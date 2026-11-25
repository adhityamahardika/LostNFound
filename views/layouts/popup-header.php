<?php
/**
 * Layout pembuka untuk halaman form laporan (tampilan popup).
 */
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Buat laporan barang hilang atau barang temuan di kampus.">
    <title><?= esc($judul) ?></title>
    <link rel="stylesheet" href="<?= esc(asset('css/laporan_pop_up.css')) ?>">
</head>
<body>
    <!-- Navbar sederhana untuk navigasi -->
    <nav class="navbar" aria-label="Navigasi utama">
        <div class="logo">LostnFound</div>
        <a href="index.php">Kembali ke Beranda</a>
    </nav>
