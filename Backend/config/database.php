<?php
// ==============================================================================
// Database Configuration, CORS, & Session Helper (PDO MySQL)
// LostnFound System
// ==============================================================================

// Set CORS headers agar frontend dapat mengakses API beserta cookie session
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Email, X-User-Role");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Konfigurasi Database MySQL
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'lostnfound_db');
define('DB_USER', 'root');
define('DB_PASS', '');

/**
 * Inisialisasi PHP Session dengan parameter cookie yang aman
 */
function initAuthSession() {
    if (PHP_SAPI === 'cli') {
        return;
    }
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 86400 * 7, // 7 hari
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

/**
 * Ambil data user dari session server yang aktif (null jika belum login)
 */
function getSessionUser() {
    initAuthSession();
    if (!empty($_SESSION['user']) && is_array($_SESSION['user'])) {
        return $_SESSION['user'];
    }
    return null;
}

/**
 * Format baris tabel users untuk respon JSON dan penyimpanan $_SESSION
 */
function formatUserPayload($row) {
    if (!$row) return null;
    return [
        'id'         => (int)$row['id'],
        'nim'        => $row['nim'] ?? '',
        'name'       => $row['name'],
        'initials'   => $row['initials'] ?: 'US',
        'email'      => $row['email'],
        'role'       => $row['role'] ?: 'Mahasiswa',
        'accessRole' => $row['access_role'] ?: 'user',
        'prodi'      => $row['prodi'] ?: '-',
        'fakultas'   => $row['fakultas'] ?: '-',
        'phone'      => $row['phone'] ?? ''
    ];
}

/**
 * Mendapatkan koneksi PDO ke database MySQL
 * @return PDO
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'message' => 'Koneksi ke database MySQL gagal: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    return $pdo;
}
