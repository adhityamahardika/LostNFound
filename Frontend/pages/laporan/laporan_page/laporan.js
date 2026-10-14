// 1. Data Dummy
const dummyData = [
    { id: 1, nama: "Dompet kulit", jenis: "Aksesoris", lokasi: "Kantin Utama", tanggal: "2026-09-27", status: "Hilang", img: "../../../assets/items/dompet.jpg" },
    { id: 2, nama: "Kunci motor", jenis: "Kendaraan", lokasi: "Gedung B", tanggal: "2026-09-28", status: "Ditemukan", img: "../../../assets/items/kunci.jpg" },
    { id: 3, nama: "Kartu Mahasiswa", jenis: "Dokumen", lokasi: "Perpustakaan", tanggal: "2026-09-28", status: "Ditemukan", img: "../../../assets/items/ktm.jpg" },
    { id: 4, nama: "Botol minum hijau", jenis: "Aksesoris", lokasi: "Lab Komputer", tanggal: "2026-09-26", status: "Hilang", img: "../../../assets/items/tumbler.jpg" },
    { id: 5, nama: "Tas ransel hitam", jenis: "Tas", lokasi: "Parkiran Timur", tanggal: "2026-09-25", status: "Ditemukan", img: "../../../assets/items/tas.jpg" },
    { id: 6, nama: "Charger Laptop", jenis: "Elektronik", lokasi: "Aula", tanggal: "2026-09-24", status: "Dikembalikan", img: "../../../assets/items/charger.jpg" }
];

let currentStatusFilter = 'Semua';

// 2. Format Tanggal
function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', options);
}

// 3. Render Kartu
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function badgeClassOf(status) {
    return escapeHTML(status.toLowerCase());
}

function renderCards(data) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p class="empty-state">Tidak ada laporan yang cocok dengan filter.</p>';
    }

    data.forEach(item => {
        const isImgUrl = item.img && (item.img.includes('/') || item.img.includes('.'));
        const imgMarkup = isImgUrl 
            ? `<img src="${escapeHTML(item.img)}" alt="${escapeHTML(item.nama)}">` 
            : escapeHTML(item.img);

        container.insertAdjacentHTML('beforeend', `
            <div class="card">
                <div class="card-image" aria-hidden="true">${imgMarkup}</div>
                <div class="card-content">
                    <span class="badge ${badgeClassOf(item.status)}">${escapeHTML(item.status)}</span>
                    <h3 class="card-title">${escapeHTML(item.nama)}</h3>
                    <p class="card-info">${escapeHTML(item.lokasi)} · ${formatDate(item.tanggal)}</p>
                    <button type="button" class="btn-detail" data-id="${escapeHTML(item.id)}">Lihat detail</button>
                </div>
            </div>
        `);
    });

    document.getElementById('summary-text').textContent =
        `Menampilkan ${data.length} dari ${dummyData.length} laporan`;
}

// 4. Filter
function filterByStatus(status, btnElement) {
    document.querySelectorAll('.status-btn').forEach(btn => {
        const active = btn === btnElement;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
    currentStatusFilter = status;
    executeFilters();
}

function executeFilters() {
    const filterJenis = document.getElementById('filter-jenis').value;
    const filterLokasi = document.getElementById('filter-lokasi').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    if (startDate && endDate && startDate > endDate) {
        document.getElementById('summary-text').textContent =
            'Tanggal "Dari" tidak boleh setelah tanggal "Sampai".';
        return;
    }

    const filtered = dummyData.filter(item => {
        const matchStatus = (currentStatusFilter === 'Semua') || (item.status === currentStatusFilter);
        const matchJenis = (filterJenis === 'Semua') || (item.jenis === filterJenis);
        const matchLokasi = (filterLokasi === 'Semua') || item.lokasi.includes(filterLokasi);
        const matchStart = !startDate || item.tanggal >= startDate;
        const matchEnd = !endDate || item.tanggal <= endDate;
        return matchStatus && matchJenis && matchLokasi && matchStart && matchEnd;
    });

    renderCards(filtered);
}

function resetFilters() {
    document.getElementById('filter-jenis').value = 'Semua';
    document.getElementById('filter-lokasi').value = 'Semua';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    filterByStatus('Semua', document.querySelector('.status-btn'));
}

// ================= MODAL =================
let lastFocused = null;

function openModal(idBarang) {
    const barang = dummyData.find(item => String(item.id) === String(idBarang));
    if (!barang) return;

    const isImgUrl = barang.img && (barang.img.includes('/') || barang.img.includes('.'));
    const imgMarkup = isImgUrl
        ? `<img src="${escapeHTML(barang.img)}" alt="${escapeHTML(barang.nama)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
        : escapeHTML(barang.img);

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-detail-flex">
            <div class="modal-gallery" aria-hidden="true">${imgMarkup}</div>
            <div class="modal-info">
                <span class="badge ${badgeClassOf(barang.status)}">${escapeHTML(barang.status)}</span>
                <h2 id="modal-title">${escapeHTML(barang.nama)}</h2>
                <p><strong>Jenis:</strong> ${escapeHTML(barang.jenis)}</p>
                <p><strong>Lokasi:</strong> ${escapeHTML(barang.lokasi)}</p>
                <p><strong>Tanggal:</strong> ${formatDate(barang.tanggal)}</p>
                <div class="claim-hint">
                    <strong>Ini barangmu?</strong><br>
                    Siapkan ciri-ciri khusus sebelum melakukan klaim.
                </div>
                <button type="button" class="btn-kembali" id="modal-back">Kembali</button>
            </div>
        </div>
    `;
    document.getElementById('modal-back').addEventListener('click', closeModal);

    lastFocused = document.activeElement;
    document.getElementById('detail-modal').hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close').focus();
}

function closeModal() {
    document.getElementById('detail-modal').hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
}

// 5. Init
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-terapkan').addEventListener('click', executeFilters);
    document.getElementById('btn-reset').addEventListener('click', resetFilters);
    document.querySelectorAll('.status-btn').forEach(btn =>
        btn.addEventListener('click', () => filterByStatus(btn.dataset.status, btn)));

    document.getElementById('card-container').addEventListener('click', e => {
        const btn = e.target.closest('.btn-detail');
        if (btn) {
            window.location.href = `../detail_barang/detail_barang.html?id=${btn.dataset.id}`;
        }
    });

    const modal = document.getElementById('detail-modal');
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // Baca parameter dari search hero di beranda
    const params = new URLSearchParams(window.location.search);
    const jenisDariHero = params.get('jenis');
    const lokasiDariHero = params.get('lokasi');

    if (jenisDariHero) {
        const selectJenis = document.getElementById('filter-jenis');
        const matchingOption = Array.from(selectJenis.options).find(o => o.value === jenisDariHero);
        if (matchingOption) selectJenis.value = jenisDariHero;
    }
    if (lokasiDariHero) {
        const selectLokasi = document.getElementById('filter-lokasi');
        const matchingOption = Array.from(selectLokasi.options).find(o => o.value === lokasiDariHero);
        if (matchingOption) selectLokasi.value = lokasiDariHero;
    }

    executeFilters();
});
