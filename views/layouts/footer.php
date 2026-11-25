  <!-- Footer -->
  <footer class="site-footer" id="kontak">
    <div class="container footer-grid">
      <div>
        <h3>LostnFound</h3>
        <p>Layanan barang hilang dan temuan untuk civitas kampus. Memudahkan proses pengembalian barang dengan sistem verifikasi kepemilikan.</p>
      </div>
      <div>
        <h3>Jelajahi</h3>
        <p>
          <a href="<?= esc(url('laporan')) ?>">Daftar Barang</a><br>
          <a href="<?= esc(url('laporan', ['aksi' => 'baru'])) ?>">Lapor</a>
        </p>
      </div>
      <div>
        <h3>Bantuan</h3>
        <p>
          <a href="index.php#cara-kerja">Tentang</a><br>
          <a href="#kontak">Kontak</a>
        </p>
      </div>
    </div>
  </footer>

</body>
</html>
