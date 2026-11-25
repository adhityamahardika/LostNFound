<?php
/**
 * LostNFound - Error Controller
 */

declare(strict_types=1);

class ErrorController extends Controller
{
    public function notFound(): void
    {
        $this->view('404', [
            'judul'        => 'Halaman Tidak Ditemukan - LostnFound',
            'halamanAktif' => '',
            'cssTambahan'  => ['components.css', 'home.css'],
        ], 404);
    }

    public function forbidden(): void
    {
        $this->view('403', [
            'judul'        => 'Akses Ditolak - LostnFound',
            'halamanAktif' => '',
            'cssTambahan'  => ['components.css', 'home.css'],
        ], 403);
    }

    public function serverError(): void
    {
        $this->view('500', [
            'judul'        => 'Terjadi Kesalahan - LostnFound',
            'halamanAktif' => '',
            'cssTambahan'  => ['components.css', 'home.css'],
        ], 500);
    }
}
