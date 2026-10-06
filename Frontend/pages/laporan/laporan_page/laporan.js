// 1. Data Dummy
const dummyData = [
    { id: 1, nama: "Dompet cokelat", jenis: "Aksesoris", lokasi: "Kantin Utama", tanggal: "2026-09-27", status: "Hilang", img: "👛" },
    { id: 2, nama: "Kunci motor Honda", jenis: "Kendaraan", lokasi: "Gedung B", tanggal: "2026-09-28", status: "Ditemukan", img: "🔑" },
    { id: 3, nama: "KTM a.n. Made Wirawan", jenis: "Dokumen", lokasi: "Perpustakaan", tanggal: "2026-09-28", status: "Ditemukan", img: "𪪙" },
    { id: 4, nama: "Botol minum biru", jenis: "Aksesoris", lokasi: "Lab Komputer", tanggal: "2026-09-26", status: "Hilang", img: "🧋" },
    { id: 5, nama: "Tas ransel hitam", jenis: "Tas", lokasi: "Parkiran Timur", tanggal: "2026-09-25", status: "Ditemukan", img: "🎒" }
];

let currentData = [...dummyData];
let currentStatusFilter = 'Semua';

// 2. Format Tanggal
function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// 3. Render Kartu
function renderCards(data) {
    const container = document.getElementById('card-container');
    container.innerHTML = ''; 

    data.forEach(item => {
        let badgeClass = item.status.toLowerCase();

        const cardHTML = `
            <div class="card">
                <div class="card-image">${item.img}</div>
                <div class="card-content">
                    <span class="badge ${badgeClass}">${item.status}</span>
                    <h3 class="card-title">${item.nama}</h3>
                    <p class="card-info">${item.lokasi} · ${formatDate(item.tanggal)}</p>
                    
                    <!-- Perbaikan: Tambah tanda kutip satu di sekitar item.id -->
                    <button class="btn-detail" onclick="openModal('${item.id}')">Lihat detail</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

    document.getElementById('summary-text').innerText = `Menampilkan ${data.length} laporan`;
}

// 4. Logika Filter Status & Filter Utama
function filterByStatus(status, btnElement) {
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    currentStatusFilter = status;
    executeFilters();
}

function applyFilters() {
    executeFilters();
}

function executeFilters() {
    const filterJenis = document.getElementById('filter-jenis').value;
    const filterLokasi = document.getElementById('filter-lokasi').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    const filtered = dummyData.filter(item => {
        const matchStatus = (currentStatusFilter === 'Semua') || (item.status === currentStatusFilter);
        const matchJenis = (filterJenis === 'Semua') || (item.jenis === filterJenis);
        const matchLokasi = (filterLokasi === 'Semua') || item.lokasi.includes(filterLokasi);
        
        let matchDate = true;
        if (startDate && endDate) {
            matchDate = (item.tanggal >= startDate && item.tanggal <= endDate);
        }

        return matchStatus && matchJenis && matchLokasi && matchDate;
    });

    renderCards(filtered);
}

function resetFilters() {
    document.getElementById('filter-jenis').value = 'Semua';
    document.getElementById('filter-lokasi').value = 'Semua';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    
    const btnSemua = document.querySelector('.status-btn'); 
    filterByStatus('Semua', btnSemua); 
}

// ================= FUNGSI MODAL =================

function openModal(idBarang) {
    // Cari data berdasarkan ID (pakai == agar string '1' bisa cocok dengan number 1)
    const barang = dummyData.find(item => item.id == idBarang);
    if (!barang) {
        console.error("Barang tidak ditemukan!");
        return;
    }

    const modalBody = document.getElementById('modal-body');
    let badgeClass = barang.status.toLowerCase();
    
    modalBody.innerHTML = `
        <div class="modal-detail-flex">
            <div class="modal-gallery">
                ${barang.img}
            </div>
            <div class="modal-info">
                <span class="badge ${badgeClass}">${barang.status}</span>
                <h2>${barang.nama}</h2>
                <p><strong>Jenis:</strong> ${barang.jenis}</p>
                <p><strong>Lokasi:</strong> ${barang.lokasi}</p>
                <p><strong>Tanggal:</strong> ${formatDate(barang.tanggal)}</p>
                
                <div style="background-color: #fff8e1; color: #8f6d00; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong>Ini barangmu?</strong><br>
                    Siapkan ciri-ciri khusus sebelum melakukan klaim.
                </div>
                
                <button class="btn-kembali" onclick="closeModal()">Kembali</button>
            </div>
        </div>
    `;

    document.getElementById('detail-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

// Tutup modal klik di luar kotak
window.onclick = function(event) {
    const modal = document.getElementById('detail-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// 5. Init saat web dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderCards(currentData);
});