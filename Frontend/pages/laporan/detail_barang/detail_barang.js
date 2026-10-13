// Data dummy - sync dengan laporan.js
const dummyData = [
    { id: 1, nama: "Dompet cokelat", jenis: "Aksesoris", lokasi: "Kantin Utama", tanggal: "2026-09-27", status: "Hilang", img: "👛", deskripsi: "Dompet kulit cokelat dengan kancing. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik." },
    { id: 2, nama: "Kunci motor Honda", jenis: "Kendaraan", lokasi: "Gedung B", tanggal: "2026-09-28", status: "Ditemukan", img: "🔑", deskripsi: "Kunci dengan gantungan karakter. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik." },
    { id: 3, nama: "KTM a.n. Made Wirawan", jenis: "Dokumen", lokasi: "Perpustakaan", tanggal: "2026-09-28", status: "Ditemukan", img: "🪪", deskripsi: "Kartu mahasiswa atas nama Made Wirawan. Hubungi untuk verifikasi lebih lanjut." },
    { id: 4, nama: "Botol minum biru", jenis: "Aksesoris", lokasi: "Lab Komputer", tanggal: "2026-09-26", status: "Hilang", img: "🧋", deskripsi: "Botol minum warna biru dengan stiker. Detail lain tidak ditampilkan untuk verifikasi." },
    { id: 5, nama: "Tas ransel hitam", jenis: "Tas", lokasi: "Parkiran Timur", tanggal: "2026-09-25", status: "Ditemukan", img: "🎒", deskripsi: "Tas ransel hitam ukuran sedang. Ciri khusus disembunyikan untuk keperluan klaim." },
    { id: 6, nama: "Charger Laptop HP", jenis: "Elektronik", lokasi: "Aula", tanggal: "2026-09-24", status: "Dikembalikan", img: "🔌", deskripsi: "Charger laptop HP original. Barang sudah dikembalikan ke pemiliknya." }
];

function formatDate(dateString) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', options);
}

function getItemFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return dummyData.find(item => String(item.id) === id);
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
    
    document.getElementById('main-image').textContent = item.img;
    document.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
        if (idx === 0) thumb.dataset.emoji = item.img;
    });
}

// Gallery thumbnails
const mainImage = document.getElementById('main-image');
const thumbnails = document.querySelectorAll('.thumbnail');

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        mainImage.textContent = thumb.dataset.emoji;
        thumbnails.forEach(t => {
            t.classList.toggle('active', t === thumb);
            t.setAttribute('aria-pressed', String(t === thumb));
        });
    });
});

// Klaim button
const klaimBtn = document.getElementById('btn-klaim');
if (klaimBtn) {
    klaimBtn.addEventListener('click', () => {
        klaimBtn.textContent = 'Form verifikasi segera tersedia';
        klaimBtn.disabled = true;
    });
}

// Init
const item = getItemFromURL();
renderItemDetail(item);
