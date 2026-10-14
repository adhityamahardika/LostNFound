// Data dummy - sync dengan laporan.js
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
<<<<<<< Updated upstream
    return dummyData.find(item => String(item.id) === id) || dummyData[0];
=======
    return dummyData.find(item => String(item.id) === id) || dummyData[1]; // default kunci jika id tidak ada
>>>>>>> Stashed changes
}

function renderItemDetail(item) {
    if (!item) {
        document.querySelector('.detail-main').innerHTML = '<p>Barang tidak ditemukan. <a href="../laporan_page/laporan.html">Kembali ke daftar</a></p>';
        return;
    }

    document.querySelector('.badge').textContent = item.status;
    document.querySelector('.badge').className = `badge ${item.status.toLowerCase()}`;
    document.querySelector('.item-title').textContent = item.nama;
    const itemCode = `LF-${item.tanggal.replace(/-/g, '')}-${String(item.id).padStart(3, '0')}`;
    document.querySelector('.item-id').textContent = `Kode laporan ${itemCode}`;
    
    document.querySelectorAll('.info-value')[0].textContent = item.jenis;
    document.querySelectorAll('.info-value')[1].textContent = formatDate(item.tanggal);
    document.querySelectorAll('.info-value')[2].textContent = 'Sekitar 08.30';
    document.querySelectorAll('.info-value')[3].textContent = item.lokasi;
    document.querySelectorAll('.info-value')[4].textContent = 'Pos satpam, gerbang utama';
    document.querySelectorAll('.info-value')[5].textContent = 'Ayu, mahasiswa';
    
    document.querySelector('.item-desc').textContent = item.deskripsi;
    
<<<<<<< Updated upstream
    document.getElementById('main-image').textContent = item.img;
    document.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
        if (idx === 0) {
            thumb.dataset.emoji = item.img;
            thumb.textContent = item.img;
        }
    });
=======
    const isImgUrl = item.img && (item.img.includes('/') || item.img.includes('.'));
    if (isImgUrl) {
        document.getElementById('main-image').innerHTML = `<img src="${item.img}" alt="${item.nama}">`;
        const firstThumb = document.querySelectorAll('.thumbnail')[0];
        if (firstThumb) {
            firstThumb.innerHTML = `<img src="${item.img}" alt="${item.nama}">`;
            firstThumb.dataset.img = item.img;
        }
    } else {
        document.getElementById('main-image').textContent = item.img;
        document.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
            if (idx === 0) thumb.dataset.emoji = item.img;
        });
    }

    // Klaim button -> redirect ke chatroom
    const klaimBtn = document.getElementById('btn-klaim');
    if (klaimBtn) {
        klaimBtn.addEventListener('click', () => {
            window.location.href = `../../chat/chat.html?item=${encodeURIComponent(itemCode)}&title=${encodeURIComponent(item.nama)}&finder=Ayu`;
        });
    }
>>>>>>> Stashed changes
}

// Gallery thumbnails
const mainImage = document.getElementById('main-image');
const thumbnails = document.querySelectorAll('.thumbnail');

thumbnails.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => {
        if (idx === 0 && thumb.dataset.img) {
            mainImage.innerHTML = `<img src="${thumb.dataset.img}" alt="Preview">`;
        } else if (thumb.dataset.emoji) {
            mainImage.innerHTML = thumb.dataset.emoji;
        }
        thumbnails.forEach(t => {
            t.classList.toggle('active', t === thumb);
            t.setAttribute('aria-pressed', String(t === thumb));
        });
    });
});

<<<<<<< Updated upstream
// Init data barang
=======
// Init
>>>>>>> Stashed changes
const item = getItemFromURL();
renderItemDetail(item);

// Klaim button - langsung aktif dan mengarah ke klaim.html saat diklik
const klaimBtn = document.getElementById('btn-klaim');
if (klaimBtn) {
    klaimBtn.textContent = 'Ajukan Klaim';
    klaimBtn.disabled = false;
    klaimBtn.addEventListener('click', () => {
        const query = window.location.search || `?id=${item ? item.id : 1}`;
        window.location.href = '../../klaim/klaim.html' + query;
    });
}