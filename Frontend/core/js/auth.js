/**
 * LostnFound - Client-Side Demo Auth & Session Manager
 * Mengelola status login (Tamu vs Civitas) untuk keperluan prototype tanpa backend.
 */

(function () {
  const STORAGE_KEY = 'lostnfound_demo_user';

  const DEFAULT_USER = {
    name: 'Made Wirawan',
    initials: 'MW',
    nim: '2408561089',
    role: 'Mahasiswa',
    prodi: 'Informatika',
    fakultas: 'MIPA',
    email: 'made.wirawan@student.kampus.ac.id'
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
        lapor: '../laporan_pop_up/laporan_pop_up.html',
        daftarBarang: '../laporan_page/laporan.html'
      };
    } else if (isPagesSub) {
      const isLogin = rawPath.includes('/login/');
      const isProfile = rawPath.includes('/profile/');
      return {
        root: '../../',
        home: '../../index.html',
        login: isLogin ? 'login.html' : '../login/login.html',
        profile: isProfile ? 'profile.html' : '../profile/profile.html',
        lapor: '../laporan/laporan_pop_up/laporan_pop_up.html',
        daftarBarang: '../laporan/laporan_page/laporan.html',
        isLogin,
        isProfile
      };
    } else {
      // Root level (index.html)
      return {
        root: './',
        home: 'index.html',
        login: 'pages/login/login.html',
        profile: 'pages/profile/profile.html',
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

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'login') {
      setUser(DEFAULT_USER);
    } else if (params.get('demo') === 'logout') {
      removeUser();
    }
  }

  function updateNavbar() {
    const user = getUser();
    const paths = getPaths();
    const navActions = document.querySelector('.nav-actions');

    if (!navActions) return;

    if (user) {
      // User Sedang Login
      if (paths.isProfile) {
        // Di laman profil, tombol keluar tetap ada
        navActions.innerHTML = `
          <button type="button" class="btn-nav-action btn-nav-outline" id="btn-nav-logout" title="Keluar Akun">
            Keluar
          </button>
        `;
      } else {
        // Di laman index atau lainnya, tampilkan Profil Saya & tombol Keluar
        navActions.innerHTML = `
          <a class="nav-user-badge" href="${paths.profile}" title="Buka Profil Saya">
            <span class="nav-user-avatar">${user.initials || 'MW'}</span>
            <span>Profil Saya</span>
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
          if (paths.isProfile) {
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
        const identifier = idInput ? idInput.value.trim() : '';
        const activeUser = {
          ...DEFAULT_USER,
          nim: identifier.includes('@') ? DEFAULT_USER.nim : identifier || DEFAULT_USER.nim
        };
        setUser(activeUser);
        window.location.href = paths.profile;
      });
    }

    // Tangani submit form Daftar
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

    // Pastikan user demo tersedia saat berada di profil
    let user = getUser();
    if (!user) {
      setUser(DEFAULT_USER);
    }
  }

  // Inisialisasi saat DOM siap
  document.addEventListener('DOMContentLoaded', function () {
    checkUrlParams();
    updateNavbar();
    setupLoginPage();
    setupProfilePage();
  });
})();
