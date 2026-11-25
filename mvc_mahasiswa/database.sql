-- Database: lostnfound_db
-- Tabel tambahan untuk latihan MVC: mahasiswa
-- Tabel `laporan` milik aplikasi LostnFound tidak diubah.

CREATE DATABASE IF NOT EXISTS `lostnfound_db`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `lostnfound_db`;

CREATE TABLE IF NOT EXISTS `mahasiswa` (
    `nim`   VARCHAR(20)  NOT NULL PRIMARY KEY,
    `nama`  VARCHAR(100) NOT NULL,
    `prodi` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data contoh (INSERT IGNORE agar aman dijalankan berulang)
INSERT IGNORE INTO `mahasiswa` (`nim`, `nama`, `prodi`) VALUES
('2308561001', 'Made Wirawan',    'Teknologi Informasi'),
('2308561002', 'Detuy Mahardika', 'Teknologi Informasi'),
('2308561003', 'Rizky Pratama',   'Sistem Informasi'),
('2308561004', 'Budi Santoso',    'Teknik Informatika'),
('2308561005', 'Ni Luh Ayu',      'Sistem Informasi'),
('2308561006', 'I Wayan Aditya',  'Teknologi Informasi');
