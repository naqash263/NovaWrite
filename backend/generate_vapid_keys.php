<?php

require_once 'vendor/autoload.php';

use Minishlink\WebPush\VAPID;

try {
    $keys = VAPID::createVapidKeys();
    echo "VAPID Public Key: " . $keys['publicKey'] . PHP_EOL;
    echo "VAPID Private Key: " . $keys['privateKey'] . PHP_EOL;
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
