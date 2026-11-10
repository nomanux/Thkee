<?php
// GET: every saved app key. POST (owner only): {"items": {"thkee.key": "json text" | null}}
require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $rows = db()->query('SELECT state_key, value FROM app_state')->fetchAll();
    $out = new stdClass();
    foreach ($rows as $row) $out->{$row['state_key']} = $row['value'];
    reply($out);
}

if ($method !== 'POST') reply(['error' => 'Method not allowed'], 405);
require_admin();

$body = json_decode(file_get_contents('php://input') ?: '', true);
$items = is_array($body['items'] ?? null) ? $body['items'] : null;
if ($items === null) reply(['error' => 'Send {"items": {...}}'], 400);

$upsert = db()->prepare('INSERT INTO app_state (state_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)');
$delete = db()->prepare('DELETE FROM app_state WHERE state_key = ?');
$saved = 0;
foreach ($items as $key => $value) {
    if (!preg_match('/^thkee\.[A-Za-z0-9._-]{1,150}$/', (string)$key)) continue;
    if ($value === null) {
        $delete->execute([$key]);
    } elseif (is_string($value) && strlen($value) <= 16 * 1024 * 1024) {
        $upsert->execute([$key, $value]);
    } else {
        continue;
    }
    $saved++;
}
reply(['ok' => true, 'saved' => $saved]);
