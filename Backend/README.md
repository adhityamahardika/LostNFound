# Backend LostnFound (PHP & MySQL)

Modul backend ini menangani penyimpanan data pelaporan barang hilang dan temuan serta status penanganannya menggunakan **PHP** dan **MySQL**.

---

## 1. Struktur Database

- **Nama Database**: `lostnfound_db`
- **Tabel**: `laporan`

### Kolom Tabel `laporan`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID unik laporan |
| `tipe` | `ENUM('Hilang', 'Ditemukan')` | Jenis pelaporan barang |
| `nama_barang` | `VARCHAR(100)` | Nama barang |
| `jenis_barang` | `VARCHAR(50)` | Kategori (Elektronik, Tas, Dokumen, dll.) |
| `tanggal` | `DATE` | Tanggal kejadian kehilangan/penemuan |
| `lokasi` | `VARCHAR(150)` | Lokasi kejadian di kampus |
| `penitipan` | `VARCHAR(100) NULL` | Tempat barang dititipkan (khusus barang temuan) |
| `deskripsi` | `TEXT` | Deskripsi fisik & kondisi umum barang |
| `ciri_rahasia` | `TEXT NULL` | Ciri khusus untuk verifikasi pemilik (klaim) |
| `foto` | `VARCHAR(255) NULL` | Path file foto barang |
| `status` | `ENUM('Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan')` | Status pelaporan saat ini |
| `created_at` | `TIMESTAMP` | Waktu data dibuat otomatis |
| `updated_at` | `TIMESTAMP` | Waktu data terakhir diperbarui |

---

## 2. Cara Menjalankan & Setup Database

### Opsi A: Menggunakan Script Otomatis `setup_db.php`
1. Pastikan MySQL sudah menyala (melalui Laragon / XAMPP).
2. Jalankan script setup:
   - **Lewat browser**: Buka `http://localhost/LostNFound/Backend/setup_db.php`
   - **Lewat terminal / CLI**:
     ```bash
     php Backend/setup_db.php
     ```
3. Database `lostnfound_db`, tabel `laporan`, dan 6 data dummy awal akan otomatis dibuat.

### Opsi B: Import Manual via phpMyAdmin
1. Buka phpMyAdmin di browser (`http://localhost/phpmyadmin`).
2. Buat database baru bernama `lostnfound_db`.
3. Klik tab **Import**, pilih file `Backend/database.sql`, lalu klik **Go / Kirim**.

---

## 3. Konfigurasi Koneksi (`config/database.php`)

Kredensial database diatur di `Backend/config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'lostnfound_db');
define('DB_USER', 'root');
define('DB_PASS', ''); // Sesuaikan jika MySQL Anda memiliki password
```

---

## 4. Dokumentasi API Endpoints

Semua endpoint mengembalikan respon berformat **JSON**.

### A. Mendapatkan Daftar Laporan
- **URL**: `Backend/api/laporan.php`
- **Metode**: `GET`
- **Parameter Query (Opsional)**:
  - `status`: Filter status (`Hilang`, `Ditemukan`, `Dikembalikan`, atau `Semua`)
  - `jenis`: Filter jenis/kategori barang
  - `lokasi`: Filter berdasarkan nama lokasi
  - `start_date`: Filter tanggal mulai (`YYYY-MM-DD`)
  - `end_date`: Filter tanggal akhir (`YYYY-MM-DD`)
  - `q`: Pencarian kata kunci nama/deskripsi barang

### B. Mendapatkan Detail Satu Laporan
- **URL**: `Backend/api/laporan.php?id={id_barang}`
- **Metode**: `GET`
- **Contoh Respon**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "tipe": "Hilang",
      "nama_barang": "Dompet kulit",
      "jenis_barang": "Aksesoris",
      "tanggal": "2026-09-27",
      "lokasi": "Kantin Utama",
      "deskripsi": "Dompet kulit cokelat dengan kancing.",
      "foto": "assets/items/dompet.jpg",
      "status": "Hilang"
    }
  }
  ```

### C. Menambah Laporan Baru (dari Form Pengguna)
- **URL**: `Backend/api/laporan.php`
- **Metode**: `POST`
- **Format**: `multipart/form-data` (mendukung upload gambar langsung) atau `application/json`
- **Field**:
  - `tipe`: `"Hilang"` atau `"Ditemukan"` (wajib)
  - `nama_barang`: Nama barang (wajib)
  - `jenis_barang`: Kategori barang (wajib)
  - `tanggal`: Format `YYYY-MM-DD` (wajib)
  - `lokasi`: Lokasi kejadian (wajib)
  - `deskripsi`: Deskripsi barang (wajib)
  - `penitipan`: Lokasi titip (wajib jika tipe = Ditemukan)
  - `ciri_rahasia`: Ciri rahasia verifikasi (wajib jika tipe = Ditemukan)
  - `foto`: File gambar (JPG/PNG/WebP, maks. 5 MB)

### D. Menghapus Laporan
- **URL**: `Backend/api/laporan.php?id={id_barang}&user_email={email}&user_role={role}`
- **Metode**: `DELETE`
- **Aturan Otorisasi**:
  - Hanya dapat dihapus oleh **Admin** (`user_role = 'admin'`) ATAU **Pemilik yang membuat laporan** (`user_email = pelapor_email`).
  - Pengguna lain atau pengguna anonim yang mencoba menghapus akan ditolak (`403 Forbidden` / `401 Unauthorized`).
- **Contoh Respon Berhasil**:
  ```json
  {
    "success": true,
    "message": "Laporan berhasil dihapus dari database.",
    "id": 1
  }
  ```
- **Contoh Respon Ditolak**:
  ```json
  {
    "success": false,
    "message": "Akses ditolak: Hanya Admin atau pembuat laporan yang berhak menghapus laporan ini."
  }
  ```

### E. Mengubah Status Laporan
- **URL**: `Backend/api/update_status.php`
- **Metode**: `POST` / `PATCH`
- **Body**:
  ```json
  {
    "id": 1,
    "status": "Dikembalikan"
  }
  ```
