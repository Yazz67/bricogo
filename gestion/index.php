<?php
/* ===========================
   ESPACE DE GESTION — page d'entrée
   - 1re visite : création du compte (protégée par le code d'installation de config.php)
   - ensuite : connexion par identifiant + mot de passe, puis l'application
=========================== */

require __DIR__ . '/lib/bootstrap.php';

$erreur = '';

if (isset($_GET['deconnexion']) && csrf_valide($_GET['deconnexion'])) {
    deconnecter();
    header('Location: ./');
    exit;
}

$installation = !compte_existe();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_valide($_POST['csrf'] ?? null)) {
        $erreur = 'La page a expiré, réessaie.';
    } elseif (est_bloque()) {
        $erreur = 'Trop de tentatives. Réessaie dans 15 minutes.';
    } elseif ($installation) {
        $config = __DIR__ . '/config.php';
        if (is_file($config)) {
            require $config;
        }
        $identifiant = trim($_POST['identifiant'] ?? '');
        $mdp = (string)($_POST['mdp'] ?? '');
        if (!defined('CODE_INSTALLATION') || strlen(CODE_INSTALLATION) < 12 || CODE_INSTALLATION === 'remplace-moi-par-un-code-secret' || !hash_equals(CODE_INSTALLATION, trim($_POST['code'] ?? ''))) {
            noter_echec();
            $erreur = "Code d'installation incorrect.";
        } elseif (!preg_match('/^[A-Za-z0-9._@-]{3,50}$/', $identifiant)) {
            $erreur = 'Identifiant : 3 à 50 caractères (lettres, chiffres, . _ @ -).';
        } elseif (mb_strlen($mdp) < 10) {
            $erreur = 'Mot de passe : 10 caractères minimum.';
        } elseif ($mdp !== ($_POST['mdp2'] ?? '')) {
            $erreur = 'Les deux mots de passe ne sont pas identiques.';
        } else {
            gestion_db()->prepare('INSERT INTO users (identifiant, hash) VALUES (?, ?)')
                ->execute([$identifiant, password_hash($mdp, PASSWORD_DEFAULT)]);
            gestion_param_set('ics_token', bin2hex(random_bytes(20)));
            connecter($identifiant, $mdp);
            header('Location: ./');
            exit;
        }
    } else {
        if (connecter(trim($_POST['identifiant'] ?? ''), (string)($_POST['mdp'] ?? ''))) {
            header('Location: ./');
            exit;
        }
        $erreur = 'Identifiant ou mot de passe incorrect.';
    }
}

$connecte = est_connecte();
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b0b0e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Brico'Go Pro">
<title>Brico'Go — Gestion</title>
<link rel="icon" type="image/png" href="../icon/favicon-32.png">
<link rel="apple-touch-icon" href="../icon/apple-touch-icon-iphone-retina.png">
<link rel="stylesheet" href="app.css?v=2">
</head>
<body class="<?= $connecte ? 'app' : 'auth' ?>">

<div class="ambient" aria-hidden="true"><span class="orb orb-1"></span><span class="orb orb-2"></span></div>

<?php if (!$connecte): ?>
<main class="auth-wrap">
  <form class="auth-card glass" method="post" autocomplete="on">
    <img src="../img/logo.png" alt="Brico'Go" class="auth-logo">
    <h1><?= $installation ? 'Créer ton accès' : 'Espace de gestion' ?></h1>
    <p class="muted"><?= $installation
        ? "Première connexion : choisis ton identifiant et ton mot de passe. Le code d'installation se trouve dans le fichier config.php."
        : 'Connecte-toi pour accéder à tes chantiers, devis et factures.' ?></p>

    <?php if ($erreur): ?><div class="alert"><?= e($erreur) ?></div><?php endif; ?>

    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
    <?php if ($installation): ?>
      <label>Code d'installation<input name="code" required autocomplete="off"></label>
    <?php endif; ?>
    <label>Identifiant<input name="identifiant" required autocomplete="username" autocapitalize="none" value="<?= e($_POST['identifiant'] ?? '') ?>"></label>
    <label>Mot de passe<input type="password" name="mdp" required autocomplete="<?= $installation ? 'new-password' : 'current-password' ?>"></label>
    <?php if ($installation): ?>
      <label>Confirme le mot de passe<input type="password" name="mdp2" required autocomplete="new-password"></label>
    <?php endif; ?>
    <button class="btn btn-primary btn-block" type="submit"><?= $installation ? 'Créer mon accès' : 'Se connecter' ?></button>
    <a class="auth-back" href="../">← Retour au site</a>
  </form>
</main>

<?php else: ?>
<div class="shell">
  <aside class="sidebar glass">
    <a class="brand" href="#tableau-de-bord"><img src="../img/logo.png" alt="Brico'Go"></a>
    <nav class="nav" id="nav"></nav>
    <a class="logout" href="?deconnexion=<?= e($_SESSION['csrf']) ?>">Déconnexion</a>
  </aside>
  <main class="main">
    <header class="topbar">
      <h1 id="titre">Tableau de bord</h1>
      <div class="topbar-actions" id="actions"></div>
    </header>
    <div id="vue" class="vue"></div>
  </main>
  <nav class="tabbar glass" id="tabbar"></nav>
</div>
<div id="modal-root"></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script>window.CSRF = <?= json_encode($_SESSION['csrf']) ?>;</script>
<script src="app.js?v=2"></script>
<?php endif; ?>
</body>
</html>
