<?php
/* ===========================
   API JSON de l'espace de gestion
   Toutes les requêtes : POST, connecté, jeton CSRF dans l'en-tête X-CSRF.
   Montants : renvoyés en centimes ; reçus en euros dans les formulaires.
=========================== */

require __DIR__ . '/lib/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function ok($data = null): never
{
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function erreur(string $message, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    erreur('Méthode non autorisée.', 405);
}
if (!est_connecte()) {
    erreur('Session expirée, reconnecte-toi.', 401);
}
if (!csrf_valide($_SERVER['HTTP_X_CSRF'] ?? null)) {
    erreur('Jeton de sécurité invalide, recharge la page.', 403);
}

$req = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$action = (string)($req['action'] ?? '');
$d = is_array($req['data'] ?? null) ? $req['data'] : [];
$db = gestion_db();

/* ---------- Validation ---------- */

function txt(array $d, string $cle, int $max = 500): string
{
    return mb_substr(trim((string)($d[$cle] ?? '')), 0, $max);
}

function entier(array $d, string $cle): int
{
    return (int)($d[$cle] ?? 0);
}

function id_ou_null(array $d, string $cle): ?int
{
    $v = (int)($d[$cle] ?? 0);
    return $v > 0 ? $v : null;
}

function date_valide(string $s, bool $obligatoire = false): string
{
    if ($s === '' && !$obligatoire) {
        return '';
    }
    $dt = DateTime::createFromFormat('!Y-m-d', $s);
    if (!$dt || $dt->format('Y-m-d') !== $s) {
        erreur('Date invalide.');
    }
    return $s;
}

function heure_valide(string $s): string
{
    if ($s === '') {
        return '';
    }
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $s)) {
        erreur('Heure invalide.');
    }
    return $s;
}

function choix(string $s, array $permis, string $defaut): string
{
    return in_array($s, $permis, true) ? $s : $defaut;
}

function en_centimes($euros): int
{
    $v = str_replace([' ', "\u{202F}", "\u{00A0}", ','], ['', '', '', '.'], (string)$euros);
    return is_numeric($v) ? (int)round((float)$v * 100) : 0;
}

const STATUTS_CHANTIER = ['prevu', 'en_cours', 'termine', 'annule'];
const STATUTS_DEVIS    = ['brouillon', 'envoye', 'accepte', 'refuse'];
const STATUTS_FACTURE  = ['brouillon', 'envoyee', 'payee', 'annulee'];

/* ---------- Documents (devis / factures) ---------- */

function prochain_numero(string $type, string $date): string
{
    $prefixe = ($type === 'devis' ? 'D' : 'F') . '-' . substr($date, 0, 4) . '-';
    $st = gestion_db()->prepare('SELECT numero FROM documents WHERE type = ? AND numero LIKE ? ORDER BY numero DESC LIMIT 1');
    $st->execute([$type, $prefixe . '%']);
    $dernier = $st->fetchColumn();
    $n = $dernier ? (int)substr($dernier, strlen($prefixe)) + 1 : 1;
    return $prefixe . str_pad((string)$n, 4, '0', STR_PAD_LEFT);
}

function document_complet(int $id): array
{
    $db = gestion_db();
    $st = $db->prepare('SELECT d.*, c.nom AS client_nom FROM documents d LEFT JOIN clients c ON c.id = d.client_id WHERE d.id = ?');
    $st->execute([$id]);
    $doc = $st->fetch();
    if (!$doc) {
        erreur('Document introuvable.', 404);
    }
    $st = $db->prepare('SELECT designation, quantite, unite, prix_ht, tva FROM lignes WHERE document_id = ? ORDER BY position');
    $st->execute([$id]);
    $doc['lignes'] = $st->fetchAll();
    return $doc;
}

function enregistrer_lignes(int $docId, array $lignes): void
{
    $db = gestion_db();
    $franchise = gestion_param('tva_franchise', '1') === '1';
    $db->prepare('DELETE FROM lignes WHERE document_id = ?')->execute([$docId]);
    $ins = $db->prepare('INSERT INTO lignes (document_id, position, designation, quantite, unite, prix_ht, tva) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $ht = $tva = 0;
    $pos = 0;
    foreach (array_slice($lignes, 0, 200) as $l) {
        if (!is_array($l)) {
            continue;
        }
        $designation = txt($l, 'designation', 1000);
        if ($designation === '') {
            continue;
        }
        $q = (float)str_replace(',', '.', (string)($l['quantite'] ?? 1));
        $pu = en_centimes($l['prix_ht'] ?? 0);
        $taux = $franchise ? 0.0 : max(0.0, min(100.0, (float)str_replace(',', '.', (string)($l['tva'] ?? 0))));
        $ligneHt = (int)round($q * $pu);
        $ht += $ligneHt;
        $tva += (int)round($ligneHt * $taux / 100);
        $ins->execute([$docId, $pos++, $designation, $q, txt($l, 'unite', 20), $pu, $taux]);
    }
    $db->prepare('UPDATE documents SET total_ht = ?, total_tva = ?, total_ttc = ? WHERE id = ?')
        ->execute([$ht, $tva, $ht + $tva, $docId]);
}

function creer_document(string $type, array $champs, array $lignes): int
{
    $db = gestion_db();
    $champs['numero'] = prochain_numero($type, $champs['date_doc']);
    $champs['type'] = $type;
    $cols = implode(', ', array_keys($champs));
    $marques = implode(', ', array_fill(0, count($champs), '?'));
    $db->prepare("INSERT INTO documents ($cols) VALUES ($marques)")->execute(array_values($champs));
    $id = (int)$db->lastInsertId();
    enregistrer_lignes($id, $lignes);
    return $id;
}

/* ---------- Actions ---------- */

try {
    switch ($action) {

    /* ===== Tableau de bord ===== */
    case 'dashboard':
        $auj = date('Y-m-d');
        $mois = date('Y-m');
        $somme = function (string $sql, array $p = []) use ($db): array {
            $st = $db->prepare($sql);
            $st->execute($p);
            return $st->fetch();
        };

        $caMois  = $somme("SELECT COALESCE(SUM(total_ttc),0) AS t FROM documents WHERE type='facture' AND statut='payee' AND substr(paye_le,1,7)=?", [$mois]);
        $caAnnee = $somme("SELECT COALESCE(SUM(total_ttc),0) AS t FROM documents WHERE type='facture' AND statut='payee' AND substr(paye_le,1,4)=?", [date('Y')]);
        $aEnc    = $somme("SELECT COUNT(*) AS n, COALESCE(SUM(total_ttc),0) AS t FROM documents WHERE type='facture' AND statut='envoyee'");
        $retard  = $somme("SELECT COUNT(*) AS n, COALESCE(SUM(total_ttc),0) AS t FROM documents WHERE type='facture' AND statut='envoyee' AND date_limite<>'' AND date_limite<?", [$auj]);
        $devis   = $somme("SELECT COUNT(*) AS n, COALESCE(SUM(total_ttc),0) AS t FROM documents WHERE type='devis' AND statut='envoye'");
        $dem     = $somme("SELECT COUNT(*) AS n FROM demandes WHERE statut='nouvelle'");

        $st = $db->prepare("SELECT ch.*, c.nom AS client_nom FROM chantiers ch LEFT JOIN clients c ON c.id=ch.client_id
            WHERE ch.statut<>'annule' AND COALESCE(NULLIF(ch.date_fin,''), ch.date_debut) >= ? AND ch.date_debut <= ?
            ORDER BY ch.date_debut, ch.heure_debut LIMIT 20");
        $st->execute([$auj, date('Y-m-d', strtotime('+7 days'))]);
        $semaine = $st->fetchAll();

        $st = $db->prepare("SELECT d.id, d.numero, d.total_ttc, d.date_limite, c.nom AS client_nom FROM documents d LEFT JOIN clients c ON c.id=d.client_id
            WHERE d.type='facture' AND d.statut='envoyee' AND d.date_limite<>'' AND d.date_limite<? ORDER BY d.date_limite LIMIT 10");
        $st->execute([$auj]);
        $facturesRetard = $st->fetchAll();

        $devisAttente = $db->query("SELECT d.id, d.numero, d.total_ttc, d.date_doc, d.objet, c.nom AS client_nom FROM documents d LEFT JOIN clients c ON c.id=d.client_id
            WHERE d.type='devis' AND d.statut='envoye' ORDER BY d.date_doc DESC LIMIT 6")->fetchAll();

        $serie = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime("first day of -$i month"));
            $serie[$m] = 0;
        }
        $st = $db->prepare("SELECT substr(paye_le,1,7) AS m, SUM(total_ttc) AS t FROM documents
            WHERE type='facture' AND statut='payee' AND paye_le >= ? GROUP BY m");
        $st->execute([array_key_first($serie) . '-01']);
        foreach ($st->fetchAll() as $r) {
            if (isset($serie[$r['m']])) {
                $serie[$r['m']] = (int)$r['t'];
            }
        }

        ok([
            'ca_mois'          => (int)$caMois['t'],
            'ca_annee'         => (int)$caAnnee['t'],
            'a_encaisser'      => ['n' => (int)$aEnc['n'], 't' => (int)$aEnc['t']],
            'retard'           => ['n' => (int)$retard['n'], 't' => (int)$retard['t']],
            'devis_attente'    => ['n' => (int)$devis['n'], 't' => (int)$devis['t']],
            'demandes'         => (int)$dem['n'],
            'semaine'          => $semaine,
            'factures_retard'  => $facturesRetard,
            'devis_liste'      => $devisAttente,
            'ca_6_mois'        => array_map(fn($m, $t) => ['mois' => $m, 'total' => $t], array_keys($serie), $serie),
        ]);

    /* ===== Clients ===== */
    case 'clients.list':
        $q = '%' . txt($d, 'q', 100) . '%';
        $st = $db->prepare("SELECT c.*,
                (SELECT COUNT(*) FROM chantiers WHERE client_id=c.id) AS nb_chantiers,
                (SELECT COALESCE(SUM(total_ttc),0) FROM documents WHERE client_id=c.id AND type='facture' AND statut='payee') AS ca
            FROM clients c WHERE c.nom LIKE ? OR c.telephone LIKE ? OR c.email LIKE ? OR c.adresse LIKE ?
            ORDER BY c.nom COLLATE NOCASE");
        $st->execute([$q, $q, $q, $q]);
        ok($st->fetchAll());

    case 'clients.get':
        $id = entier($d, 'id');
        $st = $db->prepare('SELECT * FROM clients WHERE id = ?');
        $st->execute([$id]);
        $client = $st->fetch() ?: erreur('Client introuvable.', 404);
        $st = $db->prepare('SELECT * FROM chantiers WHERE client_id = ? ORDER BY date_debut DESC');
        $st->execute([$id]);
        $client['chantiers'] = $st->fetchAll();
        $st = $db->prepare('SELECT id, type, numero, date_doc, statut, total_ttc, objet FROM documents WHERE client_id = ? ORDER BY date_doc DESC, id DESC');
        $st->execute([$id]);
        $client['documents'] = $st->fetchAll();
        ok($client);

    case 'clients.save':
        $nom = txt($d, 'nom', 150);
        if ($nom === '') {
            erreur('Le nom du client est obligatoire.');
        }
        $vals = [$nom, txt($d, 'telephone', 40), txt($d, 'email', 200), txt($d, 'adresse', 500), txt($d, 'notes', 5000)];
        if ($id = entier($d, 'id')) {
            $db->prepare('UPDATE clients SET nom=?, telephone=?, email=?, adresse=?, notes=? WHERE id=?')->execute([...$vals, $id]);
        } else {
            $db->prepare('INSERT INTO clients (nom, telephone, email, adresse, notes) VALUES (?, ?, ?, ?, ?)')->execute($vals);
            $id = (int)$db->lastInsertId();
        }
        ok(['id' => $id]);

    case 'clients.delete':
        $db->prepare('DELETE FROM clients WHERE id = ?')->execute([entier($d, 'id')]);
        ok();

    /* ===== Chantiers ===== */
    case 'chantiers.list':
        $where = ['1=1'];
        $p = [];
        if ($du = date_valide(txt($d, 'du'))) {
            $where[] = "COALESCE(NULLIF(ch.date_fin,''), ch.date_debut) >= ?";
            $p[] = $du;
        }
        if ($au = date_valide(txt($d, 'au'))) {
            $where[] = 'ch.date_debut <= ?';
            $p[] = $au;
        }
        if (($s = txt($d, 'statut')) && in_array($s, STATUTS_CHANTIER, true)) {
            $where[] = 'ch.statut = ?';
            $p[] = $s;
        }
        $st = $db->prepare('SELECT ch.*, c.nom AS client_nom, c.telephone AS client_tel FROM chantiers ch
            LEFT JOIN clients c ON c.id = ch.client_id WHERE ' . implode(' AND ', $where) . ' ORDER BY ch.date_debut DESC, ch.heure_debut');
        $st->execute($p);
        ok($st->fetchAll());

    case 'chantiers.save':
        $titre = txt($d, 'titre', 200);
        if ($titre === '') {
            erreur('Le titre du chantier est obligatoire.');
        }
        $debut = date_valide(txt($d, 'date_debut'), true);
        $fin = date_valide(txt($d, 'date_fin'));
        if ($fin !== '' && $fin < $debut) {
            erreur('La date de fin est avant la date de début.');
        }
        $vals = [
            id_ou_null($d, 'client_id'), $titre, txt($d, 'adresse', 500), $debut, heure_valide(txt($d, 'heure_debut')),
            $fin, heure_valide(txt($d, 'heure_fin')), choix(txt($d, 'statut'), STATUTS_CHANTIER, 'prevu'),
            en_centimes($d['montant_estime'] ?? 0), txt($d, 'notes', 5000),
        ];
        if ($id = entier($d, 'id')) {
            $db->prepare('UPDATE chantiers SET client_id=?, titre=?, adresse=?, date_debut=?, heure_debut=?, date_fin=?, heure_fin=?, statut=?, montant_estime=?, notes=? WHERE id=?')
                ->execute([...$vals, $id]);
        } else {
            $db->prepare('INSERT INTO chantiers (client_id, titre, adresse, date_debut, heure_debut, date_fin, heure_fin, statut, montant_estime, notes) VALUES (?,?,?,?,?,?,?,?,?,?)')
                ->execute($vals);
            $id = (int)$db->lastInsertId();
        }
        ok(['id' => $id]);

    case 'chantiers.delete':
        $db->prepare('DELETE FROM chantiers WHERE id = ?')->execute([entier($d, 'id')]);
        ok();

    /* ===== Devis & factures ===== */
    case 'documents.list':
        $type = choix(txt($d, 'type'), ['devis', 'facture'], 'devis');
        $st = $db->prepare("SELECT d.id, d.numero, d.date_doc, d.date_limite, d.statut, d.objet, d.total_ttc, d.client_id, c.nom AS client_nom
            FROM documents d LEFT JOIN clients c ON c.id = d.client_id WHERE d.type = ? ORDER BY d.date_doc DESC, d.id DESC");
        $st->execute([$type]);
        ok($st->fetchAll());

    case 'documents.get':
        ok(document_complet(entier($d, 'id')));

    case 'documents.save':
        $type = choix(txt($d, 'type'), ['devis', 'facture'], 'devis');
        $statuts = $type === 'devis' ? STATUTS_DEVIS : STATUTS_FACTURE;
        $champs = [
            'client_id'   => id_ou_null($d, 'client_id'),
            'chantier_id' => id_ou_null($d, 'chantier_id'),
            'date_doc'    => date_valide(txt($d, 'date_doc'), true),
            'date_limite' => date_valide(txt($d, 'date_limite')),
            'statut'      => choix(txt($d, 'statut'), $statuts, 'brouillon'),
            'objet'       => txt($d, 'objet', 300),
            'notes'       => txt($d, 'notes', 5000),
        ];
        if ($champs['client_id'] === null) {
            erreur('Choisis un client.');
        }
        if ($type === 'facture') {
            $st = $db->prepare('SELECT paye_le FROM documents WHERE id = ?');
            $st->execute([entier($d, 'id')]);
            $ancien = (string)$st->fetchColumn();
            $champs['paye_le'] = $champs['statut'] === 'payee' ? ($ancien ?: date('Y-m-d')) : '';
        }
        $lignes = is_array($d['lignes'] ?? null) ? $d['lignes'] : [];
        if ($id = entier($d, 'id')) {
            $set = implode(', ', array_map(fn($c) => "$c = ?", array_keys($champs)));
            $db->prepare("UPDATE documents SET $set WHERE id = ? AND type = ?")->execute([...array_values($champs), $id, $type]);
            enregistrer_lignes($id, $lignes);
        } else {
            $id = creer_document($type, $champs, $lignes);
        }
        ok(document_complet($id));

    case 'documents.statut':
        $doc = document_complet(entier($d, 'id'));
        $statuts = $doc['type'] === 'devis' ? STATUTS_DEVIS : STATUTS_FACTURE;
        $statut = choix(txt($d, 'statut'), $statuts, $doc['statut']);
        $payeLe = $statut === 'payee' ? (date_valide(txt($d, 'paye_le')) ?: date('Y-m-d')) : '';
        $db->prepare('UPDATE documents SET statut = ?, paye_le = ? WHERE id = ?')->execute([$statut, $payeLe, $doc['id']]);
        ok();

    case 'documents.delete':
        $doc = document_complet(entier($d, 'id'));
        if ($doc['type'] === 'facture' && $doc['statut'] !== 'brouillon') {
            erreur('Une facture émise ne peut pas être supprimée : passe-la en « Annulée ».');
        }
        $db->prepare('DELETE FROM documents WHERE id = ?')->execute([$doc['id']]);
        ok();

    case 'documents.dupliquer':
    case 'documents.convertir':
        $src = document_complet(entier($d, 'id'));
        $type = $action === 'documents.convertir' ? 'facture' : $src['type'];
        if ($action === 'documents.convertir' && $src['type'] !== 'devis') {
            erreur('Seul un devis peut être transformé en facture.');
        }
        $jours = (int)gestion_param('delai_paiement', '30');
        $lignes = array_map(fn($l) => [...$l, 'prix_ht' => $l['prix_ht'] / 100], $src['lignes']);
        $id = creer_document($type, [
            'client_id'   => $src['client_id'],
            'chantier_id' => $src['chantier_id'],
            'devis_id'    => $type === 'facture' && $src['type'] === 'devis' ? $src['id'] : null,
            'date_doc'    => date('Y-m-d'),
            'date_limite' => $type === 'facture' ? date('Y-m-d', strtotime("+$jours days")) : date('Y-m-d', strtotime('+' . (int)gestion_param('validite_devis', '30') . ' days')),
            'statut'      => 'brouillon',
            'objet'       => $src['objet'],
            'notes'       => $src['notes'],
        ], $lignes);
        if ($action === 'documents.convertir') {
            $db->prepare("UPDATE documents SET statut = 'accepte' WHERE id = ?")->execute([$src['id']]);
        }
        ok(document_complet($id));

    /* ===== Demandes reçues par le site ===== */
    case 'demandes.list':
        ok($db->query('SELECT * FROM demandes ORDER BY id DESC LIMIT 300')->fetchAll());

    case 'demandes.statut':
        $db->prepare('UPDATE demandes SET statut = ? WHERE id = ?')
            ->execute([choix(txt($d, 'statut'), ['nouvelle', 'traitee'], 'traitee'), entier($d, 'id')]);
        ok();

    case 'demandes.delete':
        $db->prepare('DELETE FROM demandes WHERE id = ?')->execute([entier($d, 'id')]);
        ok();

    case 'demandes.client':
        $st = $db->prepare('SELECT * FROM demandes WHERE id = ?');
        $st->execute([entier($d, 'id')]);
        $dem = $st->fetch() ?: erreur('Demande introuvable.', 404);
        $st = $db->prepare('SELECT id FROM clients WHERE (email <> \'\' AND email = ?) OR (telephone <> \'\' AND telephone = ?) LIMIT 1');
        $st->execute([$dem['email'], $dem['telephone']]);
        $clientId = (int)$st->fetchColumn();
        if (!$clientId) {
            $db->prepare('INSERT INTO clients (nom, telephone, email, notes) VALUES (?, ?, ?, ?)')
                ->execute([$dem['nom'], $dem['telephone'], $dem['email'], 'Demande du ' . $dem['created_at'] . ' : ' . $dem['objet']]);
            $clientId = (int)$db->lastInsertId();
        }
        $db->prepare("UPDATE demandes SET statut = 'traitee' WHERE id = ?")->execute([$dem['id']]);
        ok(['client_id' => $clientId, 'objet' => $dem['objet'], 'message' => $dem['message']]);

    /* ===== Paramètres ===== */
    case 'settings.get':
        $rows = $db->query('SELECT cle, valeur FROM settings')->fetchAll(PDO::FETCH_KEY_PAIR);
        unset($rows['ics_token']);
        $rows['tva_franchise'] = $rows['tva_franchise'] ?? '1';
        ok($rows + ['ics_url' => ics_url()]);

    case 'settings.save':
        $cles = ['entreprise_nom', 'entreprise_statut', 'entreprise_adresse', 'entreprise_tel', 'entreprise_email', 'entreprise_siret',
                 'entreprise_tva_intra', 'iban', 'bic', 'tva_franchise', 'tva_defaut', 'delai_paiement', 'validite_devis',
                 'mentions_devis', 'mentions_facture', 'assurance'];
        foreach ($cles as $cle) {
            if (array_key_exists($cle, $d)) {
                gestion_param_set($cle, txt($d, $cle, 3000));
            }
        }
        ok();

    case 'settings.ics_regen':
        gestion_param_set('ics_token', bin2hex(random_bytes(20)));
        ok(['ics_url' => ics_url()]);

    case 'compte.mdp':
        $st = $db->prepare('SELECT hash FROM users WHERE id = ?');
        $st->execute([$_SESSION['user_id']]);
        if (!password_verify((string)($d['ancien'] ?? ''), (string)$st->fetchColumn())) {
            erreur('Mot de passe actuel incorrect.');
        }
        $nouveau = (string)($d['nouveau'] ?? '');
        if (mb_strlen($nouveau) < 10) {
            erreur('Le nouveau mot de passe doit faire au moins 10 caractères.');
        }
        $db->prepare('UPDATE users SET hash = ? WHERE id = ?')->execute([password_hash($nouveau, PASSWORD_DEFAULT), $_SESSION['user_id']]);
        ok();

    default:
        erreur('Action inconnue.', 404);
    }
} catch (PDOException $e) {
    error_log('Brico\'Go gestion : ' . $e->getMessage());
    erreur('Erreur de base de données.', 500);
}

function ics_url(): string
{
    $hote = $_SERVER['HTTP_HOST'] ?? 'brico-go.fr';
    $chemin = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    return 'webcal://' . $hote . $chemin . '/ics.php?t=' . gestion_param('ics_token');
}
