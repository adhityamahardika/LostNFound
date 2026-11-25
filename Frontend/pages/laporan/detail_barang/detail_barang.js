// Data dummy - Sumber foto sudah disamakan persis dengan laporan.js
const dummyData = [
    { id: 1, nama: "Dompet kulit", jenis: "Aksesoris", lokasi: "Kantin Utama", tanggal: "2026-09-27", status: "Hilang", img: "../../../assets/items/dompet.jpg", deskripsi: "Dompet kulit cokelat dengan kancing. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik." },
    { id: 2, nama: "Kunci motor", jenis: "Kendaraan", lokasi: "Gedung B", tanggal: "2026-09-28", status: "Ditemukan", img: "../../../assets/items/kunci.jpg", deskripsi: "Kunci dengan gantungan karakter. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik." },
    { id: 3, nama: "Kartu Mahasiswa", jenis: "Dokumen", lokasi: "Perpustakaan", tanggal: "2026-09-28", status: "Ditemukan", img: "../../../assets/items/ktm.jpg", deskripsi: "Kartu mahasiswa atas nama Made Wirawan. Hubungi untuk verifikasi lebih lanjut." },
    { id: 4, nama: "Botol minum hijau", jenis: "Aksesoris", lokasi: "Lab Komputer", tanggal: "2026-09-26", status: "Hilang", img: "../../../assets/items/tumbler.jpg", deskripsi: "Botol minum warna hijau dengan stiker. Detail lain tidak ditampilkan untuk verifikasi." },
    { id: 5, nama: "Tas ransel hitam", jenis: "Tas", lokasi: "Parkiran Timur", tanggal: "2026-09-25", status: "Ditemukan", img: "../../../assets/items/tas.jpg", deskripsi: "Tas ransel hitam ukuran sedang. Ciri khusus disembunyikan untuk keperluan klaim." },
    { id: 6, nama: "Charger Laptop", jenis: "Elektronik", lokasi: "Aula", tanggal: "2026-09-24", status: "Dikembalikan", img: "../../../assets/items/charger.jpg", deskripsi: "Charger laptop HP original. Barang sudah dikembalikan ke pemiliknya." }
];

function formatDate(dateString) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', options);
}

// Helper Resolusi URL Foto
function resolveImgUrl(url) {
    if (!url) return '../../../assets/nowrite.jpg';
    if (url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('Backend/')) {
        return '../../../../' + url;
    }
    if (url.startsWith('assets/')) {
        return '../../../' + url;
    }
    return url;
}

// State global item
let item = null;

// Helper untuk menampilkan skeleton loading style
function showSkeleton() {
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.className = 'main-image skeleton';
        mainImage.innerHTML = '';
        mainImage.style.padding = '';
        mainImage.style.overflow = '';
    }

    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.className = 'thumbnail skeleton';
        thumb.innerHTML = '';
        thumb.dataset.img = '';
    });

    const badge = document.getElementById('item-badge') || document.querySelector('.badge');
    if (badge) {
        badge.className = 'badge skeleton skeleton-badge';
        badge.innerHTML = '&nbsp;';
    }

    const title = document.getElementById('item-title') || document.querySelector('.item-title');
    if (title) {
        title.className = 'item-title skeleton skeleton-title';
        title.innerHTML = '&nbsp;';
    }

    const idEl = document.getElementById('item-id') || document.querySelector('.item-id');
    if (idEl) {
        idEl.className = 'item-id skeleton skeleton-id';
        idEl.innerHTML = '&nbsp;';
    }

    const values = document.querySelectorAll('.info-value');
    values.forEach(val => {
        val.className = 'info-value skeleton skeleton-value';
        val.innerHTML = '&nbsp;';
    });

    const descEl = document.querySelector('.item-desc');
    if (descEl) {
        descEl.innerHTML = `
            <span class="skeleton-desc-line skeleton"></span>
            <span class="skeleton-desc-line short skeleton"></span>
        `;
    }

    const klaimBtn = document.getElementById('btn-klaim');
    if (klaimBtn) {
        klaimBtn.disabled = true;
        klaimBtn.textContent = 'Memuat...';
    }

    const hapusBtn = document.getElementById('btn-hapus');
    if (hapusBtn) {
        hapusBtn.style.display = 'none';
    }
}

// Helper untuk menampilkan gambar <img> di kotak utama maupun thumbnail
function renderImageElement(container, src, alt) {
    if (!container) return;
    container.style.padding = '0';
    container.style.overflow = 'hidden';
    container.innerHTML = `<img src="${src}" alt="${alt}" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit;">`;
}

function renderItemDetail(loadedItem) {
    item = loadedItem;
    if (!item) {
        document.querySelector('.detail-main').innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem;">
                <h2 style="font-family: var(--font-head); color: var(--ink); margin-bottom: 0.5rem;">Barang Tidak Ditemukan</h2>
                <p style="color: var(--muted); margin-bottom: 1.5rem;">Laporan barang yang Anda cari tidak tersedia atau mungkin sudah dihapus.</p>
                <a href="../laporan_page/laporan.html" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 0.65rem 1.5rem; border-radius: 8px;">Kembali ke Daftar Laporan</a>
            </div>
        `;
        return;
    }

    // 1. Badge & Status
    const badge = document.getElementById('item-badge') || document.querySelector('.badge');
    if (badge) {
        badge.className = `badge ${(item.status || 'hilang').toLowerCase()}`;
        badge.textContent = item.status || 'Hilang';
    }

    // 2. Judul Barang & ID
    const title = document.getElementById('item-title') || document.querySelector('.item-title');
    if (title) {
        title.className = 'item-title';
        title.textContent = item.nama;
    }

    const idEl = document.getElementById('item-id') || document.querySelector('.item-id');
    if (idEl) {
        idEl.className = 'item-id';
        const kodeTanggal = (item.tanggal || '20261001').replace(/-/g, '');
        idEl.textContent = `Kode laporan LF-${kodeTanggal}-${String(item.id).padStart(3, '0')}`;
    }

    // 3. Grid Informasi
    const values = document.querySelectorAll('.info-value');
    values.forEach(v => {
        v.classList.remove('skeleton', 'skeleton-value');
    });
    if (values[0]) values[0].textContent = item.jenis || '-';
    if (values[1]) values[1].textContent = formatDate(item.tanggal);
    if (values[2]) values[2].textContent = item.waktu || 'Sekitar 08.30';
    if (values[3]) values[3].textContent = item.lokasi || '-';
    if (values[4]) values[4].textContent = item.penitipan || (item.status === 'Hilang' ? '-' : 'Pos satpam, gerbang utama');
    if (values[5]) values[5].textContent = item.pelapor_name || item.pelapor || 'Anonim';

    // 4. Deskripsi
    const descEl = document.querySelector('.item-desc');
    if (descEl) {
        descEl.textContent = item.deskripsi || 'Tidak ada deskripsi rinci.';
    }

    // 5. Foto Utama
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.classList.remove('skeleton');
        renderImageElement(mainImage, item.img, item.nama);
    }

    // 6. Thumbnails Galeri
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, idx) => {
        thumb.classList.remove('skeleton');
        thumb.dataset.img = item.img;
        renderImageElement(thumb, item.img, `${item.nama} - Foto ${idx + 1}`);
        if (idx === 0) {
            thumb.classList.add('active');
            thumb.setAttribute('aria-pressed', 'true');
        } else {
            thumb.classList.remove('active');
            thumb.setAttribute('aria-pressed', 'false');
        }
    });

    // 7. Tombol Klaim & Status
    const klaimBtn = document.getElementById('btn-klaim');
    if (klaimBtn) {
        klaimBtn.textContent = isLoggedIn() ? 'Ajukan Klaim' : 'Masuk untuk Klaim';
        klaimBtn.disabled = false;
    }

    applyStatusState(item);
    updateHapusButtonVisibility(item);
}

// Delegasi event klik galeri thumbnail
const thumbnailContainer = document.querySelector('.thumbnail-list');
if (thumbnailContainer) {
    thumbnailContainer.addEventListener('click', (e) => {
        const thumb = e.target.closest('.thumbnail');
        if (!thumb || thumb.classList.contains('skeleton') || !thumb.dataset.img) return;

        const mainImage = document.getElementById('main-image');
        renderImageElement(mainImage, thumb.dataset.img, 'Foto utama barang');

        document.querySelectorAll('.thumbnail').forEach(t => {
            const isActive = (t === thumb);
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-pressed', String(isActive));
        });
    });
}

// Tombol Klaim langsung mengarah ke halaman klaim sesuai ID barang
// Klaim hanya untuk yang sudah login (sesi dari auth.js)
function isLoggedIn() {
    try { return !!localStorage.getItem('lostnfound_demo_user'); } catch (e) { return false; }
}

const klaimBtn = document.getElementById('btn-klaim');
if (klaimBtn) {
    klaimBtn.disabled = true;
    klaimBtn.textContent = 'Memuat...';
    klaimBtn.addEventListener('click', () => {
        if (!isLoggedIn()) {
            alert('Masuk dulu untuk mengajukan klaim.');
            window.location.href = '../../login/login.html';
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const targetId = params.get('id') || (item ? item.id : 1);
        window.location.href = `../../klaim/klaim.html?id=${encodeURIComponent(targetId)}`;
    });
}

// Helper Visibilitas Tombol Hapus: Hanya untuk Admin atau Pembuat Laporan
function updateHapusButtonVisibility(itemData) {
    const hapusBtn = document.getElementById('btn-hapus');
    if (!hapusBtn) return;

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('lostnfound_demo_user') || 'null');
    } catch (_) {}

    // Pengguna belum login sama sekali -> tombol hapus TIDAK muncul
    if (!user) {
        hapusBtn.style.display = 'none';
        return;
    }

    const isAdmin = (user.accessRole === 'admin');
    const isOwner = Boolean(itemData && itemData.pelapor_email && user.email &&
                    user.email.toLowerCase() === itemData.pelapor_email.toLowerCase());

    // Hanya tampil jika Admin ATAU Pemilik yang membuat laporan
    if (isAdmin || isOwner) {
        hapusBtn.style.display = 'inline-flex';
        hapusBtn.title = isAdmin ? 'Hapus Laporan (Sebagai Administrator)' : 'Hapus Laporan Saya';
    } else {
        hapusBtn.style.display = 'none';
    }
}

// Tombol Hapus Laporan
const hapusBtn = document.getElementById('btn-hapus');
if (hapusBtn) {
    hapusBtn.addEventListener('click', async () => {
        if (!item || !item.id) return;

        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('lostnfound_demo_user') || 'null');
        } catch (_) {}

        if (!user) {
            alert('Anda harus login terlebih dahulu.');
            window.location.href = '../../login/login.html';
            return;
        }

        const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus laporan "${item.nama}"?\nData akan dihapus permanen dari database.`);
        if (!confirmDelete) return;

        hapusBtn.disabled = true;
        hapusBtn.textContent = 'Menghapus...';

        try {
            const queryParams = new URLSearchParams({
                id: item.id,
                user_email: user.email || '',
                user_role: user.accessRole || 'user'
            });

            // Request DELETE ke backend PHP (MySQL) dengan verifikasi akses sesi
            const res = await fetch(`../../../../Backend/api/laporan.php?${queryParams.toString()}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await res.json().catch(() => null);

            if (!res.ok || (result && !result.success)) {
                alert((result && result.message) ? result.message : 'Gagal menghapus laporan: Akses tidak diizinkan.');
                hapusBtn.disabled = false;
                hapusBtn.textContent = 'Hapus Laporan';
                return;
            }

            // Bersihkan juga dari penyimpanan lokal browser jika ada
            try {
                const local = JSON.parse(localStorage.getItem('dataBarang')) || [];
                const updated = local.filter(x => String(x.id) !== String(item.id));
                localStorage.setItem('dataBarang', JSON.stringify(updated));
            } catch (_) {}

            alert('Laporan berhasil dihapus.');
            // Kembali ke halaman daftar laporan
            window.location.href = '../laporan_page/laporan.html';
        } catch (err) {
            console.error('Error saat menghapus laporan:', err);
            alert('Terjadi kesalahan saat menghapus laporan: ' + err.message);
            hapusBtn.disabled = false;
            hapusBtn.textContent = 'Hapus Laporan';
        }
    });
}

// ==========================================================================
// Sesuaikan tampilan dengan status barang (Hilang / Ditemukan / Diklaim / Dikembalikan)
// Dipanggil SETELAH blok tombol klaim agar tidak ditimpa.
// ==========================================================================
function applyStatusState(data) {
    if (!data || !data.status) return;
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
    if (labels[4] && values[4]) {
        labels[4].textContent = 'Status barang';
        values[4].textContent = 'Sudah dikembalikan ke pemilik';
    }

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
// Inisialisasi: Ambil data secara asinkron (dengan skeleton loading)
async function loadItemDetailAsync() {
    showSkeleton();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        renderItemDetail(null);
        return;
    }

    // 1. Coba ambil dari Backend MySQL via PHP API
    try {
        const res = await fetch(`../../../../Backend/api/laporan.php?id=${encodeURIComponent(id)}`, { credentials: 'include' });
        if (res.ok) {
            const json = await res.json();
            if (json && json.success && json.data) {
                const itm = json.data;
                const loaded = {
                    id: itm.id,
                    nama: itm.nama || itm.nama_barang,
                    jenis: itm.jenis || itm.jenis_barang,
                    lokasi: itm.lokasi,
                    tanggal: itm.tanggal,
                    status: itm.status,
                    img: resolveImgUrl(itm.foto || itm.img),
                    deskripsi: itm.deskripsi,
                    penitipan: itm.penitipan || (itm.status === 'Hilang' ? '-' : 'Pos Satpam, gerbang utama'),
                    pelapor_email: itm.pelapor_email || '',
                    pelapor_name: itm.pelapor_name || 'Civitas Kampus',
                    pelapor: itm.pelapor_name || 'Civitas Kampus'
                };
                renderItemDetail(loaded);
                return;
            }
        }
    } catch (err) {
        console.warn('Backend API belum aktif, mencoba pencarian data lokal:', err);
    }

    // 2. Coba cari di localStorage (dataBarang)
    try {
        const local = JSON.parse(localStorage.getItem('dataBarang')) || [];
        const foundLocal = local.find(x => String(x.id) === String(id));
        if (foundLocal) {
            const loaded = {
                id: foundLocal.id,
                nama: foundLocal.namaBarang || foundLocal.nama,
                jenis: foundLocal.jenis || foundLocal.jenis_barang,
                lokasi: foundLocal.lokasi,
                tanggal: foundLocal.tanggal,
                status: foundLocal.status || (foundLocal.tipe === 'Ditemukan' ? 'Ditemukan' : 'Hilang'),
                img: resolveImgUrl(foundLocal.foto),
                deskripsi: foundLocal.deskripsi || '',
                penitipan: foundLocal.penitipan || (foundLocal.tipe === 'Ditemukan' ? 'Pos Satpam, gerbang utama' : '-'),
                pelapor: 'Anonim'
            };
            renderItemDetail(loaded);
            return;
        }
    } catch (_) {}

    // 3. Coba cari di dummyData bawaan
    const foundDummy = dummyData.find(d => String(d.id) === String(id));
    if (foundDummy) {
        const loaded = {
            ...foundDummy,
            img: resolveImgUrl(foundDummy.img)
        };
        renderItemDetail(loaded);
        return;
    }

    // 4. Jika ID tidak ditemukan di manapun
    renderItemDetail(null);
}

// Jalankan pengambilan data
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadItemDetailAsync);
} else {
    loadItemDetailAsync();
}

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