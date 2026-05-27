<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_config.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método no permitido. Se requiere POST.'], 405);
}

try {
    $conn      = getConnection();
    $sessionId = session_id();

    $stmt = $conn->prepare('DELETE FROM search_history WHERE session_id = ?');
    $stmt->bind_param('s', $sessionId);
    $stmt->execute();

    $deleted = $stmt->affected_rows;
    $stmt->close();
    $conn->close();

    jsonResponse([
        'success'      => true,
        'deleted_rows' => $deleted,
        'message'      => "Se eliminaron {$deleted} registro(s) del historial.",
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Error interno del servidor.'], 500);
}
