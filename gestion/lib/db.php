<?php
/* ===========================
   BASE DE DONNÉES (SQLite) — espace de gestion Brico'Go
   Le fichier est créé automatiquement dans gestion/data/ (accès web bloqué).
=========================== */

function gestion_db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }

    $dossier = __DIR__ . '/../data';
    if (!is_dir($dossier)) {
        mkdir($dossier, 0750, true);
    }

    $pdo = new PDO('sqlite:' . $dossier . '/gestion.sqlite', null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');

    gestion_migrer($pdo);
    return $pdo;
}

function gestion_migrer(PDO $pdo): void
{
    $version = (int)$pdo->query('PRAGMA user_version')->fetchColumn();

    if ($version < 1) {
        $pdo->exec("
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                identifiant TEXT NOT NULL UNIQUE,
                hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE login_attempts (
                ip TEXT NOT NULL,
                ts INTEGER NOT NULL
            );
            CREATE TABLE settings (
                cle TEXT PRIMARY KEY,
                valeur TEXT
            );
            CREATE TABLE clients (
                id INTEGER PRIMARY KEY,
                nom TEXT NOT NULL,
                telephone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                adresse TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE chantiers (
                id INTEGER PRIMARY KEY,
                client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
                titre TEXT NOT NULL,
                adresse TEXT DEFAULT '',
                date_debut TEXT NOT NULL,
                heure_debut TEXT DEFAULT '',
                date_fin TEXT DEFAULT '',
                heure_fin TEXT DEFAULT '',
                statut TEXT NOT NULL DEFAULT 'prevu',
                montant_estime INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE documents (
                id INTEGER PRIMARY KEY,
                type TEXT NOT NULL CHECK (type IN ('devis', 'facture')),
                numero TEXT NOT NULL UNIQUE,
                client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
                chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
                devis_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
                date_doc TEXT NOT NULL,
                date_limite TEXT DEFAULT '',
                statut TEXT NOT NULL,
                objet TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                total_ht INTEGER NOT NULL DEFAULT 0,
                total_tva INTEGER NOT NULL DEFAULT 0,
                total_ttc INTEGER NOT NULL DEFAULT 0,
                paye_le TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE lignes (
                id INTEGER PRIMARY KEY,
                document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                position INTEGER NOT NULL DEFAULT 0,
                designation TEXT NOT NULL,
                quantite REAL NOT NULL DEFAULT 1,
                unite TEXT DEFAULT '',
                prix_ht INTEGER NOT NULL DEFAULT 0,
                tva REAL NOT NULL DEFAULT 0
            );
            CREATE TABLE demandes (
                id INTEGER PRIMARY KEY,
                nom TEXT NOT NULL,
                email TEXT DEFAULT '',
                telephone TEXT DEFAULT '',
                objet TEXT DEFAULT '',
                message TEXT DEFAULT '',
                statut TEXT NOT NULL DEFAULT 'nouvelle',
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );
            CREATE INDEX idx_chantiers_date ON chantiers(date_debut);
            CREATE INDEX idx_documents_type ON documents(type, statut);
            CREATE INDEX idx_lignes_doc ON lignes(document_id);
            PRAGMA user_version = 1;
        ");
    }
}

/* Paramètres (clé → valeur) */
function gestion_param(string $cle, string $defaut = ''): string
{
    $st = gestion_db()->prepare('SELECT valeur FROM settings WHERE cle = ?');
    $st->execute([$cle]);
    $v = $st->fetchColumn();
    // Un champ laissé vide dans les Paramètres reprend la valeur par défaut
    return $v === false || $v === null || trim((string)$v) === '' ? $defaut : (string)$v;
}

function gestion_param_set(string $cle, string $valeur): void
{
    $st = gestion_db()->prepare('INSERT INTO settings (cle, valeur) VALUES (?, ?)
        ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur');
    $st->execute([$cle, $valeur]);
}

/* Enregistre une demande reçue par le formulaire du site (appelé par contact.php) */
function gestion_ajouter_demande(string $nom, string $email, string $tel, string $objet, string $message): void
{
    $heure = (new DateTime('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d H:i:s');
    $st = gestion_db()->prepare('INSERT INTO demandes (nom, email, telephone, objet, message, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    $st->execute([$nom, $email, $tel, $objet, $message, $heure]);
}
