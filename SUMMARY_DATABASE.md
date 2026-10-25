# Ringkasan Implementasi Database & Backend PHP
## Sistem Pelaporan Barang Hilang & Temuan (LostnFound)

Dokumen ini merangkum seluruh pekerjaan implementasi database MySQL, backend PHP, dan integrasi dengan frontend yang telah diselesaikan.

---

## 1. Ikhtisar Pekerjaan

Tujuan dari tahapan ini adalah mengubah sistem penyimpanan laporan barang yang sebelumnya masih berupa dummy dan *local storage* statis menjadi sistem berbasis database relasional (**MySQL**) dengan antarmuka pemrograman aplikasi (**PHP Backend API**). 

Dengan implementasi ini:
- Pengguna yang mengisi formulir pelaporan barang (baik barang hilang maupun barang temuan) datanya langsung tersimpan secara persisten ke database MySQL.
- Seluruh daftar barang dan status pelaporannya (Hilang, Ditemukan, Diklaim, Dikembalikan) diambil secara dinamis dari database untuk ditampilkan pada halaman katalog dan detail barang.

---

## 2. Struktur Database MySQL

- **Nama Database**: `lostnfound_db`
- **File Skema SQL**: `Backend/database.sql`
- **Tabel Utama**: `laporan`

### Spesifikasi Kolom Tabel `laporan`
| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PRIMARY KEY` | Kunci utama dan identitas unik setiap laporan barang |
| `tipe` | `ENUM('Hilang', 'Ditemukan')` | Kategori formulir pelaporan |
| `nama_barang` | `VARCHAR(100) NOT NULL` | Nama barang yang dilaporkan |
| `jenis_barang` | `VARCHAR(50) NOT NULL` | Kategori barang (Elektronik, Dokumen, Tas, Kendaraan, Aksesoris, dll.) |
| `tanggal` | `DATE NOT NULL` | Tanggal kejadian kehilangan/penemuan |
| `lokasi` | `VARCHAR(150) NOT NULL` | Tempat atau area barang hilang/ditemukan di lingkungan kampus |
| `penitipan` | `VARCHAR(100) DEFAULT NULL` | Posisi barang sekarang dititipkan (khusus barang temuan) |
| `deskripsi` | `TEXT NOT NULL` | Rincian ciri fisik, warna, merek, dan kondisi umum barang |
| `ciri_rahasia` | `TEXT DEFAULT NULL` | Ciri khusus/rahasia untuk verifikasi bukti kepemilikan saat klaim |
| `foto` | `VARCHAR(255) DEFAULT NULL` | Lokasi path file foto barang yang diunggah |
| `status` | `ENUM('Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan')` | Status alur penanganan barang |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Waktu pencatatan laporan |
| `updated_at` | `TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Waktu pembaruan data terakhir |

> **Catatan Data Awal**: Skema SQL sudah dilengkapi dengan 6 data dummy awal agar sistem langsung dapat diuji coba begitu database diinisialisasi.

---

## 3. Komponen Backend PHP

Struktur direktori backend yang dibuat berada di dalam folder `Backend/`:

```
Backend/
├── config/
│   └── database.php       # Koneksi PDO MySQL & penanganan CORS
├── api/
│   ├── laporan.php        # API CRUD utama (GET semua/detail & POST laporan baru)
│   └── update_status.php  # API pembaruan status laporan (POST/PATCH)
├── uploads/
│   └── .gitkeep           # Direktori penyimpanan foto yang diunggah
├── database.sql           # Skrip DDL & DML skema database
├── setup_db.php           # Skrip otomatis satu klik untuk inisialisasi DB
└── README.md              # Dokumentasi teknis backend
```

### Rincian Modul:

1. **`Backend/config/database.php`**
   - Menggunakan ekstensi **PDO (PHP Data Objects)** untuk koneksi database yang aman dan efisien.
   - Mengimplementasikan *Prepared Statements* untuk mencegah kerentanan terhadap serangan *SQL Injection*.
   - Menyediakan header **CORS** (`Access-Control-Allow-Origin: *`) agar frontend dapat berkomunikasi dengan API tanpa hambatan *Cross-Origin*.

2. **`Backend/api/laporan.php`**
   - **Metode `GET`**:
     - Jika menyertakan parameter `?id={id}`, mengembalikan data detail 1 barang.
     - Jika tanpa ID, mengembalikan seluruh daftar laporan terurut dari yang paling baru.
     - Mendukung filter pencarian via query URL: `status`, `jenis`, `lokasi`, `start_date`, `end_date`, dan kata kunci `q`.
   - **Metode `POST`**:
     - Menerima masukan form berformat `multipart/form-data` maupun `application/json`.
     - Melakukan validasi sisi server (keberadaan data wajib, batasan tanggal, dll.).
     - Menangani unggahan file gambar foto barang, memvalidasi tipe file (`JPG`, `PNG`, `WebP`) dan ukuran (maksimal 5 MB), lalu menyimpannya ke folder `Backend/uploads/`.
     - Menyimpan record baru ke tabel `laporan` dan mengembalikan respon JSON berisi ID yang baru dibuat.
   - **Metode `DELETE`**:
     - Menghapus record laporan dari MySQL berdasarkan ID yang dikirim (`Backend/api/laporan.php?id=...`).
     - **Otorisasi**: Memvalidasi identitas pemohon. Penghapusan hanya diizinkan jika pemohon adalah **Admin** (`role = 'admin'`) ATAU **Pemilik yang membuat laporan** (`user_email = pelapor_email`).
     - Pengguna lain yang mencoba menghapus akan mendapatkan respon penolakan `403 Forbidden`.
     - Otomatis menghapus file foto dari disk penyimpanan lokal jika sebelumnya diunggah.

3. **`Backend/api/update_status.php`**
   - Mengubah status barang (`Hilang`, `Ditemukan`, `Diklaim`, `Dikembalikan`) menggunakan metode `POST` atau `PATCH`.

4. **`Backend/setup_db.php`**
   - Alat bantu otomatis untuk membuat database `lostnfound_db`, membuat tabel `laporan`, dan memasukkan data dummy awal hanya dengan menjalankan file ini sekali melalui browser atau CLI.

---

## 4. Integrasi Frontend

File JavaScript frontend telah diperbarui untuk menyambungkan antarmuka pengguna dengan API PHP:

1. **`Frontend/pages/laporan/laporan_pop_up/laporan_pop_up.js`**
   - Mengubah pengiriman formulir laporan barang menjadi request asynchronous menggunakan `fetch()` dengan objek `FormData`.
   - Mengunggah file foto barang secara langsung ke server.
   - Dilengkapi penanganan *fallback* yang anggun (*graceful fallback*): jika server database/PHP belum menyala, sistem akan menyimpan sementara di browser dan memberitahukan pengguna.

2. **`Frontend/pages/laporan/laporan_page/laporan.js`**
   - Mengganti pembacaan array statis dengan fungsi `loadLaporanData()` yang memanggil endpoint `Backend/api/laporan.php`.
   - Menampilkan kartu barang dinamis dari MySQL beserta lencana status (`Hilang`, `Ditemukan`, `Dikembalikan`).
   - Menyertakan helper resolusi URL gambar yang adaptif terhadap aset statis maupun file hasil upload.

3. **`Frontend/pages/laporan/detail_barang/detail_barang.js`**
   - Menambahkan fungsi `fetchItemDetailAsync()` yang memuat detail informasi barang secara dinamis berdasarkan parameter `?id=...` dari database MySQL.
   - Menyesuaikan tampilan tahapan timeline status barang (Hilang -> Ditemukan -> Diklaim -> Dikembalikan).

---

## 5. Hasil Pengujian & Verifikasi

Pengujian telah dilakukan secara langsung di lingkungan lokal:

1. **Koneksi Database**:
   - Skrip `setup_db.php` berhasil dieksekusi melalui PHP 8.1 dan MySQL 8.0 Laragon.
   - Database `lostnfound_db` dan tabel `laporan` berhasil dibuat dengan 6 record data awal.

2. **Pengujian Endpoint API `GET`**:
   - `GET Backend/api/laporan.php` berhasil mengembalikan data JSON seluruh laporan dengan format yang sesuai.
   - `GET Backend/api/laporan.php?id=2` berhasil mengembalikan data spesifik barang ID 2.

3. **Pengujian Endpoint API `POST`**:
   - Pengiriman laporan baru melalui `Backend/api/laporan.php` berhasil melakukan `INSERT` ke database MySQL dan menghasilkan ID baru.
   - Endpoint `Backend/api/update_status.php` berhasil memperbarui status barang di database.

---

## 6. Panduan Menjalankan Sistem

1. **Nyalakan Server**:
   - Buka Laragon atau XAMPP, lalu klik **Start All** (pastikan Apache dan MySQL aktif).
2. **Inisialisasi Database** (hanya perlu sekali):
   - Akses URL berikut di browser:
     ```
     http://localhost/LostNFound/Backend/setup_db.php
     ```
3. **Buka Aplikasi Web**:
   - Halaman Lapor Barang: `http://localhost/LostNFound/Frontend/pages/laporan/laporan_pop_up/laporan_pop_up.html`
   - Halaman Daftar Barang: `http://localhost/LostNFound/Frontend/pages/laporan/laporan_page/laporan.html`
