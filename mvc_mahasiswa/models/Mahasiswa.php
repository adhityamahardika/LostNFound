<?php
class Mahasiswa {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function semua() {
        $stmt = $this->db->query(
            'SELECT nim, nama, prodi FROM mahasiswa ORDER BY nim ASC'
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
