<?php
/* ===========================
   DEVIS / FACTURE — version imprimable (A4)
   « Imprimer » → « Enregistrer en PDF » pour l'envoyer au client.
=========================== */

require __DIR__ . '/lib/bootstrap.php';
exiger_connexion_page();

$db = gestion_db();
$st = $db->prepare('SELECT d.*, c.nom AS c_nom, c.adresse AS c_adresse, c.email AS c_email, c.telephone AS c_tel, ch.adresse AS ch_adresse
    FROM documents d LEFT JOIN clients c ON c.id = d.client_id LEFT JOIN chantiers ch ON ch.id = d.chantier_id WHERE d.id = ?');
$st->execute([(int)($_GET['id'] ?? 0)]);
$doc = $st->fetch();
if (!$doc) {
    http_response_code(404);
    exit('Document introuvable');
}
$st = $db->prepare('SELECT * FROM lignes WHERE document_id = ? ORDER BY position');
$st->execute([$doc['id']]);
$lignes = $st->fetchAll();

$p = fn(string $cle, string $defaut = '') => gestion_param($cle, $defaut);
$estDevis  = $doc['type'] === 'devis';
$franchise = $p('tva_franchise', '1') === '1';
$titre     = $estDevis ? 'Devis' : 'Facture';
$dateFr    = fn(string $d) => $d ? date('d/m/Y', strtotime($d)) : '';
$nombre    = fn(float $n) => rtrim(rtrim(number_format($n, 2, ',', "\u{202F}"), '0'), ',');

// Récapitulatif TVA par taux
$parTaux = [];
foreach ($lignes as $l) {
    $ht = (int)round($l['quantite'] * $l['prix_ht']);
    $t = (string)(float)$l['tva'];
    $parTaux[$t] = ($parTaux[$t] ?? 0) + $ht;
}
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= e($titre . ' ' . $doc['numero'] . ($doc['c_nom'] ? ' — ' . $doc['c_nom'] : '')) ?></title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 10.5pt; line-height: 1.45; background: #e9e7e1; }
  .page { width: 210mm; min-height: 297mm; margin: 24px auto; padding: 16mm 16mm 18mm; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.15); }
  .barre { position: sticky; top: 0; z-index: 2; display: flex; gap: 10px; justify-content: center; padding: 12px; background: #0b0b0e; }
  .barre button, .barre a { font: 600 14px Arial, sans-serif; padding: 10px 18px; border-radius: 22px; border: 0; cursor: pointer; text-decoration: none; }
  .barre button { background: #ffc93c; color: #1a1206; }
  .barre a { background: #2a2a31; color: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding-bottom: 14px; border-bottom: 3px solid #ffc93c; }
  header img { height: 62px; }
  .emetteur { text-align: right; font-size: 9.5pt; color: #444; }
  .emetteur strong { color: #111; font-size: 11pt; }
  .entete { display: flex; justify-content: space-between; gap: 24px; margin: 22px 0 18px; }
  h1 { font-size: 22pt; margin: 0 0 6px; letter-spacing: -.02em; }
  .meta { font-size: 10pt; color: #444; }
  .meta b { color: #111; }
  .client { min-width: 44%; border: 1px solid #e5e2da; border-radius: 8px; padding: 12px 14px; }
  .client small { display: block; color: #8a8578; text-transform: uppercase; letter-spacing: .08em; font-size: 8pt; margin-bottom: 4px; }
  .objet { margin: 0 0 14px; padding: 10px 14px; background: #faf8f2; border-left: 4px solid #ffc93c; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #0b0b0e; color: #fff; font-size: 9pt; font-weight: 600; text-align: left; padding: 8px; }
  thead th.n, td.n { text-align: right; white-space: nowrap; }
  tbody td { padding: 8px; border-bottom: 1px solid #ece9e1; vertical-align: top; }
  tbody tr { page-break-inside: avoid; }
  .totaux { margin-left: auto; margin-top: 14px; width: 52%; }
  .totaux td { padding: 6px 8px; }
  .totaux tr.ttc td { background: #ffc93c; font-weight: 700; font-size: 12pt; }
  .mentions { margin-top: 22px; font-size: 8.5pt; color: #555; white-space: pre-line; }
  .bloc { margin-top: 16px; font-size: 9.5pt; }
  .signature { display: flex; gap: 20px; margin-top: 24px; page-break-inside: avoid; }
  .signature div { flex: 1; border: 1px solid #ccc; border-radius: 8px; height: 34mm; padding: 10px; font-size: 9pt; color: #555; }
  footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #e5e2da; font-size: 8pt; color: #777; text-align: center; }
  @media print {
    body { background: #fff; }
    .barre { display: none; }
    .page { margin: 0; padding: 0; width: auto; min-height: 0; box-shadow: none; }
  }
  @media (max-width: 820px) { .page { width: auto; margin: 0; padding: 18px; } }
</style>
</head>
<body>
<div class="barre">
  <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  <a href="./#<?= $estDevis ? 'devis' : 'factures' ?>">← Retour</a>
</div>

<div class="page">
  <header>
    <img src="../img/logo.png" alt="Brico'Go">
    <div class="emetteur">
      <strong><?= e($p('entreprise_nom', "Brico'Go")) ?></strong><br>
      <?php if ($p('entreprise_statut')): ?><?= e($p('entreprise_statut')) ?><br><?php endif; ?>
      <?= nl2br(e($p('entreprise_adresse'))) ?><br>
      <?= e($p('entreprise_tel')) ?><?= $p('entreprise_tel') && $p('entreprise_email') ? ' · ' : '' ?><?= e($p('entreprise_email')) ?>
      <?php if ($p('entreprise_siret')): ?><br>SIRET : <?= e($p('entreprise_siret')) ?><?php endif; ?>
      <?php if (!$franchise && $p('entreprise_tva_intra')): ?><br>TVA : <?= e($p('entreprise_tva_intra')) ?><?php endif; ?>
    </div>
  </header>

  <div class="entete">
    <div>
      <h1><?= $titre ?> n° <?= e($doc['numero']) ?></h1>
      <div class="meta">
        Date : <b><?= $dateFr($doc['date_doc']) ?></b><br>
        <?php if ($doc['date_limite']): ?>
          <?= $estDevis ? 'Valable jusqu’au' : 'Échéance' ?> : <b><?= $dateFr($doc['date_limite']) ?></b><br>
        <?php endif; ?>
        <?php if (!$estDevis && $doc['statut'] === 'payee'): ?>Payée le : <b><?= $dateFr($doc['paye_le']) ?></b><br><?php endif; ?>
        <?php if ($doc['ch_adresse']): ?>Lieu des travaux : <b><?= e($doc['ch_adresse']) ?></b><?php endif; ?>
      </div>
    </div>
    <div class="client">
      <small>Client</small>
      <strong><?= e($doc['c_nom']) ?></strong><br>
      <?= nl2br(e($doc['c_adresse'])) ?>
      <?php if ($doc['c_tel'] || $doc['c_email']): ?><br><?= e(trim($doc['c_tel'] . ' · ' . $doc['c_email'], ' ·')) ?><?php endif; ?>
    </div>
  </div>

  <?php if ($doc['objet']): ?><div class="objet"><b>Objet :</b> <?= e($doc['objet']) ?></div><?php endif; ?>

  <table>
    <thead><tr>
      <th>Désignation</th><th class="n">Qté</th><th class="n">Prix unit. HT</th>
      <?php if (!$franchise): ?><th class="n">TVA</th><?php endif; ?>
      <th class="n">Total HT</th>
    </tr></thead>
    <tbody>
    <?php foreach ($lignes as $l): ?>
      <tr>
        <td><?= nl2br(e($l['designation'])) ?></td>
        <td class="n"><?= $nombre((float)$l['quantite']) ?> <?= e($l['unite']) ?></td>
        <td class="n"><?= euros((int)$l['prix_ht']) ?></td>
        <?php if (!$franchise): ?><td class="n"><?= $nombre((float)$l['tva']) ?> %</td><?php endif; ?>
        <td class="n"><?= euros((int)round($l['quantite'] * $l['prix_ht'])) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <table class="totaux">
    <tr><td>Total HT</td><td class="n"><?= euros((int)$doc['total_ht']) ?></td></tr>
    <?php if (!$franchise): foreach ($parTaux as $taux => $base): if ((float)$taux > 0): ?>
      <tr><td>TVA <?= $nombre((float)$taux) ?> %</td><td class="n"><?= euros((int)round($base * (float)$taux / 100)) ?></td></tr>
    <?php endif; endforeach; endif; ?>
    <tr class="ttc"><td>Total <?= $franchise ? 'à payer' : 'TTC' ?></td><td class="n"><?= euros((int)$doc['total_ttc']) ?></td></tr>
  </table>

  <?php if ($franchise): ?>
    <div class="bloc"><b>TVA non applicable, article 293 B du CGI.</b></div>
  <?php endif; ?>

  <?php if ($doc['notes']): ?><div class="bloc"><?= nl2br(e($doc['notes'])) ?></div><?php endif; ?>

  <?php if (!$estDevis && ($p('iban') || $p('bic'))): ?>
    <div class="bloc"><b>Règlement par virement :</b> IBAN <?= e($p('iban')) ?><?= $p('bic') ? ' · BIC ' . e($p('bic')) : '' ?></div>
  <?php endif; ?>

  <div class="mentions"><?= e($estDevis ? $p('mentions_devis', "Devis gratuit. Ce devis est valable 30 jours à compter de sa date d'émission.") : $p('mentions_facture', "Paiement à réception de facture. En cas de retard de paiement, des pénalités au taux de 3 fois le taux d'intérêt légal sont exigibles, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (clients professionnels). Pas d'escompte pour paiement anticipé.")) ?></div>

  <?php if ($p('assurance')): ?><div class="mentions"><?= e($p('assurance')) ?></div><?php endif; ?>

  <?php if ($estDevis): ?>
    <div class="signature">
      <div>L'entreprise<br><br><?= e($p('entreprise_nom', "Brico'Go")) ?></div>
      <div>Le client — date, signature précédée de la mention « Bon pour accord »</div>
    </div>
  <?php endif; ?>

  <footer><?= e($p('entreprise_nom', "Brico'Go")) ?><?= $p('entreprise_siret') ? ' · SIRET ' . e($p('entreprise_siret')) : '' ?> · <?= e($titre) ?> <?= e($doc['numero']) ?></footer>
</div>
</body>
</html>
