<?php
/* ===========================
   FORMULAIRE DE CONTACT — envoi via l'hébergeur (o2switch)
=========================== */

// Adresse(s) qui reçoivent les demandes de devis (tu peux en mettre plusieurs)
const DESTINATAIRES = [
    'dalil7@proton.me',
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

date_default_timezone_set('Europe/Paris');
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
$date  = date('d/m/Y à H:i');

// Version texte (pour les messageries qui n'affichent pas le HTML)
$corps = "NOUVELLE DEMANDE DE DEVIS\n"
       . "Reçue le $date depuis $domaine\n\n"
       . "CLIENT\n"
       . "  Nom        $nom\n"
       . "  Téléphone  $tel\n"
       . "  Email      $email\n\n"
       . "OBJET\n"
       . "  $objet\n\n"
       . "MESSAGE\n"
       . preg_replace('/^/m', '  ', $message) . "\n\n"
       . "Pour répondre au client, utilise simplement « Répondre ».\n";

// Version HTML mise en page (styles en ligne, compatibles avec toutes les messageries)
$h = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$telLien  = preg_replace('/[^0-9+]/', '', $tel);
$mailLien = 'mailto:' . rawurlencode($email) . '?subject=' . rawurlencode("Re : $sujet");
$ligne = fn(string $label, string $valeur): string =>
    '<tr><td style="padding:10px 0;border-bottom:1px solid #eeeae2;color:#8a8578;font-size:13px;width:110px;vertical-align:top">'
    . $label . '</td><td style="padding:10px 0;border-bottom:1px solid #eeeae2;color:#1a1a1a;font-size:15px;font-weight:600">'
    . $valeur . '</td></tr>';

$corpsHtml = '<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f4f3ef">'
  . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:24px 12px"><tr><td align="center">'
  . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">'
  // En-tête
  . '<tr><td style="background:#0b0b0e;padding:22px 28px;border-bottom:4px solid #ffc93c">'
  . '<div style="color:#ffc93c;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Brico\'Go</div>'
  . '<div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px">Nouvelle demande de devis</div>'
  . '<div style="color:#a9a8b4;font-size:13px;margin-top:4px">Reçue le ' . $h($date) . '</div>'
  . '</td></tr>'
  // Objet
  . '<tr><td style="padding:24px 28px 8px">'
  . '<div style="display:inline-block;background:#fff4d6;color:#7a5500;font-size:13px;font-weight:700;padding:6px 12px;border-radius:20px">' . $h($objet) . '</div>'
  . '</td></tr>'
  // Coordonnées
  . '<tr><td style="padding:8px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
  . $ligne('Nom', $h($nom))
  . $ligne('Téléphone', '<a href="tel:' . $h($telLien) . '" style="color:#1a1a1a;text-decoration:none">' . $h($tel) . '</a>')
  . $ligne('Email', '<a href="mailto:' . $h($email) . '" style="color:#1a1a1a;text-decoration:none">' . $h($email) . '</a>')
  . '</table></td></tr>'
  // Message
  . '<tr><td style="padding:16px 28px 8px">'
  . '<div style="color:#8a8578;font-size:13px;margin-bottom:8px">Message</div>'
  . '<div style="background:#f8f7f3;border-left:4px solid #ffc93c;border-radius:8px;padding:16px 18px;color:#1a1a1a;font-size:15px;line-height:1.6">'
  . nl2br($h($message)) . '</div>'
  . '</td></tr>'
  // Boutons
  . '<tr><td style="padding:20px 28px 28px">'
  . '<a href="' . $h($mailLien) . '" style="display:inline-block;background:#ffc93c;color:#1a1206;font-size:15px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:24px;margin:0 8px 8px 0">Répondre au client</a>'
  . '<a href="tel:' . $h($telLien) . '" style="display:inline-block;background:#0b0b0e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:24px;margin:0 8px 8px 0">Appeler ' . $h($tel) . '</a>'
  . '</td></tr>'
  // Pied
  . '<tr><td style="background:#f8f7f3;padding:14px 28px;color:#8a8578;font-size:12px">'
  . 'Envoyé depuis le formulaire de ' . $h($domaine) . '. Le bouton « Répondre » de ta messagerie écrit directement au client.'
  . '</td></tr>'
  . '</table></td></tr></table></body></html>';

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
        $mail->XMailer    = ' '; // pas d'en-tête « X-Mailer: PHPMailer », mal vu des filtres anti-spam
        $mail->setFrom(SMTP_UTILISATEUR, "Client Brico'Go");
        foreach (DESTINATAIRES as $destinataire) {
            $mail->addAddress($destinataire);
        }
        $mail->addReplyTo($email, $nom);
        $mail->Subject = $sujet;
        // Version HTML + texte, comme un mail envoyé depuis le webmail
        $mail->isHTML(true);
        $mail->Body    = $corpsHtml;
        $mail->AltBody = $corps;
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
        'From'                      => "Client Brico'Go <$expediteur>",
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
