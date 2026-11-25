<?php
/**
 * LostNFound - Model Laporan (dasar untuk Hilang & Temuan)
 */

declare(strict_types=1);

class Laporan extends Model
{
    /**
     * Ambil semua laporan (semua tipe) dengan filter opsional.
     *
     * Filter: status, jenis, lokasi, start_date, end_date, q.
     *
     * @param array<string, string> $filter
     * @return array<int, array<string, mixed>>
     */
    public function semua(array $filter = []): array
    {
        [$where, $params] = $this->filterSql($filter);

        $sql = 'SELECT l.*, u.nama AS pelapor_nama
                FROM `laporan` l
                JOIN `users` u ON u.id = l.pelapor_id';

        if ($where !== '') {
            $sql .= ' WHERE ' . $where;
        }

        $sql .= ' ORDER BY l.tanggal DESC, l.id DESC';

        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * Hitung jumlah laporan dengan filter opsional.
     *
     * @param array<string, string> $filter
     */
    public function hitung(array $filter = []): int
    {
        [$where, $params] = $this->filterSql($filter);

        $sql = 'SELECT COUNT(*)
                FROM `laporan` l
                JOIN `users` u ON u.id = l.pelapor_id';

        if ($where !== '') {
            $sql .= ' WHERE ' . $where;
        }

        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Laporan terbaru untuk beranda.
     *
     * @return array<int, array<string, mixed>>
     */
    public function terbaru(int $limit = 6): array
    {
        $limit = max(1, min(50, $limit));

        $stmt = $this->db()->prepare(
            'SELECT l.*, u.nama AS pelapor_nama
             FROM `laporan` l
             JOIN `users` u ON u.id = l.pelapor_id
             ORDER BY l.tanggal DESC, l.id DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        $stmt = $this->db()->prepare(
            'SELECT l.*, u.nama AS pelapor_nama
             FROM `laporan` l
             JOIN `users` u ON u.id = l.pelapor_id
             WHERE l.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    /**
     * Simpan laporan baru. Subclass menentukan tipe & status.
     *
     * @param array<string, mixed> $data
     */
    public function buat(array $data): int
    {
        $stmt = $this->db()->prepare(
            'INSERT INTO `laporan`
                (`tipe`, `nama_barang`, `jenis_barang`, `tanggal`, `lokasi`,
                 `penitipan`, `deskripsi`, `ciri_rahasia`, `foto`, `status`, `pelapor_id`)
             VALUES
                (:tipe, :nama_barang, :jenis_barang, :tanggal, :lokasi,
                 :penitipan, :deskripsi, :ciri_rahasia, :foto, :status, :pelapor_id)'
        );

        $stmt->execute([
            ':tipe'         => $data['tipe'],
            ':nama_barang'  => $data['nama_barang'],
            ':jenis_barang' => $data['jenis_barang'],
            ':tanggal'      => $data['tanggal'],
            ':lokasi'       => $data['lokasi'],
            ':penitipan'    => $data['penitipan'] !== '' ? $data['penitipan'] : null,
            ':deskripsi'    => $data['deskripsi'],
            ':ciri_rahasia' => $data['ciri_rahasia'] !== '' ? $data['ciri_rahasia'] : null,
            ':foto'         => $data['foto'] !== '' ? $data['foto'] : null,
            ':status'       => $data['status'],
            ':pelapor_id'   => $data['pelapor_id'],
        ]);

        return (int) $this->db()->lastInsertId();
    }

    public function hapus(int $id): bool
    {
        $stmt = $this->db()->prepare('DELETE FROM `laporan` WHERE `id` = :id');
        $stmt->execute([':id' => $id]);

        return $stmt->rowCount() > 0;
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->db()->prepare(
            'UPDATE `laporan` SET `status` = :status WHERE `id` = :id'
        );
        $stmt->execute([
            ':status' => $status,
            ':id'     => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * @param array<string, string> $filter
     * @return array{0:string, 1:array<string, string>}
     */
    private function filterSql(array $filter): array
    {
        $where = [];
        $params = [];

        $tipe = trim((string) ($filter['tipe'] ?? 'Semua'));
        if ($tipe !== '' && $tipe !== 'Semua') {
            $where[] = 'l.tipe = :tipe';
            $params[':tipe'] = $tipe;
        }

        $status = trim((string) ($filter['status'] ?? 'Semua'));
        if ($status !== '' && $status !== 'Semua') {
            $where[] = 'l.status = :status';
            $params[':status'] = $status;
        }

        $jenis = trim((string) ($filter['jenis'] ?? 'Semua'));
        if ($jenis !== '' && $jenis !== 'Semua') {
            $where[] = 'l.jenis_barang = :jenis';
            $params[':jenis'] = $jenis;
        }

        $lokasi = trim((string) ($filter['lokasi'] ?? 'Semua'));
        if ($lokasi !== '' && $lokasi !== 'Semua') {
            $where[] = 'l.lokasi LIKE :lokasi';
            $params[':lokasi'] = '%' . $lokasi . '%';
        }

        $startDate = trim((string) ($filter['start_date'] ?? ''));
        if ($startDate !== '') {
            $where[] = 'l.tanggal >= :start_date';
            $params[':start_date'] = $startDate;
        }

        $endDate = trim((string) ($filter['end_date'] ?? ''));
        if ($endDate !== '') {
            $where[] = 'l.tanggal <= :end_date';
            $params[':end_date'] = $endDate;
        }

        $q = trim((string) ($filter['q'] ?? ''));
        if ($q !== '') {
            $where[] = '(l.nama_barang LIKE :q_nama OR l.deskripsi LIKE :q_deskripsi OR u.nama LIKE :q_pelapor)';
            $params[':q_nama'] = '%' . $q . '%';
            $params[':q_deskripsi'] = '%' . $q . '%';
            $params[':q_pelapor'] = '%' . $q . '%';
        }

        return [implode(' AND ', $where), $params];
    }
}
