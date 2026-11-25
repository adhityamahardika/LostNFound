<?php
$tipe = $tipeAwal === 'Ditemukan' ? 'Ditemukan' : 'Hilang';
$nama = (string) ($old['nama_barang'] ?? '');
$jenis = (string) ($old['jenis_barang'] ?? '');
$tanggal = (string) ($old['tanggal'] ?? '');
$lokasi = (string) ($old['lokasi'] ?? '');
$lokasiLain = (string) ($old['lokasi_lain'] ?? '');
$penitipan = (string) ($old['penitipan'] ?? '');
$deskripsi = (string) ($old['deskripsi'] ?? '');
$ciriRahasia = (string) ($old['ciri_rahasia'] ?? '');

$tampilLokasiLain = $lokasi === 'Lainnya' || $lokasiLain !== '';
$tampilPenitipan = $tipe === 'Ditemukan';
?>
    <main class="container-laporan">
        <h1>Buat Laporan</h1>

        <!-- Tab Pilihan -->
        <div class="tabs" role="group" aria-label="Jenis laporan">
            <button type="button" class="tab-btn<?= $tipe === 'Hilang' ? ' active' : '' ?>" id="tab-hilang" aria-pressed="<?= $tipe === 'Hilang' ? 'true' : 'false' ?>">Saya Kehilangan</button>
            <button type="button" class="tab-btn<?= $tipe === 'Ditemukan' ? ' active' : '' ?>" id="tab-nemu" aria-pressed="<?= $tipe === 'Ditemukan' ? 'true' : 'false' ?>">Saya Menemukan</button>
        </div>

        <form id="form-laporan" method="post" action="<?= esc(url('laporan', ['aksi' => 'simpan'])) ?>" enctype="multipart/form-data">
            <?= csrfField() ?>

            <!-- Tipe Laporan (Hidden) -->
            <input type="hidden" id="tipe-laporan" name="tipe" value="<?= esc($tipe) ?>">

            <!-- Area Upload Foto di Paling Atas  -->
            <div class="form-group foto-upload-area">
                <label for="foto-barang" id="foto-label">
                    <span class="icon-plus" aria-hidden="true">+</span>
                    <span class="upload-text">Klik untuk unggah foto barang (PNG/JPG, maks. 2 MB)</span>
                </label>
                <input type="file" id="foto-barang" name="foto" accept="image/png, image/jpeg" aria-describedby="foto-error">
                <img id="preview-foto" alt="Pratinjau foto barang yang dipilih" hidden>
            </div>
            <p class="field-error" id="foto-error" role="alert" hidden></p>

            <div class="form-grid">
                <div class="form-group">
                    <label for="nama-barang">Nama Barang</label>
                    <input type="text" id="nama-barang" name="nama_barang" placeholder="Contoh: Dompet cokelat" maxlength="80" value="<?= esc($nama) ?>" required>
                </div>
                <div class="form-group">
                    <label for="jenis-barang">Jenis Barang</label>
                    <select id="jenis-barang" name="jenis_barang" required>
                        <option value="">Pilih jenis...</option>
<?php foreach (['Aksesoris', 'Kendaraan', 'Dokumen', 'Elektronik', 'Tas', 'Lainnya'] as $opsi): ?>
                        <option value="<?= esc($opsi) ?>"<?= $jenis === $opsi ? ' selected' : '' ?>><?= esc($opsi) ?></option>
<?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="tanggal">Tanggal Kejadian</label>
                    <input type="date" id="tanggal" name="tanggal" value="<?= esc($tanggal) ?>" required>
                </div>
                <div class="form-group">
                    <label for="lokasi">Lokasi</label>
                    <select id="lokasi" name="lokasi" required>
                        <option value="">Pilih lokasi...</option>
<?php foreach (['Kantin Utama', 'Gedung B', 'Perpustakaan', 'Lab Komputer', 'Aula', 'Parkiran Timur'] as $opsi): ?>
                        <option value="<?= esc($opsi) ?>"<?= $lokasi === $opsi ? ' selected' : '' ?>><?= esc($opsi) ?></option>
<?php endforeach; ?>
                        <option value="Lainnya"<?= $lokasi === 'Lainnya' ? ' selected' : '' ?>>Lainnya (tulis sendiri)</option>
                    </select>
                    <input type="text" id="lokasi-lain" name="lokasi_lain" placeholder="Tulis lokasi, contoh: Musala Fakultas" maxlength="100" aria-label="Lokasi lainnya" value="<?= esc($lokasiLain) ?>"<?= $tampilLokasiLain ? ' required' : ' hidden' ?>>
                </div>
            </div>

            <!-- Field khusus "Saya Menemukan"  -->
            <div class="form-group" id="field-penitipan"<?= $tampilPenitipan ? '' : ' hidden' ?>>
                <label for="penitipan">Barang sekarang di mana?</label>
                <select id="penitipan" name="penitipan"<?= $tampilPenitipan ? ' required' : '' ?>>
                    <option value="">Pilih lokasi penitipan...</option>
<?php foreach (['Pos Satpam Depan', 'Tata Usaha', 'Bawa Sendiri'] as $opsi): ?>
                    <option value="<?= esc($opsi) ?>"<?= $penitipan === $opsi ? ' selected' : '' ?>><?= esc($opsi) ?></option>
<?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label for="deskripsi">Deskripsi Umum</label>
                <textarea id="deskripsi" name="deskripsi" rows="3" maxlength="500" placeholder="Warna, merek, ukuran, kondisi..." required><?= esc($deskripsi) ?></textarea>
            </div>

            <div class="form-group">
                <label for="ciri-rahasia">Ciri Rahasia (Untuk Verifikasi)</label>
                <textarea id="ciri-rahasia" name="ciri_rahasia" rows="2" maxlength="300" aria-describedby="ciri-hint" placeholder="Isi barang, goresan, stiker"<?= $tampilPenitipan ? ' required' : '' ?>><?= esc($ciriRahasia) ?></textarea>
                <small id="ciri-hint">Tidak dipublikasikan. Wajib diisi untuk laporan barang temuan.</small>
            </div>

            <p class="form-status<?= $error !== null ? ' is-error' : '' ?>" id="form-status" role="status"<?= $error === null ? ' hidden' : '' ?>><?= esc($error ?? '') ?></p>
            <button type="submit" class="btn-submit">Kirim Laporan</button>
        </form>
    </main>

    <script src="<?= esc(asset('js/laporan-form.js')) ?>"></script>
