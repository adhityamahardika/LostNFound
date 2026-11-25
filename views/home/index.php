  <main>
    
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero__grid">
        <div class="hero__content">
          <h1>Barang hilang di kampus? Cari dan temukan di sini.</h1>
          <p>Semua laporan barang hilang dan temuan dari seluruh gedung kampus terkumpul di satu tempat. Temukan barangmu atau laporkan barang temuan dengan mudah.</p>
          
          <!-- Search Box -->
          <div class="hero__search">
            <form role="search" action="index.php" method="get">
              <input type="hidden" name="page" value="laporan">
              <div class="search-fields">
                <div class="search-field">
                  <label for="jenis">Jenis Barang</label>
                  <select id="jenis" name="jenis">
                    <option value="">Semua jenis</option>
                    <option value="Aksesoris">Aksesoris</option>
                    <option value="Kendaraan">Kendaraan</option>
                    <option value="Dokumen">Dokumen</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Tas">Tas</option>
                  </select>
                </div>
                <div class="search-field">
                  <label for="lokasi">Lokasi</label>
                  <select id="lokasi" name="lokasi">
                    <option value="">Semua lokasi</option>
                    <option value="Kantin Utama">Kantin Utama</option>
                    <option value="Gedung B">Gedung B</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                    <option value="Lab Komputer">Lab Komputer</option>
                    <option value="Aula">Aula</option>
                    <option value="Parkiran Timur">Parkiran Timur</option>
                  </select>
                </div>
                <button class="btn" type="submit">Cari</button>
              </div>
            </form>
          </div>

          <!-- CTA Actions -->
          <div class="hero__actions">
            <a href="<?= esc(url('laporan', ['aksi' => 'baru', 'tipe' => 'hilang'])) ?>" class="btn">Saya kehilangan</a>
            <a href="<?= esc(url('laporan', ['aksi' => 'baru', 'tipe' => 'ditemukan'])) ?>" class="btn btn--ghost">Saya menemukan</a>
          </div>
        </div>

        <!-- Illustration Placeholder -->
        <div class="hero__illustration" style="padding: 0; border: none; overflow: hidden; border-radius: 12px;">
        <img src="<?= esc(asset('TI.jpg')) ?>" alt="Rektorat Universitas Udayana" style="width: 100%; height: 100%; object-fit: cover; display: block;">
        </div>
      </div>
    </section>

    <!-- Cara Kerja -->
    <section class="how-it-works" id="cara-kerja">
      <div class="container">
        <h2 class="section-title">Cara Kerja</h2>
        <p class="how-it-works__subtitle">Empat langkah dari laporan sampai barang kembali.</p>
        <ol class="steps">
          <li class="steps__item">
            <h3>Lapor</h3>
            <p>Buat laporan barang hilang atau barang yang kamu temukan, tambahkan foto dan lokasi.</p>
          </li>
          <li class="steps__item">
            <h3>Cari</h3>
            <p>Telusuri daftar barang dengan filter jenis, lokasi, dan tanggal untuk menemukan barangmu.</p>
          </li>
          <li class="steps__item">
            <h3>Klaim dan verifikasi</h3>
            <p>Jawab pertanyaan tentang ciri barang yang tidak terlihat di foto untuk membuktikan kepemilikan.</p>
          </li>
          <li class="steps__item">
            <h3>Serah terima</h3>
            <p>Hubungi penemu melalui chat, sepakati tempat pengambilan, dan barang kembali ke pemiliknya.</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Laporan Terbaru -->
    <section class="latest-reports">
      <div class="container">
        <div class="latest-reports__header">
          <div class="latest-reports__title-wrapper">
            <h2 class="section-title">Laporan Terbaru</h2>
            <p>Barang yang baru dilaporkan minggu ini</p>
          </div>
          <a href="<?= esc(url('laporan')) ?>" class="btn btn--secondary">Lihat semua</a>
        </div>

<?php if ($errorDb !== null): ?>
        <p role="status" style="color: var(--muted); margin-bottom: 1rem;"><?= esc($errorDb) ?></p>
<?php elseif ($laporanTerbaru === []): ?>
        <p style="color: var(--muted); margin-bottom: 1rem;">Belum ada laporan terbaru.</p>
<?php endif; ?>

        <div class="grid">
<?php foreach ($laporanTerbaru as $item): ?>
          <article class="item-card" onclick="window.location.href='<?= esc($item['url']) ?>'" style="cursor: pointer;">
            <div class="item-card__image">
              <img src="<?= esc(asset($item['foto'])) ?>" alt="<?= esc($item['judul']) ?>">
            </div>
            <div class="item-card__body">
              <span class="badge badge--<?= esc($item['badge']) ?>"><?= esc($item['status']) ?></span>
              <h3 class="item-card__title"><?= esc($item['judul']) ?></h3>
              <p class="item-card__meta"><?= esc($item['meta']) ?></p>
            </div>
          </article>
<?php endforeach; ?>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq">
      <div class="container">
        <h2 class="section-title">Pertanyaan Umum</h2>
        <p class="faq__subtitle">Soal verifikasi dan privasi.</p>
        <div class="faq__list">
          
          <details class="faq__item">
            <summary>Bagaimana saya membuktikan barang itu milik saya?</summary>
            <div class="faq__answer">
              <p>Saat mengklaim barang, kamu akan diminta menjawab pertanyaan tentang ciri-ciri barang yang tidak ditampilkan di foto, seperti isi dompet, warna pelapis dalam tas, atau detail lain yang hanya pemilik asli yang tahu. Sistem akan mencocokkan jawabanmu dengan ciri rahasia yang diisi oleh penemu atau pelapor.</p>
            </div>
          </details>

          <details class="faq__item">
            <summary>Apakah nomor HP saya ditampilkan?</summary>
            <div class="faq__answer">
              <p>Tidak. Nomor HP dan data pribadi kamu tidak ditampilkan secara terbuka. Komunikasi antara pemilik dan penemu dilakukan melalui fitur chat internal yang menjaga privasi kedua belah pihak. Kontak langsung hanya dibagikan jika kedua pihak menyetujuinya.</p>
            </div>
          </details>

          <details class="faq__item">
            <summary>Berapa lama laporan aktif?</summary>
            <div class="faq__answer">
              <p>Laporan akan tetap aktif dan dapat dicari selama 90 hari sejak tanggal pelaporan. Jika barang sudah ditemukan atau dikembalikan sebelum batas waktu, status laporan akan diubah menjadi "Dikembalikan" dan tidak lagi muncul di pencarian aktif. Kamu juga bisa menutup laporan sendiri kapan saja.</p>
            </div>
          </details>

        </div>
      </div>
    </section>

  </main>
