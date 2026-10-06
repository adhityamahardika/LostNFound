// Simulasi Data Database berdasarkan gambar
const dummyData = [
    { id: 1, nama: "Dompet cokelat", jenis: "Aksesoris", lokasi: "Kantin Utama", tanggal: "2026-09-27", status: "Hilang", img: "👛" },
    { id: 2, nama: "Kunci motor Honda", jenis: "Kendaraan", lokasi: "Gedung B", tanggal: "2026-09-28", status: "Ditemukan", img: "🔑" },
    { id: 3, nama: "KTM a.n. Made Wirawan", jenis: "Dokumen", lokasi: "Perpustakaan", tanggal: "2026-09-28", status: "Ditemukan", img: "𪪙" }, // Menggunakan emoji ID card
    { id: 4, nama: "Botol minum biru", jenis: "Aksesoris", lokasi: "Lab Komputer", tanggal: "2026-09-26", status: "Hilang", img: "🧋" },
    { id: 5, nama: "Earphone putih", jenis: "Elektronik", lokasi: "Aula", tanggal: "2026-09-24", status: "Dikembalikan", img: "🎧" },
    { id: 6, nama: "Tas ransel hitam", jenis: "Tas", lokasi: "Parkiran Timur", tanggal: "2026-09-25", status: "Ditemukan", img: "🎒" }
];

let currentData = [...dummyData];
let currentStatusFilter = 'Semua';

// Format tanggal dari YYYY-MM-DD ke DD MMM YYYY (Contoh: 27 Sep 2026)
function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Render Kartu ke HTML
function renderCards(data) {
    const container = document.getElementById('card-container');
    container.innerHTML = ''; // Kosongkan container

    data.forEach(item => {
        // Tentukan class badge berdasarkan status
        let badgeClass = item.status.toLowerCase();

        const cardHTML = `
            <div class="card">
                <div class="card-image">${item.img}</div>
                <div class="card-content">
                    <span class="badge ${badgeClass}">${item.status}</span>
                    <h3 class="card-title">${item.nama}</h3>
                    <p class="card-info">${item.lokasi} · ${formatDate(item.tanggal)}</p>
                    <button class="btn-detail">Lihat detail</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Update text jumlah laporan
    document.getElementById('summary-text').innerText = `Menampilkan ${data.length} dari ${dummyData.length} laporan`;
}

// Logika Filter Status (Tabs)
function filterByStatus(status, btnElement) {
    // Hapus class active dari semua tombol
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    // Tambah class active ke tombol yang diklik
    btnElement.classList.add('active');

    currentStatusFilter = status;
    executeFilters();
}

// Logika Filter Utama (Dropdown & Tanggal)
function applyFilters() {
    executeFilters();
}

// Fungsi utama untuk mengeksekusi semua filter sekaligus
function executeFilters() {
    const filterJenis = document.getElementById('filter-jenis').value;
    const filterLokasi = document.getElementById('filter-lokasi').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    const filtered = dummyData.filter(item => {
        // Cek Status Tab
        const matchStatus = (currentStatusFilter === 'Semua') || (item.status === currentStatusFilter);
        
        // Cek Dropdown Jenis
        const matchJenis = (filterJenis === 'Semua') || (item.jenis === filterJenis);
        
        // Cek Dropdown Lokasi (Pada data dummy, dicocokkan sebagian/parsial)
        const matchLokasi = (filterLokasi === 'Semua') || item.lokasi.includes(filterLokasi);
        
        // Cek Tanggal
        let matchDate = true;
        if (startDate && endDate) {
            matchDate = (item.tanggal >= startDate && item.tanggal <= endDate);
        }

        return matchStatus && matchJenis && matchLokasi && matchDate;
    });

    renderCards(filtered);
}

// Reset semua filter kembali ke awal
function resetFilters() {
    document.getElementById('filter-jenis').value = 'Semua';
    document.getElementById('filter-lokasi').value = 'Semua';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    
    // Kembalikan tab ke 'Semua'
    const btnSemua = document.querySelector('.status-btn'); 
    filterByStatus('Semua', btnSemua); // Akan memanggil executeFilters() secara otomatis
}

// Render data awal saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderCards(currentData);
});