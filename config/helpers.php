<?php
/**
 * LostNFound - Helper Functions
 *
 * Fungsi bantu yang dipakai lintas controller dan view.
 */

declare(strict_types=1);

/**
 * Escape output agar aman ditampilkan di HTML.
 */
function esc(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Membuat URL internal aplikasi.
 *
 * Contoh:
 *   url()                                  -> index.php
 *   url('home')                            -> index.php
 *   url('admin/laporan', ['aksi' => 'export'])
 *                                          -> index.php?page=admin%2Flaporan&aksi=export
 */
function url(string $page = 'home', array $params = []): string
{
    if ($page === 'home' && $params === []) {
        return 'index.php';
    }

    return 'index.php?' . http_build_query(array_merge(['page' => $page], $params));
}

/**
 * URL aset di folder assets/.
 */
function asset(string $path): string
{
    return 'assets/' . ltrim($path, '/');
}

/**
 * Redirect lalu hentikan eksekusi.
 */
function redirect(string $location): never
{
    header('Location: ' . $location);
    exit;
}

/**
 * Apakah request saat ini menggunakan metode POST.
 */
function isPost(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

/**
 * Pengguna yang sedang login, atau null.
 *
 * @return array{id:int, username:string, nama:string, email:string, role:string, inisial:string}|null
 */
function currentUser(): ?array
{
    return isset($_SESSION['user']) && is_array($_SESSION['user'])
        ? $_SESSION['user']
        : null;
}

function sudahLogin(): bool
{
    return currentUser() !== null;
}

function isAdmin(): bool
{
    return (currentUser()['role'] ?? '') === 'admin';
}

/**
 * Simpan data pengguna ke session setelah kredensial valid.
 */
function loginUser(array $user): void
{
    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id'       => (int) $user['id'],
        'username' => (string) $user['username'],
        'nama'     => (string) $user['nama'],
        'email'    => (string) $user['email'],
        'role'     => (string) $user['role'],
        'inisial'  => inisial($user['nama']),
    ];
}

/**
 * Inisial nama untuk avatar navbar (maksimal 2 huruf).
 */
function inisial(string $nama): string
{
    $bagian = preg_split('/\s+/', trim($nama)) ?: [];
    $hasil = '';

    foreach ($bagian as $kata) {
        if ($kata === '') {
            continue;
        }
        $hasil .= strtoupper(substr($kata, 0, 1));
        if (strlen($hasil) >= 2) {
            break;
        }
    }

    return $hasil !== '' ? $hasil : '?';
}

/**
 * Wajib login. Jika belum, simpan tujuan lalu redirect ke halaman masuk.
 */
function wajibLogin(): void
{
    if (sudahLogin()) {
        return;
    }

    $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'] ?? url('home');
    redirect(url('auth/login'));
}

/**
 * Wajib login sebagai admin. Member yang mencoba akses ditolak 403.
 */
function wajibAdmin(): void
{
    wajibLogin();

    if (!isAdmin()) {
        http_response_code(403);
        (new ErrorController())->forbidden();
        exit;
    }
}

/**
 * Flash message satu kali pakai.
 */
function setFlash(string $key, string $message): void
{
    $_SESSION['flash'][$key] = $message;
}

function getFlash(string $key): ?string
{
    $message = $_SESSION['flash'][$key] ?? null;
    unset($_SESSION['flash'][$key]);

    return is_string($message) ? $message : null;
}

/**
 * Format tanggal menjadi "5 Oktober 2026" (opsional dengan nama hari).
 */
function tanggalIndonesia(?string $tanggal, bool $denganHari = false): string
{
    if ($tanggal === null || $tanggal === '') {
        return '-';
    }

    $ts = strtotime($tanggal);
    if ($ts === false) {
        return '-';
    }

    $bulan = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];
    $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    $hasil = (int) date('j', $ts) . ' ' . $bulan[(int) date('n', $ts)] . ' ' . date('Y', $ts);

    if ($denganHari) {
        $hasil = $hari[(int) date('w', $ts)] . ', ' . $hasil;
    }

    return $hasil;
}

/**
 * Format tanggal singkat menjadi "5 Okt 2026".
 */
function tanggalSingkatIndonesia(?string $tanggal): string
{
    if ($tanggal === null || $tanggal === '') {
        return '-';
    }

    $ts = strtotime($tanggal);
    if ($ts === false) {
        return '-';
    }

    $bulan = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
        5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
        9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    return (int) date('j', $ts) . ' ' . $bulan[(int) date('n', $ts)] . ' ' . date('Y', $ts);
}

/**
 * Kode laporan: LF-YYYYMMDD-001
 */
function kodeLaporan(string $tanggal, int $id): string
{
    $ts = strtotime($tanggal);
    $kodeTanggal = $ts !== false ? date('Ymd', $ts) : '00000000';

    return 'LF-' . $kodeTanggal . '-' . str_pad((string) $id, 3, '0', STR_PAD_LEFT);
}

/**
 * Simpan foto laporan ke assets/uploads.
 *
 * @param array<string, mixed> $file Elemen dari $_FILES.
 * @return array{ok:bool, path:?string, error:?string}
 */
function simpanFotoLaporan(array $file): array
{
    if (!isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return ['ok' => true, 'path' => null, 'error' => null];
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'path' => null, 'error' => 'Foto gagal diunggah. Coba pilih file lain.'];
    }

    if (($file['size'] ?? 0) > 2 * 1024 * 1024) {
        return ['ok' => false, 'path' => null, 'error' => 'Ukuran foto maksimal 2 MB.'];
    }

    $info = @getimagesize((string) ($file['tmp_name'] ?? ''));
    $mime = $info['mime'] ?? '';
    $ekstensi = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
    ];

    if (!isset($ekstensi[$mime])) {
        return ['ok' => false, 'path' => null, 'error' => 'Format foto harus PNG atau JPG.'];
    }

    $folder = dirname(__DIR__) . '/assets/uploads';

    if (!is_dir($folder) && !mkdir($folder, 0775, true) && !is_dir($folder)) {
        return ['ok' => false, 'path' => null, 'error' => 'Folder upload tidak dapat dibuat.'];
    }

    $namaFile = 'item_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ekstensi[$mime];
    $tujuan = $folder . '/' . $namaFile;

    if (!move_uploaded_file((string) $file['tmp_name'], $tujuan)) {
        return ['ok' => false, 'path' => null, 'error' => 'Foto gagal disimpan ke server.'];
    }

    return ['ok' => true, 'path' => 'uploads/' . $namaFile, 'error' => null];
}

/**
 * Hapus foto hasil upload (hanya file di assets/uploads).
 */
function hapusFotoLaporan(?string $path): void
{
    if ($path === null || !str_starts_with($path, 'uploads/')) {
        return;
    }

    $file = dirname(__DIR__) . '/assets/uploads/' . basename($path);

    if (is_file($file)) {
        @unlink($file);
    }
}

/**
 * Token CSRF per session.
 */
function csrfToken(): string
{
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function csrfField(): string
{
    return '<input type="hidden" name="_csrf" value="' . esc(csrfToken()) . '">';
}

/**
 * Validasi token CSRF untuk request POST.
 */
function verifyCsrf(): void
{
    $token = (string) ($_POST['_csrf'] ?? '');

    if ($token === '' || !hash_equals(csrfToken(), $token)) {
        http_response_code(403);
        exit('Sesi formulir tidak valid. Muat ulang halaman lalu coba lagi.');
    }
}
