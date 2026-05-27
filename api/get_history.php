<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_config.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Método no permitido. Se requiere GET.'], 405);
}

try {
    $conn      = getConnection();
    $sessionId = session_id();
    $limit     = 20;

    $stmt = $conn->prepare(
        'SELECT id, search_term, results_count, searched_at
         FROM search_history
         WHERE session_id = ?
         ORDER BY searched_at DESC
         LIMIT ?'
    );
    $stmt->bind_param('si', $sessionId, $limit);
    $stmt->execute();

    $result  = $stmt->get_result();
    $history = [];

    while ($row = $result->fetch_assoc()) {
        $history[] = [
            'id'            => (int)    $row['id'],
            'search_term'   => (string) $row['search_term'],
            'results_count' => (int)    $row['results_count'],
            'searched_at'   => (string) $row['searched_at'],
        ];
    }

    $stmt->close();
    $conn->close();

    jsonResponse([
        'success' => true,
        'count'   => count($history),
        'history' => $history,
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Error interno del servidor.'], 500);
}
