<?php
require __DIR__ . '/config/database.php';                    // menghasilkan objek PDO: $db
require __DIR__ . '/controllers/MahasiswaController.php';

$halaman = $_GET['page'] ?? 'mahasiswa';

if ($halaman === 'mahasiswa') {
    $controller = new MahasiswaController($db);
    $controller->index();
} else {
    http_response_code(404);
    echo 'Halaman tidak ditemukan';
}
