<?php
// POST (owner only) raw file body. Saves to /uploads/YYYY/MM and returns its public URL.
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(['error' => 'Method not allowed'], 405);
require_admin();

// The app sends the raw file as the request body, with its name in the X-File-Name header.
$original = rawurldecode((string)($_SERVER['HTTP_X_FILE_NAME'] ?? 'file'));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'm4v', 'pdf', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'];
$ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
if (!in_array($ext, $allowed, true)) reply(['error' => "Files of type .$ext are not allowed."], 400);

$sub = date('Y/m');
$dir = dirname(__DIR__) . "/uploads/$sub";
if (!is_dir($dir) && !mkdir($dir, 0755, true)) reply(['error' => 'Could not create the uploads folder.'], 500);

$name = bin2hex(random_bytes(8)) . ".$ext";
$in = fopen('php://input', 'rb');
$out = fopen("$dir/$name", 'wb');
$size = ($in && $out) ? stream_copy_to_stream($in, $out) : false;
if ($in) fclose($in);
if ($out) fclose($out);
if (!$size) {
    @unlink("$dir/$name");
    reply(['error' => 'No file received, or the file is larger than the server upload limit.'], 400);
}

$url = rtrim($CONFIG['public_url'], '/') . "/uploads/$sub/$name";
$mime = (string)(mime_content_type("$dir/$name") ?: 'application/octet-stream');
db()->prepare('INSERT INTO files (original_name, path, url, mime, size) VALUES (?, ?, ?, ?, ?)')
    ->execute([mb_substr($original, 0, 255), "uploads/$sub/$name", $url, $mime, (int)$size]);

reply(['url' => $url, 'name' => $original, 'size' => (int)$size]);
