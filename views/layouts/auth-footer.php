<?php
/**
 * Layout footer untuk halaman autentikasi.
 * Markup mengikuti Frontend/pages/login/login.html.
 */
?>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <h4>LostnFound</h4>
        <p>Layanan terpusat laporan barang hilang dan temuan untuk seluruh civitas kampus.</p>
      </div>
      <div>
        <h4>Navigasi</h4>
        <p><a href="index.php">Beranda</a> · <a href="<?= esc(url('laporan')) ?>">Daftar Barang</a> · <a href="<?= esc(url('laporan', ['aksi' => 'baru'])) ?>">Lapor</a></p>
      </div>
      <div>
        <h4>Bantuan</h4>
        <p>Pertanyaan seputar alur verifikasi klaim barang &amp; serah terima.</p>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© 2026 LostnFound. Seluruh hak cipta dilindungi.</p>
      <p>Sistem Informasi Lost &amp; Found Civitas Kampus.</p>
    </div>
  </footer>

</body>
</html>
