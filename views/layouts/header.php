<?php
/**
 * Layout header.
 *
 * Variabel yang tersedia:
 * - $judul
 * - $halamanAktif
 * - $cssTambahan
 */
$pengguna = currentUser();
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= esc($judul) ?></title>
  <link rel="icon" href="<?= esc(asset('nowrite.jpg')) ?>" type="image/jpeg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= esc(asset('css/variables.css')) ?>">
  <link rel="stylesheet" href="<?= esc(asset('css/base.css')) ?>">
  <link rel="stylesheet" href="<?= esc(asset('css/navbar.css')) ?>">
<?php foreach ($cssTambahan as $css): ?>
  <link rel="stylesheet" href="<?= esc(asset('css/' . $css)) ?>">
<?php endforeach; ?>
</head>
<body>

  <!-- Header Navigasi -->
  <header class="site-nav-wrapper">
    <nav class="container site-nav" aria-label="Navigasi Utama">
      <a class="brand-group" href="index.php">
        <img src="<?= esc(asset('nowrite.jpg')) ?>" alt="LostnFound Logo" style="width:36px;height:36px;object-fit:contain;border-radius:6px;">
        <span class="brand-title">LostnFound</span>
      </a>

      <ul class="nav-menu">
        <li><a class="nav-link<?= $halamanAktif === 'beranda' ? ' active' : '' ?>" href="index.php">Beranda</a></li>
        <li><a class="nav-link<?= $halamanAktif === 'laporan' ? ' active' : '' ?>" href="<?= esc(url('laporan')) ?>">Daftar Barang</a></li>
        <li><a class="nav-link<?= $halamanAktif === 'lapor' ? ' active' : '' ?>" href="<?= esc(url('laporan', ['aksi' => 'baru'])) ?>">Lapor</a></li>
        <li><a class="nav-link" href="index.php#cara-kerja">Tentang</a></li>
      </ul>
      <div class="nav-actions">
        <a href="Frontend/pages/chat/chat.html" class="btn-nav-chat" id="btn-navbar-chat" aria-label="Buka Pesan Chat" title="Chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="chat-notif-dot" id="chat-notif-badge"></span>
        </a>
<?php if ($pengguna !== null): ?>
        <span class="nav-user-badge" title="<?= isAdmin() ? 'Dashboard Admin' : 'Profil Saya' ?>">
          <span class="nav-user-avatar"><?= esc($pengguna['inisial'] ?? '?') ?></span>
          <span><?= isAdmin() ? 'Dashboard Admin' : 'Profil Saya' ?></span>
        </span>
        <form method="post" action="<?= esc(url('auth/logout')) ?>" style="display: contents;">
          <?= csrfField() ?>
          <button type="submit" class="btn-nav-action btn-nav-outline" id="btn-nav-logout" title="Keluar Akun">Keluar</button>
        </form>
<?php else: ?>
        <a class="btn-nav-action" href="<?= esc(url('auth/login')) ?>">Masuk</a>
<?php endif; ?>
      </div>
    </nav>
  </header>
