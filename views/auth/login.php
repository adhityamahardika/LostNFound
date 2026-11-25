  <!-- Konten Utama Auth -->
  <main class="auth-page">
    <div class="auth-container">
      
      <!-- Sisi Kiri: Hero Panel Khusus Civitas -->
      <section class="auth-hero-panel" aria-label="Informasi Portal">
        <div>
          <div class="hero-badge-tag">
            Portal Civitas Kampus
          </div>
          <h1 class="hero-heading">Barang hilang di kampus? Akses akunmu untuk lapor dan klaim.</h1>
          <p class="hero-subtitle">
            Pusat laporan barang hilang dan temuan kampus, dengan verifikasi kepemilikan ciri rahasia yang aman.
          </p>

          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <strong>Verifikasi Ciri Rahasia</strong>
                <p>Mencegah klaim keliru. Pengklaim wajib menyebutkan ciri yang tidak tampak pada foto laporan.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <strong>Chat Langsung Terproteksi</strong>
                <p>Ruang percakapan antara pemilik dan penemu langsung aktif segera setelah klaim diverifikasi.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <strong>Privasi Kontak Aman</strong>
                <p>Nomor HP dan kontak personal tidak dipublikasikan ke publik demi kenyamanan sesama civitas.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-footer-note">
          Gunakan identitas NIM atau email akademik kampus untuk mengelola laporan dan riwayat klaimmu.
        </div>
      </section>

      <!-- Sisi Kanan: Form Masuk / Daftar Dikhususkan Civitas -->
      <section class="auth-form-panel" aria-label="Form Autentikasi">
        
        <input type="radio" name="auth-tab" id="tab-masuk" class="auth-tab-control"<?= $tabAktif === 'masuk' ? ' checked' : '' ?>>
        <input type="radio" name="auth-tab" id="tab-daftar" class="auth-tab-control"<?= $tabAktif === 'daftar' ? ' checked' : '' ?>>

        <!-- Navigasi Tab Masuk / Daftar -->
        <div class="auth-tab-nav" role="tablist">
          <label for="tab-masuk" class="auth-tab-label" role="tab">Masuk</label>
          <label for="tab-daftar" class="auth-tab-label" role="tab">Daftar Akun</label>
        </div>

        <!-- PANEL MASUK -->
        <div class="auth-tab-content" id="content-masuk">
          <div class="auth-header">
            <h2>Masuk ke Akun</h2>
            <p>Masukkan NIM atau Email Kampus yang telah terdaftar.</p>
          </div>

<?php if ($tabAktif === 'masuk' && $sukses !== null): ?>
          <p role="status" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #e8f5e9; color: #1b5e20; font-size: 0.9rem; font-weight: 600;"><?= esc($sukses) ?></p>
<?php endif; ?>
<?php if ($tabAktif === 'masuk' && $error !== null): ?>
          <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fee2e2; color: #b91c1c; font-size: 0.9rem; font-weight: 600;"><?= esc($error) ?></p>
<?php endif; ?>

          <form action="<?= esc(url('auth/login', ['aksi' => 'proses'])) ?>" method="post">
            <?= csrfField() ?>
            <div class="form-group">
              <label for="login-id" class="form-label">NIM atau Email Kampus</label>
              <input 
                type="text" 
                id="login-id" 
                name="identifier" 
                class="form-control" 
                placeholder="Contoh: 2408561089 atau nama@student.ac.id" 
                value="<?= esc($old['identifier'] ?? '') ?>"
                required
              >
            </div>

            <div class="form-group" style="margin-top: 0.9rem;">
              <div class="form-label">
                <span>Kata Sandi</span>
                <a href="#lupa" class="forgot-link">Lupa sandi?</a>
              </div>
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                class="form-control" 
                placeholder="Masukkan kata sandi akun"
                required
              >
            </div>

            <div class="form-helper-row" style="margin-top: 1.15rem; margin-bottom: 1.5rem;">
              <label class="custom-checkbox">
                <input type="checkbox" name="remember" checked>
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Masuk
            </button>
          </form>

          <div class="auth-divider">atau</div>

          <div class="guest-action">
            <span>Hanya ingin mengecek barang hilang? </span>
            <a href="<?= esc(url('laporan')) ?>">
              Lihat Daftar Barang →
            </a>
          </div>
        </div>

        <!-- PANEL DAFTAR -->
        <div class="auth-tab-content" id="content-daftar">
          <div class="auth-header">
            <h2>Daftar Akun Baru</h2>
            <p>Lengkapi formulir untuk membuat akun civitas kampus.</p>
          </div>

<?php if ($tabAktif === 'daftar' && $error !== null): ?>
          <p role="alert" style="margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fee2e2; color: #b91c1c; font-size: 0.9rem; font-weight: 600;"><?= esc($error) ?></p>
<?php endif; ?>

          <form action="<?= esc(url('auth/register', ['aksi' => 'proses'])) ?>" method="post">
            <?= csrfField() ?>
            <div class="form-group">
              <label for="reg-nama" class="form-label">Nama Lengkap</label>
              <input type="text" id="reg-nama" name="nama" class="form-control" placeholder="Contoh: Made Wirawan" value="<?= esc($old['nama'] ?? '') ?>" required>
            </div>

            <div class="form-group" style="margin-top: 0.85rem;">
              <label for="reg-nim" class="form-label">NIM / NIP</label>
              <input type="text" id="reg-nim" name="nim" class="form-control" placeholder="Nomor Induk Mahasiswa / Dosen" value="<?= esc($old['nim'] ?? '') ?>" required>
            </div>

            <div class="form-group" style="margin-top: 0.85rem;">
              <label for="reg-email" class="form-label">Email Kampus (@student / @kampus.ac.id)</label>
              <input type="email" id="reg-email" name="email" class="form-control" placeholder="nama@student.kampus.ac.id" value="<?= esc($old['email'] ?? '') ?>" required>
            </div>

            <div class="form-group" style="margin-top: 0.85rem;">
              <label for="reg-pass" class="form-label">Kata Sandi</label>
              <input type="password" id="reg-pass" name="password" class="form-control" placeholder="Minimal 8 karakter" required>
            </div>

            <div class="form-group" style="margin-top: 0.85rem;">
              <label for="reg-phone" class="form-label">Nomor Telepon</label>
              <input type="tel" id="reg-phone" name="phone" class="form-control" placeholder="Contoh: 0812-3456-7890" value="<?= esc($old['phone'] ?? '') ?>" required>
            </div>

            <div class="form-group" style="margin-top: 0.85rem;">
              <label class="custom-checkbox">
                <input type="checkbox" name="setuju" required>
                <span>Saya bersedia menjaga kejujuran dan etika pelaporan barang di kampus.</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.25rem;">
              Daftar Sekarang
            </button>
          </form>

          <div class="guest-action" style="margin-top: 1.25rem;">
            <span>Sudah punya akun? </span>
            <label for="tab-masuk" style="color: var(--brand-teal); font-weight: 700; cursor: pointer; text-decoration: underline;">
              Masuk di sini
            </label>
          </div>
        </div>

      </section>

    </div>
  </main>
