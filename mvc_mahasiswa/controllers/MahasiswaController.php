<?php
require_once __DIR__ . '/../models/Mahasiswa.php';

class MahasiswaController {
    private $model;

    public function __construct($db) {
        $this->model = new Mahasiswa($db);
    }

    public function index() {
        $daftar = $this->model->semua();
        require __DIR__ . '/../views/mahasiswa/index.php';
    }
}
