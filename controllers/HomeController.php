<?php
/**
 * LostNFound - Home Controller
 */

declare(strict_types=1);

class HomeController extends Controller
{
    public function index(): void
    {
        $laporanTerbaru = [];
        $errorDb = null;

        try {
            $rows = (new Laporan())->terbaru(6);

            $badge = [
                'Hilang'       => 'hilang',
                'Ditemukan'    => 'ditemukan',
                'Diklaim'      => 'klaim',
                'Dikembalikan' => 'kembali',
            ];

            $laporanTerbaru = array_map(static function (array $row) use ($badge): array {
                return [
                    'id'     => (int) $row['id'],
                    'status' => (string) $row['status'],
                    'badge'  => $badge[(string) $row['status']] ?? 'hilang',
                    'judul'  => (string) $row['nama_barang'],
                    'meta'   => $row['lokasi'] . ' · ' . tanggalIndonesia((string) $row['tanggal']),
                    'foto'   => $row['foto'] ?: 'nowrite.jpg',
                    'url'    => url('laporan', ['aksi' => 'detail', 'id' => (int) $row['id']]),
                ];
            }, $rows);
        } catch (RuntimeException $e) {
            $errorDb = 'Database belum siap. Import database/database.sql terlebih dahulu.';
        }

        $this->view('home/index', [
            'judul'          => 'LostnFound',
            'halamanAktif'   => 'beranda',
            'cssTambahan'    => ['components.css', 'home.css'],
            'laporanTerbaru' => $laporanTerbaru,
            'errorDb'        => $errorDb,
        ]);
    }
}
