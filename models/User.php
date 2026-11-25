<?php
/**
 * LostNFound - User Model
 */

declare(strict_types=1);

class User extends Model
{
    /**
     * Cari pengguna berdasarkan username (NIM) atau email.
     */
    public function findByIdentifier(string $identifier): ?array
    {
        $stmt = $this->db()->prepare(
            'SELECT * FROM `users`
             WHERE `username` = :username OR `email` = :email
             LIMIT 1'
        );
        $stmt->execute([
            ':username' => $identifier,
            ':email'    => $identifier,
        ]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    /**
     * Ambil data pengguna yang aman ditampilkan (tanpa password_hash).
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db()->prepare(
            'SELECT `id`, `username`, `nama`, `nim`, `email`, `phone`, `role`, `status`, `created_at`
             FROM `users`
             WHERE `id` = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function semua(): array
    {
        $stmt = $this->db()->prepare(
            'SELECT `id`, `username`, `nama`, `nim`, `email`, `phone`, `role`, `status`, `created_at`
             FROM `users`
             ORDER BY `id` ASC'
        );
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function setStatus(int $id, string $status): bool
    {
        $stmt = $this->db()->prepare(
            'UPDATE `users` SET `status` = :status WHERE `id` = :id'
        );
        $stmt->execute([
            ':status' => $status,
            ':id'     => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function usernameExists(string $username): bool
    {
        $stmt = $this->db()->prepare(
            'SELECT 1 FROM `users` WHERE `username` = :username LIMIT 1'
        );
        $stmt->execute([':username' => $username]);

        return (bool) $stmt->fetchColumn();
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->db()->prepare(
            'SELECT 1 FROM `users` WHERE `email` = :email LIMIT 1'
        );
        $stmt->execute([':email' => $email]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * Buat akun member baru. Password harus sudah di-hash oleh pemanggil.
     */
    public function create(array $data): int
    {
        $stmt = $this->db()->prepare(
            'INSERT INTO `users`
                (`username`, `nama`, `nim`, `email`, `phone`, `password_hash`, `role`, `status`)
             VALUES
                (:username, :nama, :nim, :email, :phone, :password_hash, \'member\', \'aktif\')'
        );
        $stmt->execute([
            ':username'      => $data['username'],
            ':nama'          => $data['nama'],
            ':nim'           => $data['nim'],
            ':email'         => $data['email'],
            ':phone'         => $data['phone'],
            ':password_hash' => $data['password_hash'],
        ]);

        return (int) $this->db()->lastInsertId();
    }
}
