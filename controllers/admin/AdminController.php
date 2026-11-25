<?php
/**
 * LostNFound - Admin Controller
 *
 * Dashboard admin: moderasi status laporan dan status pengguna.
 * Semua aksi wajib admin dan memakai CSRF.
 */

declare(strict_types=1);

class AdminController extends Controller
{
    private const STATUS_LAPORAN = ['Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan'];
    private const TAB_VALID = ['laporan', 'report', 'pengguna'];

    public function index(): void
    {
        wajibAdmin();

        $tabAktif = trim((string) ($_GET['tab'] ?? 'laporan'));
        if (!in_array($tabAktif, self::TAB_VALID, true)) {
            $tabAktif = 'laporan';
        }

        $statusFilter = trim((string) ($_GET['status'] ?? 'Semua'));
        if ($statusFilter !== 'Semua' && !in_array($statusFilter, self::STATUS_LAPORAN, true)) {
            $statusFilter = 'Semua';
        }

        $startDate = trim((string) ($_GET['start_date'] ?? ''));
        if ($startDate !== '' && !$this->tanggalValid($startDate)) {
            $startDate = '';
        }

        $endDate = trim((string) ($_GET['end_date'] ?? ''));
        if ($endDate !== '' && !$this->tanggalValid($endDate)) {
            $endDate = '';
        }

        $filterError = null;
        if ($startDate !== '' && $endDate !== '' && $startDate > $endDate) {
            $filterError = 'Tanggal "Dari" tidak boleh setelah tanggal "Sampai".';
            $startDate = '';
            $endDate = '';
        }

        $filter = [
            'tipe'       => 'Semua',
            'status'     => $statusFilter,
            'q'          => trim((string) ($_GET['q'] ?? '')),
            'jenis'      => 'Semua',
            'lokasi'     => 'Semua',
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ];

        $daftar = [];
        $users = [];
        $admin = null;
        $stats = [
            'total'        => 0,
            'aktif'        => 0,
            'diklaim'      => 0,
            'dikembalikan' => 0,
        ];
        $errorDb = null;

        try {
            $laporan = new Laporan();
            $daftar = $laporan->semua($filter);

            $stats['total'] = $laporan->hitung([]);
            $stats['aktif'] = $laporan->hitung(['status' => 'Hilang'])
                + $laporan->hitung(['status' => 'Ditemukan']);
            $stats['diklaim'] = $laporan->hitung(['status' => 'Diklaim']);
            $stats['dikembalikan'] = $laporan->hitung(['status' => 'Dikembalikan']);

            $userModel = new User();
            $users = $userModel->semua();
            $admin = $userModel->findById((int) currentUser()['id']);
        } catch (RuntimeException $e) {
            $errorDb = 'Database belum siap. Import database/database.sql terlebih dahulu.';
        }

        if ($admin === null) {
            $admin = currentUser() ?? [];
            $admin['inisial'] = $admin['inisial'] ?? '?';
        }

        $this->view('admin/index', [
            'judul'        => 'Dashboard Admin – LostnFound',
            'halamanAktif' => 'admin',
            'cssDasar'     => [],
            'cssTambahan'  => ['main.css', 'navbar.css', 'profile.css', 'adminpage.css'],
            'layout'       => 'admin',
            'tabAktif'     => $tabAktif,
            'admin'        => $admin,
            'stats'        => $stats,
            'daftar'       => $daftar,
            'users'        => $users,
            'filter'       => $filter,
            'filterError'  => $filterError,
            'sukses'       => getFlash('sukses'),
            'flashError'   => getFlash('error'),
            'errorDb'      => $errorDb,
        ]);
    }

    public function updateStatus(): void
    {
        wajibAdmin();

        if (!isPost()) {
            redirect(url('admin'));
        }

        verifyCsrf();

        $id = (int) ($_POST['id'] ?? 0);
        $status = trim((string) ($_POST['status'] ?? ''));
        $q = trim((string) ($_POST['q'] ?? ''));
        $filterStatus = trim((string) ($_POST['filter_status'] ?? 'Semua'));

        if ($filterStatus !== 'Semua' && !in_array($filterStatus, self::STATUS_LAPORAN, true)) {
            $filterStatus = 'Semua';
        }

        $startDate = trim((string) ($_POST['start_date'] ?? ''));
        if ($startDate !== '' && !$this->tanggalValid($startDate)) {
            $startDate = '';
        }

        $endDate = trim((string) ($_POST['end_date'] ?? ''));
        if ($endDate !== '' && !$this->tanggalValid($endDate)) {
            $endDate = '';
        }

        if ($startDate !== '' && $endDate !== '' && $startDate > $endDate) {
            $startDate = '';
            $endDate = '';
        }

        $kembali = ['tab' => 'laporan'];
        if ($q !== '') {
            $kembali['q'] = $q;
        }
        if ($filterStatus !== 'Semua') {
            $kembali['status'] = $filterStatus;
        }
        if ($startDate !== '') {
            $kembali['start_date'] = $startDate;
        }
        if ($endDate !== '') {
            $kembali['end_date'] = $endDate;
        }

        if ($id <= 0 || !in_array($status, self::STATUS_LAPORAN, true)) {
            setFlash('error', 'ID atau status laporan tidak valid.');
            redirect(url('admin', $kembali));
        }

        try {
            $laporan = new Laporan();
            $item = $laporan->find($id);

            if ($item === null) {
                $this->notFound();
                return;
            }

            $laporan->updateStatus($id, $status);
        } catch (RuntimeException $e) {
            setFlash('error', 'Gagal memperbarui status laporan. Coba lagi.');
            redirect(url('admin', $kembali));
        }

        setFlash('sukses', 'Status laporan berhasil diperbarui menjadi ' . $status . '.');
        redirect(url('admin', $kembali));
    }

    public function toggleUser(): void
    {
        wajibAdmin();

        $kembali = ['tab' => 'pengguna'];

        if (!isPost()) {
            redirect(url('admin', $kembali));
        }

        verifyCsrf();

        $id = (int) ($_POST['id'] ?? 0);
        $aksi = trim((string) ($_POST['aksi_user'] ?? ''));

        if ($id <= 0 || !in_array($aksi, ['aktifkan', 'nonaktifkan'], true)) {
            setFlash('error', 'Permintaan perubahan pengguna tidak valid.');
            redirect(url('admin', $kembali));
        }

        if ($id === (int) currentUser()['id']) {
            setFlash('error', 'Tidak dapat mengubah status akun sendiri.');
            redirect(url('admin', $kembali));
        }

        try {
            $users = new User();
            $user = $users->findById($id);

            if ($user === null) {
                $this->notFound();
                return;
            }

            $statusBaru = $aksi === 'aktifkan' ? 'aktif' : 'nonaktif';
            $users->setStatus($id, $statusBaru);
        } catch (RuntimeException $e) {
            setFlash('error', 'Gagal mengubah status pengguna. Coba lagi.');
            redirect(url('admin', $kembali));
        }

        setFlash('sukses', 'Status pengguna berhasil diubah menjadi ' . $statusBaru . '.');
        redirect(url('admin', $kembali));
    }

    private function tanggalValid(string $nilai): bool
    {
        $tanggal = DateTime::createFromFormat('Y-m-d', $nilai);

        return $tanggal !== false && $tanggal->format('Y-m-d') === $nilai;
    }

    private function notFound(): void
    {
        (new ErrorController())->notFound();
    }
}
