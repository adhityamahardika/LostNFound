// 1. Logika Ganti Tab
function switchTab(jenis) {
    const btnHilang = document.getElementById('tab-hilang');
    const btnNemu = document.getElementById('tab-nemu');
    const inputTipe = document.getElementById('tipe-laporan');
    const fieldPenitipan = document.getElementById('field-penitipan');

    if (jenis === 'hilang') {
        btnHilang.classList.add('active');
        btnNemu.classList.remove('active');
        inputTipe.value = 'Hilang';
        fieldPenitipan.style.display = 'none'; // Sembunyikan input lokasi titip
    } else {
        btnNemu.classList.add('active');
        btnHilang.classList.remove('active');
        inputTipe.value = 'Ditemukan';
        fieldPenitipan.style.display = 'block'; // Tampilkan input lokasi titip
    }
}

// 2. Logika Preview Gambar
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function(){
        const output = document.getElementById('preview-foto');
        output.src = reader.result;
        output.style.display = 'block'; // Tampilkan gambar
    };
    reader.readAsDataURL(event.target.files[0]);
}

// 3. Logika Submit & Simpan ke LocalStorage (Simulasi Backend)
document.getElementById('form-laporan').addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah halaman me-refresh

    // Ambil semua data dari form
    const dataLaporan = {
        id: Date.now(), // Buat ID unik
        tipe: document.getElementById('tipe-laporan').value,
        namaBarang: document.getElementById('nama-barang').value,
        jenis: document.getElementById('jenis-barang').value,
        tanggal: document.getElementById('tanggal').value,
        lokasi: document.getElementById('lokasi').value,
        deskripsi: document.getElementById('deskripsi').value,
        // Foto disimulasikan menyimpan Base64-nya
        foto: document.getElementById('preview-foto').src || '' 
    };

    // Ambil data lama dari localStorage (jika ada), jika tidak buat array kosong
    let daftarBarang = JSON.parse(localStorage.getItem('dataBarang')) || [];
    
    // Masukkan data baru ke array
    daftarBarang.push(dataLaporan);

    // Simpan kembali ke localStorage
    localStorage.setItem('dataBarang', JSON.stringify(daftarBarang));

    // Beri notifikasi sukses
    alert('Laporan berhasil disimpan! (Data tersimpan di LocalStorage)');
    
    // Redirect kembali ke homepage (sesuaikan path index.html-mu)
    window.location.href = "../../index.html"; 
});