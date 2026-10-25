-- Database: lostnfound_db
-- Dibuat untuk Sistem Pelaporan Barang Hilang & Temuan (LostnFound)

CREATE DATABASE IF NOT EXISTS `lostnfound_db` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `lostnfound_db`;

-- Hapus tabel jika sudah ada sebelumnya (opsional untuk reset)
-- DROP TABLE IF EXISTS `laporan`;

-- Tabel: laporan
CREATE TABLE IF NOT EXISTS `laporan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tipe` ENUM('Hilang', 'Ditemukan') NOT NULL DEFAULT 'Hilang',
    `nama_barang` VARCHAR(100) NOT NULL,
    `jenis_barang` VARCHAR(50) NOT NULL,
    `tanggal` DATE NOT NULL,
    `lokasi` VARCHAR(150) NOT NULL,
    `penitipan` VARCHAR(100) DEFAULT NULL,
    `deskripsi` TEXT NOT NULL,
    `ciri_rahasia` TEXT DEFAULT NULL,
    `foto` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan') NOT NULL DEFAULT 'Hilang',
    `pelapor_email` VARCHAR(100) DEFAULT NULL,
    `pelapor_name` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Awal / Dummy untuk Pengujian
INSERT INTO `laporan` (`id`, `tipe`, `nama_barang`, `jenis_barang`, `tanggal`, `lokasi`, `penitipan`, `deskripsi`, `ciri_rahasia`, `foto`, `status`, `pelapor_email`, `pelapor_name`) VALUES
(1, 'Hilang', 'Dompet kulit', 'Aksesoris', '2026-09-27', 'Kantin Utama', NULL, 'Dompet kulit cokelat dengan kancing. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik.', 'Ada uang tunai dan kartu member di kantong dalam', 'assets/items/dompet.jpg', 'Hilang', 'deta@student.kampus.ac.id', 'Detuy Mahardika'),
(2, 'Ditemukan', 'Kunci motor', 'Kendaraan', '2026-09-28', 'Gedung B', 'Tata Usaha', 'Kunci dengan gantungan karakter. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik.', 'Gantungan kunci bertuliskan Honda dengan pita merah', 'assets/items/kunci.jpg', 'Ditemukan', 'rizky@student.kampus.ac.id', 'Rizky'),
(3, 'Ditemukan', 'Kartu Mahasiswa', 'Dokumen', '2026-09-28', 'Perpustakaan', 'Pos Satpam Depan', 'Kartu mahasiswa atas nama Made Wirawan. Hubungi untuk verifikasi lebih lanjut.', 'NIM berakhiran 106', 'assets/items/ktm.jpg', 'Ditemukan', 'rizky@student.kampus.ac.id', 'Rizky'),
(4, 'Hilang', 'Botol minum hijau', 'Aksesoris', '2026-09-26', 'Lab Komputer', NULL, 'Botol minum warna hijau dengan stiker. Detail lain tidak ditampilkan untuk verifikasi.', 'Stiker Linux di bagian tutup botol', 'assets/items/tumbler.jpg', 'Hilang', 'budi@student.kampus.ac.id', 'Budi'),
(5, 'Ditemukan', 'Tas ransel hitam', 'Tas', '2026-09-25', 'Parkiran Timur', 'Pos Satpam Depan', 'Tas ransel hitam ukuran sedang. Ciri khusus disembunyikan untuk keperluan klaim.', 'Di kantong depan ada buku catatan bersampul biru', 'assets/items/tas.jpg', 'Ditemukan', 'satpam@kampus.ac.id', 'Petugas Satpam'),
(6, 'Hilang', 'Charger Laptop', 'Elektronik', '2026-09-24', 'Aula', NULL, 'Charger laptop HP original. Barang sudah dikembalikan ke pemiliknya.', 'Ada selotip hitam di ujung kabel adaptor', 'assets/items/charger.jpg', 'Dikembalikan', 'deta@student.kampus.ac.id', 'Detuy Mahardika');
