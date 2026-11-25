<?php
$inisial = $admin['inisial'] ?? inisial((string) ($admin['nama'] ?? 'Admin'));
$adminNama = $admin['nama'] ?? 'Admin LostnFound';
$adminEmail = $admin['email'] ?? '-';
$jumlahAktif = (int) $stats['aktif'];

$badgeLaporan = [
    'Hilang'       => 'badge-hilang',
    'Ditemukan'    => 'badge-ditemukan',
    'Diklaim'      => 'badge-klaim',
    'Dikembalikan' => 'badge-kembali',
];
?>
  <main class="profile-page">
    <div class="container">

<?php if ($sukses !== null): ?>
      <p role="status" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #e8f5e9; color: #1b5e20; font-size: 0.9rem; font-weight: 600;"><?= esc($sukses) ?></p>
<?php endif; ?>
<?php if ($flashError !== null): ?>
      <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fee2e2; color: #b91c1c; font-size: 0.9rem; font-weight: 600;"><?= esc($flashError) ?></p>
<?php endif; ?>
<?php if ($errorDb !== null): ?>
      <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fff4e5; color: #8a4b00; font-size: 0.9rem; font-weight: 600;"><?= esc($errorDb) ?></p>
<?php endif; ?>
<?php if ($filterError !== null): ?>
      <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fff4e5; color: #8a4b00; font-size: 0.9rem; font-weight: 600;"><?= esc($filterError) ?></p>
<?php endif; ?>

      <!-- 1. Identitas Admin -->
      <section class="profile-header-card" aria-label="Identitas Admin">
        <div class="profile-identity-row">
          <div class="profile-user-info">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" aria-hidden="true"><?= esc($inisial) ?></div>
              <span class="avatar-online-status" title="Akun Aktif"></span>
            </div>
            <div class="user-meta-details">
              <h1>
                <?= esc($adminNama) ?>
                <span class="badge badge-role">Administrator</span>
              </h1>
              <p class="user-academic-line">
                Pengelola sistem laporan barang hilang &amp; temuan · Unit Layanan Kampus
              </p>
              <div class="user-contacts-line">
                <span class="contact-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <?= esc($adminEmail) ?>
                </span>
              </div>
            </div>
          </div>
          <div class="profile-header-actions" style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <a href="<?= esc(url('laporan')) ?>" class="btn btn-outline">Lihat Daftar Barang</a>
            <form method="get" action="index.php" style="display: flex; gap: 0.5rem; align-items: center; margin: 0; flex-wrap: wrap;">
              <input type="hidden" name="page" value="admin/laporan">
              <input type="hidden" name="aksi" value="export">
              <input type="hidden" name="status" value="<?= esc($filter['status']) ?>">
              <input type="hidden" name="start_date" value="<?= esc($filter['start_date']) ?>">
              <input type="hidden" name="end_date" value="<?= esc($filter['end_date']) ?>">
              <input type="hidden" name="q" value="<?= esc($filter['q']) ?>">
              <select name="jenis" class="form-control" aria-label="Jenis laporan yang diekspor" style="width: auto; min-width: 130px;">
                <option value="semua">Semua jenis</option>
                <option value="hilang">Hilang</option>
                <option value="temuan">Temuan</option>
              </select>
              <button type="submit" class="btn btn-export">Export Laporan</button>
            </form>
          </div>
        </div>
      </section>

      <!-- 2. Statistik Sistem -->
      <section class="profile-stats-grid" aria-label="Statistik Sistem">
        <div class="stat-card">
          <div class="stat-icon klaim" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <div class="stat-info"><span class="stat-value" id="stat-total"><?= (int) $stats['total'] ?></span><span class="stat-label">Total Laporan</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon hilang" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div class="stat-info"><span class="stat-value" id="stat-pending"><?= $jumlahAktif ?></span><span class="stat-label">Menunggu Moderasi</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon ditemukan" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <div class="stat-info"><span class="stat-value" id="stat-approved"><?= (int) $stats['diklaim'] ?></span><span class="stat-label">Laporan Disetujui</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon kembali" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="stat-info"><span class="stat-value"><?= (int) $stats['dikembalikan'] ?></span><span class="stat-label">Berhasil Dikembalikan</span></div>
        </div>
      </section>

      <!-- 3. Tab Admin (Murni CSS) -->
      <input type="radio" name="admin-tabs" id="tab-a-laporan" class="profile-tab-input"<?= $tabAktif === 'laporan' ? ' checked' : '' ?>>
      <input type="radio" name="admin-tabs" id="tab-a-report" class="profile-tab-input"<?= $tabAktif === 'report' ? ' checked' : '' ?>>
      <input type="radio" name="admin-tabs" id="tab-a-user" class="profile-tab-input"<?= $tabAktif === 'pengguna' ? ' checked' : '' ?>>

      <nav class="profile-nav-tabs" role="tablist" aria-label="Menu Admin">
        <label for="tab-a-laporan" class="tab-btn-label" role="tab">Moderasi Laporan <span class="tab-count-badge" id="tab-count-laporan"><?= $jumlahAktif ?></span></label>
        <label for="tab-a-report" class="tab-btn-label" role="tab">Report <span class="tab-count-badge is-red" id="tab-count-report">0</span></label>
        <label for="tab-a-user" class="tab-btn-label" role="tab">Pengguna</label>
      </nav>

      <!-- TAB 1: MODERASI LAPORAN -->
      <section class="profile-tab-pane" id="pane-a-laporan" aria-label="Moderasi Laporan">
        <form class="admin-toolbar" method="get" action="index.php" id="admin-filter-form" style="margin-top: 0;">
          <input type="hidden" name="page" value="admin">
          <input type="hidden" name="tab" value="laporan">
          <input type="search" id="admin-search" name="q" class="form-control" placeholder="Cari nama barang atau pelapor..." value="<?= esc($filter['q']) ?>">
          <select id="admin-filter" name="status" class="form-control" aria-label="Filter status">
            <option value="Semua"<?= $filter['status'] === 'Semua' ? ' selected' : '' ?>>Semua Status</option>
<?php foreach (['Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan'] as $status): ?>
            <option value="<?= esc($status) ?>"<?= $filter['status'] === $status ? ' selected' : '' ?>><?= esc($status) ?></option>
<?php endforeach; ?>
          </select>
          <input type="date" id="admin-start-date" name="start_date" class="form-control" value="<?= esc($filter['start_date']) ?>" aria-label="Dari tanggal" style="flex: 0 0 150px;">
          <input type="date" id="admin-end-date" name="end_date" class="form-control" value="<?= esc($filter['end_date']) ?>" aria-label="Sampai tanggal" style="flex: 0 0 150px;">
          <noscript><button type="submit" class="btn btn-primary btn-sm">Terapkan</button></noscript>
        </form>

<?php if ($daftar === []): ?>
        <p class="admin-empty" id="admin-empty">Tidak ada laporan yang cocok.</p>
<?php else: ?>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Barang</th><th>Jenis</th><th>Pelapor</th><th>Tanggal</th><th>Status</th><th class="col-actions">Aksi</th></tr>
            </thead>
            <tbody id="admin-tbody">
<?php foreach ($daftar as $item): ?>
<?php
    $status = (string) $item['status'];
    $statusKey = strtolower($status);
    $badgeClass = $badgeLaporan[$status] ?? 'badge-hilang';
    $isTemuan = $item['tipe'] === 'Ditemukan';
    $tipeLabel = $isTemuan ? 'Temuan' : 'Hilang';
    $statusAwal = $isTemuan ? 'Ditemukan' : 'Hilang';
    $isDiklaim = $status === 'Diklaim';
    $isDikembalikan = $status === 'Dikembalikan';
?>
              <tr data-status="<?= esc($statusKey) ?>">
                <td><strong><?= esc($item['nama_barang']) ?></strong><small><?= esc($item['lokasi']) ?></small></td>
                <td><?= esc($tipeLabel) ?></td>
                <td><?= esc($item['pelapor_nama'] ?? 'Anonim') ?></td>
                <td><?= esc(tanggalSingkatIndonesia((string) $item['tanggal'])) ?></td>
                <td><span class="badge <?= esc($badgeClass) ?>"><span class="badge-dot"></span><span class="status-text"><?= esc($status) ?></span></span></td>
                <td class="col-actions">
                  <form method="post" action="<?= esc(url('admin', ['aksi' => 'updateStatus'])) ?>" style="display: inline-flex; gap: 4px; flex-wrap: wrap;">
                    <?= csrfField() ?>
                    <input type="hidden" name="id" value="<?= (int) $item['id'] ?>">
                    <input type="hidden" name="tab" value="laporan">
                    <input type="hidden" name="q" value="<?= esc($filter['q']) ?>">
                    <input type="hidden" name="filter_status" value="<?= esc($filter['status']) ?>">
                    <input type="hidden" name="start_date" value="<?= esc($filter['start_date']) ?>">
                    <input type="hidden" name="end_date" value="<?= esc($filter['end_date']) ?>">
<?php if ($isDikembalikan): ?>
                    <button type="submit" name="status" value="<?= esc($statusAwal) ?>" class="btn btn-primary btn-sm" title="Pulihkan laporan ke status awal">Pulihkan</button>
<?php else: ?>
<?php if (!$isDiklaim && $isTemuan): ?>
                    <button type="submit" name="status" value="Diklaim" class="btn btn-primary btn-sm" title="Tandai laporan sebagai Diklaim">Klaim</button>
<?php endif; ?>
                    <button type="submit" name="status" value="Dikembalikan" class="btn <?= $isDiklaim ? 'btn-primary' : 'btn-outline' ?> btn-sm" title="Tandai laporan sebagai Dikembalikan">Kembalikan</button>
<?php if ($isDiklaim): ?>
                    <button type="submit" name="status" value="<?= esc($statusAwal) ?>" class="btn btn-outline btn-sm" title="Batalkan klaim">Batalkan</button>
<?php endif; ?>
<?php endif; ?>
                  </form>
                </td>
              </tr>
<?php endforeach; ?>
            </tbody>
          </table>
        </div>
<?php endif; ?>
      </section>

      <!-- TAB 2: REPORT -->
      <section class="profile-tab-pane" id="pane-a-report" aria-label="Report Laporan">
        <div class="report-summary" id="report-summary" style="display: none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          <span><strong id="report-count-text">0</strong> laporan di-report pengguna dan menunggu tinjauan admin.</span>
        </div>
        <div class="items-list-wrapper" id="report-list"></div>
        <p class="admin-empty" id="report-empty">Semua report sudah ditangani.</p>
      </section>

      <!-- TAB 3: PENGGUNA -->
      <section class="profile-tab-pane" id="pane-a-user" aria-label="Daftar Pengguna">
<?php if ($users === []): ?>
        <p class="admin-empty">Belum ada pengguna.</p>
<?php else: ?>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Nama</th><th>NIM</th><th>Email</th><th>Status</th><th class="col-actions">Aksi</th></tr></thead>
            <tbody>
<?php foreach ($users as $user): ?>
<?php
    $aktif = ($user['status'] ?? '') === 'aktif';
    $self = (int) $user['id'] === (int) currentUser()['id'];
?>
              <tr>
                <td><strong><?= esc($user['nama']) ?></strong></td>
                <td><?= esc($user['nim'] ?: '-') ?></td>
                <td><?= esc($user['email']) ?></td>
                <td><span class="badge <?= $aktif ? 'badge-ditemukan' : 'badge-hilang' ?>"><span class="badge-dot"></span><?= $aktif ? 'Aktif' : 'Nonaktif' ?></span></td>
                <td class="col-actions">
                  <form method="post" action="<?= esc(url('admin', ['aksi' => 'toggleUser'])) ?>" style="display: inline;">
                    <?= csrfField() ?>
                    <input type="hidden" name="id" value="<?= (int) $user['id'] ?>">
                    <input type="hidden" name="aksi_user" value="<?= $aktif ? 'nonaktifkan' : 'aktifkan' ?>">
                    <button type="submit" class="btn <?= $aktif ? 'btn-outline' : 'btn-primary' ?> btn-sm"<?= $self ? ' disabled title="Tidak dapat mengubah status akun sendiri"' : '' ?>><?= $aktif ? 'Nonaktifkan' : 'Aktifkan' ?></button>
                  </form>
                </td>
              </tr>
<?php endforeach; ?>
            </tbody>
          </table>
        </div>
<?php endif; ?>
      </section>

    </div>
  </main>

  <script src="<?= esc(asset('js/admin.js')) ?>"></script>
