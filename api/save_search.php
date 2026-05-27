<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_config.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método no permitido. Se requiere POST.'], 405);
}

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    jsonResponse(['error' => 'JSON inválido en el cuerpo de la petición.'], 400);
}

$searchTerm   = trim((string) ($input['search_term']   ?? ''));
$resultsCount = min(4294967295, max(0, (int) ($input['results_count'] ?? 0)));

if ($searchTerm === '') {
    jsonResponse(['error' => 'El campo search_term es obligatorio.'], 400);
}

if (strlen($searchTerm) > 200) {
    jsonResponse(['error' => 'El término de búsqueda supera los 200 caracteres.'], 400);
}

try {
    $conn      = getConnection();
    $sessionId = session_id();

    $stmt = $conn->prepare(
        'INSERT INTO search_history (session_id, search_term, results_count) VALUES (?, ?, ?)'
    );
    $stmt->bind_param('ssi', $sessionId, $searchTerm, $resultsCount);
    $stmt->execute();

    $insertedId = (int) $conn->insert_id;

    $stmt->close();
    $conn->close();

    jsonResponse([
        'success' => true,
        'id'      => $insertedId,
        'message' => 'Búsqueda guardada correctamente.',
    ], 201);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Error interno del servidor.'], 500);
}
