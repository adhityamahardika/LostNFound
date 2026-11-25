<?php
/**
 * LostNFound - Model Laporan Barang Hilang
 */

declare(strict_types=1);

class LaporanHilang extends Laporan
{
    /**
     * @param array<string, mixed> $data
     */
    public function buat(array $data): int
    {
        $data['tipe'] = 'Hilang';
        $data['status'] = 'Hilang';

        return parent::buat($data);
    }
}
