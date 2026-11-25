/**
 * Form laporan: tab Hilang/Temuan, lokasi "Lainnya", dan pratinjau foto.
 * Validasi utama tetap di server.
 */
(function () {
    const form = document.getElementById('form-laporan');
    if (!form) {
        return;
    }

    const tipeInput = document.getElementById('tipe-laporan');
    const tabHilang = document.getElementById('tab-hilang');
    const tabNemu = document.getElementById('tab-nemu');
    const fieldPenitipan = document.getElementById('field-penitipan');
    const penitipan = document.getElementById('penitipan');
    const ciriRahasia = document.getElementById('ciri-rahasia');
    const lokasi = document.getElementById('lokasi');
    const lokasiLain = document.getElementById('lokasi-lain');
    const foto = document.getElementById('foto-barang');
    const preview = document.getElementById('preview-foto');
    const fotoError = document.getElementById('foto-error');
    const tanggal = document.getElementById('tanggal');

    function setTipe(tipe) {
        const ditemukan = tipe === 'Ditemukan';

        tipeInput.value = ditemukan ? 'Ditemukan' : 'Hilang';

        tabHilang.classList.toggle('active', !ditemukan);
        tabNemu.classList.toggle('active', ditemukan);
        tabHilang.setAttribute('aria-pressed', String(!ditemukan));
        tabNemu.setAttribute('aria-pressed', String(ditemukan));

        fieldPenitipan.hidden = !ditemukan;
        penitipan.required = ditemukan;
        ciriRahasia.required = ditemukan;
    }

    tabHilang.addEventListener('click', function () {
        setTipe('Hilang');
    });

    tabNemu.addEventListener('click', function () {
        setTipe('Ditemukan');
    });

    function syncLokasi() {
        const lain = lokasi.value === 'Lainnya';

        lokasiLain.hidden = !lain;
        lokasiLain.required = lain;

        if (!lain) {
            lokasiLain.value = '';
        }
    }

    lokasi.addEventListener('change', syncLokasi);

    function resetFoto() {
        foto.value = '';
        preview.hidden = true;
        preview.removeAttribute('src');
    }

    foto.addEventListener('change', function () {
        fotoError.hidden = true;
        fotoError.textContent = '';

        const file = foto.files && foto.files[0];

        if (!file) {
            resetFoto();
            return;
        }

        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            fotoError.textContent = 'Format foto harus PNG atau JPG.';
            fotoError.hidden = false;
            resetFoto();
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            fotoError.textContent = 'Ukuran foto maksimal 2 MB.';
            fotoError.hidden = false;
            resetFoto();
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            preview.src = reader.result;
            preview.hidden = false;
        };
        reader.readAsDataURL(file);
    });

    if (tanggal) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        tanggal.max = now.toISOString().slice(0, 10);
    }
})();
