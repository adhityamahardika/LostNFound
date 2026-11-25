<?php
/**
 * LostNFound - Controller Laporan (member / publik)
 *
 * Katalog dan detail boleh diakses publik. Membuat dan menghapus laporan
 * wajib login; menghapus hanya boleh oleh pemilik atau admin.
 */

declare(strict_types=1);

class MemberLaporanController extends Controller
{
    public function index(): void
    {
        $filter = $this->filterDariGet();
        $errorFilter = null;

        if (
            $filter['start_date'] !== ''
            && $filter['end_date'] !== ''
            && $filter['start_date'] > $filter['end_date']
        ) {
            $errorFilter = 'Tanggal "Dari" tidak boleh setelah tanggal "Sampai".';
            $filter['start_date'] = '';
            $filter['end_date'] = '';
        }

        $daftar = [];
        $total = 0;
        $errorDb = null;

        try {
            $model = new Laporan();
            $daftar = $model->semua($filter);
            $total = $model->hitung([]);
        } catch (RuntimeException $e) {
            $errorDb = 'Database belum siap. Import database/database.sql terlebih dahulu.';
        }

        $daftar = array_map(function (array $item): array {
            $item['boleh_hapus'] = $this->bolehHapus($item);

            return $item;
        }, $daftar);

        $queryDasar = [];
        foreach (['jenis', 'lokasi', 'start_date', 'end_date', 'q'] as $key) {
            $nilai = $filter[$key] ?? '';
            if ($nilai !== '' && $nilai !== 'Semua') {
                $queryDasar[$key] = $nilai;
            }
        }

        $this->view('member/laporan/index', [
            'judul'        => 'Daftar Laporan - LostnFound',
            'halamanAktif' => 'laporan',
            'cssTambahan'  => ['components.css', 'laporan.css'],
            'layout'       => 'minimal',
            'daftar'       => $daftar,
            'total'        => $total,
            'filter'       => $filter,
            'queryDasar'   => $queryDasar,
            'errorFilter'  => $errorFilter,
            'errorDb'      => $errorDb,
            'sukses'       => getFlash('sukses'),
            'flashError'   => getFlash('error'),
        ]);
    }

    public function detail(): void
    {
        $id = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            $this->notFound();
            return;
        }

        try {
            $item = (new Laporan())->find($id);
        } catch (RuntimeException $e) {
            $item = null;
        }

        if ($item === null) {
            $this->notFound();
            return;
        }

        $statusKey = strtolower((string) $item['status']);
        $timelineAktif = [
            'hilang'       => 1,
            'ditemukan'    => 2,
            'diklaim'      => 3,
            'dikembalikan' => 4,
        ][$statusKey] ?? 1;

        $item['kode']           = kodeLaporan((string) $item['tanggal'], $id);
        $item['tanggal_panjang'] = tanggalIndonesia((string) $item['tanggal'], true);
        $item['status_key']     = $statusKey;
        $item['timeline_aktif'] = $timelineAktif;
        $item['dikembalikan']   = $statusKey === 'dikembalikan';
        $item['boleh_hapus']    = $this->bolehHapus($item);

        $this->view('member/laporan/detail', [
            'judul'        => 'Detail Barang - LostnFound',
            'halamanAktif' => 'laporan',
            'cssTambahan'  => ['components.css', 'detail_barang.css'],
            'layout'       => 'minimal',
            'item'         => $item,
            'sukses'       => getFlash('sukses'),
            'flashError'   => getFlash('error'),
        ]);
    }

    public function baru(): void
    {
        wajibLogin();

        $tipe = strtolower(trim((string) ($_GET['tipe'] ?? '')));
        $tipeAwal = in_array($tipe, ['ditemukan', 'nemu'], true) ? 'Ditemukan' : 'Hilang';

        $this->renderForm($tipeAwal);
    }

    public function simpan(): void
    {
        wajibLogin();

        if (!isPost()) {
            redirect(url('laporan', ['aksi' => 'baru']));
        }

        verifyCsrf();

        $tipe = (($_POST['tipe'] ?? '') === 'Ditemukan') ? 'Ditemukan' : 'Hilang';

        $nama          = trim((string) ($_POST['nama_barang'] ?? ''));
        $jenis         = trim((string) ($_POST['jenis_barang'] ?? ''));
        $tanggal       = trim((string) ($_POST['tanggal'] ?? ''));
        $lokasiPilihan = trim((string) ($_POST['lokasi'] ?? ''));
        $lokasiLain    = trim((string) ($_POST['lokasi_lain'] ?? ''));
        $penitipan     = trim((string) ($_POST['penitipan'] ?? ''));
        $deskripsi     = trim((string) ($_POST['deskripsi'] ?? ''));
        $ciriRahasia   = trim((string) ($_POST['ciri_rahasia'] ?? ''));

        $lokasi = $lokasiPilihan === 'Lainnya' ? $lokasiLain : $lokasiPilihan;

        $old = [
            'tipe'         => $tipe,
            'nama_barang'  => $nama,
            'jenis_barang' => $jenis,
            'tanggal'      => $tanggal,
            'lokasi'       => $lokasiPilihan,
            'lokasi_lain'  => $lokasiLain,
            'penitipan'    => $penitipan,
            'deskripsi'    => $deskripsi,
            'ciri_rahasia' => $ciriRahasia,
        ];

        $error = $this->validasiLaporan(
            $tipe,
            $nama,
            $jenis,
            $tanggal,
            $lokasi,
            $penitipan,
            $deskripsi,
            $ciriRahasia
        );

        if ($error !== null) {
            $this->renderForm($tipe, $old, $error);
            return;
        }

        $upload = simpanFotoLaporan($_FILES['foto'] ?? []);

        if (!$upload['ok']) {
            $this->renderForm($tipe, $old, $upload['error']);
            return;
        }

        try {
            $data = [
                'nama_barang'  => $nama,
                'jenis_barang' => $jenis,
                'tanggal'      => $tanggal,
                'lokasi'       => $lokasi,
                'penitipan'    => $tipe === 'Ditemukan' ? $penitipan : '',
                'deskripsi'    => $deskripsi,
                'ciri_rahasia' => $ciriRahasia,
                'foto'         => $upload['path'] ?? '',
                'pelapor_id'   => (int) currentUser()['id'],
            ];

            $model = $tipe === 'Ditemukan' ? new LaporanTemuan() : new LaporanHilang();
            $id = $model->buat($data);
        } catch (RuntimeException $e) {
            if ($upload['path'] !== null) {
                hapusFotoLaporan($upload['path']);
            }

            $this->renderForm($tipe, $old, 'Gagal menyimpan laporan. Pastikan database sudah siap.');
            return;
        }

        setFlash('sukses', 'Laporan berhasil dikirim.');
        redirect(url('laporan', ['aksi' => 'detail', 'id' => $id]));
    }

    public function hapus(): void
    {
        wajibLogin();

        if (!isPost()) {
            redirect(url('laporan'));
        }

        verifyCsrf();

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            $this->notFound();
            return;
        }

        try {
            $item = (new Laporan())->find($id);
        } catch (RuntimeException $e) {
            $item = null;
        }

        if ($item === null) {
            $this->notFound();
            return;
        }

        if (!$this->bolehHapus($item)) {
            $this->forbidden();
            return;
        }

        try {
            (new Laporan())->hapus($id);
        } catch (RuntimeException $e) {
            setFlash('error', 'Gagal menghapus laporan. Coba lagi.');
            redirect(url('laporan', ['aksi' => 'detail', 'id' => $id]));
        }

        hapusFotoLaporan($item['foto'] ?? null);

        setFlash('sukses', 'Laporan berhasil dihapus.');
        redirect(url('laporan'));
    }

    /**
     * @param array<string, string> $old
     */
    private function renderForm(string $tipe, array $old = [], ?string $error = null): void
    {
        $this->view('member/laporan/form', [
            'judul'    => 'Lapor Barang - LostnFound',
            'layout'   => 'popup',
            'tipeAwal' => $tipe === 'Ditemukan' ? 'Ditemukan' : 'Hilang',
            'old'      => $old,
            'error'    => $error,
        ]);
    }

    /**
     * @param array<string, mixed> $item
     */
    private function bolehHapus(array $item): bool
    {
        $user = currentUser();

        if ($user === null) {
            return false;
        }

        return isAdmin() || ((int) ($item['pelapor_id'] ?? 0) === (int) $user['id']);
    }

    /**
     * @return array<string, string>
     */
    private function filterDariGet(): array
    {
        $status = trim((string) ($_GET['status'] ?? 'Semua'));
        if (!in_array($status, ['Semua', 'Hilang', 'Ditemukan', 'Dikembalikan'], true)) {
            $status = 'Semua';
        }

        $jenis = trim((string) ($_GET['jenis'] ?? 'Semua'));
        if ($jenis === '') {
            $jenis = 'Semua';
        }

        $lokasi = trim((string) ($_GET['lokasi'] ?? 'Semua'));
        if ($lokasi === '') {
            $lokasi = 'Semua';
        }

        $startDate = trim((string) ($_GET['start_date'] ?? ''));
        if ($startDate !== '' && !$this->tanggalValid($startDate)) {
            $startDate = '';
        }

        $endDate = trim((string) ($_GET['end_date'] ?? ''));
        if ($endDate !== '' && !$this->tanggalValid($endDate)) {
            $endDate = '';
        }

        $q = trim((string) ($_GET['q'] ?? ''));

        return [
            'status'     => $status,
            'jenis'      => $jenis,
            'lokasi'     => $lokasi,
            'start_date' => $startDate,
            'end_date'   => $endDate,
            'q'          => $q,
        ];
    }

    private function tanggalValid(string $nilai): bool
    {
        $tanggal = DateTime::createFromFormat('Y-m-d', $nilai);

        return $tanggal !== false && $tanggal->format('Y-m-d') === $nilai;
    }

    private function validasiLaporan(
        string $tipe,
        string $nama,
        string $jenis,
        string $tanggal,
        string $lokasi,
        string $penitipan,
        string $deskripsi,
        string $ciriRahasia
    ): ?string {
        if ($nama === '' || $jenis === '' || $tanggal === '' || $lokasi === '' || $deskripsi === '') {
            return 'Nama barang, jenis, tanggal, lokasi, dan deskripsi wajib diisi.';
        }

        if (strlen($nama) > 80) {
            return 'Nama barang maksimal 80 karakter.';
        }

        if (strlen($jenis) > 50) {
            return 'Jenis barang maksimal 50 karakter.';
        }

        if (!$this->tanggalValid($tanggal)) {
            return 'Format tanggal tidak valid.';
        }

        if ($tanggal > date('Y-m-d')) {
            return 'Tanggal kejadian tidak boleh di masa depan.';
        }

        if (strlen($lokasi) > 150) {
            return 'Lokasi maksimal 150 karakter.';
        }

        if (strlen($deskripsi) > 500) {
            return 'Deskripsi maksimal 500 karakter.';
        }

        if (strlen($penitipan) > 100) {
            return 'Lokasi penitipan maksimal 100 karakter.';
        }

        if (strlen($ciriRahasia) > 300) {
            return 'Ciri rahasia maksimal 300 karakter.';
        }

        if ($tipe === 'Ditemukan' && ($penitipan === '' || $ciriRahasia === '')) {
            return 'Laporan barang temuan wajib mengisi lokasi penitipan dan ciri rahasia.';
        }

        return null;
    }

    private function notFound(): void
    {
        (new ErrorController())->notFound();
    }

    private function forbidden(): void
    {
        (new ErrorController())->forbidden();
    }
}
