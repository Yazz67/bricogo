<?php
/* ===========================
   FORMULAIRE DE CONTACT — envoi via l'hébergeur (o2switch)
=========================== */

// Adresse(s) qui reçoivent les demandes de devis (tu peux en mettre plusieurs)
const DESTINATAIRES = [
    'huseyin@brico-go.fr',
];

// Adresse qui envoie le mail : toujours une vraie boîte de ton domaine,
// sinon les messageries (Gmail, Proton…) le refusent
const EXPEDITEUR = 'huseyin@brico-go.fr';

// Envoi authentifié (recommandé) : remplir contact-config.php
// (voir contact-config.exemple.php). Sans ce fichier, envoi simple via mail().
if (is_file(__DIR__ . '/contact-config.php')) {
    require __DIR__ . '/contact-config.php';
}

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

$envoye = false;

if (defined('SMTP_UTILISATEUR') && SMTP_UTILISATEUR !== '') {
    // Envoi SMTP authentifié avec la boîte mail du domaine
    require __DIR__ . '/lib/PHPMailer/Exception.php';
    require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
    require __DIR__ . '/lib/PHPMailer/SMTP.php';

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_SERVEUR;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_UTILISATEUR;
        $mail->Password   = SMTP_MOT_DE_PASSE;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(SMTP_UTILISATEUR, "Site Brico'Go");
        foreach (DESTINATAIRES as $destinataire) {
            $mail->addAddress($destinataire);
        }
        $mail->addReplyTo($email, $nom);
        $mail->Subject = $sujet;
        $mail->Body    = $corps;
        $mail->send();
        $envoye = true;
    } catch (Throwable $e) {
        error_log('Brico\'Go contact SMTP : ' . $mail->ErrorInfo);
        $envoye = false;
    }
}

if (!$envoye) {
    // Envoi simple via le serveur (secours si le SMTP n'est pas configuré ou échoue)
    $expediteur = defined('SMTP_UTILISATEUR') && SMTP_UTILISATEUR !== '' ? SMTP_UTILISATEUR : EXPEDITEUR;
    $entetes = [
        'From'                      => "Site Brico'Go <$expediteur>",
        'Reply-To'                  => "$nom <$email>",
        'MIME-Version'              => '1.0',
        'Content-Type'              => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => '8bit',
    ];
    $envoye = mail(
        implode(', ', DESTINATAIRES),
        '=?UTF-8?B?' . base64_encode($sujet) . '?=',
        $corps,
        $entetes,
        '-f' . $expediteur
    );
}

if (!$envoye) {
    repondre(500, false, "Erreur lors de l'envoi. Appelez-nous au 07 81 56 05 38.");
}

@touch($verrou);
repondre(200, true, 'Message envoyé avec succès ! Nous vous répondons rapidement.');
