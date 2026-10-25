<?php
// ==============================================================================
// API Update Status Laporan
// Endpoint:
//   POST / PATCH Backend/api/update_status.php
// Body (JSON atau Form):
//   { "id": 1, "status": "Dikembalikan" }
// ==============================================================================

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST' && $method !== 'PATCH' && $method !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode HTTP harus POST, PUT, atau PATCH.'
    ]);
    exit;
}

$inputData = $_POST;
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (is_array($json)) {
        $inputData = array_merge($inputData, $json);
    }
}

$id = isset($inputData['id']) ? (int)$inputData['id'] : 0;
$status = trim($inputData['status'] ?? '');

$allowedStatuses = ['Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan'];

if ($id <= 0 || !in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID laporan tidak valid atau status tidak dikenali. Pilihan status: ' . implode(', ', $allowedStatuses)
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE `laporan` SET `status` = ? WHERE `id` = ?");
    $stmt->execute([$status, $id]);

    if ($stmt->rowCount() === 0) {
        // Cek apakah item memang ada
        $check = $pdo->prepare("SELECT `id` FROM `laporan` WHERE `id` = ?");
        $check->execute([$id]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Laporan dengan ID ' . $id . ' tidak ditemukan.'
            ]);
            exit;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Status laporan berhasil diperbarui menjadi ' . $status . '.',
        'id'      => $id,
        'status'  => $status
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal memperbarui status: ' . $e->getMessage()
    ]);
}
