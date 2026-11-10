<?php
// Health check: database status, owner key status and PHP upload limits.
require __DIR__ . '/lib.php';

db();
reply([
    'ok' => true,
    'database' => 'connected',
    'admin' => is_admin(),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
]);
