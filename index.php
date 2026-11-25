<?php
/**
 * LostNFound - Front Controller
 *
 * Semua request masuk melalui file ini.
 * Routing: index.php?page={halaman}&aksi={aksi}
 */

declare(strict_types=1);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');

if (session_status() !== PHP_SESSION_ACTIVE) {
    $secure = !empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off';

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

require_once __DIR__ . '/config/helpers.php';
require_once __DIR__ . '/config/koneksi.php';

/**
 * Autoload sederhana untuk class di controllers/ dan models/.
 */
spl_autoload_register(static function (string $class): void {
    $base = __DIR__;

    foreach (['controllers', 'controllers/member', 'controllers/admin', 'models'] as $folder) {
        $file = $base . '/' . $folder . '/' . $class . '.php';
        if (is_file($file)) {
            require_once $file;
            return;
        }
    }
});

/**
 * Peta route.
 *
 * - default : aksi yang dipakai jika ?aksi tidak diisi
 * - aksi    : daftar aksi yang diizinkan => method controller
 *
 * Aksi di luar daftar menghasilkan 404, sehingga method controller
 * tidak bisa dipanggil sembarangan dari URL.
 */
$routes = [
    'home' => [
        'controller' => HomeController::class,
        'default'    => 'index',
        'aksi'       => ['index' => 'index'],
    ],
    'auth/login' => [
        'controller' => AuthController::class,
        'default'    => 'login',
        'aksi'       => [
            'login'  => 'login',
            'proses' => 'prosesLogin',
        ],
    ],
    'auth/register' => [
        'controller' => AuthController::class,
        'default'    => 'register',
        'aksi'       => [
            'register' => 'register',
            'proses'   => 'prosesRegister',
        ],
    ],
    'auth/logout' => [
        'controller' => AuthController::class,
        'default'    => 'logout',
        'aksi'       => ['logout' => 'logout'],
    ],
    'laporan' => [
        'controller' => MemberLaporanController::class,
        'default'    => 'index',
        'aksi'       => [
            'index'  => 'index',
            'detail' => 'detail',
            'baru'   => 'baru',
            'simpan' => 'simpan',
            'hapus'  => 'hapus',
        ],
    ],
];

$page = trim((string) ($_GET['page'] ?? 'home'));
if ($page === '') {
    $page = 'home';
}

$route = $routes[$page] ?? null;

if ($route === null) {
    (new ErrorController())->notFound();
    exit;
}

$aksi = trim((string) ($_GET['aksi'] ?? ''));
if ($aksi === '') {
    $aksi = $route['default'];
}

$method = $route['aksi'][$aksi] ?? null;

if ($method === null) {
    (new ErrorController())->notFound();
    exit;
}

$controllerClass = $route['controller'];
/** @var Controller $controller */
$controller = new $controllerClass();
$controller->{$method}();
