<?php
/**
 * LostNFound - Model Laporan Barang Temuan
 */

declare(strict_types=1);

class LaporanTemuan extends Laporan
{
    /**
     * @param array<string, mixed> $data
     */
    public function buat(array $data): int
    {
        $data['tipe'] = 'Ditemukan';
        $data['status'] = 'Ditemukan';

        return parent::buat($data);
    }
}
