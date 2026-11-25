<?php
/**
 * LostNFound - Auth Controller
 *
 * Menangani halaman masuk, daftar akun, proses autentikasi, dan keluar.
 */

declare(strict_types=1);

class AuthController extends Controller
{
    private ?User $users = null;

    private function users(): User
    {
        return $this->users ??= new User();
    }

    public function login(): void
    {
        if (sudahLogin()) {
            redirect(url('home'));
        }

        $sukses = getFlash('sukses');

        if (isset($_GET['keluar'])) {
            $sukses = 'Anda telah keluar dari akun.';
        }

        $this->renderAuth('masuk', ['sukses' => $sukses]);
    }

    public function prosesLogin(): void
    {
        if (sudahLogin()) {
            redirect(url('home'));
        }

        if (!isPost()) {
            redirect(url('auth/login'));
        }

        verifyCsrf();

        $identifier = trim((string) ($_POST['identifier'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        if ($identifier === '' || $password === '') {
            $this->renderAuth('masuk', [
                'error' => 'NIM/email dan kata sandi wajib diisi.',
                'old'   => ['identifier' => $identifier],
            ]);
            return;
        }

        try {
            $user = $this->users()->findByIdentifier($identifier);
        } catch (RuntimeException $e) {
            $this->renderAuth('masuk', [
                'error' => 'Layanan database belum siap. Import database/database.sql terlebih dahulu.',
                'old'   => ['identifier' => $identifier],
            ]);
            return;
        }

        if ($user === null || !password_verify($password, (string) $user['password_hash'])) {
            $this->renderAuth('masuk', [
                'error' => 'NIM/email atau kata sandi salah.',
                'old'   => ['identifier' => $identifier],
            ]);
            return;
        }

        if (($user['status'] ?? '') !== 'aktif') {
            $this->renderAuth('masuk', [
                'error' => 'Akun ini sedang nonaktif. Hubungi administrator.',
                'old'   => ['identifier' => $identifier],
            ]);
            return;
        }

        loginUser($user);

        $tujuan = $_SESSION['redirect_after_login'] ?? null;
        unset($_SESSION['redirect_after_login']);

        // Hanya izinkan path internal (bukan URL eksternal / protocol-relative).
        if (is_string($tujuan) && preg_match('#^/(?!/)#', $tujuan) === 1) {
            redirect($tujuan);
        }

        redirect(url('home'));
    }

    public function register(): void
    {
        if (sudahLogin()) {
            redirect(url('home'));
        }

        $this->renderAuth('daftar');
    }

    public function prosesRegister(): void
    {
        if (sudahLogin()) {
            redirect(url('home'));
        }

        if (!isPost()) {
            redirect(url('auth/register'));
        }

        verifyCsrf();

        $nama = trim((string) ($_POST['nama'] ?? ''));
        $nim = trim((string) ($_POST['nim'] ?? ''));
        $email = strtolower(trim((string) ($_POST['email'] ?? '')));
        $password = (string) ($_POST['password'] ?? '');
        $phone = trim((string) ($_POST['phone'] ?? ''));
        $setuju = isset($_POST['setuju']);

        $old = [
            'nama'  => $nama,
            'nim'   => $nim,
            'email' => $email,
            'phone' => $phone,
        ];

        $error = $this->validasiPendaftaran($nama, $nim, $email, $password, $phone, $setuju);

        if ($error !== null) {
            $this->renderAuth('daftar', ['error' => $error, 'old' => $old]);
            return;
        }

        try {
            if ($this->users()->usernameExists($nim)) {
                $this->renderAuth('daftar', [
                    'error' => 'NIM/NIP tersebut sudah terdaftar.',
                    'old'   => $old,
                ]);
                return;
            }

            if ($this->users()->emailExists($email)) {
                $this->renderAuth('daftar', [
                    'error' => 'Email tersebut sudah terdaftar.',
                    'old'   => $old,
                ]);
                return;
            }

            $this->users()->create([
                'username'      => $nim,
                'nama'          => $nama,
                'nim'           => $nim,
                'email'         => $email,
                'phone'         => $phone,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $e) {
            $this->renderAuth('daftar', [
                'error' => $e->getCode() === '23000'
                    ? 'NIM/NIP atau email tersebut sudah terdaftar.'
                    : 'Layanan database belum siap. Import database/database.sql terlebih dahulu.',
                'old'   => $old,
            ]);
            return;
        } catch (RuntimeException $e) {
            $this->renderAuth('daftar', [
                'error' => 'Layanan database belum siap. Import database/database.sql terlebih dahulu.',
                'old'   => $old,
            ]);
            return;
        }

        setFlash('sukses', 'Akun berhasil dibuat. Silakan masuk dengan NIM atau email kamu.');
        redirect(url('auth/login'));
    }

    public function logout(): void
    {
        if (!isPost()) {
            redirect(url('home'));
        }

        verifyCsrf();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();

            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'domain'   => $params['domain'],
                'secure'   => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }

        session_destroy();

        redirect(url('auth/login', ['keluar' => 1]));
    }

    /**
     * @param array<string, string> $old
     */
    private function renderAuth(string $tab, array $data = []): void
    {
        $defaults = [
            'judul'        => $tab === 'daftar'
                ? 'Daftar Akun – LostnFound'
                : 'Masuk & Daftar – LostnFound',
            'halamanAktif' => '',
            'cssTambahan'  => ['main.css', 'login.css'],
            'layout'       => 'auth',
            'tabAktif'     => $tab,
            'error'        => null,
            'sukses'       => null,
            'old'          => [],
        ];

        $this->view('auth/login', array_merge($defaults, $data));
    }

    private function validasiPendaftaran(
        string $nama,
        string $nim,
        string $email,
        string $password,
        string $phone,
        bool $setuju
    ): ?string {
        if ($nama === '' || $nim === '' || $email === '' || $password === '' || $phone === '') {
            return 'Semua kolom wajib diisi.';
        }

        if (strlen($nama) > 100) {
            return 'Nama lengkap maksimal 100 karakter.';
        }

        if (strlen($nim) > 30) {
            return 'NIM/NIP maksimal 30 karakter.';
        }

        if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'Format email tidak valid.';
        }

        if (strlen($phone) > 30) {
            return 'Nomor telepon maksimal 30 karakter.';
        }

        if (strlen($password) < 8) {
            return 'Kata sandi minimal 8 karakter.';
        }

        if (strlen($password) > 72) {
            return 'Kata sandi maksimal 72 karakter.';
        }

        if (!$setuju) {
            return 'Kamu harus menyetujui pernyataan etika pelaporan.';
        }

        return null;
    }
}
