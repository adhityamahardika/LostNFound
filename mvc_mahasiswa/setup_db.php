<?php
// ==============================================================================
// Script setup tabel `mahasiswa` (latihan MVC)
// Jalankan sekali melalui browser:
//   http://localhost/LostNFound/mvc_mahasiswa/setup_db.php
// Atau melalui CLI:
//   php mvc_mahasiswa/setup_db.php
// ==============================================================================

header('Content-Type: text/plain; charset=utf-8');

$host   = 'localhost';
$port   = '3306';
$user   = 'root';
$pass   = '';
$dbName = 'lostnfound_db';

echo "=== Setup Tabel Mahasiswa (MVC) ===\n\n";

try {
    // 1. Hubungkan ke MySQL tanpa memilih database terlebih dahulu
    $pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "[OK] Berhasil terhubung ke server MySQL ($host:$port).\n";

    // 2. Baca dan jalankan skema dari database.sql
    $sqlFile = __DIR__ . '/database.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("File database.sql tidak ditemukan di: $sqlFile");
    }

    $pdo->exec(file_get_contents($sqlFile));
    echo "[OK] Database '$dbName', tabel 'mahasiswa', dan data contoh siap.\n";

    // 3. Verifikasi isi tabel
    $stmt = $pdo->query("SELECT COUNT(*) AS total FROM `mahasiswa`");
    echo "[OK] Total data mahasiswa: " . $stmt->fetchColumn() . " data.\n\n";

    echo "SETUP SELESAI.\n";
} catch (PDOException $e) {
    echo "[!] Kesalahan PDO / MySQL: " . $e->getMessage() . "\n";
    echo "Pastikan service MySQL di Laragon / XAMPP sudah dinyalakan.\n";
} catch (Exception $e) {
    echo "[!] Kesalahan: " . $e->getMessage() . "\n";
}
