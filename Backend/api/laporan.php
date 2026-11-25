<?php
// ==============================================================================
// API Laporan (CRUD Laporan Barang LostnFound)
// Endpoint:
//   GET    Backend/api/laporan.php            -> Ambil semua laporan (dengan filter)
//   GET    Backend/api/laporan.php?id=1       -> Ambil detail 1 laporan
//   POST   Backend/api/laporan.php            -> Buat laporan baru
//   PUT    Backend/api/laporan.php?id=1       -> Edit laporan (atau POST + _method=PUT)
//   PATCH  Backend/api/laporan.php?id=1       -> Edit sebagian field laporan
//   DELETE Backend/api/laporan.php?id=1       -> Hapus laporan (Admin / Pemilik)
// ==============================================================================

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$inputData = parseRequestInput();

// Mendukung method spoofing via POST (_method=PUT/PATCH atau action=update)
// Berguna saat client mengirim multipart/form-data berisi upload foto baru.
if ($method === 'POST') {
    $override = strtoupper(trim($inputData['_method'] ?? ''));
    $action   = strtolower(trim($inputData['action'] ?? ''));
    if (in_array($override, ['PUT', 'PATCH'], true) || $action === 'update') {
        $method = $override === 'PATCH' ? 'PATCH' : 'PUT';
    }
}

// ==============================================================================
// 1. GET: Ambil Laporan
// ==============================================================================
if ($method === 'GET') {
    $caller = getCallerIdentity();

    // A. Ambil Detail Barang Berdasarkan ID
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if (!$item) {
            sendJsonError(404, 'Laporan tidak ditemukan.');
        }

        $includePrivate = canAccessPrivateFields($item, $caller);

        echo json_encode([
            'success' => true,
            'data'    => formatLaporanItem($item, $includePrivate)
        ]);
        exit;
    }

    // B. Ambil Daftar Laporan dengan Filter
    $conditions = [];
    $params = [];

    if (!empty($_GET['status']) && $_GET['status'] !== 'Semua') {
        $conditions[] = "`status` = :status";
        $params[':status'] = $_GET['status'];
    }

    if (!empty($_GET['tipe']) && $_GET['tipe'] !== 'Semua') {
        $conditions[] = "`tipe` = :tipe";
        $params[':tipe'] = $_GET['tipe'];
    }

    if (!empty($_GET['jenis']) && $_GET['jenis'] !== 'Semua') {
        $conditions[] = "`jenis_barang` = :jenis";
        $params[':jenis'] = $_GET['jenis'];
    }

    if (!empty($_GET['lokasi']) && $_GET['lokasi'] !== 'Semua') {
        $conditions[] = "`lokasi` LIKE :lokasi";
        $params[':lokasi'] = '%' . $_GET['lokasi'] . '%';
    }

    if (!empty($_GET['start_date'])) {
        $conditions[] = "`tanggal` >= :start_date";
        $params[':start_date'] = $_GET['start_date'];
    }

    if (!empty($_GET['end_date'])) {
        $conditions[] = "`tanggal` <= :end_date";
        $params[':end_date'] = $_GET['end_date'];
    }

    if (!empty($_GET['pelapor_email'])) {
        $conditions[] = "LOWER(`pelapor_email`) = LOWER(:pelapor_email)";
        $params[':pelapor_email'] = trim($_GET['pelapor_email']);
    }

    if (!empty($_GET['q'])) {
        $conditions[] = "(`nama_barang` LIKE :query OR `deskripsi` LIKE :query)";
        $params[':query'] = '%' . $_GET['q'] . '%';
    }

    $sql = "SELECT * FROM `laporan`";
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    $sql .= " ORDER BY `tanggal` DESC, `id` DESC";

    if (!empty($_GET['limit']) && (int)$_GET['limit'] > 0) {
        $limit = min((int)$_GET['limit'], 100);
        $sql .= " LIMIT " . $limit;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $data = array_map(function ($row) use ($caller) {
        return formatLaporanItem($row, canAccessPrivateFields($row, $caller));
    }, $rows);

    echo json_encode([
        'success' => true,
        'count'   => count($data),
        'data'    => $data
    ]);
    exit;
}

// ==============================================================================
// 2. POST: Tambah Laporan Baru
// ==============================================================================
if ($method === 'POST') {
    $pelaporEmail = trim($inputData['pelapor_email'] ?? $inputData['email'] ?? '');
    $pelaporName  = trim($inputData['pelapor_name'] ?? $inputData['pelapor'] ?? $inputData['name'] ?? 'Civitas Kampus');

    if (empty($pelaporEmail)) {
        sendJsonError(401, 'Anda harus login terlebih dahulu sebelum dapat membuat laporan.');
    }

    $tipe        = trim($inputData['tipe'] ?? $inputData['tipe-laporan'] ?? 'Hilang');
    $namaBarang  = trim($inputData['nama_barang'] ?? $inputData['nama-barang'] ?? $inputData['nama'] ?? '');
    $jenisBarang = trim($inputData['jenis_barang'] ?? $inputData['jenis-barang'] ?? $inputData['jenis'] ?? '');
    $tanggal     = trim($inputData['tanggal'] ?? date('Y-m-d'));
    $lokasi      = resolveLokasi($inputData);
    $penitipan   = trim($inputData['penitipan'] ?? '');
    $deskripsi   = trim($inputData['deskripsi'] ?? '');
    $ciriRahasia = trim($inputData['ciri_rahasia'] ?? $inputData['ciri-rahasia'] ?? '');
    $status      = trim($inputData['status'] ?? ($tipe === 'Ditemukan' ? 'Ditemukan' : 'Hilang'));

    validateLaporanFields([
        'tipe'         => $tipe,
        'status'       => $status,
        'nama_barang'  => $namaBarang,
        'tanggal'      => $tanggal,
        'lokasi'       => $lokasi,
        'penitipan'    => $penitipan,
        'deskripsi'    => $deskripsi,
        'ciri_rahasia' => $ciriRahasia
    ]);

    $fotoPath = extractUploadedPhoto($inputData);
    if (empty($fotoPath)) {
        $fotoPath = 'assets/nowrite.jpg';
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `laporan` 
                (`tipe`, `nama_barang`, `jenis_barang`, `tanggal`, `lokasi`, `penitipan`, `deskripsi`, `ciri_rahasia`, `foto`, `status`, `pelapor_email`, `pelapor_name`)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $tipe,
            $namaBarang,
            $jenisBarang ?: 'Lainnya',
            $tanggal,
            $lokasi,
            $penitipan ?: null,
            $deskripsi,
            $ciriRahasia ?: null,
            $fotoPath,
            $status,
            $pelaporEmail,
            $pelaporName
        ]);

        $newId = (int)$pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmtGet->execute([$newId]);
        $insertedItem = formatLaporanItem($stmtGet->fetch(), true);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Laporan berhasil disimpan ke database.',
            'id'      => $newId,
            'data'    => $insertedItem
        ]);
    } catch (PDOException $e) {
        sendJsonError(500, 'Gagal menyimpan laporan: ' . $e->getMessage());
    }
    exit;
}

// ==============================================================================
// 3. PUT / PATCH: Edit Laporan (Hanya Admin atau Pemilik Laporan)
// ==============================================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $id = extractLaporanId($inputData);
    if ($id <= 0) {
        sendJsonError(400, 'ID laporan tidak valid atau tidak disertakan.');
    }

    $caller   = getCallerIdentity($inputData);
    $existing = requireAuthorizedLaporan($pdo, $id, $caller, 'mengubah');

    $tipe        = pickField($inputData, ['tipe', 'tipe-laporan'], $existing['tipe']);
    $namaBarang  = pickField($inputData, ['nama_barang', 'nama-barang', 'nama'], $existing['nama_barang']);
    $jenisBarang = pickField($inputData, ['jenis_barang', 'jenis-barang', 'jenis'], $existing['jenis_barang']);
    $tanggal     = pickField($inputData, ['tanggal'], $existing['tanggal']);
    $lokasi      = hasAnyKey($inputData, ['lokasi']) ? resolveLokasi($inputData) : $existing['lokasi'];
    $penitipan   = pickField($inputData, ['penitipan'], $existing['penitipan'] ?? '');
    $deskripsi   = pickField($inputData, ['deskripsi'], $existing['deskripsi']);
    $ciriRahasia = pickField($inputData, ['ciri_rahasia', 'ciri-rahasia'], $existing['ciri_rahasia'] ?? '');
    $status      = pickField($inputData, ['status'], $existing['status']);

    validateLaporanFields([
        'tipe'         => $tipe,
        'status'       => $status,
        'nama_barang'  => $namaBarang,
        'tanggal'      => $tanggal,
        'lokasi'       => $lokasi,
        'penitipan'    => $penitipan,
        'deskripsi'    => $deskripsi,
        'ciri_rahasia' => $ciriRahasia
    ]);

    $newFotoPath = extractUploadedPhoto($inputData);
    $fotoPath = $existing['foto'];
    if (!empty($newFotoPath) && $newFotoPath !== $existing['foto']) {
        deleteLocalUpload($existing['foto']);
        $fotoPath = $newFotoPath;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE `laporan`
            SET `tipe` = ?,
                `nama_barang` = ?,
                `jenis_barang` = ?,
                `tanggal` = ?,
                `lokasi` = ?,
                `penitipan` = ?,
                `deskripsi` = ?,
                `ciri_rahasia` = ?,
                `foto` = ?,
                `status` = ?
            WHERE `id` = ?
        ");

        $stmt->execute([
            $tipe,
            $namaBarang,
            $jenisBarang ?: 'Lainnya',
            $tanggal,
            $lokasi,
            $penitipan ?: null,
            $deskripsi,
            $ciriRahasia ?: null,
            $fotoPath ?: 'assets/nowrite.jpg',
            $status,
            $id
        ]);

        $stmtGet = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmtGet->execute([$id]);
        $updatedItem = formatLaporanItem($stmtGet->fetch(), true);

        echo json_encode([
            'success' => true,
            'message' => 'Laporan berhasil diperbarui.',
            'id'      => $id,
            'data'    => $updatedItem
        ]);
    } catch (PDOException $e) {
        sendJsonError(500, 'Gagal memperbarui laporan: ' . $e->getMessage());
    }
    exit;
}

// ==============================================================================
// 4. DELETE: Hapus Laporan Berdasarkan ID (Hanya Admin atau Pemilik Laporan)
// ==============================================================================
if ($method === 'DELETE') {
    $id = extractLaporanId($inputData);
    if ($id <= 0) {
        sendJsonError(400, 'ID laporan tidak valid atau tidak disertakan.');
    }

    $caller = getCallerIdentity($inputData);
    $item   = requireAuthorizedLaporan($pdo, $id, $caller, 'menghapus');

    try {
        deleteLocalUpload($item['foto'] ?? '');

        $stmtDel = $pdo->prepare("DELETE FROM `laporan` WHERE `id` = ?");
        $stmtDel->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Laporan berhasil dihapus dari database.',
            'id'      => $id
        ]);
    } catch (PDOException $e) {
        sendJsonError(500, 'Gagal menghapus laporan: ' . $e->getMessage());
    }
    exit;
}

sendJsonError(405, 'Metode HTTP tidak diizinkan.');


// ==============================================================================
// Helper Functions
// ==============================================================================

/**
 * Kirim respon JSON error dan hentikan eksekusi
 */
function sendJsonError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

/**
 * Gabungkan input form ($_POST) dan JSON body (php://input)
 */
function parseRequestInput() {
    $inputData = $_POST;
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if (is_array($json)) {
            $inputData = array_merge($inputData, $json);
        }
    }
    return $inputData;
}

/**
 * Ambil ID laporan dari query string atau body
 */
function extractLaporanId($inputData) {
    if (!empty($_GET['id'])) {
        return (int)$_GET['id'];
    }
    if (!empty($inputData['id'])) {
        return (int)$inputData['id'];
    }
    return 0;
}

/**
 * Ambil identitas pemohon (email & role) dari query, body, atau header
 */
function getCallerIdentity($inputData = []) {
    return [
        'email' => trim($_GET['user_email'] ?? $inputData['user_email'] ?? $_SERVER['HTTP_X_USER_EMAIL'] ?? ''),
        'role'  => trim($_GET['user_role'] ?? $inputData['user_role'] ?? $_SERVER['HTTP_X_USER_ROLE'] ?? '')
    ];
}

/**
 * Cek apakah pemohon adalah Admin atau pemilik laporan
 */
function canAccessPrivateFields($row, $caller) {
    if (!$row) return false;
    $isAdmin = (strtolower($caller['role']) === 'admin');
    $isOwner = (!empty($row['pelapor_email']) && !empty($caller['email']) &&
                strtolower($caller['email']) === strtolower($row['pelapor_email']));
    return $isAdmin || $isOwner;
}

/**
 * Ambil laporan dan pastikan pemohon memiliki hak akses Admin / Pemilik
 */
function requireAuthorizedLaporan($pdo, $id, $caller, $actionVerb) {
    if (empty($caller['email']) && empty($caller['role'])) {
        sendJsonError(401, "Akses ditolak: Anda harus login untuk melakukan {$actionVerb} laporan.");
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();
    } catch (PDOException $e) {
        sendJsonError(500, 'Gagal mengambil data laporan: ' . $e->getMessage());
    }

    if (!$item) {
        sendJsonError(404, "Laporan dengan ID {$id} tidak ditemukan.");
    }

    if (!canAccessPrivateFields($item, $caller)) {
        sendJsonError(403, "Akses ditolak: Hanya Admin atau pembuat laporan yang berhak {$actionVerb} laporan ini.");
    }

    return $item;
}

function hasAnyKey($arr, $keys) {
    foreach ($keys as $k) {
        if (array_key_exists($k, $arr)) return true;
    }
    return false;
}

function pickField($arr, $keys, $default = '') {
    foreach ($keys as $k) {
        if (array_key_exists($k, $arr)) {
            return trim((string)$arr[$k]);
        }
    }
    return $default;
}

function resolveLokasi($inputData) {
    $lokasi     = trim($inputData['lokasi'] ?? '');
    $lokasiLain = trim($inputData['lokasi-lain'] ?? $inputData['lokasi_lain'] ?? '');
    if ($lokasi === 'Lainnya' && !empty($lokasiLain)) {
        return $lokasiLain;
    }
    return $lokasi;
}

/**
 * Validasi field laporan sesuai aturan bisnis
 */
function validateLaporanFields($fields) {
    $allowedTipe   = ['Hilang', 'Ditemukan'];
    $allowedStatus = ['Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan'];

    if (!in_array($fields['tipe'], $allowedTipe, true)) {
        sendJsonError(400, 'Tipe laporan harus Hilang atau Ditemukan.');
    }

    if (!in_array($fields['status'], $allowedStatus, true)) {
        sendJsonError(400, 'Status laporan tidak valid.');
    }

    if (empty($fields['nama_barang']) || empty($fields['lokasi']) || empty($fields['deskripsi'])) {
        sendJsonError(400, 'Nama barang, lokasi, dan deskripsi wajib diisi.');
    }

    if (empty($fields['tanggal']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fields['tanggal'])) {
        sendJsonError(400, 'Format tanggal tidak valid (gunakan YYYY-MM-DD).');
    }

    if ($fields['tanggal'] > date('Y-m-d')) {
        sendJsonError(400, 'Tanggal kejadian tidak boleh di masa depan.');
    }

    if ($fields['tipe'] === 'Ditemukan' && (empty($fields['ciri_rahasia']) || empty($fields['penitipan']))) {
        sendJsonError(400, 'Laporan barang temuan wajib mengisi lokasi penitipan dan ciri rahasia.');
    }
}

/**
 * Format satu baris item laporan; sembunyikan ciri_rahasia untuk akses publik
 */
function formatLaporanItem($row, $includePrivate = false) {
    if (!$row) return null;

    $foto = $row['foto'] ?? '';

    $formatted = [
        'id'               => (int)$row['id'],
        'tipe'             => $row['tipe'],
        'nama'             => $row['nama_barang'],
        'nama_barang'      => $row['nama_barang'],
        'jenis'            => $row['jenis_barang'],
        'jenis_barang'     => $row['jenis_barang'],
        'tanggal'          => $row['tanggal'],
        'lokasi'           => $row['lokasi'],
        'penitipan'        => $row['penitipan'],
        'deskripsi'        => $row['deskripsi'],
        'has_ciri_rahasia' => !empty($row['ciri_rahasia']),
        'foto'             => $foto,
        'img'              => $foto,
        'status'           => $row['status'],
        'pelapor_email'    => $row['pelapor_email'] ?? '',
        'pelapor_name'     => $row['pelapor_name'] ?? 'Civitas Kampus',
        'pelapor'          => $row['pelapor_name'] ?? 'Civitas Kampus',
        'created_at'       => $row['created_at'],
        'updated_at'       => $row['updated_at'] ?? $row['created_at']
    ];

    if ($includePrivate) {
        $formatted['ciri_rahasia'] = $row['ciri_rahasia'];
    }

    return $formatted;
}

/**
 * Ekstrak foto dari $_FILES, Base64, atau URL/path teks
 */
function extractUploadedPhoto($inputData) {
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        return handleFileUpload($_FILES['foto']);
    }
    if (isset($_FILES['foto-barang']) && $_FILES['foto-barang']['error'] === UPLOAD_ERR_OK) {
        return handleFileUpload($_FILES['foto-barang']);
    }
    if (!empty($inputData['foto']) && strpos($inputData['foto'], 'data:image') === 0) {
        return handleBase64Image($inputData['foto']);
    }
    if (!empty($inputData['foto'])) {
        return trim($inputData['foto']);
    }
    return '';
}

/**
 * Hapus file foto lokal dari folder Backend/uploads/ dengan aman
 */
function deleteLocalUpload($fotoPath) {
    if (empty($fotoPath) || strpos($fotoPath, 'Backend/uploads/') !== 0) {
        return;
    }
    $safeName = basename($fotoPath);
    $realPhotoPath = __DIR__ . '/../uploads/' . $safeName;
    if (file_exists($realPhotoPath)) {
        @unlink($realPhotoPath);
    }
}

/**
 * Handle upload file dari form multipart
 */
function handleFileUpload($file) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    $fileInfo = getimagesize($file['tmp_name']);
    if (!$fileInfo || !in_array($fileInfo['mime'], $allowedMimes)) {
        return '';
    }

    // Maksimal 5 MB
    if ($file['size'] > 5 * 1024 * 1024) {
        return '';
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    if (empty($ext)) {
        $ext = ($fileInfo['mime'] === 'image/png') ? 'png' : 'jpg';
    }

    $fileName = 'item_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return 'Backend/uploads/' . $fileName;
    }

    return '';
}

/**
 * Simpan data URI Base64 ke file gambar
 */
function handleBase64Image($base64String) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';
        if (!in_array($ext, ['jpg', 'png', 'webp'])) {
            return '';
        }

        $data = substr($base64String, strpos($base64String, ',') + 1);
        $decoded = base64_decode($data);
        if ($decoded === false) {
            return '';
        }

        $fileName = 'item_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = $uploadDir . $fileName;

        if (file_put_contents($targetPath, $decoded) !== false) {
            return 'Backend/uploads/' . $fileName;
        }
    }

    return '';
}
