const STORAGE_KEY = 'dataBarang';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB agar localStorage (~5 MB) tidak penuh
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg'];

const form = document.getElementById('form-laporan');
const statusEl = document.getElementById('form-status');
const photoErrorEl = document.getElementById('foto-error');
const photoInput = document.getElementById('foto-barang');
const preview = document.getElementById('preview-foto');
const submitBtn = form.querySelector('.btn-submit');
let fotoData = ''; // Base64 foto yang valid

function todayLocalISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function showStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
    statusEl.hidden = false;
}

function showPhotoError(message) {
    photoErrorEl.textContent = message;
    photoErrorEl.hidden = !message;
}

function loadList() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return []; // data rusak: mulai dari kosong
    }
}

// 1. Ganti tab
function switchTab(jenis) {
    const isNemu = jenis === 'nemu' || jenis === 'ditemukan';
    const btnHilang = document.getElementById('tab-hilang');
    const btnNemu = document.getElementById('tab-nemu');

    btnHilang.classList.toggle('active', !isNemu);
    btnNemu.classList.toggle('active', isNemu);
    btnHilang.setAttribute('aria-pressed', String(!isNemu));
    btnNemu.setAttribute('aria-pressed', String(isNemu));

    document.getElementById('tipe-laporan').value = isNemu ? 'Ditemukan' : 'Hilang';
    document.getElementById('field-penitipan').hidden = !isNemu;
    document.getElementById('penitipan').required = isNemu;
    document.getElementById('ciri-rahasia').required = isNemu;
}

// 2. Preview foto
function previewImage(event) {
    const file = event.target.files[0];
    showPhotoError('');

    const reset = () => {
        fotoData = '';
        preview.hidden = true;
        preview.removeAttribute('src');
        photoInput.value = '';
    };

    if (!file) { reset(); return; } // dialog dibatalkan
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        showPhotoError('Format foto harus PNG atau JPG.');
        reset();
        return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
        showPhotoError('Ukuran foto maksimal 2 MB.');
        reset();
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        fotoData = reader.result;
        preview.src = fotoData;
        preview.hidden = false;
    };
    reader.onerror = () => {
        showPhotoError('Foto tidak dapat dibaca. Coba pilih file lain.');
        reset();
    };
    reader.readAsDataURL(file);
}

// Notifikasi (toast) sukses
let toastTimer = null;
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.innerHTML = '<span class="toast-icon" aria-hidden="true">&#10003;</span><span class="toast-text"></span>';
    toast.querySelector('.toast-text').textContent = message;

    // paksa reflow agar animasi muncul ulang bila toast dipanggil berturut-turut
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}

// Kosongkan form setelah laporan terkirim (tab yang aktif tetap dipertahankan)
function resetForm() {
    form.reset();
    fotoData = '';
    preview.hidden = true;
    preview.removeAttribute('src');
    photoInput.value = '';
    showPhotoError('');
    statusEl.hidden = true;

    const lain = document.getElementById('lokasi-lain');
    if (lain) { lain.hidden = true; lain.required = false; lain.value = ''; }
}

// 3. Submit (simulasi backend via localStorage)
form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.hidden = true;
    if (submitBtn.disabled) return; // cegah klik ganda

    const value = id => document.getElementById(id).value.trim();
    const data = {
        id: Date.now(),
        tipe: value('tipe-laporan'),
        namaBarang: value('nama-barang'),
        jenis: value('jenis-barang'),
        tanggal: value('tanggal'),
        lokasi: value('lokasi') === 'Lainnya' ? value('lokasi-lain') : value('lokasi'),
        deskripsi: value('deskripsi'),
        ciriRahasia: value('ciri-rahasia'), // jangan tampilkan di halaman publik
        penitipan: value('penitipan'),
        foto: fotoData
    };

    // "required" lolos untuk spasi saja, jadi cek ulang setelah trim
    if (!data.namaBarang || !data.lokasi || !data.deskripsi) {
        showStatus('Nama barang, lokasi, dan deskripsi tidak boleh hanya berisi spasi.', true);
        return;
    }
    if (data.tipe === 'Ditemukan' && (!data.ciriRahasia || !data.penitipan)) {
        showStatus('Laporan barang temuan wajib mengisi lokasi penitipan dan ciri rahasia.', true);
        return;
    }
    if (data.tanggal > todayLocalISO()) {
        showStatus('Tanggal kejadian tidak boleh di masa depan.', true);
        return;
    }

    submitBtn.disabled = true;
    try {
        const list = loadList();
        list.push(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
        submitBtn.disabled = false;
        showStatus('Laporan gagal disimpan (penyimpanan penuh). Coba foto yang lebih kecil.', true);
        return;
    }

    // Berhasil: tetap di halaman ini, kosongkan form, tampilkan notifikasi
    resetForm();
    submitBtn.disabled = false;
    showToast('Laporan berhasil dikirim.');
});

// 4. Pasang event listener (menggantikan onclick/onchange inline)
document.getElementById('tab-hilang').addEventListener('click', () => switchTab('hilang'));
document.getElementById('tab-nemu').addEventListener('click', () => switchTab('nemu'));
photoInput.addEventListener('change', previewImage);
document.getElementById('tanggal').max = todayLocalISO();

// Dropdown lokasi: tampilkan kolom tulis sendiri bila memilih "Lainnya"
const lokasiSelect = document.getElementById('lokasi');
const lokasiLain = document.getElementById('lokasi-lain');
lokasiSelect.addEventListener('change', () => {
    const isLain = lokasiSelect.value === 'Lainnya';
    lokasiLain.hidden = !isLain;
    lokasiLain.required = isLain;
    if (isLain) lokasiLain.focus(); else lokasiLain.value = '';
});

// 5. Terapkan ?tipe=hilang|ditemukan dari tombol beranda
const tipeParam = new URLSearchParams(window.location.search).get('tipe');
if (tipeParam) switchTab(tipeParam);

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  // 1. Jika dibuka di dalam pop-up modal, sembunyikan navbar "Kembali ke Beranda"
  if (params.get("popup") === "1" || window.self !== window.top) {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.display = "none";
  }

  // 2. Jika diklik dari tombol "Saya menemukan" (?tipe=ditemukan), otomatis klik tab Saya Menemukan
  if (params.get("tipe") === "ditemukan") {
    const tabNemu = document.getElementById("tab-nemu");
    if (tabNemu) tabNemu.click();
  }
});