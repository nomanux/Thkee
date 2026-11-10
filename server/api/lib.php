<?php
// Shared setup for the Thkee demo API: CORS, JSON replies, database and owner key.
declare(strict_types=1);

$CONFIG = require __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key, X-File-Name');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function reply($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function db(): PDO
{
    global $CONFIG;
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $pdo = new PDO(
            "mysql:host={$CONFIG['db_host']};dbname={$CONFIG['db_name']};charset=utf8mb4",
            $CONFIG['db_user'],
            $CONFIG['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (Throwable $e) {
        reply(['error' => 'Database connection failed. Check config.php.'], 500);
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS app_state (
        state_key VARCHAR(191) NOT NULL PRIMARY KEY,
        value LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS files (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        mime VARCHAR(120) NOT NULL,
        size BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    return $pdo;
}

function is_admin(): bool
{
    global $CONFIG;
    $key = (string)($CONFIG['admin_key'] ?? '');
    $sent = (string)($_SERVER['HTTP_X_ADMIN_KEY'] ?? '');
    return strlen($key) >= 12 && strpos($key, 'PASTE') !== 0 && hash_equals($key, $sent);
}

function require_admin(): void
{
    if (!is_admin()) reply(['error' => 'Only the site owner can save changes.'], 403);
}
