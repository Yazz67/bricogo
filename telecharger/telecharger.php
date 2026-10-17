<?php
/* ===========================
   TÉLÉCHARGEUR MP4 — récupère une vidéo à partir d'un lien direct
   et la renvoie au navigateur en tant que fichier à enregistrer.
   Protégé contre les liens vers le réseau interne (SSRF).
=========================== */

// Taille maximale d'une vidéo (octets) — 2 Go
const TAILLE_MAX = 2 * 1024 * 1024 * 1024;
// Nombre maximum de redirections suivies
const REDIRECTIONS_MAX = 5;

set_time_limit(0);

function erreur(int $code, string $message): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

// Vérifie le lien et renvoie [hôte, port, ip] — refuse les adresses privées
function verifierLien(string $url): array
{
    $p = parse_url($url);
    if (!$p || !in_array(strtolower($p['scheme'] ?? ''), ['http', 'https'], true) || empty($p['host'])) {
        erreur(400, 'Lien invalide : il doit commencer par http:// ou https://');
    }
    if (isset($p['user']) || isset($p['pass'])) {
        erreur(400, 'Lien invalide.');
    }
    $hote = trim($p['host'], '[]');
    $port = $p['port'] ?? (strtolower($p['scheme']) === 'https' ? 443 : 80);

    $ips = filter_var($hote, FILTER_VALIDATE_IP) ? [$hote] : array_merge(
        array_column(dns_get_record($hote, DNS_A) ?: [], 'ip'),
        array_column(dns_get_record($hote, DNS_AAAA) ?: [], 'ipv6')
    );
    if (!$ips) {
        erreur(400, 'Site introuvable.');
    }
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            erreur(400, 'Ce lien n\'est pas autorisé.');
        }
    }
    return [$hote, $port, $ips[0]];
}

function nomFichier(string $url, string $disposition): string
{
    if (preg_match('/filename\*?=(?:UTF-8\'\')?"?([^";]+)"?/i', $disposition, $m)) {
        $nom = rawurldecode($m[1]);
    } else {
        $nom = rawurldecode(basename(parse_url($url, PHP_URL_PATH) ?: ''));
    }
    $nom = preg_replace('/[^\w.\- ]+/u', '_', $nom);
    $nom = trim(preg_replace('/\.mp4$/i', '', $nom), ' ._');
    return ($nom !== '' ? mb_substr($nom, 0, 120) : 'video') . '.mp4';
}

$url = trim($_GET['url'] ?? '');
if ($url === '') {
    erreur(400, 'Aucun lien fourni.');
}

// Suit les redirections à la main pour vérifier chaque étape
$entetes = [];
for ($i = 0; ; $i++) {
    if ($i > REDIRECTIONS_MAX) {
        erreur(400, 'Trop de redirections.');
    }
    [$hote, $port, $ip] = verifierLien($url);
    $entetes = [];
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_NOBODY => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_RESOLVE => ["$hote:$port:" . (str_contains($ip, ':') ? "[$ip]" : $ip)],
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Telechargeur MP4)',
        CURLOPT_HEADERFUNCTION => function ($ch, $ligne) use (&$entetes) {
            if (str_contains($ligne, ':')) {
                [$k, $v] = explode(':', $ligne, 2);
                $entetes[strtolower(trim($k))] = trim($v);
            }
            return strlen($ligne);
        },
    ]);
    curl_exec($ch);
    $statut = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $redirection = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    $echec = curl_errno($ch);
    curl_close($ch);

    if ($echec) {
        erreur(502, 'Impossible de joindre ce lien.');
    }
    if ($statut >= 300 && $statut < 400 && $redirection) {
        $url = $redirection;
        continue;
    }
    // Certains serveurs refusent HEAD : on tente quand même le téléchargement
    if ($statut >= 400 && $statut !== 405 && $statut !== 403) {
        erreur(502, "Le site a répondu avec l'erreur $statut.");
    }
    break;
}

$type = strtolower($entetes['content-type'] ?? '');
$estMp4 = str_starts_with($type, 'video/mp4')
    || (preg_match('/\.mp4$/i', parse_url($url, PHP_URL_PATH) ?? '') && !str_starts_with($type, 'text/'));
if (!$estMp4) {
    erreur(415, 'Ce lien ne pointe pas vers une vidéo MP4.');
}
if (isset($entetes['content-length']) && (int) $entetes['content-length'] > TAILLE_MAX) {
    erreur(413, 'La vidéo est trop lourde.');
}

// Mode vérification : la page demande d'abord si le lien est valide
$nom = nomFichier($url, $entetes['content-disposition'] ?? '');
if (isset($_GET['verifier'])) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'nom' => $nom,
        'taille' => isset($entetes['content-length']) ? (int) $entetes['content-length'] : null,
    ]);
    exit;
}

// Téléchargement réel, envoyé au navigateur au fur et à mesure
$envoye = 0;
$debut = false;
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_RESOLVE => ["$hote:$port:" . (str_contains($ip, ':') ? "[$ip]" : $ip)],
    CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
    CURLOPT_CONNECTTIMEOUT => 20,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Telechargeur MP4)',
    CURLOPT_HEADERFUNCTION => function ($ch, $ligne) use (&$entetes) {
        if (preg_match('/^content-length:\s*(\d+)/i', $ligne, $m)) {
            $entetes['content-length'] = $m[1];
        }
        return strlen($ligne);
    },
    CURLOPT_WRITEFUNCTION => function ($ch, $morceau) use (&$envoye, &$debut, &$entetes, $nom) {
        if (!$debut) {
            $statut = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            if ($statut >= 300) {
                return -1;
            }
            $debut = true;
            while (ob_get_level()) {
                ob_end_clean();
            }
            header('Content-Type: video/mp4');
            header('Content-Disposition: attachment; filename="' . $nom . '"; filename*=UTF-8\'\'' . rawurlencode($nom));
            header('X-Content-Type-Options: nosniff');
            if (isset($entetes['content-length'])) {
                header('Content-Length: ' . $entetes['content-length']);
            }
        }
        $envoye += strlen($morceau);
        if ($envoye > TAILLE_MAX) {
            return -1;
        }
        echo $morceau;
        flush();
        return strlen($morceau);
    },
]);
curl_exec($ch);
$echec = curl_errno($ch);
curl_close($ch);

if (!$debut) {
    erreur(502, $echec ? 'Impossible de télécharger cette vidéo.' : 'Le site a refusé le téléchargement.');
}
