<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'wikipedia_search');
define('DB_CHARSET', 'utf8mb4');

function getConnection(): mysqli
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int) DB_PORT);
    if ($conn->connect_error) {
        throw new Exception('Error al conectar con la base de datos.');
    }
    $conn->set_charset(DB_CHARSET);
    $conn->query("SET time_zone = '+00:00'");
    return $conn;
}

function jsonResponse(array $data, int $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
