<?php
// ==============================================================================
// API Autentikasi (Login, Register, Logout, Cek Sesi)
// Endpoint:
//   GET    Backend/api/auth.php?action=me       -> Cek sesi aktif saat ini
//   POST   Backend/api/auth.php?action=login    -> Masuk dengan NIM/Email & sandi
//   POST   Backend/api/auth.php?action=register -> Daftar akun baru mahasiswa
//   POST   Backend/api/auth.php?action=logout   -> Keluar & hapus sesi
//   DELETE Backend/api/auth.php                 -> Keluar & hapus sesi
// ==============================================================================

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

initAuthSession();
$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$inputData = $_POST;
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (is_array($json)) {
        $inputData = array_merge($inputData, $json);
    }
}

$action = strtolower(trim($_GET['action'] ?? $inputData['action'] ?? ''));

// ==============================================================================
// 1. GET / Cek Sesi Aktif
// ==============================================================================
if ($method === 'GET') {
    $sessionUser = getSessionUser();
    if (!$sessionUser) {
        echo json_encode([
            'success'       => true,
            'authenticated' => false,
            'user'          => null
        ]);
        exit;
    }

    // Sinkronkan data user terbaru dari database
    try {
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$sessionUser['id']]);
        $row = $stmt->fetch();
        if (!$row) {
            clearAuthSession();
            echo json_encode([
                'success'       => true,
                'authenticated' => false,
                'user'          => null
            ]);
            exit;
        }
        $freshUser = formatUserPayload($row);
        $_SESSION['user'] = $freshUser;

        echo json_encode([
            'success'       => true,
            'authenticated' => true,
            'user'          => $freshUser
        ]);
    } catch (PDOException $e) {
        sendAuthError(500, 'Gagal memeriksa sesi pengguna: ' . $e->getMessage());
    }
    exit;
}

// ==============================================================================
// 2. DELETE / Logout
// ==============================================================================
if ($method === 'DELETE' || ($method === 'POST' && $action === 'logout')) {
    clearAuthSession();
    echo json_encode([
        'success' => true,
        'message' => 'Berhasil keluar dari akun.'
    ]);
    exit;
}

// ==============================================================================
// 3. POST: Login atau Register
// ==============================================================================
if ($method === 'POST') {
    if ($action === 'register') {
        handleRegister($pdo, $inputData);
        exit;
    }

    if ($action === 'login' || $action === '') {
        handleLogin($pdo, $inputData);
        exit;
    }

    sendAuthError(400, 'Aksi autentikasi tidak dikenal.');
}

sendAuthError(405, 'Metode HTTP tidak diizinkan.');


// ==============================================================================
// Helper Functions
// ==============================================================================

function sendAuthError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

function clearAuthSession() {
    initAuthSession();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function computeInitials($name) {
    $words = preg_split('/\s+/', trim($name));
    $initials = '';
    foreach ($words as $w) {
        if ($w !== '') {
            $initials .= strtoupper(substr($w, 0, 1));
        }
        if (strlen($initials) >= 2) break;
    }
    return $initials ?: 'US';
}

function handleLogin($pdo, $inputData) {
    $identifier = trim($inputData['identifier'] ?? $inputData['email'] ?? $inputData['nim'] ?? '');
    $password   = (string)($inputData['password'] ?? '');

    if ($identifier === '' || $password === '') {
        sendAuthError(400, 'NIM/Email dan kata sandi wajib diisi.');
    }

    try {
        $stmt = $pdo->prepare("
            SELECT * FROM `users`
            WHERE LOWER(`email`) = LOWER(?) OR LOWER(`nim`) = LOWER(?)
            LIMIT 1
        ");
        $stmt->execute([$identifier, $identifier]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($password, $row['password_hash'])) {
            sendAuthError(401, 'NIM/Email atau kata sandi salah.');
        }

        initAuthSession();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }

        $userPayload = formatUserPayload($row);
        $_SESSION['user'] = $userPayload;

        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil.',
            'user'    => $userPayload
        ]);
    } catch (PDOException $e) {
        sendAuthError(500, 'Gagal melakukan login: ' . $e->getMessage());
    }
}

function handleRegister($pdo, $inputData) {
    $name     = trim($inputData['nama'] ?? $inputData['name'] ?? '');
    $nim      = trim($inputData['nim'] ?? '');
    $email    = trim($inputData['email'] ?? '');
    $password = (string)($inputData['password'] ?? '');
    $phone    = trim($inputData['phone'] ?? '');
    $prodi    = trim($inputData['prodi'] ?? 'Teknologi Informasi');
    $fakultas = trim($inputData['fakultas'] ?? 'Teknik');

    if ($name === '' || $nim === '' || $email === '' || $password === '') {
        sendAuthError(400, 'Nama lengkap, NIM, email, dan kata sandi wajib diisi.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendAuthError(400, 'Format email kampus tidak valid.');
    }

    if (strlen($password) < 8) {
        sendAuthError(400, 'Kata sandi minimal 8 karakter.');
    }

    try {
        // Cek duplikasi email atau NIM
        $check = $pdo->prepare("SELECT `id`, `email`, `nim` FROM `users` WHERE LOWER(`email`) = LOWER(?) OR LOWER(`nim`) = LOWER(?) LIMIT 1");
        $check->execute([$email, $nim]);
        $dup = $check->fetch();
        if ($dup) {
            if (strtolower($dup['email']) === strtolower($email)) {
                sendAuthError(409, 'Email tersebut sudah terdaftar. Silakan masuk.');
            }
            sendAuthError(409, 'NIM/NIP tersebut sudah terdaftar. Silakan masuk.');
        }

        $initials = computeInitials($name);
        $hash     = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO `users` (`nim`, `name`, `initials`, `email`, `password_hash`, `role`, `access_role`, `prodi`, `fakultas`, `phone`)
            VALUES (?, ?, ?, ?, ?, 'Mahasiswa', 'user', ?, ?, ?)
        ");
        $stmt->execute([$nim, $name, $initials, $email, $hash, $prodi, $fakultas, $phone ?: null]);

        $newId = (int)$pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ?");
        $stmtGet->execute([$newId]);
        $userPayload = formatUserPayload($stmtGet->fetch());

        initAuthSession();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
        $_SESSION['user'] = $userPayload;

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Pendaftaran akun berhasil.',
            'user'    => $userPayload
        ]);
    } catch (PDOException $e) {
        sendAuthError(500, 'Gagal mendaftarkan akun: ' . $e->getMessage());
    }
}
