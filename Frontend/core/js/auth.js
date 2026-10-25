/**
 * LostnFound - Client-Side Demo Auth & Session Manager
 * Mengelola status login (Tamu / Civitas / Admin), Pop-up Lapor, & Tombol Chat Navbar.
 */

(function () {
  const STORAGE_KEY = 'lostnfound_demo_user';

  // ⚠️ PENTING: Sesuaikan lokasi file chat.html kamu di sini!
  // Jika berada di dalam folder pages -> 'pages/chat/chat.html'
  // Jika berada sejajar dengan index.html -> 'chat/chat.html'
  const CHAT_PATH_FROM_ROOT = 'pages/chat/chat.html';

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

  // Helper resolusi path otomatis berdasarkan tag <script src="...core/js/auth.js">
  function getPaths() {
    const rawPath = window.location.pathname.replace(/\\/g, '/');
    const isLaporanSub = rawPath.includes('/pages/laporan/') || rawPath.includes('/laporan/');
    const isLogin = rawPath.includes('/login/');
    const isProfile = rawPath.includes('/profile/');
    const isAdmin = rawPath.includes('/admin_profile/');
    const isChat = rawPath.includes('/chat/');

    // Deteksi prefix root paling akurat dari tag script auth.js di HTML
    const authScript = document.querySelector('script[src*="core/js/auth.js"]');
    let root = './';
    if (authScript) {
      root = authScript.getAttribute('src').replace('core/js/auth.js', '');
    } else if (isLaporanSub) {
      root = '../../../';
    } else if (rawPath.includes('/pages/')) {
      root = '../../';
    }

    return {
      root: root,
      home: root + 'index.html',
      login: root + 'pages/login/login.html',
      profile: root + 'pages/profile/profile.html',
      admin: root + 'pages/admin_profile/adminpage.html',
      lapor: root + 'pages/laporan/laporan_pop_up/laporan_pop_up.html',
      daftarBarang: root + 'pages/laporan/laporan_page/laporan.html',
      chat: root + CHAT_PATH_FROM_ROOT,
      isLogin,
      isProfile,
      isAdmin,
      isChat
    };
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

  function isAdminUser(user) {
    return !!user && user.accessRole === 'admin';
  }

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

  // Pastikan CSS tombol chat selalu tersedia meskipun navbar.css belum ter-update
  function injectChatButtonStyles() {
    if (document.getElementById('lf-chat-btn-styles')) return;
    const style = document.createElement('style');
    style.id = 'lf-chat-btn-styles';
    style.textContent = `
      .btn-nav-chat {
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #ffffff;
        border: 1.5px solid var(--border-subtle, #d0e4e8);
        color: var(--brand-navy, #202050);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.16s ease-out;
        flex-shrink: 0;
      }
      .btn-nav-chat:hover {
        border-color: var(--brand-teal, #286890);
        background: var(--brand-hero-bg, #e0f0f0);
        color: var(--brand-teal, #286890);
        transform: translateY(-1px);
      }
      .btn-nav-chat svg {
        width: 20px;
        height: 20px;
      }
      .chat-notif-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 11px;
        height: 11px;
        background: #e53935;
        border: 2px solid #ffffff;
        border-radius: 50%;
      }
    `;
    document.head.appendChild(style);
  }

  function updateNavbar() {
    injectChatButtonStyles();
    const user = getUser();
    const paths = getPaths();
    const navActions = document.querySelector('.nav-actions');

    if (!navActions) return;

    // Template HTML Tombol Ikon Chat (langsung pakai <a href="..."> agar pasti bisa diklik)
    const chatButtonHTML = `
      <a href="${paths.chat}" class="btn-nav-chat" id="btn-navbar-chat" aria-label="Buka Pesan Chat" title="Chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chat-notif-dot" id="chat-notif-badge"></span>
      </a>
    `;

    if (user) {
      const onOwnPage = isAdminUser(user) ? paths.isAdmin : paths.isProfile;

      if (onOwnPage) {
        navActions.innerHTML = `
          ${chatButtonHTML}
          <button type="button" class="btn-nav-action btn-nav-outline" id="btn-nav-logout" title="Keluar Akun">
            Keluar
          </button>
        `;
      } else {
        const label = isAdminUser(user) ? 'Dashboard Admin' : 'Profil Saya';
        navActions.innerHTML = `
          ${chatButtonHTML}
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
      // Pengunjung / Belum Login (Tetap tampilkan tombol Chat + tombol Masuk)
      navActions.innerHTML = `
        ${chatButtonHTML}
        <a class="btn-nav-action" href="${paths.login}">Masuk</a>
      `;
    }
  }

  function setupLoginPage() {
    const paths = getPaths();
    if (!paths.isLogin) return;

    const masukForm = document.querySelector('#content-masuk form');
    const daftarForm = document.querySelector('#content-daftar form');

    if (masukForm) {
      masukForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const idInput = document.getElementById('login-id');
        const passInput = document.getElementById('login-password');
        const identifier = idInput ? idInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (ADMIN_ACCOUNT.identifiers.includes(identifier.toLowerCase())) {
          if (password !== ADMIN_ACCOUNT.password) {
            alert('Kata sandi admin salah.');
            return;
          }
          setUser(ADMIN_ACCOUNT.user);
          window.location.href = paths.admin;
          return;
        }

        const activeUser = {
          ...DEFAULT_USER,
          nim: identifier.includes('@') ? DEFAULT_USER.nim : identifier || DEFAULT_USER.nim
        };
        setUser(activeUser);
        window.location.href = paths.profile;
      });
    }

    if (daftarForm) {
      daftarForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const namaInput = document.getElementById('reg-nama');
        const nimInput = document.getElementById('reg-nim');
        const phoneInput = document.getElementById('reg-phone');
        const namaVal = (namaInput && namaInput.value.trim()) || DEFAULT_USER.name;
        const initials = namaVal
          .split(/\s+/)
          .map(function (w) { return w[0]; })
          .join('')
          .substring(0, 2)
          .toUpperCase();

        const activeUser = {
          ...DEFAULT_USER,
          name: namaVal,
          initials: initials || 'MW',
          nim: (nimInput && nimInput.value.trim()) || DEFAULT_USER.nim,
          phone: (phoneInput && phoneInput.value.trim()) || ''
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
    if (isAdminUser(user)) {
      window.location.replace(paths.admin);
      return;
    }
    if (!user) {
      setUser(DEFAULT_USER);
    }
  }

  function setupAdminPage() {
    const paths = getPaths();
    if (!paths.isAdmin) return;

    const user = getUser();
    if (!user) {
      window.location.replace(paths.login);
    } else if (!isAdminUser(user)) {
      window.location.replace(paths.profile);
    }
  }

  function setupLaporPopupModal() {
    if (window.location.pathname.includes('laporan_pop_up.html')) return;

    const style = document.createElement('style');
    style.textContent = `
      .lapor-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(26, 26, 64, 0.55);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.22s ease, visibility 0.22s ease;
        padding: 1rem;
      }
      .lapor-modal-overlay.is-open {
        opacity: 1;
        visibility: visible;
      }
      .lapor-modal-box {
        position: relative;
        width: min(680px, 100%);
        height: min(88vh, 780px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.22);
        overflow: hidden;
        transform: translateY(16px) scale(0.98);
        transition: transform 0.22s ease;
      }
      .lapor-modal-overlay.is-open .lapor-modal-box {
        transform: translateY(0) scale(1);
      }
      .lapor-modal-close {
        position: absolute;
        top: 14px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid #d0e4e8;
        background: #ffffff;
        color: #202050;
        font-size: 1.3rem;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        display: grid;
        place-items: center;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      .lapor-modal-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'lapor-modal-overlay';
    overlay.innerHTML = `
      <div class="lapor-modal-box">
        <button type="button" class="lapor-modal-close" aria-label="Tutup pop-up">&times;</button>
        <iframe class="lapor-modal-iframe" id="lapor-iframe" title="Form Buat Laporan"></iframe>
      </div>
    `;
    document.body.appendChild(overlay);

    const iframe = overlay.querySelector('#lapor-iframe');
    const closeBtn = overlay.querySelector('.lapor-modal-close');

    function openLaporModal(url) {
      const separator = url.includes('?') ? '&' : '?';
      iframe.src = url + separator + 'popup=1';
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLaporModal() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { iframe.src = ''; }, 220);
    }

    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href*="laporan_pop_up.html"]');
      if (!link) return;
      e.preventDefault();

      const user = getUser();
      if (!user) {
        alert('Silakan masuk (login) terlebih dahulu sebelum membuat laporan.');
        window.location.href = paths.login;
        return;
      }

      openLaporModal(link.getAttribute('href'));
    });

    closeBtn.addEventListener('click', closeLaporModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLaporModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeLaporModal();
      }
    });
  }

  // Jalankan semua dalam satu pintu saat DOM siap
  document.addEventListener('DOMContentLoaded', function () {
    checkUrlParams();
    setupAdminPage();
    setupProfilePage();
    updateNavbar();
    setupLoginPage();
    setupLaporPopupModal();
  });
})();