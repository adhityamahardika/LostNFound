// ==========================================================================
// CHAT (Terintegrasi Backend PHP/MySQL + Delta Polling + Fallback Demo)
// ==========================================================================
document.addEventListener('DOMContentLoaded', function () {
  const USER_KEY = 'lostnfound_demo_user';
  const CHAT_KEY = 'lostnfound_chats_v1';
  const API_AUTH = '../../../Backend/api/auth.php';
  const API_CHAT = '../../../Backend/api/chat.php';
  const POLL_INTERVAL_MS = 3500;

  const $ = (id) => document.getElementById(id);
  const els = {
    shell: $('chat-shell'),
    list: $('conv-list'),
    search: $('conv-search'),
    empty: $('room-empty'),
    room: $('room-active'),
    avatar: $('room-avatar'),
    name: $('room-name'),
    subtitle: $('room-subtitle'),
    context: $('item-context'),
    messages: $('messages'),
    input: $('msg-input'),
    send: $('send-btn'),
    back: $('back-btn'),
    quick: $('quick-replies')
  };

  let user = null;
  let useBackend = false;
  let chats = [];
  let activeId = null;
  let activeMessages = [];
  let pollTimer = null;
  let isPolling = false;
  const typing = {};

  // ---------- Helpers ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dayKey = (ts) => new Date(ts).toDateString();
  const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function fmtDay(ts) {
    const d = new Date(ts), today = new Date();
    const yest = new Date(); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    if (d.toDateString() === yest.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function statusPillMarkup(status) {
    const s = String(status || 'Menunggu');
    let cls = '';
    if (s === 'Terverifikasi') cls = ' is-verified';
    else if (s === 'Selesai') cls = ' is-done';
    return `<span class="conv-status-pill${cls}">${esc(s)}</span>`;
  }

  function renderQuickReplies(isOwner) {
    if (!els.quick) return;
    const chips = isOwner
      ? [
          'Cirinya cocok, silakan ambil!',
          'Saya titipkan di Pos Satpam Depan.',
          'Bisa sebutkan ciri tambahan?',
          'Terima kasih!'
        ]
      : [
          'Ciri rahasia barangnya...',
          'Kapan bisa bertemu?',
          'Barangnya diambil di mana?',
          'Terima kasih!'
        ];

    els.quick.innerHTML = chips.map((c) => `<button type="button" class="chip">${esc(c)}</button>`).join('');
  }

  // ---------- Auth & Mode Check ----------
  async function initSession() {
    try {
      const res = await fetch(API_AUTH + '?action=me', { credentials: 'include' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        useBackend = true;
        if (!data.authenticated || !data.user) {
          location.replace('../login/login.html');
          return false;
        }
        user = data.user;
        try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (_) {}
        return true;
      }
    } catch (_) {
      // Backend offline -> fallback ke mode lokal
    }

    try { user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (_) {}
    if (!user) {
      location.replace('../login/login.html');
      return false;
    }
    return true;
  }

  // ---------- Storage Fallback (Offline) ----------
  function saveLocal() { try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); } catch (_) {} }

  function seedLocal() {
    const now = Date.now(), H = 3600000;
    return [
      {
        id: 'c-seed-1', laporanId: 3, itemCode: 'LF-20260928-003', itemTitle: 'Kartu Mahasiswa',
        otherName: 'Rizky', otherRoleLabel: 'Penemu · identitas dijaga', isOwner: false,
        status: 'Terverifikasi', unread: 1, updatedTs: now - 2 * H,
        messages: [
          { id: uid(), from: 'sys', text: 'Percakapan dimulai untuk barang "Kartu Mahasiswa".', ts: now - 26 * H },
          { id: uid(), from: 'them', text: 'Halo, KTM-nya sudah saya titipkan di Pos Satpam Depan.', ts: now - 25 * H },
          { id: uid(), from: 'me', text: 'Terima kasih banyak! Besok pagi saya ambil.', ts: now - 25 * H + 60000, read: true },
          { id: uid(), from: 'them', text: 'Siap, jangan lupa bawa kartu identitas lain ya.', ts: now - 2 * H }
        ]
      }
    ];
  }

  function loadLocal() {
    try { chats = JSON.parse(localStorage.getItem(CHAT_KEY) || 'null') || []; } catch (_) { chats = []; }
    if (!chats.length) { chats = seedLocal(); saveLocal(); }
  }

  function openLocalFromParams() {
    const p = new URLSearchParams(location.search);
    let code = p.get('item');
    let title = p.get('title');
    let finder = p.get('finder');
    let laporanId = p.get('id') || '';
    let initialUserMsg = '';

    try {
      const klaimTerbaru = JSON.parse(localStorage.getItem('klaim_terbaru') || 'null');
      if (klaimTerbaru) {
        if (!code) code = klaimTerbaru.kodeLaporan || ('LF-' + klaimTerbaru.idBarang);
        if (!title) title = klaimTerbaru.namaBarang;
        if (!finder) finder = klaimTerbaru.pelapor || 'Penemu Anonim';
        if (!laporanId) laporanId = klaimTerbaru.idBarang || '';
        if (klaimTerbaru.ciriRahasia) {
          initialUserMsg = 'Halo, saya mengajukan klaim untuk ' + title + '. Ciri khusus: ' + klaimTerbaru.ciriRahasia;
          if (klaimTerbaru.catatan) initialUserMsg += ' (Catatan: ' + klaimTerbaru.catatan + ')';
        }
      }
    } catch (_) {}

    if (!code) return null;

    let chat = chats.find((c) => c.itemCode === code);
    if (!chat) {
      title = title || 'Barang temuan';
      finder = finder || 'Penemu Anonim';
      const now = Date.now();
      const newMessages = [
        { id: uid(), from: 'sys', text: 'Kamu mengajukan klaim untuk "' + title + '".', ts: now }
      ];
      if (initialUserMsg) {
        newMessages.push({ id: uid(), from: 'me', text: initialUserMsg, ts: now + 500, read: true });
        newMessages.push({ id: uid(), from: 'them', text: 'Halo, terima kasih informasinya. Saya cek dulu ya.', ts: now + 2000 });
      }
      chat = {
        id: 'c-' + now, laporanId, itemCode: code, itemTitle: title,
        otherName: finder, otherRoleLabel: 'Penemu · identitas dijaga', isOwner: false,
        status: 'Menunggu', unread: 0, updatedTs: now, messages: newMessages
      };
      chats.push(chat);
      saveLocal();
    }
    history.replaceState(null, '', location.pathname);
    return chat.id;
  }

  // ---------- Backend Fetchers ----------
  async function loadBackendConversations() {
    const res = await fetch(API_CHAT, { credentials: 'include' });
    if (res.status === 401) {
      location.replace('../login/login.html');
      return;
    }
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      chats = data.data;
    }
  }

  async function resolveInitialConversationBackend() {
    const p = new URLSearchParams(location.search);
    const convParam = p.get('conv');
    const laporanParam = p.get('laporan_id') || p.get('id');
    const itemParam = p.get('item');

    let targetId = null;

    if (convParam) {
      const found = chats.find((c) => String(c.id) === String(convParam));
      if (found) targetId = found.id;
    } else if (laporanParam) {
      const found = chats.find((c) => String(c.laporanId) === String(laporanParam));
      if (found) {
        targetId = found.id;
      } else {
        // Buka room baru bila user mengklaim dari detail_barang -> klaim
        try {
          const res = await fetch(API_CHAT + '?action=start', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ laporan_id: Number(laporanParam) })
          });
          const data = await res.json().catch(() => null);
          if (data && data.success && data.conversation_id) {
            await loadBackendConversations();
            targetId = data.conversation_id;
          }
        } catch (_) {}
      }
    } else if (itemParam) {
      const found = chats.find((c) => c.itemCode === itemParam);
      if (found) targetId = found.id;
    }

    if (location.search) {
      history.replaceState(null, '', location.pathname);
    }
    return targetId;
  }

  async function fetchBackendMessages(convId, afterId = 0) {
    const url = `${API_CHAT}?conversation_id=${encodeURIComponent(convId)}&after_id=${encodeURIComponent(afterId)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (res.status === 401) {
      location.replace('../login/login.html');
      return null;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.success) return null;
    return data;
  }

  // ---------- Render: Daftar Percakapan ----------
  function renderList() {
    const q = els.search.value.trim().toLowerCase();
    const items = chats
      .filter((c) => {
        const name = c.otherName || c.finder || '';
        return !q || (name + ' ' + c.itemTitle + ' ' + (c.itemCode || '')).toLowerCase().includes(q);
      })
      .sort((a, b) => (b.updatedTs || b.updated || 0) - (a.updatedTs || a.updated || 0));

    if (!items.length) {
      els.list.innerHTML = '<p class="conv-empty">Belum ada percakapan.</p>';
      return;
    }

    els.list.innerHTML = '';
    items.forEach((c) => {
      const displayName = c.otherName || c.finder || 'Civitas Kampus';
      let previewText = c.lastMessage || '';
      let fromMe = Boolean(c.lastFromMe);
      let timeTs = c.updatedTs || c.updated || Date.now();

      if (!useBackend && Array.isArray(c.messages) && c.messages.length) {
        const last = c.messages[c.messages.length - 1];
        previewText = last.text;
        fromMe = last.from === 'me';
        timeTs = last.ts;
      }

      const preview = (fromMe ? 'Kamu: ' : '') + (previewText || 'Percakapan dimulai');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'conv-item' + (String(c.id) === String(activeId) ? ' active' : '');
      btn.innerHTML =
        `<span class="avatar">${esc(initials(displayName))}</span>` +
        `<span class="conv-body"><strong>${esc(displayName)}</strong>` +
        `<span class="conv-item-name">${esc(c.itemTitle)}${statusPillMarkup(c.status)}</span>` +
        `<p>${esc(preview)}</p></span>` +
        `<span class="conv-meta"><span>${fmtTime(timeTs)}</span>` +
        (c.unread ? `<span class="unread-badge">${c.unread}</span>` : '') +
        `</span>`;
      btn.addEventListener('click', () => openChat(c.id));
      els.list.appendChild(btn);
    });
  }

  // ---------- Render: Ruang Chat ----------
  function renderRoomHeaderAndContext(c) {
    const displayName = c.otherName || c.finder || 'Civitas Kampus';
    els.avatar.textContent = initials(displayName);
    els.name.textContent = displayName;
    if (els.subtitle) {
      els.subtitle.textContent = c.otherRoleLabel || 'Identitas dijaga';
    }

    const detailHref = c.laporanId
      ? `../laporan/detail_barang/detail_barang.html?id=${encodeURIComponent(c.laporanId)}`
      : '../laporan/laporan_page/laporan.html';

    let ownerButtons = '';
    if (useBackend && (c.isOwner || (user && user.accessRole === 'admin'))) {
      if (c.status === 'Menunggu') {
        ownerButtons += `<button type="button" class="btn-ctx btn-ctx--verify" data-conv-status="Terverifikasi">Setujui Klaim</button>`;
      }
      if (c.status !== 'Selesai') {
        ownerButtons += `<button type="button" class="btn-ctx btn-ctx--done" data-conv-status="Selesai">Tandai Dikembalikan</button>`;
      }
    }

    els.context.innerHTML =
      `<span class="item-context-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></span>` +
      `<div class="item-context-info"><strong>${esc(c.itemTitle)}</strong><span>${esc(c.itemCode)} · ${esc(c.status)}${c.itemLokasi ? ' · ' + esc(c.itemLokasi) : ''}</span></div>` +
      `<div class="item-context-actions">${ownerButtons}<a href="${detailHref}">Lihat barang</a></div>`;

    renderQuickReplies(Boolean(c.isOwner));
  }

  function renderRoom() {
    const c = chats.find((x) => String(x.id) === String(activeId));
    els.empty.hidden = !!c;
    els.room.hidden = !c;
    if (!c) return;

    renderRoomHeaderAndContext(c);
    renderMessages();
  }

  function renderMessages() {
    const c = chats.find((x) => String(x.id) === String(activeId));
    if (!c) return;

    const msgs = useBackend ? activeMessages : (c.messages || []);
    const wasNearBottom = (els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight) < 80;

    els.messages.innerHTML = '';
    let lastDay = '';

    msgs.forEach((m) => {
      if (dayKey(m.ts) !== lastDay) {
        lastDay = dayKey(m.ts);
        const d = document.createElement('div');
        d.className = 'msg-day';
        d.textContent = fmtDay(m.ts);
        els.messages.appendChild(d);
      }

      if (m.from === 'sys') {
        const s = document.createElement('div');
        s.className = 'msg-sys';
        s.textContent = m.text;
        els.messages.appendChild(s);
        return;
      }

      const row = document.createElement('div');
      row.className = 'msg ' + (m.from === 'me' ? 'out' : 'in');
      const p = document.createElement('p');
      p.textContent = m.text; // aman dari XSS
      const meta = document.createElement('div');
      meta.className = 'msg-meta';
      meta.innerHTML = '<span>' + fmtTime(m.ts) + '</span>' +
        (m.from === 'me' ? '<span class="tick' + (m.read ? ' read' : '') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '');
      row.append(p, meta);
      els.messages.appendChild(row);
    });

    if (!useBackend && typing[activeId]) {
      const t = document.createElement('div');
      t.className = 'typing';
      t.setAttribute('aria-label', 'Sedang mengetik');
      t.innerHTML = '<i></i><i></i><i></i>';
      els.messages.appendChild(t);
    }

    if (wasNearBottom || msgs.length <= 20) {
      els.messages.scrollTop = els.messages.scrollHeight;
    }
  }

  // ---------- Open Room & Polling ----------
  async function openChat(id) {
    activeId = id;
    const c = chats.find((x) => String(x.id) === String(id));
    if (c) c.unread = 0;

    els.shell.dataset.view = 'room';

    if (useBackend) {
      const data = await fetchBackendMessages(id, 0);
      if (data) {
        const idx = chats.findIndex((x) => String(x.id) === String(id));
        if (idx !== -1 && data.conversation) {
          chats[idx] = data.conversation;
        }
        activeMessages = data.messages || [];
      }
      if (typeof window.refreshUnreadChatBadge === 'function') {
        window.refreshUnreadChatBadge();
      }
      startPolling();
    } else {
      saveLocal();
    }

    renderList();
    renderRoom();

    if (els.messages) {
      els.messages.scrollTop = els.messages.scrollHeight;
    }

    if (window.matchMedia('(min-width: 769px)').matches) {
      els.input.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: els.shell.offsetTop - 12, behavior: 'smooth' });
    }
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    if (!useBackend) return;

    pollTimer = setInterval(async () => {
      if (document.hidden || isPolling || !activeId) return;
      isPolling = true;
      try {
        const lastMsg = activeMessages.length ? activeMessages[activeMessages.length - 1] : null;
        const afterId = lastMsg ? lastMsg.id : 0;
        const data = await fetchBackendMessages(activeId, afterId);
        if (data) {
          let changed = false;

          // Tambahkan pesan baru
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const existingIds = new Set(activeMessages.map((m) => m.id));
            data.messages.forEach((m) => {
              if (!existingIds.has(m.id)) {
                activeMessages.push(m);
                changed = true;
              }
            });
          }

          // Update status terbaca (✓ -> ✓✓)
          if (Array.isArray(data.read_ids) && data.read_ids.length > 0) {
            const readSet = new Set(data.read_ids);
            activeMessages.forEach((m) => {
              if (m.from === 'me' && !m.read && readSet.has(m.id)) {
                m.read = true;
                changed = true;
              }
            });
          }

          // Sinkronkan status room jika berubah dari sisi lain
          if (data.conversation) {
            const idx = chats.findIndex((x) => String(x.id) === String(activeId));
            if (idx !== -1 && chats[idx].status !== data.conversation.status) {
              chats[idx] = data.conversation;
              renderRoomHeaderAndContext(data.conversation);
              changed = true;
            }
          }

          if (changed) {
            renderMessages();
            await loadBackendConversations();
            renderList();
          }
        }
      } catch (_) {
        // Abaikan gangguan polling sesaat
      } finally {
        isPolling = false;
      }
    }, POLL_INTERVAL_MS);
  }

  // ---------- Kirim Pesan ----------
  async function sendMessage(raw) {
    const text = String(raw || '').trim();
    if (!text || !activeId) return;

    if (useBackend) {
      els.input.value = '';
      autosize();
      els.send.disabled = true;

      try {
        const res = await fetch(API_CHAT + '?action=send', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: Number(activeId), message: text })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.success) {
          alert((data && data.message) || 'Gagal mengirim pesan.');
          els.input.value = text;
          autosize();
          return;
        }

        if (data.message && !activeMessages.some((m) => m.id === data.message.id)) {
          activeMessages.push(data.message);
        }

        await loadBackendConversations();
        renderList();
        renderMessages();
        els.messages.scrollTop = els.messages.scrollHeight;
      } catch (err) {
        alert('Gagal terhubung ke server: ' + err.message);
        els.input.value = text;
        autosize();
      }
      return;
    }

    // Mode Offline Fallback
    const chat = chats.find((x) => String(x.id) === String(activeId));
    if (!chat) return;
    const ts = Date.now();
    chat.messages.push({ id: uid(), from: 'me', text, ts, read: false });
    chat.updatedTs = ts;
    saveLocal();
    els.input.value = '';
    autosize();
    renderList();
    renderMessages();
    els.messages.scrollTop = els.messages.scrollHeight;
    scheduleOfflineReply(chat, text);
  }

  function scheduleOfflineReply(chat, text) {
    const t = text.toLowerCase();
    let reply = 'Baik, noted. Ada hal lain yang ingin ditanyakan?';
    if (/(terima kasih|makasih|thanks)/.test(t)) reply = 'Sama-sama! Semoga barangnya segera kembali ke kamu.';
    else if (/(kapan|jam|waktu|ketemu|bertemu)/.test(t)) reply = 'Saya bisa besok pagi sekitar jam 08.00 di Pos satpam gerbang utama.';
    else if (/(di mana|dimana|lokasi|ambil|pos)/.test(t)) reply = 'Barangnya saya titipkan di Pos satpam gerbang utama. Bawa KTM ya.';
    else if (/(ciri|warna|isi|merk|merek|stiker)/.test(t)) reply = 'Sudah saya cek, cirinya cocok! Silakan ambil di Pos satpam gerbang utama.';

    typing[chat.id] = true;
    renderMessages();
    setTimeout(() => {
      delete typing[chat.id];
      const ts = Date.now();
      chat.messages.forEach((m) => { if (m.from === 'me') m.read = true; });
      chat.messages.push({ id: uid(), from: 'them', text: reply, ts, read: true });
      chat.updatedTs = ts;
      saveLocal();
      if (String(activeId) === String(chat.id)) { renderList(); renderMessages(); }
    }, 1200);
  }

  function autosize() {
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
    els.send.disabled = !els.input.value.trim();
  }

  // ---------- Event Listeners ----------
  els.input.addEventListener('input', autosize);
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(els.input.value);
    }
  });
  els.send.addEventListener('click', () => sendMessage(els.input.value));
  els.search.addEventListener('input', renderList);
  els.back.addEventListener('click', () => { els.shell.dataset.view = 'list'; });

  els.quick.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const text = chip.textContent.trim();
    if (text.endsWith('...')) {
      els.input.value = 'Ciri yang tidak terlihat di foto: ';
      autosize();
      els.input.focus();
    } else {
      sendMessage(text);
    }
  });

  // Aksi Setujui Klaim / Tandai Dikembalikan dari bar konteks barang
  els.context.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-conv-status]');
    if (!btn || !activeId || !useBackend) return;

    const newStatus = btn.dataset.convStatus;
    const confirmMsg = newStatus === 'Selesai'
      ? 'Tandai barang ini sudah selesai dikembalikan kepada pemiliknya?'
      : 'Setujui kecocokan ciri rahasia dan verifikasi klaim ini?';

    if (!confirm(confirmMsg)) return;

    btn.disabled = true;
    try {
      const res = await fetch(API_CHAT + '?action=update_status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: Number(activeId), status: newStatus })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        alert((data && data.message) || 'Gagal memperbarui status.');
        btn.disabled = false;
        return;
      }
      await loadBackendConversations();
      await openChat(activeId);
    } catch (err) {
      alert('Gagal terhubung ke server: ' + err.message);
      btn.disabled = false;
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && useBackend && activeId) {
      // Langsung refresh saat user kembali ke tab chat
      fetchBackendMessages(activeId, activeMessages.length ? activeMessages[activeMessages.length - 1].id : 0)
        .then((data) => {
          if (data && Array.isArray(data.messages) && data.messages.length) {
            const ids = new Set(activeMessages.map((m) => m.id));
            data.messages.forEach((m) => { if (!ids.has(m.id)) activeMessages.push(m); });
            renderMessages();
          }
        })
        .catch(() => {});
    }
  });

  // ---------- Init ----------
  (async function start() {
    const ok = await initSession();
    if (!ok) return;

    if (useBackend) {
      await loadBackendConversations();
      const fromParams = await resolveInitialConversationBackend();
      renderList();
      if (fromParams) {
        await openChat(fromParams);
      } else {
        renderRoom();
      }
    } else {
      loadLocal();
      const fromParams = openLocalFromParams();
      renderList();
      if (fromParams) {
        openChat(fromParams);
      } else {
        renderRoom();
      }
    }
  })();
});
