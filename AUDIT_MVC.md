# AUDIT STRUKTUR MVC — LostNFound

Tanggal audit: 25 November 2026
Ruang lingkup: seluruh repo (`E:\LostNFound\LostNFound`), branch lokal + remote, riwayat commit.
Mode: **read-only**. Tidak ada file yang diubah/dihapus. Satu-satunya file yang dibuat adalah dokumen ini.

---

## 0. Ringkasan Eksekutif

**Repo ini BELUM memakai MVC.** Tidak ada `index.php` sebagai front controller/router, tidak ada folder `models/`, `views/`, `controllers/`, dan tidak ada autoload/composer maupun mekanisme routing.

Arsitektur yang benar-benar ada saat ini:

```
Frontend (statis)                     Backend (PHP prosedural)
HTML + CSS + JS  ──fetch()──>  api/laporan.php        (GET, POST, DELETE)
                               api/update_status.php  (POST/PATCH/PUT)
                                      │
                               config/database.php    (koneksi PDO + CORS)
                                      │
                                    MySQL (1 tabel: laporan)
```

Jadi yang ada bukan MVC, melainkan **static frontend + 2 endpoint PHP prosedural (API style)**. Pemisahan yang berhasil hanyalah pemisahan *fisik* frontend/backend dan pemisahan koneksi DB ke `config/`. Query SQL, validasi, otorisasi, upload, dan formatting JSON semuanya menumpuk di dalam file endpoint `Backend/api/laporan.php` (457 baris).

Entitas yang sudah "jalan" ke database hanya **laporan** (hilang & temuan, satu tabel, dibedakan kolom `tipe`). **User dan klaim belum ada di backend sama sekali** — keduanya masih demo berbasis `localStorage`.

Temuan paling penting:

1. **Tidak ada jejak pekerjaan MVC** di branch mana pun maupun di riwayat commit.
2. **Tidak ada Export CSV** — pencarian `csv|export|download|Content-Disposition` di seluruh file: 0 hasil.
3. **Tidak ada `wajibLogin` / `wajibAdmin`**. Yang ada hanya guard client-side di `auth.js` yang mudah dilewati.
4. `Frontend/pages/profile/profile.html:489` memanggil `requireRole('user')`, padahal fungsi itu **tidak pernah didefinisikan** di `auth.js` → `ReferenceError` di console dan guard tidak berjalan.
5. Halaman **admin 100% statis**: tabel moderasi, report, dan daftar pengguna di-hardcode di HTML; tombol aksi hanya mengubah DOM (`adminpage.js`), tidak menyentuh database.
6. Alur **klaim tidak menyimpan apa pun ke backend** — hanya `localStorage.setItem("klaim_terbaru", ...)`.
7. `api/update_status.php` **tidak pernah dipanggil** oleh frontend mana pun (grep: hanya muncul di komentar file itu sendiri).

---

## 1. Cek Struktur MVC

### 1.1 Front controller / router

| Yang dicari | Hasil | Bukti |
|---|---|---|
| `index.php` di root | **Tidak ada** | Hanya ada 4 file PHP, semuanya di `Backend/` |
| Router / front controller | **Tidak ada** | Tidak ada `.htaccess`, tidak ada `composer.json`, tidak ada dispatch/route |
| Autoload / namespace | **Tidak ada** | Tidak ada `spl_autoload_register`, tidak ada `namespace` |
| Folder `models/` | **Tidak ada** | — |
| Folder `views/` | **Tidak ada** | — |
| Folder `controllers/` | **Tidak ada** | — |
| Folder `config/` | **Ada (terbatas)** | `Backend/config/database.php` — hanya koneksi PDO + CORS |

Struktur folder aktual (tanpa aset gambar):

```
LostNFound/
├── Backend/
│   ├── api/
│   │   ├── laporan.php          (457 baris — GET/POST/DELETE + validasi + upload + format)
│   │   └── update_status.php    ( 81 baris — update status, tanpa otorisasi)
│   ├── config/
│   │   └── database.php         ( 53 baris — PDO + CORS + credential hardcoded)
│   ├── uploads/                 (foto hasil upload)
│   ├── database.sql             ( 39 baris — 1 tabel: laporan)
│   ├── setup_db.php             ( 59 baris — installer, output text/plain)
│   └── README.md
├── Frontend/
│   ├── index.html               (267 baris — landing page)
│   ├── style.css                (253 baris — duplikat/legacy CSS)
│   ├── core/
│   │   ├── css/  (base, components, main, navbar, status, style, variables)
│   │   └── js/   (auth.js 443 baris, test.js kosong)
│   └── pages/
│       ├── admin_profile/  (adminpage.html/css/js)
│       ├── chat/           (chat.html/css/js — localStorage)
│       ├── klaim/          (klaim.html/css — logika submit inline di HTML)
│       ├── login/          (login.html/css — form statis)
│       ├── profile/        (profile.html/css — laporan hardcoded)
│       └── laporan/
│           ├── laporan_page/     (katalog — fetch API)
│           ├── detail_barang/    (detail + hapus — fetch API)
│           └── laporan_pop_up/   (form lapor — fetch API)
├── README.md
├── repo2md.py
├── SUMMARY_DATABASE.md
└── AUDIT_MVC.md                 (dokumen ini)
```

### 1.2 Branch dan riwayat commit

| Ref | Commit terakhir | Tanggal | Catatan |
|---|---|---|---|
| `main` (aktif, `*`) | `ae05441` Fix loading screen detail barang kalau barang baru | 2026-11-25 | Branch utama, berisi Backend + Frontend |
| `origin/main` | `ae05441` | 2026-11-25 | Sama dengan lokal |
| `laporan` | `1d5562f` Update laporan page dan tambah page detail barang | 2026-10-06 | Branch lama, **belum punya folder Backend** (relatif ke main, semua file Backend terhapus) |
| `origin/laporan` | `1d5562f` | 2026-10-06 | Sama dengan lokal |

Jejak MVC di riwayat:

- `git log --all --regexp-ignore-case --grep='mvc|controller|model|view|router|front controller|oop|refactor'` → **0 commit**.
- `git log --all --diff-filter=A --name-only` → **tidak pernah ada** file `index.php`, `*Controller*`, `*Model*`, folder `models/`, `views/`, `controllers/`, atau `router`.
- Riwayat branch `laporan` hanya berisi penataan folder (`57cbf64 Create folder Frontend`, `8c9dfef Create folder Backend`, `81ebcde Struktur folder`, `cd5091a Struktur Folder pt 2`) dan update halaman laporan. Tidak ada refactor arsitektur.

Kesimpulan: **pekerjaan MVC belum pernah dimulai**, baik di `main` maupun di branch `laporan`.

---

## 2. Penilaian Kelengkapan per Entitas

Legenda status:

- **Selesai** = Model + Controller + View terpisah, view bersih dari SQL/logika data.
- **Sebagian** = sebagian layer sudah ada (mis. data lewat API, tetapi tanpa Model/Controller terpisah), atau hanya view-nya yang ada.
- **Belum** = belum ada layer backend maupun penyimpanan.

| Entitas | Model | Controller | View | Status |
|---|---|---|---|---|
| **Laporan Hilang** | ❌ Belum — SQL langsung di `Backend/api/laporan.php` (baris 24, 87, 204, 327) | ❌ Belum — endpoint prosedural `if ($method === ...)`, tidak ada class/controller | ✅ Ada — `laporan_page/`, `detail_barang/`, `laporan_pop_up/` (tab Hilang) | **Sebagian** |
| **Laporan Temuan** | ❌ Belum — tabel & endpoint sama dengan laporan hilang (kolom `tipe='Ditemukan'`) | ❌ Belum — sama seperti di atas | ✅ Ada — form tab "Nemu" di `laporan_pop_up`, tampil di katalog | **Sebagian** |
| **User** | ❌ Belum — tidak ada tabel `users`, tidak ada `UserModel` | ❌ Belum — login/daftar ditangani `auth.js` di browser, tanpa API | ✅ Ada — `login.html`, `profile.html`, `adminpage.html` (semua statis) | **Belum** |
| **Klaim** | ❌ Belum — tidak ada tabel `klaim` dan tidak ada riwayat klaim | ❌ Belum — submit form hanya `localStorage` (`klaim.html` baris 300–330) | ✅ Ada — `klaim.html` (+ CSS), tetapi JS logika menyatu di dalam HTML | **Belum** |
| **Chat** (komponen tambahan) | ❌ Belum | ❌ Belum | ✅ Ada — `chat.html`, `chat.js` (localStorage, baris 43) | **Belum** |
| **Moderasi/Admin** (komponen tambahan) | ❌ Belum | ❌ Belum | ✅ Ada — `adminpage.html` (318 baris, isi hardcoded) | **Sebagian (view saja)** |

### 2.1 Apakah masih ada query SQL / koneksi DB di view/halaman lama?

**Tidak ada.** Semua HTML/JS frontend bersih dari SQL dan dari `new PDO`/`mysqli`. Semua akses database terpusat di 4 file PHP:

| File | Baris | Peran |
|---|---:|---|
| `Backend/config/database.php` | 53 | Koneksi PDO, CORS, credential hardcoded (`root`, password kosong) |
| `Backend/api/laporan.php` | 457 | GET list/detail, POST create + upload, DELETE + otorisasi, helper format |
| `Backend/api/update_status.php` | 81 | Update status (tidak dipakai frontend) |
| `Backend/setup_db.php` | 59 | Installer DB (menjalankan `database.sql`) |

Catatan: `setup_db.php` bukan "PHP campur HTML" — output-nya `text/plain`, tanpa tag HTML.

### 2.2 Apakah admin dan member sudah dipisah controller dan view?

- **View: ya, terpisah secara file** — `pages/profile/profile.html` (member) vs `pages/admin_profile/adminpage.html` (admin).
- **Controller: tidak ada** untuk keduanya — tidak ada `ProfileController`, `AdminController`, dsb.
- **Backend: tidak ada konsep role** — tidak ada session, tidak ada tabel user, tidak ada middleware.
- Pemisahan hanya dilakukan di JS browser melalui `auth.js`:
  - `setupProfilePage()` (baris 291) mengalihkan admin dari halaman profile.
  - `setupAdminPage()` (baris 305) mengalihkan non-admin dari halaman admin.
  - Keduanya **client-side only** dan bisa dilewati dengan mengubah `localStorage` (`accessRole: 'admin'`).
- `adminpage.html` sama sekali tidak melakukan fetch; datanya hardcoded (6 baris moderasi, 3 kartu report, 3 baris pengguna).

### 2.3 Apakah ada cek role (`wajibLogin` / `wajibAdmin`)?

**Tidak ada fungsi bernama `wajibLogin` atau `wajibAdmin`.** Yang ada hanya padanan parsial dan tidak konsisten:

| Lokasi | Mekanisme | Kekuatan |
|---|---|---|
| `core/js/auth.js:305` `setupAdminPage()` | redirect jika bukan admin | Client-side, bisa dipalsukan |
| `core/js/auth.js:291` `setupProfilePage()` | redirect admin ke halaman admin | Client-side |
| `laporan_pop_up.js:40` `checkAuthUser()` | baca `localStorage`, tolak submit jika kosong | Client-side |
| `detail_barang.js:209` `isLoggedIn()` | cek key localStorage | Client-side |
| `klaim.html:260` | cek `localStorage` lalu redirect ke login | Client-side |
| `profile.html:489` | `requireRole('user')` | **BUG: fungsi tidak terdefinisi** → guard tidak berjalan |
| `api/laporan.php:138` | tolak POST jika `pelapor_email` kosong | Server-side, tetapi `pelapor_email` dikirim client (bisa diisi siapa saja) |
| `api/laporan.php:276-316` | DELETE: `user_email` & `user_role` dari query string | Server-side, tetapi **role berasal dari client** → cukup kirim `?user_role=admin` |
| `api/update_status.php` | tidak ada otorisasi sama sekali | Siapa pun bisa mengubah status |

### 2.4 Apakah Export CSV sudah ada?

**Belum ada sama sekali.**

- Pencarian case-insensitive `csv|export|download|Content-Disposition` di seluruh `*.php`, `*.js`, `*.html`, `*.md`, `*.sql` → **0 hasil**.
- Tidak ada endpoint export, tidak ada tombol export di halaman admin.
- Data memang sudah bisa difilter di API (`status`, `jenis`, `lokasi`, `start_date`, `end_date`, `q`), jadi bahan untuk export CSV sudah tersedia di `laporan.php`, tinggal dibuat endpoint + tombolnya.

### 2.5 Seberapa dalam integrasi backend yang ada?

| Halaman | Terhubung ke API? | Bukti |
|---|---|---|
| `laporan_page/laporan.js` | ✅ GET list + DELETE | `loadLaporanData()` baris 220; `fetch(...laporan.php)` |
| `detail_barang/detail_barang.js` | ✅ GET detail + DELETE | baris 377 (detail), 289 (hapus) |
| `laporan_pop_up/laporan_pop_up.js` | ✅ POST create + upload | baris 211 |
| `klaim/klaim.html` | ⚠️ hanya GET detail; submit **tidak** ke API | baris 201 (GET), 319 (`localStorage.setItem`) |
| `profile/profile.html` | ❌ tidak ada fetch; 3 laporan hardcoded | baris 154–310 |
| `admin_profile/adminpage.js` | ❌ tidak ada fetch; aksi hanya DOM | `setStatus()` baris 49, handler 57–69 |
| `chat/chat.js` | ❌ localStorage | baris 43 |
| `login/login.html` | ❌ login demo di `auth.js` (`admin`/`admin123` hardcoded, baris 25–38) | — |

Dua endpoint backend tidak terpakai / tidak lengkap:

- `update_status.php` — **0 pemanggil** di frontend; status `Diklaim` bahkan tidak pernah di-set oleh alur klaim.
- Export — tidak ada.

---

## 3. File Lama yang Masih "Bandel"

### 3.1 PHP campur HTML + query dalam satu file

**Tidak ditemukan.** Tidak ada halaman `*.php` di root, dan tidak ada file PHP yang mencampur markup HTML dengan query. Kondisi ini justru lebih baik dari dugaan awal.

### 3.2 Analog masalah "bandel" yang nyata di repo ini

Karena tidak ada PHP campur HTML, masalahnya bergeser ke **HTML yang mencampur markup + logika + data dummy**:

| File | Baris | Masalah |
|---|---:|---|
| `Frontend/pages/klaim/klaim.html` | 334 | 1 blok `<script>` inline ±170 baris: `dummyData` 6 item, `formatDate`, `resolveImgUrl`, `fetchItemForClaim`, dan submit klaim ke localStorage. Tidak ada file `klaim.js` terpisah. |
| `Frontend/pages/profile/profile.html` | 491 | 3 kartu "Laporan Saya" hardcoded di HTML (baris 154–310), plus `<script>requireRole('user')</script>` yang error. Tidak ada `profile.js`. |
| `Frontend/pages/admin_profile/adminpage.html` | 318 | 6 baris moderasi, 3 kartu report, 3 baris pengguna — semuanya hardcoded. Tidak ada koneksi DB/API. |
| `Frontend/pages/laporan/detail_barang/detail_barang.js` | 637 | Mencampur: data dummy, fetch API, fallback `localStorage`, render detail, hapus laporan, dialog report. Terlalu banyak tanggung jawab. |
| `Frontend/pages/laporan/laporan_page/laporan.js` | 305 | Fetch API + fallback `dummyData` + merge `localStorage` + modal + hapus. |
| `Frontend/pages/laporan/laporan_pop_up/laporan_pop_up.js` | 298 | Submit ke API **dan** menulis cache `localStorage` (dual write). |
| `Frontend/core/js/auth.js` | 443 | Auth demo + manipulasi navbar + modal laporan + guard halaman, semuanya satu IIFE. |
| `Frontend/index.html` + `Frontend/style.css` | 267 + 253 | CSS legacy di root yang tumpang tindih dengan `core/css/main.css` (510) dan `core/css/style.css` (184). |

**Sumber data ganda (single source of truth belum tercapai):** data laporan bisa berasal dari MySQL, `localStorage` (`dataBarang`), atau `dummyData` yang di-copy-paste di beberapa file (`klaim.html`, `laporan.js`, `detail_barang.js`). Ini menyulitkan migrasi ke MVC karena view masih "tahu" struktur data dan punya data cadangan sendiri.

---

## 4. Temuan Risiko (Read-Only, Belum Diperbaiki)

Ini bukan bagian permintaan eksplisit, tetapi penting untuk urutan pekerjaan MVC.

| # | Risiko | Lokasi | Dampak |
|---|---|---|---|
| R1 | Otorisasi DELETE memakai `user_role` dari query string | `api/laporan.php:276-316` | Siapa pun bisa menghapus laporan dengan `?user_role=admin` |
| R2 | Identitas pelapor dipercaya dari client | `api/laporan.php:134-145` | Laporan bisa dibuat atas nama email orang lain |
| R3 | `update_status.php` tanpa cek role/sesi | `api/update_status.php` | Status barang bisa diubah siapa pun |
| R4 | Auth demo & password admin hardcoded | `core/js/auth.js:25-38` | Tidak ada keamanan nyata; role dapat dipalsukan via localStorage |
| R5 | Guard `requireRole` tidak terdefinisi | `profile.html:489` | ReferenceError; halaman profile tetap terbuka |
| R6 | CORS `Access-Control-Allow-Origin: *` | `config/database.php:8` | API terbuka untuk semua origin |
| R7 | Pesan error PDO ditampilkan ke client | `api/laporan.php:244, 339`; `database.php:46` | Kebocoran informasi database |
| R8 | Ekstensi file upload mengikuti nama file client | `api/laporan.php:411-416` | Jika divalidasi hanya MIME, file dengan ekstensi berbahaya berpotensi tersimpan di `uploads/` |
| R9 | Kredensial DB hardcoded | `config/database.php:18-22` | Tidak aman untuk produksi |
| R10 | Tidak ada CSRF/session | seluruh backend | Tidak ada proteksi aksi state-changing |

---

## 5. Sisa Pekerjaan (Checklist)

### Fondasi arsitektur
- [ ] Buat `index.php` sebagai front controller + router sederhana (atau `.htaccess` rewrite).
- [ ] Buat `controllers/`, `models/`, `views/`, `core/` (base Controller/Model/Response), `config/`.
- [ ] Tambahkan autoload sederhana (`spl_autoload_register`) dan konfigurasi environment (`.env`/config terpisah).
- [ ] Standarkan response JSON & error handling di satu tempat.

### Laporan (hilang & temuan)
- [ ] Pindahkan seluruh query dari `api/laporan.php` ke `models/Laporan.php` (atau `LaporanModel`).
- [ ] Pindahkan validasi + upload + otorisasi ke `controllers/LaporanController.php`.
- [ ] Buat `views/` untuk halaman laporan (atau pertahankan frontend statis sebagai view, tetapi tanpa query/validasi).
- [ ] Hapus `dummyData` dan fallback `localStorage` dari view; jadikan DB satu-satunya sumber data.
- [ ] Tambahkan pagination (belum ada; list selalu mengambil semua baris).

### User & Auth
- [ ] Buat tabel `users` (id, nama, nim, email, password_hash, role, status, timestamps).
- [ ] Buat `UserModel`, `AuthController` (register, login, logout, session).
- [ ] Ganti auth demo `localStorage` dengan session server-side + `password_hash`/`password_verify`.
- [ ] Implementasikan `wajibLogin()` dan `wajibAdmin()` yang benar-benar dipanggil di controller.
- [ ] Perbaiki `requireRole('user')` yang tidak terdefinisi (atau hapus dan ganti guard yang benar).

### Klaim
- [ ] Buat tabel `klaim` (id, laporan_id, user_id, ciri_rahasia, bukti, catatan, status, timestamps).
- [ ] Buat `KlaimModel` + `KlaimController` (create, list by user, approve/reject).
- [ ] Pindahkan logika dari inline `<script>` `klaim.html` ke `klaim.js` yang memanggil API.
- [ ] Hubungkan approve klaim → update status laporan menjadi `Diklaim`/`Dikembalikan` lewat controller.
- [ ] Gunakan `update_status.php` (atau gantinya) dari UI, dengan otorisasi admin.

### Admin & Moderasi
- [ ] Buat `AdminController` + view admin yang mengambil data dari DB (bukan hardcoded).
- [ ] Pindahkan aksi Setujui/Tolak/Tarik/Hapus/Report agar benar-benar mengubah database.
- [ ] Tambahkan daftar pengguna dari tabel `users`, bukan baris statis.
- [ ] Tambahkan guard admin server-side di semua endpoint admin.

### Export CSV
- [ ] Buat endpoint `GET /laporan/export` (atau `api/export_csv.php` sementara) yang mengikuti filter yang sama dengan list.
- [ ] Set header `Content-Type: text/csv` + `Content-Disposition: attachment`.
- [ ] Tambahkan tombol "Export CSV" di halaman admin, membawa filter aktif.
- [ ] Pastikan escape delimiter/koma dan encoding UTF-8 (BOM agar Excel rapi).

### Pembersihan & keamanan
- [ ] Hapus `Frontend/style.css` legacy dan duplikasi CSS lain setelah dicek pemakaiannya.
- [ ] Hapus `core/js/test.js` dan `core/css/test.css` (file kosong/legacy).
- [ ] Hapus/tutup fallback `localStorage` setelah backend stabil (atau jadikan mode offline eksplisit).
- [ ] Tutup R1–R10: otorisasi berbasis session, CORS whitelist, validasi ekstensi upload, jangan tampilkan error PDO, pindahkan credential ke config non-commit.

---

## 6. Rekomendasi Urutan Pengerjaan

Prinsip: **jangan memindahkan view dulu sebelum ada Model + Controller**, dan jangan mengerjakan export/CSV sebelum sumber data tunggal (DB) beres. Urutan ini dibuat agar setiap tahap bisa dites tanpa merusak frontend yang sudah jalan.

| Tahap | Fokus | Deliverable | Alasan urutan |
|---|---|---|---|
| **0. Bekukan baseline** | Catat kondisi sekarang, buat branch kerja | `AUDIT_MVC.md`, daftar endpoint & halaman | Sudah dilakukan (dokumen ini); branch kerja dibuat saat mulai, bukan sekarang |
| **1. Fondasi MVC** | `index.php`, router, `controllers/`, `models/`, `views/`, autoload, base class, config | 1 halaman laporan bisa diakses via router | Semua tahap lain bergantung pada ini |
| **2. Auth & User** | Tabel `users`, `UserModel`, `AuthController`, session, `wajibLogin`, `wajibAdmin` | Login/daftar/logout nyata; halaman admin terlindungi server-side | Laporan & klaim butuh identitas user yang tepercaya |
| **3. Laporan** | `LaporanModel` + `LaporanController`; pindahkan SQL, validasi, upload, format | CRUD laporan via controller; view tanpa SQL/dummy | Entitas paling matang, paling kecil risikonya |
| **4. Klaim** | Tabel `klaim`, `KlaimModel`, `KlaimController`, `klaim.js` | Klaim tersimpan di DB; riwayat klaim per user | Bergantung pada user (tahap 2) dan laporan (tahap 3) |
| **5. Admin & Moderasi** | `AdminController`, view admin dinamis, aksi persisten, update status | Dashboard admin nyata; status `Diklaim`/`Dikembalikan` berfungsi | Butuh auth admin + data klaim |
| **6. Export CSV** | Endpoint export + tombol admin + filter | CSV sesuai filter aktif | Butuh query laporan yang sudah rapi di Model |
| **7. Pembersihan** | Hapus dummy/fallback/legacy CSS, duplikasi JS | Satu sumber data, file view ramping | Dilakukan setelah semua jalur DB stabil |
| **8. Hardening** | CSRF, CORS whitelist, upload validation, error handling, credential | Daftar R1–R10 tertutup | Tidak mengubah arsitektur, hanya memperkuat |

Estimasi kasar (bukan komitmen): tahap 1–3 adalah inti MVC; tahap 4–5 menyelesaikan entitas yang sekarang masih demo; tahap 6–8 adalah penyelesaian dan pengerasan.

---

## 7. Bukti Audit (Perintah Read-Only yang Dijalankan)

```text
git branch -a
git log --oneline --all -30
git log --oneline origin/laporan -20
git log --all --regexp-ignore-case --grep='mvc|controller|model|view|router|front controller|oop|refactor'
git log --all --diff-filter=A --name-only      # daftar file yang pernah ditambahkan
git log --all --diff-filter=D --name-only      # daftar file yang pernah dihapus
git diff --stat main origin/laporan
git ls-files
grep -i 'csv|export|download|Content-Disposition'   (seluruh file)
grep 'wajibLogin|wajibAdmin|requireRole|requireAdmin|checkAuthUser'
grep 'update_status'
grep 'CREATE TABLE|INSERT INTO|FROM `laporan`'
```

Tidak ada perintah yang mengubah working tree, index, branch, atau remote. `git status --short` sebelum audit: bersih.

---

## 8. Asumsi & Hal yang Perlu Dikonfirmasi

Audit ini menilai repo **apa adanya** (static frontend + PHP API) terhadap target "struktur MVC". Beberapa hal sebaiknya dikonfirmasi sebelum implementasi:

1. **Target MVC-nya seperti apa?** MVC PHP penuh dengan `index.php` + server-rendered views, atau tetap mempertahankan frontend statis dan hanya merapikan backend menjadi Model/Controller (API) + frontend sebagai View?
2. **Apakah User dan Klaim memang masuk scope MVC**, atau untuk saat ini cukup Laporan? Keduanya belum punya tabel, jadi pekerjaannya lebih besar daripada memindahkan kode.
3. **Export CSV** cukup untuk tabel `laporan`, atau juga perlu klaim/pengguna? Dan apakah harus mengikuti filter yang sedang aktif di halaman admin?
4. **Auth**: apakah boleh mengganti auth demo `localStorage` dengan session PHP + tabel `users` (ini mengubah perilaku login), atau harus tetap demo untuk kebutuhan presentasi?

Jawaban atas poin-poin ini menentukan apakah tahap 1–2 langsung dikerjakan atau audit ini cukup menjadi peta jalan.
