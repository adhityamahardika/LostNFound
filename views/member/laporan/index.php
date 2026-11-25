    <main class="container">
        <h1>Laporan terbaru</h1>

<?php if ($sukses !== null): ?>
        <p role="status" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #e8f5e9; color: #1b5e20; font-size: 0.9rem; font-weight: 600;"><?= esc($sukses) ?></p>
<?php endif; ?>
<?php if ($flashError !== null): ?>
        <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fee2e2; color: #b91c1c; font-size: 0.9rem; font-weight: 600;"><?= esc($flashError) ?></p>
<?php endif; ?>

        <!-- Kotak Filter Utama -->
        <form class="filter-box" method="get" action="index.php">
            <input type="hidden" name="page" value="laporan">
            <input type="hidden" name="status" value="<?= esc($filter['status']) ?>">
            <div class="filter-group">
                <label for="filter-jenis">Jenis barang</label>
                <select id="filter-jenis" name="jenis">
<?php foreach (['Semua', 'Aksesoris', 'Kendaraan', 'Dokumen', 'Elektronik', 'Tas'] as $opsi): ?>
                    <option value="<?= esc($opsi) ?>"<?= $filter['jenis'] === $opsi ? ' selected' : '' ?>><?= $opsi === 'Semua' ? 'Semua jenis' : esc($opsi) ?></option>
<?php endforeach; ?>
                </select>
            </div>
            <div class="filter-group">
                <label for="filter-lokasi">Lokasi ditemukan</label>
                <select id="filter-lokasi" name="lokasi">
<?php foreach (['Semua', 'Kantin Utama', 'Gedung B', 'Perpustakaan', 'Lab Komputer', 'Aula', 'Parkiran Timur'] as $opsi): ?>
                    <option value="<?= esc($opsi) ?>"<?= $filter['lokasi'] === $opsi ? ' selected' : '' ?>><?= $opsi === 'Semua' ? 'Semua lokasi' : esc($opsi) ?></option>
<?php endforeach; ?>
                </select>
            </div>
            <div class="filter-group">
                <label for="filter-start-date">Dari tanggal</label>
                <input type="date" id="filter-start-date" name="start_date" value="<?= esc($filter['start_date']) ?>">
            </div>
            <div class="filter-group">
                <label for="filter-end-date">Sampai tanggal</label>
                <input type="date" id="filter-end-date" name="end_date" value="<?= esc($filter['end_date']) ?>">
            </div>
            <div class="filter-actions">
                <button type="submit" class="btn-terapkan" id="btn-terapkan">Terapkan</button>
                <a href="<?= esc(url('laporan')) ?>" class="btn-reset" id="btn-reset" style="text-decoration: none; display: inline-block; text-align: center;">Reset</a>
            </div>
        </form>

        <!-- Info & Filter Status -->
<?php if ($errorFilter !== null): ?>
        <p class="summary-text" role="status" aria-live="polite"><?= esc($errorFilter) ?></p>
<?php elseif ($errorDb !== null): ?>
        <p class="summary-text" role="status" aria-live="polite"><?= esc($errorDb) ?></p>
<?php else: ?>
        <p class="summary-text" role="status" aria-live="polite">Menampilkan <?= count($daftar) ?> dari <?= (int) $total ?> laporan</p>
<?php endif; ?>
        <div class="status-tabs" role="group" aria-label="Filter status">
<?php foreach (['Semua', 'Hilang', 'Ditemukan', 'Dikembalikan'] as $status): ?>
<?php
    $params = $queryDasar;
    if ($status !== 'Semua') {
        $params['status'] = $status;
    }
    $aktif = $filter['status'] === $status;
?>
            <a class="status-btn<?= $aktif ? ' active' : '' ?>" href="<?= esc(url('laporan', $params)) ?>" data-status="<?= esc($status) ?>" aria-pressed="<?= $aktif ? 'true' : 'false' ?>" style="text-decoration: none; display: inline-block;"><?= esc($status) ?></a>
<?php endforeach; ?>
        </div>

        <!-- Grid Container untuk Kartu -->
        <div class="grid-container" id="card-container">
<?php if ($daftar === [] && $errorDb === null): ?>
            <p class="empty-state">Tidak ada laporan yang cocok dengan filter.</p>
<?php endif; ?>
<?php foreach ($daftar as $item): ?>
<?php
    $statusKey = strtolower((string) $item['status']);
    $foto = $item['foto'] ? asset((string) $item['foto']) : asset('nowrite.jpg');
?>
            <div class="card">
                <div class="card-image" aria-hidden="true">
                    <img src="<?= esc($foto) ?>" alt="<?= esc($item['nama_barang']) ?>">
                </div>
                <div class="card-content">
                    <span class="badge <?= esc($statusKey) ?>"><?= esc($item['status']) ?></span>
                    <h3 class="card-title"><?= esc($item['nama_barang']) ?></h3>
                    <p class="card-info"><?= esc($item['lokasi']) ?> · <?= esc(tanggalSingkatIndonesia((string) $item['tanggal'])) ?></p>
                    <button type="button" class="btn-detail" data-id="<?= (int) $item['id'] ?>">Lihat detail</button>
                </div>

                <template class="modal-template">
                    <div class="modal-detail-flex">
                        <div class="modal-gallery" aria-hidden="true">
                            <img src="<?= esc($foto) ?>" alt="<?= esc($item['nama_barang']) ?>" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
                        </div>
                        <div class="modal-info">
                            <span class="badge <?= esc($statusKey) ?>"><?= esc($item['status']) ?></span>
                            <h2 id="modal-title"><?= esc($item['nama_barang']) ?></h2>
                            <p><strong>Jenis:</strong> <?= esc($item['jenis_barang']) ?></p>
                            <p><strong>Lokasi:</strong> <?= esc($item['lokasi']) ?></p>
                            <p><strong>Tanggal:</strong> <?= esc(tanggalIndonesia((string) $item['tanggal'])) ?></p>
                            <div class="claim-hint">
                                <strong>Ini barangmu?</strong><br>
                                Siapkan ciri-ciri khusus sebelum melakukan klaim.
                            </div>
                            <div style="display:flex;gap:8px;margin-top:16px;">
                                <button type="button" class="btn-kembali" data-modal-close>Kembali</button>
<?php if ($item['boleh_hapus']): ?>
                                <form method="post" action="<?= esc(url('laporan', ['aksi' => 'hapus'])) ?>" onsubmit="return confirm('Apakah Anda yakin ingin menghapus laporan ini? Data akan dihapus permanen.');" style="display:contents;">
                                    <?= csrfField() ?>
                                    <input type="hidden" name="id" value="<?= (int) $item['id'] ?>">
                                    <button type="submit" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">Hapus Laporan</button>
                                </form>
<?php endif; ?>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
<?php endforeach; ?>
        </div>

    </main>

    <!-- ================= MODAL POPUP DETAIL ================= -->
    <div id="detail-modal" class="modal-overlay" hidden>
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <!-- Tombol Silang untuk Close (X) -->
            <button type="button" class="close-btn" id="modal-close" aria-label="Tutup detail">&times;</button>

            <div id="modal-body"></div>
        </div>
    </div>

    <script src="<?= esc(asset('js/laporan-catalog.js')) ?>"></script>
