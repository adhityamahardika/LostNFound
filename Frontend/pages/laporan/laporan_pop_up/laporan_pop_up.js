const STORAGE_KEY = 'dataBarang';
const HOME_URL = '../../../index.html'; // dari pages/laporan/laporan_pop_up/ ke Frontend/index.html
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
        lokasi: value('lokasi'),
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

    showStatus('Laporan berhasil dikirim. Mengalihkan ke beranda...', false);
    setTimeout(() => { window.location.href = HOME_URL; }, 1200);
});

// 4. Pasang event listener (menggantikan onclick/onchange inline)
document.getElementById('tab-hilang').addEventListener('click', () => switchTab('hilang'));
document.getElementById('tab-nemu').addEventListener('click', () => switchTab('nemu'));
photoInput.addEventListener('change', previewImage);
document.getElementById('tanggal').max = todayLocalISO();

// 5. Terapkan ?tipe=hilang|ditemukan dari tombol beranda
const tipeParam = new URLSearchParams(window.location.search).get('tipe');
if (tipeParam) switchTab(tipeParam);
