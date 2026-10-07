<?php
/* ===========================
   CONFIGURATION DE L'ENVOI DES MAILS
   1. Copie ce fichier et renomme la copie en « contact-config.php »
      (dans le même dossier que contact.php)
   2. Remplis les 3 valeurs ci-dessous
   Ce fichier contient un mot de passe : ne le partage pas.
=========================== */

// Adresse créée dans cPanel > Comptes de messagerie (ex. contact@tondomaine.fr)
const SMTP_UTILISATEUR = 'contact@tondomaine.fr';

// Mot de passe de cette adresse
const SMTP_MOT_DE_PASSE = 'ton-mot-de-passe';

// Serveur sortant : cPanel > Comptes de messagerie > « Connect Devices »
// (ligne « Serveur sortant », souvent du type xxxx.o2switch.net)
const SMTP_SERVEUR = 'xxxx.o2switch.net';
