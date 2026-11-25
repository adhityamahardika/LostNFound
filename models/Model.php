<?php
/**
 * LostNFound - Base Model
 *
 * Koneksi dibuat lazy: model boleh dibuat tanpa MySQL aktif,
 * koneksi baru terjadi saat query pertama dijalankan.
 */

declare(strict_types=1);

abstract class Model
{
    private ?PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo;
    }

    protected function db(): PDO
    {
        return $this->pdo ??= db();
    }
}
