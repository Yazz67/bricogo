<?php
/* ===========================
   FORMULAIRE DE CONTACT — envoi via l'hébergeur (o2switch)
=========================== */

// Adresse qui reçoit les demandes de devis
const DESTINATAIRE = 'pro.dig201@passmail.net';

// Expéditeur technique : une adresse de ton domaine (ex. no-reply@tondomaine.fr).
// Laisser vide pour utiliser automatiquement no-reply@<domaine du site>.
const EXPEDITEUR = '';

// Délai minimum entre deux envois depuis la même adresse IP (secondes)
const DELAI_ANTI_SPAM = 30;

header('Content-Type: application/json; charset=utf-8');

function repondre(int $code, bool $ok, string $message): void
{
    $ajax = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';
    if (!$ajax) {
        // Navigateur sans JavaScript : retour sur la page
        header('Location: index.html?envoi=' . ($ok ? 'ok' : 'erreur') . '#contact', true, 303);
        exit;
    }
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function champ(string $nom, int $max): string
{
    $valeur = trim((string)($_POST[$nom] ?? ''));
    return mb_substr($valeur, 0, $max);
}

function sans_retour_ligne(string $s): string
{
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], ' ', $s));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    repondre(405, false, 'Méthode non autorisée.');
}

// Piège à robots : ce champ est invisible pour les humains
if (champ('site_web', 200) !== '') {
    repondre(200, true, 'Message envoyé avec succès !');
}

$nom     = sans_retour_ligne(champ('name', 100));
$email   = sans_retour_ligne(champ('email', 200));
$tel     = sans_retour_ligne(champ('phone', 40));
$objet   = sans_retour_ligne(champ('title', 150));
$message = champ('message', 5000);

if ($nom === '' || $tel === '' || $objet === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    repondre(422, false, 'Merci de remplir correctement tous les champs.');
}

// Anti-spam simple : un envoi toutes les X secondes par IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
$verrou = sys_get_temp_dir() . '/bricogo_contact_' . md5($ip);
if (is_file($verrou) && time() - filemtime($verrou) < DELAI_ANTI_SPAM) {
    repondre(429, false, 'Merci de patienter quelques secondes avant un nouvel envoi.');
}

$domaine = preg_replace('/^www\./', '', strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0]));
$expediteur = EXPEDITEUR !== '' ? EXPEDITEUR : 'no-reply@' . $domaine;

$sujet = "Demande de devis : $objet";
$corps = "Nouvelle demande depuis le site Brico'Go\n"
       . "----------------------------------------\n\n"
       . "Nom       : $nom\n"
       . "Email     : $email\n"
       . "Téléphone : $tel\n"
       . "Objet     : $objet\n\n"
       . "Message :\n$message\n\n"
       . "----------------------------------------\n"
       . 'Envoyé le ' . date('d/m/Y à H:i') . " depuis $domaine\n";

$entetes = [
    'From'                      => "Site Brico'Go <$expediteur>",
    'Reply-To'                  => "$nom <$email>",
    'MIME-Version'              => '1.0',
    'Content-Type'              => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer'                  => 'PHP',
];

$envoye = mail(
    DESTINATAIRE,
    '=?UTF-8?B?' . base64_encode($sujet) . '?=',
    $corps,
    $entetes,
    '-f' . $expediteur
);

if (!$envoye) {
    repondre(500, false, "Erreur lors de l'envoi. Appelez-nous au 07 81 56 05 38.");
}

@touch($verrou);
repondre(200, true, 'Message envoyé avec succès ! Nous vous répondons rapidement.');
