<?php
// ==============================================================================
// API Laporan (CRUD Laporan Barang LostnFound)
// Endpoint:
//   GET  Backend/api/laporan.php          -> Ambil semua laporan (dengan filter)
//   GET  Backend/api/laporan.php?id=1     -> Ambil detail 1 laporan
//   POST Backend/api/laporan.php          -> Buat laporan baru
// ==============================================================================

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// 1. GET: Ambil Laporan
// ==============================================================================
if ($method === 'GET') {
    // A. Ambil Detail Barang Berdasarkan ID
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.'
            ]);
            exit;
        }

        // Format data agar kompatibel dengan frontend lama & baru
        $formatted = formatLaporanItem($item);

        echo json_encode([
            'success' => true,
            'data'    => $formatted
        ]);
        exit;
    }

    // B. Ambil Daftar Laporan dengan Filter
    $conditions = [];
    $params = [];

    // Filter Status
    if (!empty($_GET['status']) && $_GET['status'] !== 'Semua') {
        $conditions[] = "`status` = :status";
        $params[':status'] = $_GET['status'];
    }

    // Filter Jenis Barang
    if (!empty($_GET['jenis']) && $_GET['jenis'] !== 'Semua') {
        $conditions[] = "`jenis_barang` = :jenis";
        $params[':jenis'] = $_GET['jenis'];
    }

    // Filter Lokasi
    if (!empty($_GET['lokasi']) && $_GET['lokasi'] !== 'Semua') {
        $conditions[] = "`lokasi` LIKE :lokasi";
        $params[':lokasi'] = '%' . $_GET['lokasi'] . '%';
    }

    // Filter Tanggal Mulai (Dari)
    if (!empty($_GET['start_date'])) {
        $conditions[] = "`tanggal` >= :start_date";
        $params[':start_date'] = $_GET['start_date'];
    }

    // Filter Tanggal Selesai (Sampai)
    if (!empty($_GET['end_date'])) {
        $conditions[] = "`tanggal` <= :end_date";
        $params[':end_date'] = $_GET['end_date'];
    }

    // Filter Pencarian Teks Bebas (Nama / Deskripsi)
    if (!empty($_GET['q'])) {
        $conditions[] = "(`nama_barang` LIKE :query OR `deskripsi` LIKE :query)";
        $params[':query'] = '%' . $_GET['q'] . '%';
    }

    $sql = "SELECT * FROM `laporan`";
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    $sql .= " ORDER BY `tanggal` DESC, `id` DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $data = array_map('formatLaporanItem', $rows);

    echo json_encode([
        'success' => true,
        'count'   => count($data),
        'data'    => $data
    ]);
    exit;
}

// ==============================================================================
// 2. POST: Tambah Laporan Baru
// ==============================================================================
if ($method === 'POST') {
    // Dukung input form multipart/form-data dan JSON
    $inputData = $_POST;
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if (is_array($json)) {
            $inputData = array_merge($inputData, $json);
        }
    }

    // Ambil dan bersihkan field
    $tipe        = trim($inputData['tipe'] ?? $inputData['tipe-laporan'] ?? 'Hilang');
    $namaBarang  = trim($inputData['nama_barang'] ?? $inputData['nama-barang'] ?? $inputData['nama'] ?? '');
    $jenisBarang = trim($inputData['jenis_barang'] ?? $inputData['jenis-barang'] ?? $inputData['jenis'] ?? '');
    $tanggal     = trim($inputData['tanggal'] ?? date('Y-m-d'));
    $lokasi      = trim($inputData['lokasi'] ?? '');
    $lokasiLain  = trim($inputData['lokasi-lain'] ?? $inputData['lokasi_lain'] ?? '');
    $penitipan   = trim($inputData['penitipan'] ?? '');
    $deskripsi   = trim($inputData['deskripsi'] ?? '');
    $ciriRahasia = trim($inputData['ciri_rahasia'] ?? $inputData['ciri-rahasia'] ?? '');
    $status      = trim($inputData['status'] ?? ($tipe === 'Ditemukan' ? 'Ditemukan' : 'Hilang'));
    $pelaporEmail = trim($inputData['pelapor_email'] ?? $inputData['email'] ?? '');
    $pelaporName  = trim($inputData['pelapor_name'] ?? $inputData['pelapor'] ?? $inputData['name'] ?? 'Civitas Kampus');

    // Pengguna wajib login untuk membuat laporan
    if (empty($pelaporEmail)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Anda harus login terlebih dahulu sebelum dapat membuat laporan.'
        ]);
        exit;
    }

    // Jika lokasi "Lainnya", gunakan nilai lokasi-lain
    if ($lokasi === 'Lainnya' && !empty($lokasiLain)) {
        $lokasi = $lokasiLain;
    }

    // Validasi Field Wajib
    if (empty($namaBarang) || empty($lokasi) || empty($deskripsi)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Nama barang, lokasi, dan deskripsi wajib diisi.'
        ]);
        exit;
    }

    if ($tanggal > date('Y-m-d')) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tanggal kejadian tidak boleh di masa depan.'
        ]);
        exit;
    }

    if ($tipe === 'Ditemukan' && (empty($ciriRahasia) || empty($penitipan))) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Laporan barang temuan wajib mengisi lokasi penitipan dan ciri rahasia.'
        ]);
        exit;
    }

    // Penanganan Upload Foto
    $fotoPath = '';

    // A. File Upload melalui FormData
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $fotoPath = handleFileUpload($_FILES['foto']);
    } elseif (isset($_FILES['foto-barang']) && $_FILES['foto-barang']['error'] === UPLOAD_ERR_OK) {
        $fotoPath = handleFileUpload($_FILES['foto-barang']);
    } 
    // B. Base64 string dari FileReader
    elseif (!empty($inputData['foto']) && strpos($inputData['foto'], 'data:image') === 0) {
        $fotoPath = handleBase64Image($inputData['foto']);
    } 
    // C. Menggunakan path foto yang sudah ada / URL teks
    elseif (!empty($inputData['foto'])) {
        $fotoPath = trim($inputData['foto']);
    }

    // Default icon/placeholder jika tidak ada foto
    if (empty($fotoPath)) {
        $fotoPath = 'assets/nowrite.jpg';
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `laporan` 
                (`tipe`, `nama_barang`, `jenis_barang`, `tanggal`, `lokasi`, `penitipan`, `deskripsi`, `ciri_rahasia`, `foto`, `status`, `pelapor_email`, `pelapor_name`)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $tipe,
            $namaBarang,
            $jenisBarang ?: 'Lainnya',
            $tanggal,
            $lokasi,
            $penitipan ?: null,
            $deskripsi,
            $ciriRahasia ?: null,
            $fotoPath,
            $status,
            $pelaporEmail,
            $pelaporName
        ]);

        $newId = $pdo->lastInsertId();

        // Ambil data yang baru disimpan
        $stmtGet = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmtGet->execute([$newId]);
        $insertedItem = formatLaporanItem($stmtGet->fetch());

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Laporan berhasil disimpan ke database.',
            'id'      => (int)$newId,
            'data'    => $insertedItem
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menyimpan laporan: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ==============================================================================
// 3. DELETE: Hapus Laporan Berdasarkan ID (Hanya Admin atau Pemilik Laporan)
// ==============================================================================
if ($method === 'DELETE') {
    $id = 0;
    $rawInput = [];
    if (!empty($_GET['id'])) {
        $id = (int)$_GET['id'];
    } else {
        $raw = file_get_contents('php://input');
        $rawInput = json_decode($raw, true) ?: [];
        if (!empty($rawInput['id'])) {
            $id = (int)$rawInput['id'];
        }
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ID laporan tidak valid atau tidak disertakan.'
        ]);
        exit;
    }

    // Ambil identitas pemohon penghapusan
    $callerEmail = trim($_GET['user_email'] ?? $rawInput['user_email'] ?? $_SERVER['HTTP_X_USER_EMAIL'] ?? '');
    $callerRole  = trim($_GET['user_role'] ?? $rawInput['user_role'] ?? $_SERVER['HTTP_X_USER_ROLE'] ?? '');

    if (empty($callerEmail) && empty($callerRole)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Akses ditolak: Anda harus login untuk melakukan penghapusan laporan.'
        ]);
        exit;
    }

    try {
        // Ambil data laporan terlebih dahulu (untuk cek otorisasi dan file foto)
        $stmt = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Laporan dengan ID ' . $id . ' tidak ditemukan.'
            ]);
            exit;
        }

        // Cek Hak Akses:
        // 1. Admin selalu diizinkan
        // 2. Pemilik laporan (pelapor_email sama) diizinkan
        $isAdmin = (strtolower($callerRole) === 'admin');
        $isOwner = (!empty($item['pelapor_email']) && strtolower($callerEmail) === strtolower($item['pelapor_email']));

        if (!$isAdmin && !$isOwner) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Akses ditolak: Hanya Admin atau pembuat laporan yang berhak menghapus laporan ini.'
            ]);
            exit;
        }

        // Hapus file foto dari disk jika berada di folder uploads lokal
        if (!empty($item['foto']) && strpos($item['foto'], 'Backend/uploads/') !== false) {
            $realPhotoPath = __DIR__ . '/../../' . $item['foto'];
            if (file_exists($realPhotoPath)) {
                @unlink($realPhotoPath);
            }
        }

        // Hapus record dari database MySQL
        $stmtDel = $pdo->prepare("DELETE FROM `laporan` WHERE `id` = ?");
        $stmtDel->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Laporan berhasil dihapus dari database.',
            'id'      => $id
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menghapus laporan: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Method tidak diizinkan
http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Metode HTTP tidak diizinkan.'
]);
exit;


// ==============================================================================
// Helper Functions
// ==============================================================================

/**
 * Format satu baris item laporan agar serasi dengan kebutuhan frontend
 */
function formatLaporanItem($row) {
    if (!$row) return null;

    $foto = $row['foto'] ?? '';
    // Format image URL
    $img = $foto;

    return [
        'id'           => (int)$row['id'],
        'tipe'         => $row['tipe'],
        'nama'         => $row['nama_barang'],
        'nama_barang'  => $row['nama_barang'],
        'jenis'        => $row['jenis_barang'],
        'jenis_barang' => $row['jenis_barang'],
        'tanggal'      => $row['tanggal'],
        'lokasi'       => $row['lokasi'],
        'penitipan'    => $row['penitipan'],
        'deskripsi'    => $row['deskripsi'],
        'ciri_rahasia' => $row['ciri_rahasia'],
        'foto'         => $foto,
        'img'          => $img,
        'status'       => $row['status'],
        'pelapor_email'=> $row['pelapor_email'] ?? '',
        'pelapor_name' => $row['pelapor_name'] ?? 'Civitas Kampus',
        'pelapor'      => $row['pelapor_name'] ?? 'Civitas Kampus',
        'created_at'   => $row['created_at'],
        'updated_at'   => $row['updated_at'] ?? $row['created_at']
    ];
}

/**
 * Handle upload file dari form multipart
 */
function handleFileUpload($file) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    $fileInfo = getimagesize($file['tmp_name']);
    if (!$fileInfo || !in_array($fileInfo['mime'], $allowedMimes)) {
        return '';
    }

    // Maksimal 5 MB
    if ($file['size'] > 5 * 1024 * 1024) {
        return '';
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    if (empty($ext)) {
        $ext = ($fileInfo['mime'] === 'image/png') ? 'png' : 'jpg';
    }

    $fileName = 'item_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return 'Backend/uploads/' . $fileName;
    }

    return '';
}

/**
 * Simpan data URI Base64 ke file gambar
 */
function handleBase64Image($base64String) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';
        if (!in_array($ext, ['jpg', 'png', 'webp'])) {
            return '';
        }

        $data = substr($base64String, strpos($base64String, ',') + 1);
        $decoded = base64_decode($data);
        if ($decoded === false) {
            return '';
        }

        $fileName = 'item_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = $uploadDir . $fileName;

        if (file_put_contents($targetPath, $decoded) !== false) {
            return 'Backend/uploads/' . $fileName;
        }
    }

    return '';
}
