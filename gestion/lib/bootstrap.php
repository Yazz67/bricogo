<?php
/* ===========================
   SOCLE COMMUN : sessions, authentification, sécurité
=========================== */

require_once __DIR__ . '/db.php';

date_default_timezone_set('Europe/Paris');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

const SESSION_DUREE    = 60 * 60 * 12; // déconnexion après 12 h d'inactivité
const ESSAIS_MAX       = 5;            // tentatives de connexion avant blocage
const BLOCAGE_SECONDES = 15 * 60;

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_name('bricogo_gestion');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

if (isset($_SESSION['vu']) && time() - $_SESSION['vu'] > SESSION_DUREE) {
    $_SESSION = [];
    session_regenerate_id(true);
}
$_SESSION['vu'] = time();

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function est_connecte(): bool
{
    return !empty($_SESSION['user_id']);
}

function compte_existe(): bool
{
    return (int)gestion_db()->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0;
}

function ip_client(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
}

function est_bloque(): bool
{
    $db = gestion_db();
    $db->prepare('DELETE FROM login_attempts WHERE ts < ?')->execute([time() - BLOCAGE_SECONDES]);
    $st = $db->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ?');
    $st->execute([ip_client()]);
    return (int)$st->fetchColumn() >= ESSAIS_MAX;
}

function noter_echec(): void
{
    gestion_db()->prepare('INSERT INTO login_attempts (ip, ts) VALUES (?, ?)')->execute([ip_client(), time()]);
}

function connecter(string $identifiant, string $mdp): bool
{
    $st = gestion_db()->prepare('SELECT id, hash FROM users WHERE identifiant = ?');
    $st->execute([$identifiant]);
    $u = $st->fetch();
    if (!$u || !password_verify($mdp, $u['hash'])) {
        noter_echec();
        return false;
    }
    gestion_db()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([ip_client()]);
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$u['id'];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return true;
}

function deconnecter(): void
{
    $_SESSION = [];
    session_regenerate_id(true);
}

function csrf_valide(?string $jeton): bool
{
    return is_string($jeton) && hash_equals($_SESSION['csrf'] ?? '', $jeton);
}

function e(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

function euros(int $centimes): string
{
    return number_format($centimes / 100, 2, ',', "\u{202F}") . "\u{00A0}€";
}

function exiger_connexion_page(): void
{
    if (!est_connecte()) {
        header('Location: ./');
        exit;
    }
}
