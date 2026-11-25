<?php
// ==============================================================================
// API Chat (Percakapan & Pesan Antar Pengguna LostnFound)
// Endpoint:
//   GET  Backend/api/chat.php                       -> Daftar percakapan user aktif
//   GET  Backend/api/chat.php?action=unread_count   -> Total pesan belum dibaca
//   GET  Backend/api/chat.php?conversation_id=1     -> Detail room + semua pesan
//   GET  Backend/api/chat.php?conversation_id=1&after_id=5 -> Delta polling pesan baru
//   POST Backend/api/chat.php?action=start          -> Mulai/buka room untuk laporan_id
//   POST Backend/api/chat.php?action=send           -> Kirim pesan baru ke room
//   POST/PATCH Backend/api/chat.php?action=update_status -> Verifikasi klaim / Selesai
// ==============================================================================

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

initAuthSession();
$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$sessionUser = getSessionUser();
if (!$sessionUser || empty($sessionUser['email'])) {
    sendChatError(401, 'Silakan masuk terlebih dahulu untuk mengakses fitur pesan.');
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

$action = strtolower(trim($_GET['action'] ?? $inputData['action'] ?? ''));

// ==============================================================================
// 1. GET Requests
// ==============================================================================
if ($method === 'GET') {
    // A. Jumlah pesan belum dibaca untuk badge navbar
    if ($action === 'unread_count') {
        $unread = getTotalUnreadCount($pdo, $sessionUser['email']);
        echo json_encode([
            'success' => true,
            'unread'  => $unread
        ]);
        exit;
    }

    // B. Ambil isi pesan di satu room (mendukung delta polling ?after_id=)
    if (!empty($_GET['conversation_id'])) {
        $convId  = (int)$_GET['conversation_id'];
        $afterId = isset($_GET['after_id']) ? (int)$_GET['after_id'] : 0;

        $conv = fetchConversationWithItem($pdo, $convId);
        if (!$conv) {
            sendChatError(404, 'Percakapan tidak ditemukan.');
        }

        if (!canAccessConversation($conv, $sessionUser)) {
            sendChatError(403, 'Akses ditolak: Anda tidak tergabung dalam percakapan ini.');
        }

        // Tandai pesan dari lawan bicara sebagai sudah dibaca
        $markStmt = $pdo->prepare("
            UPDATE `messages`
            SET `is_read` = 1
            WHERE `conversation_id` = ?
              AND `sender_type` = 'user'
              AND LOWER(`sender_email`) != LOWER(?)
              AND `is_read` = 0
        ");
        $markStmt->execute([$convId, $sessionUser['email']]);

        // Ambil pesan baru (atau seluruh pesan bila after_id = 0)
        $msgStmt = $pdo->prepare("
            SELECT * FROM `messages`
            WHERE `conversation_id` = ? AND `id` > ?
            ORDER BY `id` ASC
        ");
        $msgStmt->execute([$convId, $afterId]);
        $msgRows = $msgStmt->fetchAll();

        // Daftar ID pesan milik user ini yang sudah dibaca lawan (untuk update ✓ -> ✓✓)
        $readStmt = $pdo->prepare("
            SELECT `id` FROM `messages`
            WHERE `conversation_id` = ?
              AND `sender_type` = 'user'
              AND LOWER(`sender_email`) = LOWER(?)
              AND `is_read` = 1
        ");
        $readStmt->execute([$convId, $sessionUser['email']]);
        $readIds = array_map('intval', $readStmt->fetchAll(PDO::FETCH_COLUMN));

        $formattedConv = formatConversation($conv, $sessionUser['email']);
        $formattedMsgs = array_map(function ($m) use ($sessionUser) {
            return formatMessage($m, $sessionUser['email']);
        }, $msgRows);

        echo json_encode([
            'success'      => true,
            'conversation' => $formattedConv,
            'messages'     => $formattedMsgs,
            'read_ids'     => $readIds
        ]);
        exit;
    }

    // C. Ambil daftar semua percakapan milik user (atau semua jika Admin)
    $isAdmin = (strtolower($sessionUser['accessRole'] ?? '') === 'admin');
    $laporanFilter = !empty($_GET['laporan_id']) ? (int)$_GET['laporan_id'] : 0;

    $sql = "
        SELECT c.*,
               l.nama_barang, l.tanggal AS laporan_tanggal, l.lokasi AS laporan_lokasi,
               l.status AS laporan_status, l.tipe AS laporan_tipe, l.foto AS laporan_foto,
               (
                   SELECT m.message FROM `messages` m
                   WHERE m.conversation_id = c.id
                   ORDER BY m.id DESC LIMIT 1
               ) AS last_message,
               (
                   SELECT m.sender_email FROM `messages` m
                   WHERE m.conversation_id = c.id
                   ORDER BY m.id DESC LIMIT 1
               ) AS last_sender_email,
               (
                   SELECT m.sender_type FROM `messages` m
                   WHERE m.conversation_id = c.id
                   ORDER BY m.id DESC LIMIT 1
               ) AS last_sender_type,
               (
                   SELECT m.created_at FROM `messages` m
                   WHERE m.conversation_id = c.id
                   ORDER BY m.id DESC LIMIT 1
               ) AS last_message_at,
               (
                   SELECT COUNT(*) FROM `messages` m
                   WHERE m.conversation_id = c.id
                     AND m.sender_type = 'user'
                     AND LOWER(m.sender_email) != LOWER(:me_unread)
                     AND m.is_read = 0
               ) AS unread_count
        FROM `conversations` c
        INNER JOIN `laporan` l ON l.id = c.laporan_id
    ";

    $conditions = [];
    $params = [':me_unread' => $sessionUser['email']];

    if (!$isAdmin) {
        $conditions[] = "(LOWER(c.pelapor_email) = LOWER(:me_owner) OR LOWER(c.pengklaim_email) = LOWER(:me_claimer))";
        $params[':me_owner'] = $sessionUser['email'];
        $params[':me_claimer'] = $sessionUser['email'];
    }

    if ($laporanFilter > 0) {
        $conditions[] = "c.laporan_id = :laporan_id";
        $params[':laporan_id'] = $laporanFilter;
    }

    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    $sql .= " ORDER BY COALESCE(last_message_at, c.updated_at) DESC, c.id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $data = array_map(function ($row) use ($sessionUser) {
        return formatConversation($row, $sessionUser['email']);
    }, $rows);

    echo json_encode([
        'success' => true,
        'count'   => count($data),
        'data'    => $data
    ]);
    exit;
}

// ==============================================================================
// 2. POST / PATCH: Mulai Room, Kirim Pesan, atau Update Status Verifikasi
// ==============================================================================
if ($method === 'POST' || $method === 'PATCH') {
    // A. Update status verifikasi klaim / serah terima
    if ($action === 'update_status') {
        $convId    = (int)($inputData['conversation_id'] ?? 0);
        $newStatus = trim($inputData['status'] ?? '');

        if ($convId <= 0 || !in_array($newStatus, ['Terverifikasi', 'Selesai'], true)) {
            sendChatError(400, 'ID percakapan atau status tidak valid.');
        }

        $conv = fetchConversationWithItem($pdo, $convId);
        if (!$conv) {
            sendChatError(404, 'Percakapan tidak ditemukan.');
        }

        $role = strtolower($sessionUser['accessRole'] ?? 'user');
        $isPrivileged = in_array($role, ['admin', 'petugas'], true);
        $isOwner = strtolower($conv['pelapor_email']) === strtolower($sessionUser['email']);

        if (!$isPrivileged && !$isOwner) {
            sendChatError(403, 'Hanya penemu/pelapor atau petugas yang dapat memverifikasi klaim ini.');
        }

        try {
            $pdo->beginTransaction();

            $updConv = $pdo->prepare("UPDATE `conversations` SET `status` = ?, `updated_at` = NOW() WHERE `id` = ?");
            $updConv->execute([$newStatus, $convId]);

            $laporanStatus = ($newStatus === 'Selesai') ? 'Dikembalikan' : 'Diklaim';
            $updLap = $pdo->prepare("UPDATE `laporan` SET `status` = ? WHERE `id` = ?");
            $updLap->execute([$laporanStatus, $conv['laporan_id']]);

            $sysText = ($newStatus === 'Selesai')
                ? 'Barang telah ditandai dikembalikan kepada pemiliknya. Terima kasih telah menggunakan LostnFound!'
                : 'Penemu telah menyetujui verifikasi klaim! Silakan sepakati lokasi dan waktu serah terima di area kampus.';

            $insSys = $pdo->prepare("INSERT INTO `messages` (`conversation_id`, `sender_email`, `sender_type`, `message`, `is_read`) VALUES (?, 'system', 'sys', ?, 1)");
            $insSys->execute([$convId, $sysText]);

            $pdo->commit();

            $freshConv = fetchConversationWithItem($pdo, $convId);
            echo json_encode([
                'success'      => true,
                'message'      => 'Status berhasil diperbarui.',
                'conversation' => formatConversation($freshConv, $sessionUser['email'])
            ]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sendChatError(500, 'Gagal memperbarui status percakapan: ' . $e->getMessage());
        }
        exit;
    }

    // B. Mulai atau ambil percakapan untuk suatu laporan (dari klaim.html / detail_barang)
    if ($action === 'start') {
        $laporanId   = (int)($inputData['laporan_id'] ?? $inputData['id'] ?? 0);
        $ciriRahasia = trim($inputData['ciri_rahasia'] ?? '');
        $catatan     = trim($inputData['catatan'] ?? '');

        if ($laporanId <= 0) {
            sendChatError(400, 'ID laporan tidak valid.');
        }

        $stmtLap = $pdo->prepare("SELECT * FROM `laporan` WHERE `id` = ? LIMIT 1");
        $stmtLap->execute([$laporanId]);
        $laporan = $stmtLap->fetch();

        if (!$laporan) {
            sendChatError(404, 'Laporan barang tidak ditemukan.');
        }

        $pelaporEmail = trim($laporan['pelapor_email'] ?? '');
        $pelaporName  = trim($laporan['pelapor_name'] ?? 'Civitas Kampus');
        if ($pelaporEmail === '') {
            $pelaporEmail = 'admin@kampus.ac.id';
            $pelaporName  = 'Admin LostnFound';
        }

        if (strtolower($pelaporEmail) === strtolower($sessionUser['email'])) {
            sendChatError(400, 'Anda tidak dapat mengajukan klaim pada laporan yang Anda buat sendiri.');
        }

        try {
            // Cek apakah room antara barang & pengklaim ini sudah ada
            $checkStmt = $pdo->prepare("
                SELECT `id` FROM `conversations`
                WHERE `laporan_id` = ? AND LOWER(`pengklaim_email`) = LOWER(?)
                LIMIT 1
            ");
            $checkStmt->execute([$laporanId, $sessionUser['email']]);
            $existingId = $checkStmt->fetchColumn();

            $convId = $existingId ? (int)$existingId : 0;

            $pdo->beginTransaction();

            if ($convId === 0) {
                $insConv = $pdo->prepare("
                    INSERT INTO `conversations` (`laporan_id`, `pelapor_email`, `pelapor_name`, `pengklaim_email`, `pengklaim_name`, `status`)
                    VALUES (?, ?, ?, ?, ?, 'Menunggu')
                ");
                $insConv->execute([
                    $laporanId,
                    $pelaporEmail,
                    $pelaporName,
                    $sessionUser['email'],
                    $sessionUser['name']
                ]);
                $convId = (int)$pdo->lastInsertId();

                $sysMsg = 'Klaim diajukan untuk "' . $laporan['nama_barang'] . '". Sebutkan ciri yang tidak terlihat di foto untuk verifikasi.';
                $insSys = $pdo->prepare("INSERT INTO `messages` (`conversation_id`, `sender_email`, `sender_type`, `message`, `is_read`) VALUES (?, 'system', 'sys', ?, 1)");
                $insSys->execute([$convId, $sysMsg]);
            }

            // Jika pengklaim mengisi ciri rahasia di form klaim, kirim sebagai pesan pertama
            if ($ciriRahasia !== '') {
                $claimText = 'Halo, saya mengajukan klaim kepemilikan untuk "' . $laporan['nama_barang'] . '". Ciri khusus barang: ' . $ciriRahasia;
                if ($catatan !== '') {
                    $claimText .= "\nCatatan tambahan: " . $catatan;
                }
                $insClaimMsg = $pdo->prepare("INSERT INTO `messages` (`conversation_id`, `sender_email`, `sender_type`, `message`, `is_read`) VALUES (?, ?, 'user', ?, 0)");
                $insClaimMsg->execute([$convId, $sessionUser['email'], $claimText]);

                $touchStmt = $pdo->prepare("UPDATE `conversations` SET `updated_at` = NOW() WHERE `id` = ?");
                $touchStmt->execute([$convId]);
            }

            $pdo->commit();

            $freshConv = fetchConversationWithItem($pdo, $convId);
            echo json_encode([
                'success'         => true,
                'conversation_id' => $convId,
                'conversation'    => formatConversation($freshConv, $sessionUser['email'])
            ]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sendChatError(500, 'Gagal membuka ruang percakapan: ' . $e->getMessage());
        }
        exit;
    }

    // C. Kirim pesan baru ke conversation
    if ($action === 'send' || $action === '') {
        $convId  = (int)($inputData['conversation_id'] ?? 0);
        $message = trim((string)($inputData['message'] ?? ''));

        if ($convId <= 0) {
            sendChatError(400, 'ID percakapan tidak valid.');
        }

        if ($message === '') {
            sendChatError(400, 'Pesan tidak boleh kosong.');
        }

        $msgLen = function_exists('mb_strlen') ? mb_strlen($message, 'UTF-8') : strlen($message);
        if ($msgLen > 2000) {
            sendChatError(400, 'Pesan terlalu panjang (maksimal 2000 karakter).');
        }

        $conv = fetchConversationWithItem($pdo, $convId);
        if (!$conv) {
            sendChatError(404, 'Percakapan tidak ditemukan.');
        }

        if (!canAccessConversation($conv, $sessionUser)) {
            sendChatError(403, 'Akses ditolak: Anda tidak berhak mengirim pesan ke percakapan ini.');
        }

        try {
            $pdo->beginTransaction();

            $ins = $pdo->prepare("
                INSERT INTO `messages` (`conversation_id`, `sender_email`, `sender_type`, `message`, `is_read`)
                VALUES (?, ?, 'user', ?, 0)
            ");
            $ins->execute([$convId, $sessionUser['email'], $message]);
            $msgId = (int)$pdo->lastInsertId();

            $upd = $pdo->prepare("UPDATE `conversations` SET `updated_at` = NOW() WHERE `id` = ?");
            $upd->execute([$convId]);

            $pdo->commit();

            $getMsg = $pdo->prepare("SELECT * FROM `messages` WHERE `id` = ?");
            $getMsg->execute([$msgId]);
            $msgRow = $getMsg->fetch();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => formatMessage($msgRow, $sessionUser['email'])
            ]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sendChatError(500, 'Gagal mengirim pesan: ' . $e->getMessage());
        }
        exit;
    }

    sendChatError(400, 'Aksi chat tidak dikenal.');
}

sendChatError(405, 'Metode HTTP tidak diizinkan.');


// ==============================================================================
// Helper Functions
// ==============================================================================

function sendChatError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

function canAccessConversation($conv, $user) {
    if (!$conv || !$user) return false;
    if (strtolower($user['accessRole'] ?? '') === 'admin') return true;
    $me = strtolower($user['email']);
    return strtolower($conv['pelapor_email']) === $me || strtolower($conv['pengklaim_email']) === $me;
}

function getTotalUnreadCount($pdo, $userEmail) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM `messages` m
        INNER JOIN `conversations` c ON c.id = m.conversation_id
        WHERE (LOWER(c.pelapor_email) = LOWER(?) OR LOWER(c.pengklaim_email) = LOWER(?))
          AND m.sender_type = 'user'
          AND LOWER(m.sender_email) != LOWER(?)
          AND m.is_read = 0
    ");
    $stmt->execute([$userEmail, $userEmail, $userEmail]);
    return (int)$stmt->fetchColumn();
}

function fetchConversationWithItem($pdo, $convId) {
    $stmt = $pdo->prepare("
        SELECT c.*,
               l.nama_barang, l.tanggal AS laporan_tanggal, l.lokasi AS laporan_lokasi,
               l.status AS laporan_status, l.tipe AS laporan_tipe, l.foto AS laporan_foto
        FROM `conversations` c
        INNER JOIN `laporan` l ON l.id = c.laporan_id
        WHERE c.id = ?
        LIMIT 1
    ");
    $stmt->execute([$convId]);
    return $stmt->fetch();
}

function formatConversation($row, $viewerEmail) {
    $isOwner = strtolower($row['pelapor_email']) === strtolower($viewerEmail);
    $otherName = $isOwner ? $row['pengklaim_name'] : $row['pelapor_name'];
    $otherRoleLabel = $isOwner ? 'Pengklaim · identitas dijaga' : 'Penemu / Pelapor · identitas dijaga';

    $tglKode = str_replace('-', '', $row['laporan_tanggal'] ?? '20261001');
    $itemCode = 'LF-' . $tglKode . '-' . str_pad((string)$row['laporan_id'], 3, '0', STR_PAD_LEFT);

    $lastAt = $row['last_message_at'] ?? $row['updated_at'] ?? $row['created_at'];
    $lastFromMe = !empty($row['last_sender_email'])
        && ($row['last_sender_type'] ?? 'user') === 'user'
        && strtolower($row['last_sender_email']) === strtolower($viewerEmail);

    return [
        'id'              => (int)$row['id'],
        'laporanId'       => (int)$row['laporan_id'],
        'itemCode'        => $itemCode,
        'itemTitle'       => $row['nama_barang'] ?? 'Barang',
        'itemLokasi'      => $row['laporan_lokasi'] ?? '-',
        'itemStatus'      => $row['laporan_status'] ?? 'Ditemukan',
        'status'          => $row['status'] ?? 'Menunggu',
        'isOwner'         => $isOwner,
        'otherName'       => $otherName ?: 'Civitas Kampus',
        'otherRoleLabel'  => $otherRoleLabel,
        'unread'          => (int)($row['unread_count'] ?? 0),
        'lastMessage'     => $row['last_message'] ?? '',
        'lastFromMe'      => $lastFromMe,
        'updatedTs'       => $lastAt ? (strtotime($lastAt) * 1000) : (time() * 1000)
    ];
}

function formatMessage($row, $viewerEmail) {
    if (($row['sender_type'] ?? 'user') === 'sys') {
        $from = 'sys';
    } elseif (strtolower($row['sender_email']) === strtolower($viewerEmail)) {
        $from = 'me';
    } else {
        $from = 'them';
    }

    return [
        'id'   => (int)$row['id'],
        'from' => $from,
        'text' => $row['message'],
        'read' => (bool)$row['is_read'],
        'ts'   => strtotime($row['created_at']) * 1000
    ];
}
