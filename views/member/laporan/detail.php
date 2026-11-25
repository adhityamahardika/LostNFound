<?php
$statusKey = (string) $item['status_key'];
$foto = $item['foto'] ? asset((string) $item['foto']) : asset('nowrite.jpg');
$pelapor = $item['pelapor_nama'] ?? 'Anonim';
$penitipan = trim((string) ($item['penitipan'] ?? ''));
$aktif = (int) $item['timeline_aktif'];
?>
    <main class="container detail-main">
        <h1 class="page-title">Detail barang</h1>

<?php if ($sukses !== null): ?>
        <p role="status" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #e8f5e9; color: #1b5e20; font-size: 0.9rem; font-weight: 600;"><?= esc($sukses) ?></p>
<?php endif; ?>
<?php if ($flashError !== null): ?>
        <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fee2e2; color: #b91c1c; font-size: 0.9rem; font-weight: 600;"><?= esc($flashError) ?></p>
<?php endif; ?>

        <div class="detail-card">
            <div class="detail-content">
                <!-- Kolom Kiri: Galeri Foto -->
                <div class="gallery-section">
                    <div class="main-image" id="main-image" role="img" aria-label="Foto utama <?= esc($item['nama_barang']) ?>" style="padding: 0; overflow: hidden;">
                        <img src="<?= esc($foto) ?>" alt="<?= esc($item['nama_barang']) ?>" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit;">
                    </div>
                    <div class="thumbnail-list">
<?php for ($i = 0; $i < 3; $i++): ?>
                        <button type="button" class="thumbnail<?= $i === 0 ? ' active' : '' ?>" data-img="<?= esc($foto) ?>" aria-pressed="<?= $i === 0 ? 'true' : 'false' ?>">
                            <img src="<?= esc($foto) ?>" alt="<?= esc($item['nama_barang']) ?> - Foto <?= $i + 1 ?>">
                        </button>
<?php endfor; ?>
                    </div>
                </div>

                <!-- Kolom Kanan: Informasi Barang -->
                <div class="info-section">
                    <span class="badge <?= esc($statusKey) ?>" id="item-badge"><?= esc($item['status']) ?></span>
                    <h2 class="item-title" id="item-title"><?= esc($item['nama_barang']) ?></h2>
                    <p class="item-id" id="item-id"><?= esc($item['kode']) ?></p>

                    <div class="info-grid">
                        <div class="info-row">
                            <span class="info-label">Jenis barang</span>
                            <span class="info-value"><?= esc($item['jenis_barang']) ?></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Tanggal kejadian</span>
                            <span class="info-value"><?= esc($item['tanggal_panjang']) ?></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Perkiraan waktu</span>
                            <span class="info-value">-</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Lokasi</span>
                            <span class="info-value"><?= esc($item['lokasi']) ?></span>
                        </div>
<?php if ($item['dikembalikan']): ?>
                        <div class="info-row">
                            <span class="info-label">Status barang</span>
                            <span class="info-value">Sudah dikembalikan ke pemilik</span>
                        </div>
<?php else: ?>
                        <div class="info-row">
                            <span class="info-label">Barang sekarang di</span>
                            <span class="info-value"><?= esc($penitipan !== '' ? $penitipan : '-') ?></span>
                        </div>
<?php endif; ?>
                        <div class="info-row">
                            <span class="info-label">Dilaporkan oleh</span>
                            <span class="info-value"><?= esc($pelapor) ?></span>
                        </div>
                    </div>

                    <p class="item-desc"><?= esc($item['deskripsi']) ?></p>

                    <!-- Kotak Peringatan Klaim -->
<?php if ($item['dikembalikan']): ?>
                    <div class="claim-warning is-returned">
                        <strong>Barang sudah dikembalikan</strong><br>
                        Barang ini sudah diserahkan kepada pemiliknya, jadi klaim baru tidak lagi diterima.
                    </div>
<?php else: ?>
                    <div class="claim-warning">
                        <strong>Ini barangmu?</strong><br>
                        Kamu akan diminta menyebutkan ciri yang tidak terlihat di foto sebelum bisa menghubungi penemu.
                    </div>
<?php endif; ?>

                    <div class="action-buttons">
<?php if ($item['dikembalikan']): ?>
                        <button type="button" class="btn-primary" id="btn-klaim" disabled>Sudah dikembalikan</button>
<?php elseif (!sudahLogin()): ?>
                        <a href="<?= esc(url('auth/login')) ?>" class="btn-primary" id="btn-klaim" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Masuk untuk Klaim</a>
<?php else: ?>
                        <button type="button" class="btn-primary" id="btn-klaim" disabled title="Fitur klaim akan diaktifkan pada tahap berikutnya">Ajukan Klaim</button>
<?php endif; ?>
                        <a href="<?= esc(url('laporan')) ?>" class="btn-secondary">Kembali ke daftar</a>
<?php if ($item['boleh_hapus']): ?>
                        <form method="post" action="<?= esc(url('laporan', ['aksi' => 'hapus'])) ?>" onsubmit="return confirm('Apakah Anda yakin ingin menghapus laporan ini? Data akan dihapus permanen.');" style="display:contents;">
                            <?= csrfField() ?>
                            <input type="hidden" name="id" value="<?= (int) $item['id'] ?>">
                            <button type="submit" class="btn-secondary btn-danger" id="btn-hapus" style="color: #dc2626; border-color: #fca5a5; display: inline-flex; align-items: center; gap: 6px;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                Hapus Laporan
                            </button>
                        </form>
<?php endif; ?>
                        <button type="button" class="btn-secondary btn-report" id="btn-report" disabled title="Fitur report akan tersedia pada tahap berikutnya">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                            Report
                        </button>
                    </div>
                </div>
            </div>

            <!-- Bagian Bawah: Timeline Status -->
            <div class="timeline-section">
                <div class="timeline-step<?= $aktif >= 1 ? ' active' : '' ?>">
                    <div class="dot"></div>
                    <span>Dilaporkan</span>
                </div>
                <div class="timeline-line<?= $aktif > 1 ? ' active' : '' ?>"></div>

                <div class="timeline-step<?= $aktif >= 2 ? ' active' : '' ?>">
                    <div class="dot"></div>
                    <span>Dititipkan</span>
                </div>
                <div class="timeline-line<?= $aktif > 2 ? ' active' : '' ?>"></div>

                <div class="timeline-step<?= $aktif >= 3 ? ' active' : '' ?>">
                    <div class="dot"></div>
                    <span>Diklaim</span>
                </div>
                <div class="timeline-line<?= $aktif > 3 ? ' active' : '' ?>"></div>

                <div class="timeline-step<?= $aktif >= 4 ? ' active' : '' ?>">
                    <div class="dot"></div>
                    <span>Dikembalikan</span>
                </div>
            </div>
        </div>
    </main>

    <script src="<?= esc(asset('js/detail-galeri.js')) ?>"></script>
