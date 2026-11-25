<?php
/**
 * LostNFound - Admin Laporan Controller
 *
 * Endpoint export CSV untuk laporan.
 */

declare(strict_types=1);

class AdminLaporanController extends Controller
{
    private const STATUS_LAPORAN = ['Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan'];

    public function index(): void
    {
        wajibAdmin();
        redirect(url('admin'));
    }

    public function export(): void
    {
        wajibAdmin();

        $jenis = strtolower(trim((string) ($_GET['jenis'] ?? 'semua')));
        $tipe = match ($jenis) {
            'hilang' => 'Hilang',
            'temuan' => 'Ditemukan',
            default  => 'Semua',
        };

        $status = trim((string) ($_GET['status'] ?? 'Semua'));
        if ($status !== 'Semua' && !in_array($status, self::STATUS_LAPORAN, true)) {
            $status = 'Semua';
        }

        $startDate = trim((string) ($_GET['start_date'] ?? ''));
        if ($startDate !== '' && !$this->tanggalValid($startDate)) {
            $startDate = '';
        }

        $endDate = trim((string) ($_GET['end_date'] ?? ''));
        if ($endDate !== '' && !$this->tanggalValid($endDate)) {
            $endDate = '';
        }

        if ($startDate !== '' && $endDate !== '' && $startDate > $endDate) {
            $startDate = '';
            $endDate = '';
        }

        $filter = [
            'tipe'       => $tipe,
            'status'     => $status,
            'q'          => trim((string) ($_GET['q'] ?? '')),
            'jenis'      => 'Semua',
            'lokasi'     => 'Semua',
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ];

        try {
            $rows = (new Laporan())->semua($filter);
        } catch (RuntimeException $e) {
            http_response_code(500);
            header('Content-Type: text/plain; charset=utf-8');
            echo 'Gagal mengekspor laporan: database belum siap.';
            exit;
        }

        $header = [
            'Kode Laporan',
            'Jenis',
            'Nama Barang',
            'Lokasi',
            'Tanggal',
            'Status',
            'Nama Pelapor',
        ];

        $baris = array_map(static function (array $row): array {
            return [
                kodeLaporan((string) $row['tanggal'], (int) $row['id']),
                $row['tipe'] === 'Ditemukan' ? 'Temuan' : 'Hilang',
                $row['nama_barang'],
                $row['lokasi'],
                (string) $row['tanggal'],
                $row['status'],
                $row['pelapor_nama'] ?? 'Anonim',
            ];
        }, $rows);

        kirimCsv('laporan-' . date('Ymd-His') . '.csv', $header, $baris);
    }

    private function tanggalValid(string $nilai): bool
    {
        $tanggal = DateTime::createFromFormat('Y-m-d', $nilai);

        return $tanggal !== false && $tanggal->format('Y-m-d') === $nilai;
    }
}
