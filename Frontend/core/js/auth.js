/**
 * LostnFound - Auth & Session Manager (Terintegrasi Backend PHP Session + Fallback Demo)
 * Mengelola status login (Tamu / Civitas / Admin), Pop-up Lapor, & Tombol Chat Navbar.
 */

(function () {
  const STORAGE_KEY = 'lostnfound_demo_user';
  const CHAT_PATH_FROM_ROOT = 'pages/chat/chat.html';

  const DEFAULT_USER = {
    name: 'Detuy Mahardika',
    initials: 'DM',
    nim: '2505551106',
    role: 'Mahasiswa',
    accessRole: 'user',
    prodi: 'Teknologi Informasi',
    fakultas: 'Teknik',
    email: 'deta@student.kampus.ac.id',
    phone: '0812-3456-7890'
  };

  const ADMIN_ACCOUNT = {
    identifiers: ['admin', 'admin@kampus.ac.id'],
    password: 'admin123',
    user: {
      name: 'Admin LostnFound',
      initials: 'AD',
      nim: 'admin',
      role: 'Administrator',
      accessRole: 'admin',
      prodi: '-',
      fakultas: '-',
      email: 'admin@kampus.ac.id',
      phone: '-'
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
      apiAuth: root + '../Backend/api/auth.php',
      apiChat: root + '../Backend/api/chat.php',
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

  // Render pesan error/info inline pada form login atau register
  function showAuthFeedback(form, message, isError) {
    if (!form) return;
    let box = form.querySelector('.auth-feedback-box');
    if (!box) {
      box = document.createElement('div');
      box.className = 'auth-feedback-box';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'padding:0.75rem 1rem;border-radius:10px;font-size:0.875rem;font-weight:600;margin-bottom:1rem;';
      form.prepend(box);
    }
    box.textContent = message;
    if (isError) {
      box.style.background = '#fee2e2';
      box.style.color = '#b91c1c';
      box.style.border = '1px solid #fecaca';
    } else {
      box.style.background = '#d1fae5';
      box.style.color = '#065f46';
      box.style.border = '1px solid #a7f3d0';
    }
  }

  // Helper call API auth.php; melempar { isApiError: true, message } jika server merespon error,
  // atau Error biasa jika server offline / bukan PHP.
  async function callAuthApi(url, options) {
    const res = await fetch(url, {
      credentials: 'include',
      ...options
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('SERVER_NOT_PHP');
    }

    const data = await res.json();
    if (!res.ok || !data || data.success === false) {
      const err = new Error((data && data.message) || ('HTTP ' + res.status));
      err.isApiError = true;
      throw err;
    }
    return data;
  }

  async function performLogout(paths) {
    try {
      await fetch(paths.apiAuth + '?action=logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (_) {
      // Abaikan jika offline
    }
    removeUser();
    if (paths.isProfile || paths.isAdmin || paths.isChat) {
      window.location.href = paths.home;
    } else {
      updateNavbar();
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

    const chatButtonHTML = `
      <a href="${paths.chat}" class="btn-nav-chat" id="btn-navbar-chat" aria-label="Buka Pesan Chat" title="Chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chat-notif-dot" id="chat-notif-badge" hidden></span>
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
            <span class="nav-user-avatar">${user.initials || 'US'}</span>
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
          performLogout(paths);
        });
      }
    } else {
      navActions.innerHTML = `
        ${chatButtonHTML}
        <a class="btn-nav-action" href="${paths.login}">Masuk</a>
      `;
    }
  }

  function populateProfileHeader(user) {
    if (!user) return;
    const avatarEl = document.querySelector('.profile-avatar');
    if (avatarEl) avatarEl.textContent = user.initials || 'US';

    const h1El = document.querySelector('.user-meta-details h1');
    if (h1El) {
      h1El.innerHTML = '';
      h1El.appendChild(document.createTextNode((user.name || 'Pengguna') + ' '));
      const badge = document.createElement('span');
      badge.className = 'badge badge-role';
      badge.textContent = user.role || 'Mahasiswa';
      h1El.appendChild(badge);
    }

    const acadEl = document.querySelector('.user-academic-line');
    if (acadEl) {
      acadEl.innerHTML = `NIM <strong>${escapeHtml(user.nim || '-')}</strong> · Program Studi ${escapeHtml(user.prodi || '-')} · Fakultas ${escapeHtml(user.fakultas || '-')}`;
    }

    const pills = document.querySelectorAll('.user-contacts-line .contact-pill');
    if (pills[0]) {
      const svg = pills[0].querySelector('svg');
      pills[0].textContent = ' ' + (user.email || '-');
      if (svg) pills[0].prepend(svg);
    }
    if (pills[1]) {
      const svg = pills[1].querySelector('svg');
      const phoneLabel = user.phone ? `${user.phone} (Privat)` : 'Belum diisi (Privat)';
      pills[1].textContent = ' ' + phoneLabel;
      if (svg) pills[1].prepend(svg);
    }
  }

  function escapeHtml(val) {
    return String(val).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function setupLoginPage() {
    const paths = getPaths();
    if (!paths.isLogin) return;

    const masukForm = document.querySelector('#content-masuk form');
    const daftarForm = document.querySelector('#content-daftar form');

    if (masukForm) {
      masukForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const idInput = document.getElementById('login-id');
        const passInput = document.getElementById('login-password');
        const submitBtn = masukForm.querySelector('button[type="submit"]');
        const identifier = idInput ? idInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (!identifier || !password) {
          showAuthFeedback(masukForm, 'NIM/Email dan kata sandi wajib diisi.', true);
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Memproses...';
        }

        try {
          const data = await callAuthApi(paths.apiAuth + '?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
          });

          setUser(data.user);
          window.location.href = homeFor(data.user, paths);
        } catch (err) {
          if (err.isApiError) {
            showAuthFeedback(masukForm, err.message, true);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Masuk';
            }
            return;
          }

          // Fallback offline jika server PHP/MySQL belum aktif
          console.warn('Auth backend belum aktif, menggunakan fallback demo lokal:', err);
          if (ADMIN_ACCOUNT.identifiers.includes(identifier.toLowerCase())) {
            if (password !== ADMIN_ACCOUNT.password) {
              showAuthFeedback(masukForm, 'Kata sandi admin salah.', true);
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Masuk';
              }
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
        }
      });
    }

    if (daftarForm) {
      daftarForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const namaVal = (document.getElementById('reg-nama')?.value || '').trim();
        const nimVal = (document.getElementById('reg-nim')?.value || '').trim();
        const emailVal = (document.getElementById('reg-email')?.value || '').trim();
        const passVal = document.getElementById('reg-pass')?.value || '';
        const phoneVal = (document.getElementById('reg-phone')?.value || '').trim();
        const submitBtn = daftarForm.querySelector('button[type="submit"]');

        if (!namaVal || !nimVal || !emailVal || !passVal) {
          showAuthFeedback(daftarForm, 'Semua kolom wajib diisi.', true);
          return;
        }

        if (passVal.length < 8) {
          showAuthFeedback(daftarForm, 'Kata sandi minimal 8 karakter.', true);
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Mendaftar...';
        }

        try {
          const data = await callAuthApi(paths.apiAuth + '?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nama: namaVal,
              nim: nimVal,
              email: emailVal,
              password: passVal,
              phone: phoneVal
            })
          });

          setUser(data.user);
          window.location.href = paths.profile;
        } catch (err) {
          if (err.isApiError) {
            showAuthFeedback(daftarForm, err.message, true);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Daftar Sekarang';
            }
            return;
          }

          // Fallback offline jika server PHP/MySQL belum aktif
          console.warn('Auth backend belum aktif, menggunakan fallback pendaftaran lokal:', err);
          const initials = namaVal
            .split(/\s+/)
            .map(function (w) { return w[0]; })
            .join('')
            .substring(0, 2)
            .toUpperCase();

          const activeUser = {
            ...DEFAULT_USER,
            name: namaVal || DEFAULT_USER.name,
            initials: initials || 'US',
            nim: nimVal || DEFAULT_USER.nim,
            email: emailVal || DEFAULT_USER.email,
            phone: phoneVal
          };
          setUser(activeUser);
          window.location.href = paths.profile;
        }
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
    if (user) {
      populateProfileHeader(user);
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

  async function refreshUnreadChatBadge() {
    const badge = document.getElementById('chat-notif-badge');
    const chatBtn = document.getElementById('btn-navbar-chat');
    if (!badge) return;

    const user = getUser();
    if (!user) {
      badge.hidden = true;
      return;
    }

    const paths = getPaths();
    try {
      const res = await fetch(paths.apiChat + '?action=unread_count', { credentials: 'include' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        const count = Number((data && data.unread) || 0);
        badge.hidden = count <= 0;
        if (chatBtn) {
          chatBtn.title = count > 0 ? `Chat (${count} pesan baru)` : 'Chat';
        }
      }
    } catch (_) {
      badge.hidden = true;
    }
  }

  // Sinkronkan status login lokal dengan $_SESSION server PHP
  async function syncSessionWithBackend() {
    const paths = getPaths();
    try {
      const data = await callAuthApi(paths.apiAuth + '?action=me', { method: 'GET' });
      if (data.authenticated && data.user) {
        setUser(data.user);
        updateNavbar();
        refreshUnreadChatBadge();
        if (paths.isProfile) {
          if (isAdminUser(data.user)) {
            window.location.replace(paths.admin);
            return;
          }
          populateProfileHeader(data.user);
        } else if (paths.isAdmin && !isAdminUser(data.user)) {
          window.location.replace(paths.profile);
        }
      } else {
        // Server PHP aktif & menyatakan belum ada sesi login
        if (getUser()) {
          removeUser();
          updateNavbar();
        }
        if (paths.isProfile || paths.isAdmin) {
          window.location.replace(paths.login);
        }
      }
    } catch (_) {
      // Backend belum aktif -> gunakan mode fallback localStorage
      if (paths.isProfile && !getUser()) {
        setUser(DEFAULT_USER);
        populateProfileHeader(DEFAULT_USER);
        updateNavbar();
      }
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
      window.dispatchEvent(new CustomEvent('lostnfound:modal-closed'));
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

  // Ekspos fungsi logout global untuk kompatibilitas tombol Keluar di profile.html
  window.logout = function () {
    performLogout(getPaths());
  };
  window.refreshUnreadChatBadge = refreshUnreadChatBadge;

  document.addEventListener('DOMContentLoaded', function () {
    checkUrlParams();
    setupAdminPage();
    setupProfilePage();
    updateNavbar();
    setupLoginPage();
    setupLaporPopupModal();
    syncSessionWithBackend();
  });
})();
