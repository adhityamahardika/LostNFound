// Data dummy - Sumber foto sudah disamakan persis dengan laporan.js
const dummyData = [
    { id: 1, nama: "Dompet cokelat", jenis: "Aksesoris", lokasi: "Kantin Utama", tanggal: "2026-09-27", status: "Hilang", img: "../../../assets/items/dompet.jpg", deskripsi: "Dompet kulit cokelat dengan kancing. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik." },
    { id: 2, nama: "Kunci motor Honda", jenis: "Kendaraan", lokasi: "Gedung B", tanggal: "2026-09-28", status: "Ditemukan", img: "../../../assets/items/kunci.jpg", deskripsi: "Kunci dengan gantungan karakter. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik." },
    { id: 3, nama: "KTM a.n. Made Wirawan", jenis: "Dokumen", lokasi: "Perpustakaan", tanggal: "2026-09-28", status: "Ditemukan", img: "../../../assets/items/ktm.jpg", deskripsi: "Kartu mahasiswa atas nama Made Wirawan. Hubungi untuk verifikasi lebih lanjut." },
    { id: 4, nama: "Botol minum biru", jenis: "Aksesoris", lokasi: "Lab Komputer", tanggal: "2026-09-26", status: "Hilang", img: "../../../assets/items/tumbler.jpg", deskripsi: "Botol minum warna biru dengan stiker. Detail lain tidak ditampilkan untuk verifikasi." },
    { id: 5, nama: "Tas ransel hitam", jenis: "Tas", lokasi: "Parkiran Timur", tanggal: "2026-09-25", status: "Ditemukan", img: "../../../assets/items/tas.jpg", deskripsi: "Tas ransel hitam ukuran sedang. Ciri khusus disembunyikan untuk keperluan klaim." },
    { id: 6, nama: "Charger Laptop HP", jenis: "Elektronik", lokasi: "Aula", tanggal: "2026-09-24", status: "Dikembalikan", img: "../../../assets/items/charger.jpg", deskripsi: "Charger laptop HP original. Barang sudah dikembalikan ke pemiliknya." }
];

function formatDate(dateString) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', options);
}

function getItemFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return dummyData.find(item => String(item.id) === id) || dummyData[0];
}

// Helper untuk menampilkan gambar <img> di kotak utama maupun thumbnail
function renderImageElement(container, src, alt) {
    if (!container) return;
    container.style.padding = '0';
    container.style.overflow = 'hidden';
    container.innerHTML = `<img src="${src}" alt="${alt}" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit;">`;
}

function renderItemDetail(item) {
    if (!item) {
        document.querySelector('.detail-main').innerHTML = '<p>Barang tidak ditemukan. <a href="../laporan_page/laporan.html">Kembali ke daftar</a></p>';
        return;
    }

    document.querySelector('.badge').textContent = item.status;
    document.querySelector('.badge').className = `badge ${item.status.toLowerCase()}`;
    document.querySelector('.item-title').textContent = item.nama;
    document.querySelector('.item-id').textContent = `Kode laporan LF-${item.tanggal.replace(/-/g, '')}-${String(item.id).padStart(3, '0')}`;
    
    document.querySelectorAll('.info-value')[0].textContent = item.jenis;
    document.querySelectorAll('.info-value')[1].textContent = formatDate(item.tanggal);
    document.querySelectorAll('.info-value')[2].textContent = 'Sekitar 08.30';
    document.querySelectorAll('.info-value')[3].textContent = item.lokasi;
    document.querySelectorAll('.info-value')[4].textContent = 'Pos satpam, gerbang utama';
    document.querySelectorAll('.info-value')[5].textContent = 'Anonim, mahasiswa';
    
    document.querySelector('.item-desc').textContent = item.deskripsi;
    
    // Render Foto Utama
    const mainImage = document.getElementById('main-image');
    renderImageElement(mainImage, item.img, item.nama);

    // Render Thumbnail dengan foto barang tersebut
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, idx) => {
        thumb.dataset.img = item.img;
        renderImageElement(thumb, item.img, `${item.nama} - Foto ${idx + 1}`);
    });
}

// Interaksi Klik Gallery Thumbnails
const mainImage = document.getElementById('main-image');
const thumbnails = document.querySelectorAll('.thumbnail');

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        if (thumb.dataset.img) {
            renderImageElement(mainImage, thumb.dataset.img, 'Foto utama barang');
        }
        thumbnails.forEach(t => {
            t.classList.toggle('active', t === thumb);
            t.setAttribute('aria-pressed', String(t === thumb));
        });
    });
});

// Init halaman
const item = getItemFromURL();
renderItemDetail(item);

// Tombol Klaim langsung mengarah ke halaman klaim sesuai ID barang
const klaimBtn = document.getElementById('btn-klaim');
if (klaimBtn) {
    klaimBtn.textContent = 'Ajukan Klaim';
    klaimBtn.disabled = false;
    klaimBtn.addEventListener('click', () => {
        // Harus login dulu sebelum chat dengan pelapor
        let loggedIn = false;
        try { loggedIn = !!localStorage.getItem('lostnfound_demo_user'); } catch (e) {}
        if (!loggedIn) {
            alert('Masuk dulu untuk mengajukan klaim.');
            window.location.href = '../../login/login.html';
            return;
        }

        // Buka chat langsung dengan pelapor barang
        const reporterText = document.querySelectorAll('.info-value')[5].textContent.split(',')[0].trim();
        const params = new URLSearchParams({
            item: document.querySelector('.item-id').textContent.replace('Kode laporan', '').trim(),
            title: item.nama,
            finder: /^anonim$/i.test(reporterText) ? 'Penemu Anonim' : reporterText
        });
        window.location.href = '../../chat/chat.html?' + params;
    });
}

// ==========================================================================
// Sesuaikan tampilan dengan status barang (Hilang / Ditemukan / Diklaim / Dikembalikan)
// Dipanggil SETELAH blok tombol klaim agar tidak ditimpa.
// ==========================================================================
function applyStatusState(data) {
    const status = data.status.toLowerCase();

    // 1) Timeline di bawah mengikuti status: jumlah langkah yang sudah aktif
    const activeCount = { hilang: 1, ditemukan: 2, diklaim: 3, dikembalikan: 4 }[status] || 1;
    const steps = document.querySelectorAll('.timeline-step');
    const lines = document.querySelectorAll('.timeline-line');

    steps.forEach((step, i) => {
        step.classList.toggle('active', i < activeCount);
        if (i === activeCount - 1) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
    });
    lines.forEach((line, i) => line.classList.toggle('active', i < activeCount - 1));

    // 2) Khusus barang yang sudah dikembalikan
    if (status !== 'dikembalikan') return;

    const labels = document.querySelectorAll('.info-label');
    const values = document.querySelectorAll('.info-value');
    labels[4].textContent = 'Status barang';
    values[4].textContent = 'Sudah dikembalikan ke pemilik';

    const warn = document.querySelector('.claim-warning');
    if (warn) {
        warn.classList.add('is-returned');
        warn.innerHTML = '<strong>Barang sudah dikembalikan</strong><br>' +
            'Barang ini sudah diserahkan kepada pemiliknya, jadi klaim baru tidak lagi diterima.';
    }

    const klaim = document.getElementById('btn-klaim');
    if (klaim) {
        klaim.textContent = 'Sudah dikembalikan';
        klaim.disabled = true;
    }
}
applyStatusState(item);

// ==========================================================================
// REPORT BARANG (halaman detail): tombol Report + modal alasan.
// Cukup pasang report.css & report.js di halaman detail; tombol disisipkan
// otomatis di samping tombol "Kembali ke daftar".
// Data disimpan di localStorage key "lostnfound_reports_v1".
// ==========================================================================
(function () {
  const REPORT_KEY = 'lostnfound_reports_v1';
  const USER_KEY = 'lostnfound_demo_user';
  const REASONS = [
    'Laporan palsu',
    'Informasi tidak sesuai',
    'Data pribadi terlihat',
    'Laporan duplikat',
    'Konten tidak pantas',
    'Lainnya'
  ];
  const FLAG_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18">' +
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>';

  // ---------- Helpers ----------
  function readJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }

  function currentReporter() {
    const u = readJSON(USER_KEY, null);
    return u && u.name ? u.name : 'Anonim';
  }

  // Ambil kode & judul barang saat tombol diklik (halaman bisa dirender lewat JS)
  function getItemInfo(btn) {
    let code = btn.dataset.code || '';
    if (!code) {
      const idEl = document.querySelector('.item-id');
      const m = (idEl ? idEl.textContent : document.body.innerText).match(/LF-\d+(?:-\d+)+/);
      code = m ? m[0] : 'LF-TANPA-KODE';
    }

    let title = btn.dataset.title || '';
    if (!title) {
      const t = document.querySelector('.item-title') || document.querySelector('[data-item-title]');
      title = t ? t.textContent.trim() : 'Barang';
    }
    return { code: code, title: title };
  }

  function alreadyReported(code) {
    const me = currentReporter();
    return readJSON(REPORT_KEY, []).some((r) => r.itemCode === code && r.reporter === me);
  }

  // ---------- Tombol Report ----------
  function markReported(btn) {
    btn.disabled = true;
    btn.innerHTML = FLAG_SVG + ' Sudah dilaporkan';
  }

  function insertButton() {
    if (document.getElementById('btn-report')) return true;

    // Cari tombol "Kembali ke daftar" lalu sisipkan Report setelahnya
    const anchor = Array.from(document.querySelectorAll('a, button'))
      .find((el) => /kembali ke daftar/i.test(el.textContent));
    if (!anchor) return false;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-report';
    btn.className = 'btn btn-report';
    btn.innerHTML = FLAG_SVG + ' Report';
    anchor.insertAdjacentElement('afterend', btn);

    if (alreadyReported(getItemInfo(btn).code)) markReported(btn);
    return true;
  }

  // ---------- Modal ----------
  let dialog = null;

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'rp-dialog';
    dialog.setAttribute('aria-labelledby', 'rp-title');
    dialog.innerHTML =
      '<form id="rp-form" novalidate>' +
        '<h3 id="rp-title">Report laporan</h3>' +
        '<p class="rp-item"><strong id="rp-item-name"></strong><span id="rp-item-code"></span></p>' +
        '<label for="rp-reason">Alasan report</label>' +
        '<select id="rp-reason" required><option value="">Pilih alasan...</option>' +
          REASONS.map((r) => '<option value="' + r + '">' + r + '</option>').join('') +
        '</select>' +
        '<label for="rp-note">Keterangan <span class="rp-opt">(opsional, wajib bila memilih Lainnya)</span></label>' +
        '<textarea id="rp-note" rows="3" maxlength="300" placeholder="Jelaskan singkat apa yang tidak sesuai..."></textarea>' +
        '<p class="rp-error" id="rp-error" role="alert" hidden></p>' +
        '<div class="rp-actions">' +
          '<button type="button" class="rp-btn" id="rp-cancel">Batal</button>' +
          '<button type="submit" class="rp-btn rp-btn-danger">Kirim Report</button>' +
        '</div>' +
      '</form>' +
      '<div class="rp-success" id="rp-success" hidden>' +
        '<div class="rp-success-icon" aria-hidden="true">' + FLAG_SVG + '</div>' +
        '<h3>Report terkirim</h3>' +
        '<p>Terima kasih. Admin akan meninjau laporan ini.</p>' +
        '<div class="rp-actions"><button type="button" class="rp-btn rp-btn-danger" id="rp-close">Tutup</button></div>' +
      '</div>';
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // klik backdrop
    dialog.querySelector('#rp-cancel').addEventListener('click', () => dialog.close());
    dialog.querySelector('#rp-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('#rp-form').addEventListener('submit', onSubmit);
  }

  function openDialog(btn) {
    if (!dialog) buildDialog();
    const info = getItemInfo(btn);
    dialog.dataset.code = info.code;
    dialog.dataset.title = info.title;
    dialog.querySelector('#rp-item-name').textContent = info.title;
    dialog.querySelector('#rp-item-code').textContent = info.code;
    dialog.querySelector('#rp-form').reset();
    dialog.querySelector('#rp-form').hidden = false;
    dialog.querySelector('#rp-success').hidden = true;
    dialog.querySelector('#rp-error').hidden = true;
    dialog.showModal();
    dialog.querySelector('#rp-reason').focus();
  }

  function showError(msg) {
    const el = dialog.querySelector('#rp-error');
    el.textContent = msg;
    el.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    const reason = dialog.querySelector('#rp-reason').value;
    const note = dialog.querySelector('#rp-note').value.trim();
    const code = dialog.dataset.code;

    if (!reason) return showError('Pilih alasan report terlebih dahulu.');
    if (reason === 'Lainnya' && !note) return showError('Isi keterangan bila memilih "Lainnya".');
    if (alreadyReported(code)) return showError('Kamu sudah melaporkan barang ini.');

    const list = readJSON(REPORT_KEY, []);
    list.push({
      id: Date.now(),
      itemCode: code,
      itemTitle: dialog.dataset.title,
      reason: reason,
      note: note,
      reporter: currentReporter(),
      ts: Date.now(),
      status: 'pending'
    });

    try {
      localStorage.setItem(REPORT_KEY, JSON.stringify(list));
    } catch (err) {
      return showError('Report gagal disimpan. Coba lagi.');
    }

    dialog.querySelector('#rp-form').hidden = true;
    dialog.querySelector('#rp-success').hidden = false;
    const btn = document.getElementById('btn-report');
    if (btn) markReported(btn);
  }

  // ---------- Init ----------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btn-report');
    if (btn && !btn.disabled) openDialog(btn);
  });

  function init() {
    if (insertButton()) return;
    // Halaman detail mungkin dirender belakangan oleh JS: pantau sebentar
    const obs = new MutationObserver(() => { if (insertButton()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 8000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();