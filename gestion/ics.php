<?php
/* ===========================
   CALENDRIER (format .ics, compatible Apple Calendrier, Google, Outlook)
   - ics.php?t=JETON : abonnement à tous les chantiers (se met à jour tout seul)
   - ics.php?id=12   : un seul chantier à ajouter (connexion requise)
=========================== */

require_once __DIR__ . '/lib/db.php';

date_default_timezone_set('Europe/Paris');

function ics_texte(string $s): string
{
    return str_replace(["\\", ';', ',', "\r\n", "\n", "\r"], ["\\\\", '\;', '\,', '\n', '\n', ''], $s);
}

// Lignes de 75 octets maximum, comme l'exige le format iCalendar
function ics_ligne(string $s): string
{
    $out = '';
    while (strlen($s) > 75) {
        $coupe = 75;
        while ($coupe > 0 && (ord($s[$coupe]) & 0xC0) === 0x80) {
            $coupe--; // ne pas couper au milieu d'un caractère UTF-8
        }
        $out .= substr($s, 0, $coupe) . "\r\n ";
        $s = substr($s, $coupe);
    }
    return $out . $s . "\r\n";
}

function ics_utc(string $date, string $heure): string
{
    $dt = new DateTime("$date $heure", new DateTimeZone('Europe/Paris'));
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Ymd\THis\Z');
}

function ics_evenement(array $c, string $hote): string
{
    $statuts = ['prevu' => 'Prévu', 'en_cours' => 'En cours', 'termine' => 'Terminé', 'annule' => 'Annulé'];
    $fin = $c['date_fin'] ?: $c['date_debut'];

    $v = ics_ligne('BEGIN:VEVENT');
    $v .= ics_ligne('UID:chantier-' . $c['id'] . '@' . $hote);
    $v .= ics_ligne('DTSTAMP:' . gmdate('Ymd\THis\Z'));
    if ($c['heure_debut'] !== '') {
        $v .= ics_ligne('DTSTART:' . ics_utc($c['date_debut'], $c['heure_debut']));
        $heureFin = $c['heure_fin'] ?: date('H:i', strtotime($c['heure_debut'] . ' +2 hours'));
        $v .= ics_ligne('DTEND:' . ics_utc($fin, $heureFin));
    } else {
        $v .= ics_ligne('DTSTART;VALUE=DATE:' . str_replace('-', '', $c['date_debut']));
        $v .= ics_ligne('DTEND;VALUE=DATE:' . date('Ymd', strtotime($fin . ' +1 day')));
    }
    $titre = $c['titre'] . ($c['client_nom'] ? ' — ' . $c['client_nom'] : '');
    $v .= ics_ligne('SUMMARY:' . ics_texte($titre));
    if ($c['adresse'] !== '') {
        $v .= ics_ligne('LOCATION:' . ics_texte($c['adresse']));
    }
    $desc = 'Statut : ' . ($statuts[$c['statut']] ?? $c['statut']);
    if ($c['client_tel']) {
        $desc .= "\nTél. client : " . $c['client_tel'];
    }
    if ($c['notes'] !== '') {
        $desc .= "\n\n" . $c['notes'];
    }
    $v .= ics_ligne('DESCRIPTION:' . ics_texte($desc));
    if ($c['statut'] === 'annule') {
        $v .= ics_ligne('STATUS:CANCELLED');
    }
    return $v . ics_ligne('END:VEVENT');
}

$db = gestion_db();
$hote = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['HTTP_HOST'] ?? 'brico-go.fr');
$sql = 'SELECT ch.*, c.nom AS client_nom, c.telephone AS client_tel FROM chantiers ch LEFT JOIN clients c ON c.id = ch.client_id';

if (isset($_GET['t'])) {
    $jeton = gestion_param('ics_token');
    if ($jeton === '' || !hash_equals($jeton, (string)$_GET['t'])) {
        http_response_code(404);
        exit('Introuvable');
    }
    $st = $db->prepare("$sql WHERE ch.statut <> 'annule' AND COALESCE(NULLIF(ch.date_fin,''), ch.date_debut) >= ? ORDER BY ch.date_debut");
    $st->execute([date('Y-m-d', strtotime('-90 days'))]);
    $chantiers = $st->fetchAll();
    $nomFichier = 'chantiers-bricogo.ics';
} else {
    require_once __DIR__ . '/lib/bootstrap.php';
    exiger_connexion_page();
    $st = $db->prepare("$sql WHERE ch.id = ?");
    $st->execute([(int)($_GET['id'] ?? 0)]);
    $chantiers = $st->fetchAll();
    if (!$chantiers) {
        http_response_code(404);
        exit('Chantier introuvable');
    }
    $nomFichier = 'chantier-' . $chantiers[0]['id'] . '.ics';
}

$out = ics_ligne('BEGIN:VCALENDAR')
     . ics_ligne('VERSION:2.0')
     . ics_ligne("PRODID:-//Brico'Go//Gestion//FR")
     . ics_ligne('CALSCALE:GREGORIAN')
     . ics_ligne('METHOD:PUBLISH')
     . ics_ligne("X-WR-CALNAME:Chantiers Brico'Go")
     . ics_ligne('X-WR-TIMEZONE:Europe/Paris')
     . ics_ligne('REFRESH-INTERVAL;VALUE=DURATION:PT1H')
     . ics_ligne('X-PUBLISHED-TTL:PT1H');
foreach ($chantiers as $c) {
    $out .= ics_evenement($c, $hote);
}
$out .= ics_ligne('END:VCALENDAR');

header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: ' . (isset($_GET['t']) ? 'inline' : 'attachment') . '; filename="' . $nomFichier . '"');
header('Cache-Control: no-cache');
echo $out;
