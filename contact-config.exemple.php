<?php
/* ===========================
   CONFIGURATION DE L'ENVOI DES MAILS
   1. Copie ce fichier et renomme la copie en « contact-config.php »
      (dans le même dossier que contact.php)
   2. Remplis les 3 valeurs ci-dessous
   Ce fichier contient un mot de passe : ne le partage pas.
=========================== */

// Adresse créée dans cPanel > Comptes de messagerie
const SMTP_UTILISATEUR = 'huseyin@brico-go.fr';

// Mot de passe de cette adresse
const SMTP_MOT_DE_PASSE = 'METS-ICI-TON-MOT-DE-PASSE';

// Serveur sortant : cPanel > Comptes de messagerie > « Connect Devices »
// (ligne « Serveur sortant »). Si ce n'est pas mail.brico-go.fr, remplace-le.
const SMTP_SERVEUR = 'mail.brico-go.fr';
