<?php
// ==============================================================================
// Script Setup & Inisialisasi Database MySQL
// Jalankan script ini sekali untuk membuat database 'lostnfound_db', tabel,
// dan mengisinya dengan data awal.
// Bisa dibuka melalui browser (http://localhost/.../Backend/setup_db.php)
// atau dijalankan via CLI: php Backend/setup_db.php
// ==============================================================================

header('Content-Type: text/plain; charset=utf-8');

$host = 'localhost';
$port = '3306';
$user = 'root';
$pass = '';
$dbName = 'lostnfound_db';

echo "=== Setup Database LostnFound ===\n\n";

try {
    // 1. Hubungkan ke MySQL server tanpa memilih database dulu
    $pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "[✓] Berhasil terhubung ke server MySQL ($host:$port).\n";

    // 2. Buat database jika belum ada
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "[✓] Database '$dbName' siap.\n";

    // 3. Gunakan database
    $pdo->exec("USE `$dbName`;");

    // 4. Baca dan eksekusi skema dari file database.sql
    $sqlFile = __DIR__ . '/database.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("File database.sql tidak ditemukan di: $sqlFile");
    }

    $sqlContent = file_get_contents($sqlFile);
    // Pisahkan query berdasarkan titik koma (agar dieksekusi satu per satu dengan aman)
    $pdo->exec($sqlContent);
    echo "[✓] Tabel 'laporan' dan data awal berhasil dibuat/diperbarui.\n";

    // 5. Verifikasi isi tabel
    $stmt = $pdo->query("SELECT COUNT(*) AS total FROM `laporan`");
    $count = $stmt->fetchColumn();
    echo "[✓] Total data laporan di tabel: $count data.\n\n";

    echo "=================================================\n";
    echo "SETUP DATABASE SELESAI & BERHASIL!\n";
    echo "=================================================\n";

} catch (PDOException $e) {
    echo "[!] Kesalahan PDO / MySQL: " . $e->getMessage() . "\n";
    echo "Pastikan service MySQL di Laragon / XAMPP sudah dinyalakan (START).\n";
} catch (Exception $e) {
    echo "[!] Kesalahan: " . $e->getMessage() . "\n";
}
