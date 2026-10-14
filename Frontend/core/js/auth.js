/**
 * LostnFound - Client-Side Demo Auth & Session Manager
 * Mengelola status login (Tamu / Civitas / Admin) untuk keperluan prototype tanpa backend.
 *
 * Catatan: field `role` dipakai untuk label tampilan (mis. "Mahasiswa"),
 * sedangkan hak akses memakai field terpisah `accessRole` ('user' | 'admin').
 */

(function () {
  const STORAGE_KEY = 'lostnfound_demo_user';

  const DEFAULT_USER = {
    name: 'Detuy Mahardika',
    initials: 'MW',
    nim: '2505551106',
    role: 'Mahasiswa',
    accessRole: 'user',
    prodi: 'Teknologi Informasi',
    fakultas: 'Teknik',
    email: 'deta@student.kampus.ac.id'
  };

  // Akun admin demo (dibuat manual, TIDAK bisa dibuat lewat form daftar)
  const ADMIN_ACCOUNT = {
    identifiers: ['admin', 'admin@kampus.ac.id'],
    password: 'admin123',
    user: {
      name: 'Admin LostnFound',
      initials: 'AD',
      nim: '-',
      role: 'Administrator',
      accessRole: 'admin',
      prodi: '-',
      fakultas: '-',
      email: 'admin@kampus.ac.id'
    }
  };

  // Helper resolusi path berdasarkan lokasi file saat ini
  function getPaths() {
    const rawPath = window.location.pathname.replace(/\\/g, '/');
    const isLaporanSub = rawPath.includes('/pages/laporan/');
    const isPagesSub = rawPath.includes('/pages/') && !isLaporanSub;

    if (isLaporanSub) {
      return {
        root: '../../../',
        home: '../../../index.html',
        login: '../../login/login.html',
        profile: '../../profile/profile.html',
        admin: '../../admin_profile/adminpage.html',
        lapor: '../laporan_pop_up/laporan_pop_up.html',
        daftarBarang: '../laporan_page/laporan.html'
      };
    } else if (isPagesSub) {
      const isLogin = rawPath.includes('/login/');
      const isProfile = rawPath.includes('/profile/');
      const isAdmin = rawPath.includes('/admin_profile/');
      return {
        root: '../../',
        home: '../../index.html',
        login: isLogin ? 'login.html' : '../login/login.html',
        profile: isProfile ? 'profile.html' : '../profile/profile.html',
        admin: isAdmin ? 'adminpage.html' : '../admin_profile/adminpage.html',
        lapor: '../laporan/laporan_pop_up/laporan_pop_up.html',
        daftarBarang: '../laporan/laporan_page/laporan.html',
        isLogin,
        isProfile,
        isAdmin
      };
    } else {
      // Root level (index.html)
      return {
        root: './',
        home: 'index.html',
        login: 'pages/login/login.html',
        profile: 'pages/profile/profile.html',
        admin: 'pages/admin_profile/adminpage.html',
        lapor: 'pages/laporan/laporan_pop_up/laporan_pop_up.html',
        daftarBarang: 'pages/laporan/laporan_page/laporan.html',
        isRoot: true
      };
    }
  }

  function getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user || DEFAULT_USER));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  function removeUser() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  // ===== Helper role =====
  function isAdminUser(user) {
    return !!user && user.accessRole === 'admin';
  }

  // Halaman "rumah" sesuai role: admin -> dashboard, user -> profil
  function homeFor(user, paths) {
    return isAdminUser(user) ? paths.admin : paths.profile;
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'login') {
      setUser(DEFAULT_USER);
    } else if (demo === 'admin') {
      setUser(ADMIN_ACCOUNT.user);
    } else if (demo === 'logout') {
      removeUser();
    }
  }

  function updateNavbar() {
    const user = getUser();
    const paths = getPaths();
    const navActions = document.querySelector('.nav-actions');

    if (!navActions) return;

    if (user) {
      // Sedang di halaman "rumah" miliknya? (admin -> adminpage, user -> profile)
      const onOwnPage = isAdminUser(user) ? paths.isAdmin : paths.isProfile;

      if (onOwnPage) {
        // Di laman miliknya, cukup tombol keluar
        navActions.innerHTML = `
          <button type="button" class="btn-nav-action btn-nav-outline" id="btn-nav-logout" title="Keluar Akun">
            Keluar
          </button>
        `;
      } else {
        // Di laman lain, tampilkan badge (Profil Saya / Dashboard Admin) & tombol Keluar
        const label = isAdminUser(user) ? 'Dashboard Admin' : 'Profil Saya';
        navActions.innerHTML = `
          <a class="nav-user-badge" href="${homeFor(user, paths)}" title="Buka ${label}">
            <span class="nav-user-avatar">${user.initials || 'MW'}</span>
            <span>${label}</span>
          </a>
          <button type="button" class="btn-nav-action btn-nav-outline" id="btn-nav-logout" title="Keluar Akun">
            Keluar
          </button>
        `;
      }

      const logoutBtn = document.getElementById('btn-nav-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          removeUser();
          if (paths.isProfile || paths.isAdmin) {
            window.location.href = paths.home;
          } else {
            updateNavbar();
          }
        });
      }
    } else {
      // Pengunjung / Belum Login
      navActions.innerHTML = `
        <a class="btn-nav-action" href="${paths.login}">Masuk</a>
      `;
    }
  }

  function setupLoginPage() {
    const paths = getPaths();
    if (!paths.isLogin) return;

    const masukForm = document.querySelector('#content-masuk form');
    const daftarForm = document.querySelector('#content-daftar form');

    // Tangani submit form Masuk
    if (masukForm) {
      masukForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const idInput = document.getElementById('login-id');
        const passInput = document.getElementById('login-password');
        const identifier = idInput ? idInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        // 1) Cek akun admin
        if (ADMIN_ACCOUNT.identifiers.includes(identifier.toLowerCase())) {
          if (password !== ADMIN_ACCOUNT.password) {
            alert('Kata sandi admin salah.');
            return;
          }
          setUser(ADMIN_ACCOUNT.user);
          window.location.href = paths.admin;
          return;
        }

        // 2) Selain itu: civitas biasa (perilaku demo lama dipertahankan)
        const activeUser = {
          ...DEFAULT_USER,
          nim: identifier.includes('@') ? DEFAULT_USER.nim : identifier || DEFAULT_USER.nim
        };
        setUser(activeUser);
        window.location.href = paths.profile;
      });
    }

    // Tangani submit form Daftar (selalu menjadi user biasa)
    if (daftarForm) {
      daftarForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const namaInput = document.getElementById('reg-nama');
        const nimInput = document.getElementById('reg-nim');
        const activeUser = {
          ...DEFAULT_USER,
          name: (namaInput && namaInput.value.trim()) || DEFAULT_USER.name,
          nim: (nimInput && nimInput.value.trim()) || DEFAULT_USER.nim
        };
        setUser(activeUser);
        window.location.href = paths.profile;
      });
    }
  }

  function setupProfilePage() {
    const paths = getPaths();
    if (!paths.isProfile) return;

    const user = getUser();

    // Admin nyasar ke profil user -> arahkan ke dashboard admin
    if (isAdminUser(user)) {
      window.location.replace(paths.admin);
      return;
    }

    // Pastikan user demo tersedia saat berada di profil
    if (!user) {
      setUser(DEFAULT_USER);
    }
  }

  // Penjaga halaman admin
  function setupAdminPage() {
    const paths = getPaths();
    if (!paths.isAdmin) return;

    const user = getUser();
    if (!user) {
      window.location.replace(paths.login);        // belum login
    } else if (!isAdminUser(user)) {
      window.location.replace(paths.profile);      // login tapi bukan admin
    }
  }

  // Inisialisasi saat DOM siap
  document.addEventListener('DOMContentLoaded', function () {
    checkUrlParams();
    setupAdminPage();   // guard dulu sebelum render apa pun
    setupProfilePage();
    updateNavbar();
    setupLoginPage();
  });
})();