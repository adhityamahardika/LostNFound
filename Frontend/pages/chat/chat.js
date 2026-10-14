// ==========================================================================
// CHAT (front-end demo): percakapan disimpan di localStorage, balasan penemu
// disimulasikan. Dibuka dari tombol "Klaim barang ini" lewat parameter URL:
//   chat.html?item=LF-20260927-001&title=Dompet%20cokelat&finder=Penemu%20Anonim
// ==========================================================================
document.addEventListener('DOMContentLoaded', function () {
  const USER_KEY = 'lostnfound_demo_user';
  const CHAT_KEY = 'lostnfound_chats_v1';

  // Halaman ini hanya untuk yang sudah login (dicek setelah DOM siap, supaya ?demo=login dari auth.js sudah terbaca)
  let user = null;
  try { user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) {}
  if (!user) { location.replace('../login/login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const els = {
    shell: $('chat-shell'), list: $('conv-list'), search: $('conv-search'),
    empty: $('room-empty'), room: $('room-active'), avatar: $('room-avatar'),
    name: $('room-name'), context: $('item-context'), messages: $('messages'),
    input: $('msg-input'), send: $('send-btn'), back: $('back-btn'), quick: $('quick-replies')
  };

  let chats = [];
  let activeId = null;
  const typing = {};

  // ---------- Helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
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

  // ---------- Storage ----------
  function save() { try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); } catch (e) {} }

  function load() {
    try { chats = JSON.parse(localStorage.getItem(CHAT_KEY) || 'null') || []; } catch (e) { chats = []; }
    if (!chats.length) { chats = seed(); save(); }
  }

  // Data awal supaya daftar percakapan tidak kosong saat demo
  function seed() {
    const now = Date.now(), H = 3600000;
    return [
      {
        id: 'c-seed-1', itemCode: 'LF-20260928-004', itemTitle: 'KTM a.n. Made Wirawan', finder: 'Rizky',
        status: 'Dititipkan', unread: 1, updated: now - 2 * H,
        messages: [
          { id: uid(), from: 'sys', text: 'Percakapan dimulai untuk barang "KTM a.n. Made Wirawan".', ts: now - 26 * H },
          { id: uid(), from: 'them', text: 'Halo, KTM-nya sudah saya titipkan di Perpustakaan Pusat Lt. 1.', ts: now - 25 * H },
          { id: uid(), from: 'me', text: 'Terima kasih banyak! Besok pagi saya ambil.', ts: now - 25 * H + 60000, read: true },
          { id: uid(), from: 'them', text: 'Siap, jangan lupa bawa kartu identitas lain ya.', ts: now - 2 * H }
        ]
      },
      {
        id: 'c-seed-2', itemCode: 'LF-20260925-002', itemTitle: 'Earphone Putih', finder: 'Ayu',
        status: 'Dikembalikan', unread: 0, updated: now - 50 * H,
        messages: [
          { id: uid(), from: 'sys', text: 'Percakapan dimulai untuk barang "Earphone Putih".', ts: now - 52 * H },
          { id: uid(), from: 'me', text: 'Earphone-nya sudah sampai, terima kasih ya!', ts: now - 50 * H, read: true },
          { id: uid(), from: 'them', text: 'Sama-sama, senang bisa membantu.', ts: now - 50 * H + 120000 }
        ]
      }
    ];
  }

  // ---------- Buka chat dari tombol "Klaim barang ini" ----------
  function openFromParams() {
    const p = new URLSearchParams(location.search);
    const code = p.get('item');
    if (!code) return null;

    let chat = chats.find((c) => c.itemCode === code);
    if (!chat) {
      const title = p.get('title') || 'Barang temuan';
      const finder = p.get('finder') || 'Penemu Anonim';
      const now = Date.now();
      chat = {
        id: 'c-' + now, itemCode: code, itemTitle: title, finder: finder,
        status: 'Dititipkan', unread: 0, updated: now,
        messages: [
          { id: uid(), from: 'sys', text: 'Kamu mengajukan klaim untuk "' + title + '". Sebutkan ciri yang tidak terlihat di foto agar penemu bisa memverifikasi.', ts: now },
          { id: uid(), from: 'them', text: 'Halo, terima kasih sudah menghubungi. Silakan sebutkan ciri barangnya ya.', ts: now + 1000 }
        ]
      };
      chats.push(chat);
      save();
    }
    history.replaceState(null, '', location.pathname); // bersihkan URL
    return chat.id;
  }

  // ---------- Render: daftar percakapan ----------
  function lastMsg(c) { return c.messages[c.messages.length - 1]; }

  function renderList() {
    const q = els.search.value.trim().toLowerCase();
    const items = chats
      .filter((c) => !q || (c.finder + ' ' + c.itemTitle).toLowerCase().includes(q))
      .sort((a, b) => b.updated - a.updated);

    if (!items.length) { els.list.innerHTML = '<p class="conv-empty">Tidak ada percakapan.</p>'; return; }

    els.list.innerHTML = '';
    items.forEach((c) => {
      const m = lastMsg(c);
      const preview = (m.from === 'me' ? 'Kamu: ' : '') + m.text;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'conv-item' + (c.id === activeId ? ' active' : '');
      btn.innerHTML =
        '<span class="avatar">' + esc(initials(c.finder)) + '</span>' +
        '<span class="conv-body"><strong>' + esc(c.finder) + '</strong>' +
        '<span class="conv-item-name">' + esc(c.itemTitle) + '</span>' +
        '<p>' + esc(preview) + '</p></span>' +
        '<span class="conv-meta"><span>' + fmtTime(m.ts) + '</span>' +
        (c.unread ? '<span class="unread-badge">' + c.unread + '</span>' : '') + '</span>';
      btn.addEventListener('click', () => openChat(c.id));
      els.list.appendChild(btn);
    });
  }

  // ---------- Render: ruang chat ----------
  function renderRoom() {
    const c = chats.find((x) => x.id === activeId);
    els.empty.hidden = !!c;
    els.room.hidden = !c;
    if (!c) return;

    els.avatar.textContent = initials(c.finder);
    els.name.textContent = c.finder;
    els.context.innerHTML =
      '<span class="item-context-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></span>' +
      '<div class="item-context-info"><strong>' + esc(c.itemTitle) + '</strong><span>' + esc(c.itemCode) + ' · ' + esc(c.status) + '</span></div>' +
      '<a href="../laporan/laporan_page/laporan.html">Lihat barang</a>';

    renderMessages();
  }

  function renderMessages() {
    const c = chats.find((x) => x.id === activeId);
    if (!c) return;
    els.messages.innerHTML = '';
    let lastDay = '';

    c.messages.forEach((m) => {
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

    if (typing[activeId]) {
      const t = document.createElement('div');
      t.className = 'typing';
      t.setAttribute('aria-label', 'Sedang mengetik');
      t.innerHTML = '<i></i><i></i><i></i>';
      els.messages.appendChild(t);
    }
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function openChat(id) {
    activeId = id;
    const c = chats.find((x) => x.id === id);
    if (c) c.unread = 0;
    save();
    els.shell.dataset.view = 'room';
    renderList();
    renderRoom();
    if (window.matchMedia('(min-width: 769px)').matches) els.input.focus();
  }

  // ---------- Kirim & balasan ----------
  function replyFor(text) {
    const t = text.toLowerCase();
    if (/(terima kasih|makasih|thanks)/.test(t))
      return [{ text: 'Sama-sama! Semoga barangnya segera kembali ke kamu.', delay: 1400 }];
    if (/(kapan|jam|waktu|ketemu|bertemu)/.test(t))
      return [{ text: 'Saya bisa besok pagi sekitar jam 08.00 di Pos satpam gerbang utama. Bagaimana?', delay: 1600 }];
    if (/(di mana|dimana|lokasi|ambil|pos)/.test(t))
      return [{ text: 'Barangnya saya titipkan di Pos satpam gerbang utama. Bawa KTM ya saat mengambil.', delay: 1600 }];
    if (/(ciri|warna|isi|dalam|bentuk|merk|merek|stiker|kartu|foto)/.test(t))
      return [
        { text: 'Terima kasih infonya. Saya cek dulu barangnya, sebentar ya...', delay: 1200 },
        { text: 'Sudah saya cek, cirinya cocok! Silakan ambil di Pos satpam gerbang utama dengan membawa KTM.', delay: 2600 }
      ];
    return [{ text: 'Baik, noted. Ada hal lain yang ingin ditanyakan?', delay: 1500 }];
  }

  function addMsg(chat, from, text) {
    const ts = Date.now();
    chat.messages.push({ id: uid(), from, text, ts, read: false });
    chat.updated = ts;
  }

  function scheduleReply(chat, text) {
    const steps = replyFor(text);
    let wait = 0;
    typing[chat.id] = true;

    steps.forEach((s, i) => {
      wait += s.delay;
      setTimeout(() => {
        addMsg(chat, 'them', s.text);
        chat.messages.forEach((m) => { if (m.from === 'me') m.read = true; }); // pesan kita "dibaca"
        if (i === steps.length - 1) delete typing[chat.id];
        if (activeId !== chat.id) chat.unread = (chat.unread || 0) + 1;
        save();
        renderList();
        if (activeId === chat.id) renderMessages();
      }, wait);
    });

    renderMessages();
  }

  function sendMessage(text) {
    text = text.trim();
    const chat = chats.find((c) => c.id === activeId);
    if (!text || !chat) return;

    addMsg(chat, 'me', text);
    save();
    els.input.value = '';
    autosize();
    renderList();
    renderMessages();
    scheduleReply(chat, text);
  }

  function autosize() {
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
    els.send.disabled = !els.input.value.trim();
  }

  // ---------- Event ----------
  els.input.addEventListener('input', autosize);
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(els.input.value); }
  });
  els.send.addEventListener('click', () => sendMessage(els.input.value));
  els.search.addEventListener('input', renderList);
  els.back.addEventListener('click', () => { els.shell.dataset.view = 'list'; });

  els.quick.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const text = chip.textContent.trim();
    if (text.endsWith('...')) { // chip "ciri" -> isi dulu, biar user melengkapi
      els.input.value = 'Ciri yang tidak terlihat di foto: ';
      autosize();
      els.input.focus();
    } else {
      sendMessage(text);
    }
  });

  // ---------- Init ----------
  load();
  const fromParams = openFromParams();
  renderList();
  if (fromParams) openChat(fromParams); else renderRoom();
});