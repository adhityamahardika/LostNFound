<?php
/**
 * LostNFound - Base Controller
 */

declare(strict_types=1);

abstract class Controller
{
    /**
     * Render view dengan layout header/footer.
     *
     * @param array<string, mixed> $data Variabel yang diekstrak untuk view.
     */
    protected function view(string $view, array $data = [], int $status = 200): void
    {
        http_response_code($status);

        extract($data, EXTR_SKIP);

        $judul = $data['judul'] ?? 'LostNFound';
        $halamanAktif = $data['halamanAktif'] ?? '';
        $cssTambahan = $data['cssTambahan'] ?? [];
        $layout = $data['layout'] ?? 'default';

        if ($layout === 'popup') {
            require __DIR__ . '/../views/layouts/popup-header.php';
            require __DIR__ . '/../views/' . $view . '.php';
            require __DIR__ . '/../views/layouts/popup-footer.php';
            return;
        }

        require __DIR__ . '/../views/layouts/header.php';
        require __DIR__ . '/../views/' . $view . '.php';

        $footer = match ($layout) {
            'auth'    => 'auth-footer.php',
            'minimal' => 'minimal-footer.php',
            default   => 'footer.php',
        };

        require __DIR__ . '/../views/layouts/' . $footer;
    }
}
