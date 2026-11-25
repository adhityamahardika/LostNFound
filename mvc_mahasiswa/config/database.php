<?php
// ==============================================================================
// Konfigurasi koneksi database MySQL (menghasilkan objek PDO: $db)
// ==============================================================================

$host   = 'localhost';
$port   = '3306';
$dbname = 'lostnfound_db';
$user   = 'root';
$pass   = '';

try {
    $db = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit('Koneksi database gagal: ' . $e->getMessage());
}
