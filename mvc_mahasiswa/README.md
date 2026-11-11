# Latihan MVC - Daftar Mahasiswa (PHP Native)

Proyek terpisah untuk latihan pola **Model-View-Controller** sesuai materi
`Frontend/assets/example/Materi_MVC_Ringkasan.txt`. Proyek ini tidak mengubah
kode Backend/Frontend LostnFound yang sudah ada.

## Struktur

```
mvc_mahasiswa/
├── index.php                        # Front controller / router sederhana
├── config/
│   └── database.php                 # Koneksi PDO MySQL ($db)
├── models/
│   └── Mahasiswa.php                # Query data mahasiswa
├── controllers/
│   └── MahasiswaController.php      # Menghubungkan Model dan View
├── views/
│   └── mahasiswa/
│       └── index.php                # Tabel daftar mahasiswa
├── database.sql                     # Skema tabel mahasiswa + data contoh
└── setup_db.php                     # Skrip setup sekali jalan
```

Tabel baru `mahasiswa` ditambahkan ke database `lostnfound_db`; tabel `laporan`
tidak diubah.

## Cara menjalankan

1. Nyalakan Apache dan MySQL (Laragon/XAMPP).
2. Jalankan setup database sekali:
   ```text
   http://localhost/LostNFound/mvc_mahasiswa/setup_db.php
   ```
3. Buka daftar mahasiswa:
   ```text
   http://localhost/LostNFound/mvc_mahasiswa/
   ```
   atau
   ```text
   http://localhost/LostNFound/mvc_mahasiswa/index.php?page=mahasiswa
   ```

## Alur request

`Browser -> index.php (router) -> MahasiswaController -> Mahasiswa (Model) -> MySQL`
lalu data diteruskan ke `views/mahasiswa/index.php` untuk dirender sebagai HTML.

Kredensial database diatur di `config/database.php` (default: `root`, password
kosong, port `3306`).
