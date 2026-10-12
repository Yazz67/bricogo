/* =========================================================
   BRICO'GO — Espace de gestion (application)
========================================================= */
'use strict';

/* ---------- Outils ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtEur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const euros = (c) => fmtEur.format((Number(c) || 0) / 100);
const eurosCourt = (c) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((Number(c) || 0) / 100);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const auj = () => iso(new Date());
const plusJours = (n, base = new Date()) => { const d = new Date(base); d.setDate(d.getDate() + n); return iso(d); };
const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dateFr = (s) => (s ? parseIso(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const dateCourt = (s) => (s ? parseIso(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '');
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const telLien = (t) => String(t || '').replace(/[^0-9+]/g, '');

async function api(action, data = {}) {
  let res;
  try {
    res = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': window.CSRF },
      body: JSON.stringify({ action, data }),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifie ta connexion internet.');
  }
  if (res.status === 401) { location.reload(); throw new Error('Session expirée.'); }
  let json;
  try { json = await res.json(); } catch { throw new Error('Réponse invalide du serveur.'); }
  if (!json.ok) throw new Error(json.message || 'Erreur.');
  return json.data;
}

function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast on' + (err ? ' err' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = 'toast'), 2800);
}

async function action(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(e.message, true); throw e; }
}

/* ---------- Icônes ---------- */
const ICONES = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  planning: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chantier: '<path d="M2 20h20M4 20V10l8-6 8 6v10"/><path d="M10 20v-6h4v6"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  devis: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  facture: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  demandes: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  reglages: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  gauche: '<path d="m15 18-6-6 6-6"/>',
  droite: '<path d="m9 18 6-6-6-6"/>',
  tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
};
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n] || ''}</svg>`;

/* ---------- Statuts ---------- */
const STATUTS = {
  chantier: { prevu: ['Prévu', 'b-warn'], en_cours: ['En cours', 'b-info'], termine: ['Terminé', 'b-ok'], annule: ['Annulé', 'b-neutre'] },
  devis: { brouillon: ['Brouillon', 'b-neutre'], envoye: ['Envoyé', 'b-info'], accepte: ['Accepté', 'b-ok'], refuse: ['Refusé', 'b-bad'] },
  facture: { brouillon: ['Brouillon', 'b-neutre'], envoyee: ['À encaisser', 'b-info'], payee: ['Payée', 'b-ok'], annulee: ['Annulée', 'b-neutre'] },
};
function badge(type, statut, doc) {
  if (type === 'facture' && statut === 'envoyee' && doc?.date_limite && doc.date_limite < auj()) return '<span class="badge b-bad">En retard</span>';
  const [l, c] = STATUTS[type][statut] || [statut, 'b-neutre'];
  return `<span class="badge ${c}">${l}</span>`;
}
const options = (type, val) => Object.entries(STATUTS[type]).map(([k, [l]]) => `<option value="${k}"${k === val ? ' selected' : ''}>${l}</option>`).join('');

/* ---------- Navigation ---------- */
const ROUTES = [
  { id: 'tableau-de-bord', label: 'Tableau de bord', court: 'Accueil', icone: 'dashboard', vue: vueDashboard, tab: true },
  { id: 'planning', label: 'Planning', court: 'Planning', icone: 'planning', vue: vuePlanning, tab: true },
  { id: 'chantiers', label: 'Chantiers', court: 'Chantiers', icone: 'chantier', vue: vueChantiers },
  { id: 'devis', label: 'Devis', court: 'Devis', icone: 'devis', vue: () => vueDocuments('devis'), tab: true },
  { id: 'factures', label: 'Factures', court: 'Factures', icone: 'facture', vue: () => vueDocuments('facture'), tab: true },
  { id: 'clients', label: 'Clients', court: 'Clients', icone: 'clients', vue: vueClients },
  { id: 'demandes', label: 'Demandes du site', court: 'Demandes', icone: 'demandes', vue: vueDemandes },
  { id: 'parametres', label: 'Paramètres', court: 'Réglages', icone: 'reglages', vue: vueParametres },
  { id: 'plus', label: 'Plus', court: 'Plus', icone: 'menu', vue: vuePlus, cache: true },
];
let compteDemandes = 0;

function dessinerNav(courant) {
  const lien = (r, court) => `<a href="#${r.id}" class="${r.id === courant ? 'active' : ''}">${ic(r.icone)}<span>${court ? r.court : r.label}</span>${r.id === 'demandes' && compteDemandes ? `<span class="count">${compteDemandes}</span>` : ''}</a>`;
  $('#nav').innerHTML = ROUTES.filter((r) => !r.cache).map((r) => lien(r)).join('');
  const dansPlus = !ROUTES.find((r) => r.id === courant)?.tab;
  $('#tabbar').innerHTML = ROUTES.filter((r) => r.tab).map((r) => lien(r, true)).join('')
    + `<a href="#plus" class="${dansPlus ? 'active' : ''}">${ic('menu')}<span>Plus</span>${compteDemandes ? `<span class="count">${compteDemandes}</span>` : ''}</a>`;
}

function setActions(html = '') { $('#actions').innerHTML = html; }

async function router() {
  const id = location.hash.slice(1) || 'tableau-de-bord';
  const route = ROUTES.find((r) => r.id === id) || ROUTES[0];
  document.title = `${route.label} — Brico'Go`;
  $('#titre').textContent = route.label;
  setActions();
  dessinerNav(route.id);
  const vue = $('#vue');
  vue.innerHTML = '<div class="empty">Chargement…</div>';
  try { await route.vue(vue); } catch (e) { vue.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  vue.classList.remove('vue'); void vue.offsetWidth; vue.classList.add('vue');
}
window.addEventListener('hashchange', router);

/* ---------- Modale ---------- */
function modal({ titre, corps, pied = '', large = false, onOpen }) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-back"><div class="modal${large ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(titre)}">
      <div class="modal-head"><h2>${esc(titre)}</h2><button class="btn btn-icon" data-close aria-label="Fermer">${ic('close')}</button></div>
      <div class="modal-body">${corps}</div>${pied ? `<div class="modal-foot">${pied}</div>` : ''}</div></div>`;
  const back = $('.modal-back', root);
  const fermer = () => { root.innerHTML = ''; document.removeEventListener('keydown', esc_); };
  const esc_ = (e) => { if (e.key === 'Escape') fermer(); };
  document.addEventListener('keydown', esc_);
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) fermer(); });
  const m = $('.modal', root);
  onOpen?.(m, fermer);
  setTimeout(() => $('input, select, textarea', m)?.focus({ preventScroll: true }), 50);
  return { el: m, fermer };
}

function confirmer(texte, bouton = 'Supprimer') {
  return new Promise((ok) => {
    modal({
      titre: 'Confirmer', corps: `<p>${esc(texte)}</p>`,
      pied: `<button class="btn" data-close>Annuler</button><button class="btn btn-primary" data-oui>${esc(bouton)}</button>`,
      onOpen: (m, fermer) => {
        $('[data-oui]', m).onclick = () => { fermer(); ok(true); };
        $$('[data-close]', m).forEach((b) => b.addEventListener('click', () => ok(false)));
      },
    });
  });
}

const valeurs = (form) => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));

/* ---------- Clients (cache pour les listes déroulantes) ---------- */
let cacheClients = null;
async function clients(force = false) {
  if (!cacheClients || force) cacheClients = await api('clients.list');
  return cacheClients;
}
async function optionsClients(sel) {
  const liste = await clients();
  return '<option value="">— Choisir un client —</option>' + liste.map((c) => `<option value="${c.id}"${+c.id === +sel ? ' selected' : ''}>${esc(c.nom)}</option>`).join('');
}

/* =========================================================
   TABLEAU DE BORD
========================================================= */
async function vueDashboard(vue) {
  setActions(`<button class="btn btn-primary" id="nv-devis">${ic('plus')} Devis</button><button class="btn" id="nv-chantier">${ic('plus')} Chantier</button>`);
  $('#nv-devis').onclick = () => editerDocument('devis');
  $('#nv-chantier').onclick = () => editerChantier();
  const d = await api('dashboard');
  compteDemandes = d.demandes; dessinerNav('tableau-de-bord');

  const ligneChantier = (c) => `<button class="row" data-ch="${c.id}">
      <div class="date-pill"><b>${parseIso(c.date_debut).getDate()}</b><span>${parseIso(c.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span></div>
      <div class="grow"><div class="t">${esc(c.titre)}</div><div class="s">${esc([c.heure_debut, c.client_nom, c.adresse].filter(Boolean).join(' · '))}</div></div>
      ${badge('chantier', c.statut)}</button>`;

  vue.innerHTML = `
    <div class="kpis">
      <div class="kpi glass"><span class="label">Encaissé ce mois-ci</span><span class="value">${euros(d.ca_mois)}</span><span class="sub">${euros(d.ca_annee)} depuis janvier</span></div>
      <a class="kpi glass" href="#factures"><span class="label">À encaisser</span><span class="value">${euros(d.a_encaisser.t)}</span><span class="sub">${d.a_encaisser.n} facture${d.a_encaisser.n > 1 ? 's' : ''} envoyée${d.a_encaisser.n > 1 ? 's' : ''}</span></a>
      <a class="kpi glass${d.retard.n ? ' alerte' : ''}" href="#factures"><span class="label">${d.retard.n ? '⚠ ' : ''}Paiements en retard</span><span class="value">${euros(d.retard.t)}</span><span class="sub">${d.retard.n} facture${d.retard.n > 1 ? 's' : ''} dépassée${d.retard.n > 1 ? 's' : ''}</span></a>
      <a class="kpi glass" href="#devis"><span class="label">Devis en attente</span><span class="value">${euros(d.devis_attente.t)}</span><span class="sub">${d.devis_attente.n} devis envoyé${d.devis_attente.n > 1 ? 's' : ''}</span></a>
    </div>
    <div class="cards-2">
      <section class="card glass"><h2>Les 7 prochains jours <a href="#planning">Planning →</a></h2>
        <div class="list">${d.semaine.length ? d.semaine.map(ligneChantier).join('') : '<div class="empty">Aucun chantier prévu cette semaine.</div>'}</div></section>
      <section class="card glass"><h2>Encaissements, 6 derniers mois</h2><div class="chart" id="chart"></div></section>
      <section class="card glass"><h2>Factures en retard <a href="#factures">Tout voir →</a></h2>
        <div class="list">${d.factures_retard.length ? d.factures_retard.map((f) => `<button class="row" data-doc="${f.id}" data-type="facture">
          <div class="grow"><div class="t">${esc(f.client_nom || '—')}</div><div class="s">${esc(f.numero)} · échéance ${dateFr(f.date_limite)}</div></div>
          <span class="amount">${euros(f.total_ttc)}</span></button>`).join('') : '<div class="empty">Aucun retard de paiement 👍</div>'}</div></section>
      <section class="card glass"><h2>Devis en attente de réponse <a href="#devis">Tout voir →</a></h2>
        <div class="list">${d.devis_liste.length ? d.devis_liste.map((f) => `<button class="row" data-doc="${f.id}" data-type="devis">
          <div class="grow"><div class="t">${esc(f.client_nom || '—')}</div><div class="s">${esc([f.numero, f.objet].filter(Boolean).join(' · '))}</div></div>
          <span class="amount">${euros(f.total_ttc)}</span></button>`).join('') : '<div class="empty">Aucun devis en attente.</div>'}</div></section>
    </div>
    ${d.demandes ? `<a class="card glass" href="#demandes" style="display:block;margin-top:16px"><b>📩 ${d.demandes} nouvelle${d.demandes > 1 ? 's' : ''} demande${d.demandes > 1 ? 's' : ''} reçue${d.demandes > 1 ? 's' : ''} par le site</b> <span class="muted">— les voir →</span></a>` : ''}`;

  dessinerGraphique($('#chart'), d.ca_6_mois);
  $$('[data-ch]', vue).forEach((b) => (b.onclick = () => editerChantier(+b.dataset.ch)));
  $$('[data-doc]', vue).forEach((b) => (b.onclick = () => editerDocument(b.dataset.type, +b.dataset.doc)));
}

function dessinerGraphique(el, serie) {
  const W = 520, H = 220, m = { t: 14, r: 8, b: 26, l: 52 };
  const max = Math.max(...serie.map((s) => s.total), 1);
  const pas = Math.pow(10, Math.floor(Math.log10(max / 100)));
  const haut = Math.ceil(max / 100 / pas / 2) * 2 * pas * 100 || 100;
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const bw = Math.min(46, iw / serie.length - 14);
  const x = (i) => m.l + (iw / serie.length) * i + (iw / serie.length - bw) / 2;
  const y = (v) => m.t + ih - (v / haut) * ih;
  const graduations = [0, 0.5, 1].map((f) => haut * f);
  const moisLabel = (s) => new Date(s.mois + '-01T12:00').toLocaleDateString('fr-FR', { month: 'short' });
  const barre = (s, i) => {
    const h = Math.max(0, ih - (y(s.total) - m.t));
    const r = Math.min(4, h);
    const x0 = x(i), y0 = y(s.total), base = m.t + ih;
    const path = h > 0 ? `M${x0},${base}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + bw - r}Q${x0 + bw},${y0} ${x0 + bw},${y0 + r}V${base}Z` : '';
    return `<rect class="bar-hit" x="${x0 - 6}" y="${m.t}" width="${bw + 12}" height="${ih}" data-i="${i}"/><path class="bar" d="${path}"/>`;
  };
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Encaissements des 6 derniers mois">
      <g class="grid">${graduations.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g class="axis">${graduations.map((v) => `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${eurosCourt(v)}</text>`).join('')}
        ${serie.map((s, i) => `<text x="${x(i) + bw / 2}" y="${H - 6}" text-anchor="middle">${moisLabel(s)}</text>`).join('')}</g>
      ${serie.map(barre).join('')}</svg>
    <div class="tip"></div>
    <table class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"><caption>Encaissements par mois</caption>
      ${serie.map((s) => `<tr><th>${s.mois}</th><td>${euros(s.total)}</td></tr>`).join('')}</table>`;
  const tip = $('.tip', el), svg = $('svg', el);
  $$('.bar-hit', el).forEach((hit) => {
    hit.addEventListener('mouseenter', () => {
      const i = +hit.dataset.i, s = serie[i];
      const r = svg.getBoundingClientRect(), k = r.width / W;
      tip.innerHTML = `${new Date(s.mois + '-01T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}<b>${euros(s.total)}</b>`;
      tip.style.left = (x(i) + bw / 2) * k + 'px';
      tip.style.top = y(s.total) * k + 'px';
      tip.classList.add('on');
    });
    hit.addEventListener('mouseleave', () => tip.classList.remove('on'));
  });
}

/* =========================================================
   PLANNING
========================================================= */
let moisPlanning = new Date();
moisPlanning.setDate(1);

async function vuePlanning(vue) {
  setActions(`<button class="btn" id="abo">${ic('cal')} Calendrier Apple</button><button class="btn btn-primary" id="nv">${ic('plus')} Chantier</button>`);
  $('#nv').onclick = () => editerChantier(null, { date_debut: auj() });
  $('#abo').onclick = aideCalendrier;

  const debut = new Date(moisPlanning);
  const decal = (debut.getDay() + 6) % 7; // lundi en premier
  const premier = new Date(debut); premier.setDate(1 - decal);
  const dernier = new Date(premier); dernier.setDate(premier.getDate() + 41);
  const liste = await api('chantiers.list', { du: iso(premier), au: iso(dernier) });

  const parJour = {};
  liste.forEach((c) => {
    const d0 = parseIso(c.date_debut), d1 = parseIso(c.date_fin || c.date_debut);
    for (let d = new Date(d0); d <= d1 && d <= dernier; d.setDate(d.getDate() + 1)) {
      if (d >= premier) (parJour[iso(d)] ||= []).push(c);
    }
  });

  const jours = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(premier); d.setDate(premier.getDate() + i);
    const k = iso(d), evs = parJour[k] || [];
    jours.push(`<div class="day${d.getMonth() !== debut.getMonth() ? ' out' : ''}${k === auj() ? ' today' : ''}" data-jour="${k}" role="button" tabindex="0" aria-label="${d.toLocaleDateString('fr-FR', { dateStyle: 'full' })}${evs.length ? `, ${evs.length} chantier(s)` : ''}">
      <span class="num">${d.getDate()}</span>
      ${evs.slice(0, 3).map((c) => `<button class="ev s-${c.statut}" data-ch="${c.id}" title="${esc(c.titre)}">${esc((c.heure_debut ? c.heure_debut + ' ' : '') + c.titre)}</button>`).join('')}
      ${evs.length > 3 ? `<span class="ev-more">+${evs.length - 3}</span>` : ''}</div>`);
  }

  const duMois = liste.filter((c) => (c.date_fin || c.date_debut) >= iso(debut) && c.date_debut <= iso(new Date(debut.getFullYear(), debut.getMonth() + 1, 0)))
    .sort((a, b) => (a.date_debut + a.heure_debut).localeCompare(b.date_debut + b.heure_debut));

  vue.innerHTML = `
    <section class="card glass">
      <div class="cal-head">
        <button class="btn btn-icon" id="prec" aria-label="Mois précédent">${ic('gauche')}</button>
        <h2>${debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
        <div style="display:flex;gap:6px"><button class="btn btn-sm" id="ajd">Aujourd'hui</button><button class="btn btn-icon" id="suiv" aria-label="Mois suivant">${ic('droite')}</button></div>
      </div>
      <div class="cal">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((j) => `<div class="dow">${j}</div>`).join('')}${jours.join('')}</div>
      <div class="legend"><span><i style="background:rgba(255,201,60,.6)"></i>Prévu</span><span><i style="background:rgba(122,167,255,.7)"></i>En cours</span><span><i style="background:rgba(61,220,132,.6)"></i>Terminé</span></div>
    </section>
    <section class="card glass agenda"><h2>Chantiers du mois</h2>
      <div class="list">${duMois.length ? duMois.map((c) => `<button class="row" data-ch="${c.id}">
        <div class="date-pill"><b>${parseIso(c.date_debut).getDate()}</b><span>${parseIso(c.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span></div>
        <div class="grow"><div class="t">${esc(c.titre)}</div><div class="s">${esc([c.heure_debut && (c.heure_debut + (c.heure_fin ? '–' + c.heure_fin : '')), c.date_fin && c.date_fin !== c.date_debut ? 'jusqu\'au ' + dateFr(c.date_fin) : '', c.client_nom, c.adresse].filter(Boolean).join(' · '))}</div></div>
        ${badge('chantier', c.statut)}</button>`).join('') : '<div class="empty">Aucun chantier ce mois-ci. Touche un jour du calendrier pour en ajouter un.</div>'}</div>
    </section>`;

  $('#prec').onclick = () => { moisPlanning.setMonth(moisPlanning.getMonth() - 1); router(); };
  $('#suiv').onclick = () => { moisPlanning.setMonth(moisPlanning.getMonth() + 1); router(); };
  $('#ajd').onclick = () => { moisPlanning = new Date(); moisPlanning.setDate(1); router(); };
  $$('[data-ch]', vue).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); editerChantier(+b.dataset.ch); }));
  $$('[data-jour]', vue).forEach((j) => {
    const ouvrir = () => {
      const evs = parJour[j.dataset.jour] || [];
      if (window.matchMedia('(max-width: 900px)').matches && evs.length) return listeJour(j.dataset.jour, evs);
      editerChantier(null, { date_debut: j.dataset.jour });
    };
    j.addEventListener('click', ouvrir);
    j.addEventListener('keydown', (e) => { if (e.key === 'Enter') ouvrir(); });
  });
}

function listeJour(jour, evs) {
  modal({
    titre: parseIso(jour).toLocaleDateString('fr-FR', { dateStyle: 'full' }),
    corps: `<div class="list">${evs.map((c) => `<button class="row" data-ch="${c.id}"><div class="grow"><div class="t">${esc(c.titre)}</div><div class="s">${esc([c.heure_debut, c.client_nom].filter(Boolean).join(' · '))}</div></div>${badge('chantier', c.statut)}</button>`).join('')}</div>`,
    pied: `<button class="btn btn-primary" id="aj">${ic('plus')} Ajouter un chantier ce jour</button>`,
    onOpen: (m, fermer) => {
      $$('[data-ch]', m).forEach((b) => (b.onclick = () => { fermer(); editerChantier(+b.dataset.ch); }));
      $('#aj', m).onclick = () => { fermer(); editerChantier(null, { date_debut: jour }); };
    },
  });
}

async function aideCalendrier() {
  const s = await action(() => api('settings.get'));
  modal({
    titre: 'Synchroniser avec Apple Calendrier',
    corps: `<div class="help">
        <p>Abonne ton iPhone à tes chantiers : ils apparaîtront dans l'app <b>Calendrier</b> et se mettront à jour tout seuls (environ toutes les heures).</p>
        <ol>
          <li>Sur ton iPhone, touche le bouton ci-dessous, puis <b>S'abonner</b>.</li>
          <li>Ou : <b>Réglages → Apps → Calendrier → Comptes → Ajouter un compte → Autre → Ajouter un calendrier avec abonnement</b>, puis colle le lien.</li>
          <li>Sur Mac : <b>Calendrier → Fichier → Nouvel abonnement à un calendrier</b>.</li>
        </ol>
        <p style="margin-top:10px">Garde ce lien privé : il donne accès à ton planning. Tu peux le changer dans les Paramètres.</p>
      </div>
      <div class="copy-box" style="margin-top:14px"><input readonly value="${esc(s.ics_url)}" id="ics"><button class="btn" id="cp">Copier</button></div>`,
    pied: `<a class="btn btn-primary" href="${esc(s.ics_url)}">${ic('cal')} S'abonner sur cet appareil</a>`,
    onOpen: (m) => { $('#cp', m).onclick = () => copier($('#ics', m).value); },
  });
}

function copier(texte) {
  navigator.clipboard?.writeText(texte).then(() => toast('Lien copié'), () => toast('Copie impossible : sélectionne le lien', true));
}

/* =========================================================
   CHANTIERS
========================================================= */
let filtreChantier = 'actifs';

async function vueChantiers(vue) {
  setActions(`<button class="btn btn-primary" id="nv">${ic('plus')} Nouveau chantier</button>`);
  $('#nv').onclick = () => editerChantier();
  const liste = await api('chantiers.list');
  const filtres = { actifs: 'À venir & en cours', prevu: 'Prévus', en_cours: 'En cours', termine: 'Terminés', annule: 'Annulés', tous: 'Tous' };

  const dessiner = () => {
    const q = ($('#q')?.value || '').toLowerCase();
    let l = liste;
    if (filtreChantier === 'actifs') l = l.filter((c) => c.statut === 'prevu' || c.statut === 'en_cours').sort((a, b) => a.date_debut.localeCompare(b.date_debut));
    else if (filtreChantier !== 'tous') l = l.filter((c) => c.statut === filtreChantier);
    if (q) l = l.filter((c) => [c.titre, c.client_nom, c.adresse, c.notes].join(' ').toLowerCase().includes(q));
    $('#tb').innerHTML = l.length ? l.map((c) => `<tr data-id="${c.id}">
        <td class="main-cell">${esc(c.titre)}<div class="faint" style="font-weight:400;font-size:.84rem">${esc(c.client_nom || 'Sans client')}</div></td>
        <td>${dateCourt(c.date_debut)}${c.heure_debut ? ' · ' + c.heure_debut : ''}${c.date_fin && c.date_fin !== c.date_debut ? `<div class="faint" style="font-size:.84rem">→ ${dateCourt(c.date_fin)}</div>` : ''}</td>
        <td data-m="hide" class="muted">${esc(c.adresse)}</td>
        <td class="n">${badge('chantier', c.statut)}</td></tr>`).join('')
      : '<tr><td colspan="4"><div class="empty">Aucun chantier.</div></td></tr>';
    $$('#tb tr[data-id]').forEach((tr) => (tr.onclick = () => editerChantier(+tr.dataset.id)));
    $$('.chip', vue).forEach((c) => c.classList.toggle('on', c.dataset.f === filtreChantier));
  };

  vue.innerHTML = `<div class="toolbar"><input type="search" id="q" placeholder="Rechercher un chantier, un client…">
      <div class="chips">${Object.entries(filtres).map(([k, l]) => `<button class="chip" data-f="${k}">${l}</button>`).join('')}</div></div>
    <div class="table-wrap glass"><table class="data"><thead><tr><th>Chantier</th><th>Date</th><th>Adresse</th><th class="n">Statut</th></tr></thead><tbody id="tb"></tbody></table></div>`;
  $('#q').oninput = dessiner;
  $$('.chip', vue).forEach((c) => (c.onclick = () => { filtreChantier = c.dataset.f; dessiner(); }));
  dessiner();
}

async function editerChantier(id = null, defauts = {}) {
  let c = { statut: 'prevu', date_debut: auj(), ...defauts };
  if (id) c = (await api('chantiers.list')).find((x) => +x.id === +id) || c;
  const opts = await optionsClients(c.client_id);
  modal({
    titre: id ? c.titre : 'Nouveau chantier',
    corps: `<form id="f" class="grid-form">
        <label class="full">Titre du chantier *<input name="titre" required value="${esc(c.titre)}" placeholder="Ex. Montage cuisine, peinture salon…"></label>
        <label class="full">Client<div style="display:flex;gap:8px"><select name="client_id">${opts}</select><button type="button" class="btn btn-icon" id="nc" title="Nouveau client">${ic('plus')}</button></div></label>
        <label>Date de début *<input type="date" name="date_debut" required value="${esc(c.date_debut)}"></label>
        <label>Heure de début<input type="time" name="heure_debut" value="${esc(c.heure_debut)}"></label>
        <label>Date de fin<input type="date" name="date_fin" value="${esc(c.date_fin)}"></label>
        <label>Heure de fin<input type="time" name="heure_fin" value="${esc(c.heure_fin)}"></label>
        <label class="full">Adresse du chantier<input name="adresse" value="${esc(c.adresse)}" placeholder="Adresse (sinon celle du client)"></label>
        <label>Statut<select name="statut">${options('chantier', c.statut)}</select></label>
        <label>Montant estimé (€)<input name="montant_estime" inputmode="decimal" value="${c.montant_estime ? (c.montant_estime / 100).toString().replace('.', ',') : ''}"></label>
        <label class="full">Notes<textarea name="notes" placeholder="Matériel à prévoir, code d'accès, remarques…">${esc(c.notes)}</textarea></label>
      </form>
      ${id ? `<div class="chips" style="margin-top:14px">
        <a class="chip" href="ics.php?id=${id}">${ic('cal')} Ajouter à mon Calendrier</a>
        ${c.adresse ? `<a class="chip" target="_blank" rel="noopener" href="https://maps.apple.com/?q=${encodeURIComponent(c.adresse)}">${ic('pin')} Itinéraire</a>` : ''}
        ${c.client_tel ? `<a class="chip" href="tel:${telLien(c.client_tel)}">${ic('tel')} Appeler le client</a>` : ''}
      </div>` : ''}`,
    pied: `${id ? '<button class="btn btn-danger left" id="del">Supprimer</button><button class="btn" id="dev">Créer un devis</button>' : ''}
      <button class="btn" data-close>Annuler</button><button class="btn btn-primary" id="ok">Enregistrer</button>`,
    onOpen: (m, fermer) => {
      const f = $('#f', m);
      $('#nc', m).onclick = async () => {
        const nouveau = await editerClient(null, true);
        if (nouveau) { $('[name=client_id]', f).innerHTML = await optionsClients(nouveau); }
      };
      $('[name=date_debut]', f).addEventListener('change', (e) => { const fin = $('[name=date_fin]', f); if (fin.value && fin.value < e.target.value) fin.value = e.target.value; });
      $('#ok', m).onclick = async () => {
        if (!f.reportValidity()) return;
        await action(() => api('chantiers.save', { ...valeurs(f), id }), 'Chantier enregistré');
        fermer(); router();
      };
      if (id) {
        $('#del', m).onclick = async () => {
          if (!(await confirmer('Supprimer ce chantier ?'))) return;
          await action(() => api('chantiers.delete', { id }), 'Chantier supprimé'); router();
        };
        $('#dev', m).onclick = () => { fermer(); editerDocument('devis', null, { client_id: c.client_id, chantier_id: id, objet: c.titre }); };
      }
    },
  });
}

/* =========================================================
   CLIENTS
========================================================= */
async function vueClients(vue) {
  setActions(`<button class="btn btn-primary" id="nv">${ic('plus')} Nouveau client</button>`);
  $('#nv').onclick = () => editerClient();
  const liste = await clients(true);
  const dessiner = () => {
    const q = ($('#q').value || '').toLowerCase();
    const l = q ? liste.filter((c) => [c.nom, c.telephone, c.email, c.adresse].join(' ').toLowerCase().includes(q)) : liste;
    $('#tb').innerHTML = l.length ? l.map((c) => `<tr data-id="${c.id}">
        <td class="main-cell">${esc(c.nom)}<div class="faint" style="font-weight:400;font-size:.84rem">${esc(c.adresse.split('\n')[0])}</div></td>
        <td>${esc(c.telephone)}</td><td data-m="hide" class="muted">${esc(c.email)}</td>
        <td class="n" data-m="hide">${c.nb_chantiers} chantier${c.nb_chantiers > 1 ? 's' : ''}</td><td class="n">${euros(c.ca)}</td></tr>`).join('')
      : `<tr><td colspan="5"><div class="empty">${liste.length ? 'Aucun résultat.' : 'Aucun client pour l\'instant.'}</div></td></tr>`;
    $$('#tb tr[data-id]').forEach((tr) => (tr.onclick = () => ficheClient(+tr.dataset.id)));
  };
  vue.innerHTML = `<div class="toolbar"><input type="search" id="q" placeholder="Rechercher un client…"></div>
    <div class="table-wrap glass"><table class="data"><thead><tr><th>Client</th><th>Téléphone</th><th>Email</th><th class="n">Chantiers</th><th class="n">Facturé payé</th></tr></thead><tbody id="tb"></tbody></table></div>`;
  $('#q').oninput = dessiner;
  dessiner();
}

function editerClient(c = null, retourId = false) {
  c ||= {};
  return new Promise((resolve) => {
    modal({
      titre: c.id ? 'Modifier le client' : 'Nouveau client',
      corps: `<form id="f" class="grid-form">
          <label class="full">Nom / Société *<input name="nom" required value="${esc(c.nom)}" autocomplete="off"></label>
          <label>Téléphone<input name="telephone" type="tel" value="${esc(c.telephone)}"></label>
          <label>Email<input name="email" type="email" value="${esc(c.email)}"></label>
          <label class="full">Adresse<textarea name="adresse" rows="2">${esc(c.adresse)}</textarea></label>
          <label class="full">Notes<textarea name="notes">${esc(c.notes)}</textarea></label></form>`,
      pied: '<button class="btn" data-close>Annuler</button><button class="btn btn-primary" id="ok">Enregistrer</button>',
      onOpen: (m, fermer) => {
        $$('[data-close]', m).forEach((b) => b.addEventListener('click', () => resolve(null)));
        $('#ok', m).onclick = async () => {
          const f = $('#f', m);
          if (!f.reportValidity()) return;
          const r = await action(() => api('clients.save', { ...valeurs(f), id: c.id }), 'Client enregistré');
          await clients(true);
          fermer();
          resolve(r.id);
          if (!retourId) router();
        };
      },
    });
  });
}

async function ficheClient(id) {
  const c = await action(() => api('clients.get', { id }));
  modal({
    titre: c.nom, large: true,
    corps: `<div class="detail-grid">
        <div><small>Téléphone</small>${c.telephone ? `<a href="tel:${telLien(c.telephone)}">${esc(c.telephone)}</a>` : '—'}</div>
        <div><small>Email</small>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '—'}</div>
        <div><small>Adresse</small>${c.adresse ? nl2br(c.adresse) : '—'}</div>
        <div><small>Notes</small>${c.notes ? nl2br(c.notes) : '—'}</div></div>
      <div class="chips">
        ${c.telephone ? `<a class="chip" href="tel:${telLien(c.telephone)}">${ic('tel')} Appeler</a><a class="chip" href="sms:${telLien(c.telephone)}">SMS</a>` : ''}
        ${c.email ? `<a class="chip" href="mailto:${esc(c.email)}">${ic('mail')} Email</a>` : ''}
        ${c.adresse ? `<a class="chip" target="_blank" rel="noopener" href="https://maps.apple.com/?q=${encodeURIComponent(c.adresse)}">${ic('pin')} Plan</a>` : ''}
      </div>
      <div class="section-title">Chantiers</div>
      <div class="list">${c.chantiers.length ? c.chantiers.map((x) => `<button class="row" data-ch="${x.id}"><div class="grow"><div class="t">${esc(x.titre)}</div><div class="s">${dateFr(x.date_debut)}</div></div>${badge('chantier', x.statut)}</button>`).join('') : '<div class="empty">Aucun chantier.</div>'}</div>
      <div class="section-title">Devis & factures</div>
      <div class="list">${c.documents.length ? c.documents.map((x) => `<button class="row" data-doc="${x.id}" data-type="${x.type}"><div class="grow"><div class="t">${x.type === 'devis' ? 'Devis' : 'Facture'} ${esc(x.numero)}</div><div class="s">${dateFr(x.date_doc)}${x.objet ? ' · ' + esc(x.objet) : ''}</div></div><span class="amount">${euros(x.total_ttc)}</span>${badge(x.type, x.statut, x)}</button>`).join('') : '<div class="empty">Aucun document.</div>'}</div>`,
    pied: `<button class="btn btn-danger left" id="del">Supprimer</button><button class="btn" id="ed">Modifier</button>
      <button class="btn" id="ch">${ic('plus')} Chantier</button><button class="btn btn-primary" id="dv">${ic('plus')} Devis</button>`,
    onOpen: (m, fermer) => {
      $$('[data-ch]', m).forEach((b) => (b.onclick = () => { fermer(); editerChantier(+b.dataset.ch); }));
      $$('[data-doc]', m).forEach((b) => (b.onclick = () => { fermer(); editerDocument(b.dataset.type, +b.dataset.doc); }));
      $('#ed', m).onclick = () => { fermer(); editerClient(c); };
      $('#ch', m).onclick = () => { fermer(); editerChantier(null, { client_id: c.id, adresse: c.adresse.replace(/\n/g, ', ') }); };
      $('#dv', m).onclick = () => { fermer(); editerDocument('devis', null, { client_id: c.id }); };
      $('#del', m).onclick = async () => {
        if (!(await confirmer(`Supprimer le client « ${c.nom} » ? Ses chantiers et documents seront conservés sans client.`))) return;
        await action(() => api('clients.delete', { id: c.id }), 'Client supprimé');
        await clients(true); router();
      };
    },
  });
}

/* =========================================================
   DEVIS & FACTURES
========================================================= */
const filtreDoc = { devis: 'tous', facture: 'tous' };
let reglages = null;
async function params(force = false) {
  if (!reglages || force) reglages = await api('settings.get');
  return reglages;
}

async function vueDocuments(type) {
  const vue = $('#vue');
  const nom = type === 'devis' ? 'devis' : 'facture';
  setActions(`<button class="btn btn-primary" id="nv">${ic('plus')} Nouveau${type === 'facture' ? 'lle' : ''} ${nom}</button>`);
  $('#nv').onclick = () => editerDocument(type);
  const liste = await api('documents.list', { type });
  const filtres = type === 'devis'
    ? { tous: 'Tous', brouillon: 'Brouillons', envoye: 'Envoyés', accepte: 'Acceptés', refuse: 'Refusés' }
    : { tous: 'Toutes', brouillon: 'Brouillons', envoyee: 'À encaisser', retard: 'En retard', payee: 'Payées', annulee: 'Annulées' };

  const dessiner = () => {
    const q = ($('#q').value || '').toLowerCase();
    const f = filtreDoc[type];
    let l = liste;
    if (f === 'retard') l = l.filter((x) => x.statut === 'envoyee' && x.date_limite && x.date_limite < auj());
    else if (f !== 'tous') l = l.filter((x) => x.statut === f);
    if (q) l = l.filter((x) => [x.numero, x.client_nom, x.objet].join(' ').toLowerCase().includes(q));
    const total = l.reduce((s, x) => s + (+x.total_ttc || 0), 0);
    $('#tb').innerHTML = l.length ? l.map((x) => `<tr data-id="${x.id}">
        <td class="main-cell">${esc(x.client_nom || '—')}<div class="faint" style="font-weight:400;font-size:.84rem">${esc(x.numero)}${x.objet ? ' · ' + esc(x.objet) : ''}</div></td>
        <td data-m="hide">${dateFr(x.date_doc)}</td>
        <td>${badge(type, x.statut, x)}</td>
        <td class="n">${euros(x.total_ttc)}</td></tr>`).join('')
      : `<tr><td colspan="4"><div class="empty">${liste.length ? 'Aucun résultat.' : `Aucun${type === 'facture' ? 'e' : ''} ${nom} pour l'instant.`}</div></td></tr>`;
    $('#total').textContent = l.length ? `${l.length} ${nom}${l.length > 1 && type === 'facture' ? 's' : ''} · ${euros(total)}` : '';
    $$('#tb tr[data-id]').forEach((tr) => (tr.onclick = () => editerDocument(type, +tr.dataset.id)));
    $$('.chip', vue).forEach((c) => c.classList.toggle('on', c.dataset.f === f));
  };

  vue.innerHTML = `<div class="toolbar"><input type="search" id="q" placeholder="Rechercher (n°, client, objet)…">
      <div class="chips">${Object.entries(filtres).map(([k, l]) => `<button class="chip" data-f="${k}">${l}</button>`).join('')}</div>
      <span class="muted" id="total" style="margin-left:auto;font-size:.88rem"></span></div>
    <div class="table-wrap glass"><table class="data"><thead><tr><th>Client</th><th>Date</th><th>Statut</th><th class="n">Montant</th></tr></thead><tbody id="tb"></tbody></table></div>`;
  $('#q').oninput = dessiner;
  $$('.chip', vue).forEach((c) => (c.onclick = () => { filtreDoc[type] = c.dataset.f; dessiner(); }));
  dessiner();
}

async function editerDocument(type, id = null, defauts = {}) {
  const p = await params();
  const franchise = p.tva_franchise !== '0';
  const tvaDefaut = p.tva_defaut || '20';
  let doc;
  if (id) doc = await action(() => api('documents.get', { id }));
  else {
    const delai = type === 'devis' ? +(p.validite_devis || 30) : +(p.delai_paiement || 30);
    doc = { type, statut: 'brouillon', date_doc: auj(), date_limite: plusJours(delai), lignes: [], total_ttc: 0, ...defauts };
  }
  if (!doc.lignes.length) doc.lignes.push({ designation: '', quantite: 1, unite: '', prix_ht: 0, tva: tvaDefaut });
  const titre = (type === 'devis' ? 'Devis' : 'Facture') + (doc.numero ? ' ' + doc.numero : '');
  const opts = await optionsClients(doc.client_id);
  const chantiers = await api('chantiers.list');
  const verrou = type === 'facture' && ['payee', 'annulee'].includes(doc.statut);

  const ligneHtml = (l) => `<div class="line">
      <textarea name="designation" rows="1" placeholder="Désignation (ex. Pose de carrelage)">${esc(l.designation)}</textarea>
      <input name="quantite" inputmode="decimal" value="${esc(String(l.quantite).replace('.', ','))}" aria-label="Quantité">
      <input name="unite" value="${esc(l.unite)}" placeholder="u, m², h" aria-label="Unité">
      <input name="prix_ht" inputmode="decimal" value="${l.prix_ht ? (l.prix_ht / 100).toString().replace('.', ',') : ''}" placeholder="0,00" aria-label="Prix unitaire HT">
      <input name="tva" class="col-tva" inputmode="decimal" value="${esc(String(l.tva ?? tvaDefaut).replace('.', ','))}" aria-label="TVA %">
      <div class="tot">0,00 €</div>
      <button type="button" class="btn btn-icon btn-danger" data-suppr aria-label="Supprimer la ligne">${ic('close')}</button></div>`;

  const optsChantiers = (clientId) => '<option value="">— Aucun —</option>' + chantiers.filter((c) => !clientId || +c.client_id === +clientId)
    .map((c) => `<option value="${c.id}"${+c.id === +doc.chantier_id ? ' selected' : ''}>${esc(c.titre)} (${dateFr(c.date_debut)})</option>`).join('');

  modal({
    titre, large: true,
    corps: `<form id="f">
      <div class="grid-form">
        <label>Client *<div style="display:flex;gap:8px"><select name="client_id" required>${opts}</select><button type="button" class="btn btn-icon" id="nc" title="Nouveau client">${ic('plus')}</button></div></label>
        <label>Chantier lié<select name="chantier_id">${optsChantiers(doc.client_id)}</select></label>
        <label>Date<input type="date" name="date_doc" required value="${esc(doc.date_doc)}"></label>
        <label>${type === 'devis' ? 'Valable jusqu\'au' : 'Échéance de paiement'}<input type="date" name="date_limite" value="${esc(doc.date_limite)}"></label>
        <label>Statut<select name="statut">${options(type, doc.statut)}</select></label>
        <label>Objet<input name="objet" value="${esc(doc.objet)}" placeholder="Ex. Rénovation salle de bain"></label>
      </div>
      <div class="section-title">Prestations</div>
      <div class="${franchise ? 'no-tva' : ''}">
        <div class="line line-head"><span>Désignation</span><span>Qté</span><span>Unité</span><span>Prix unit. HT</span><span class="col-tva">TVA %</span><span style="text-align:right">Total HT</span><span></span></div>
        <div class="lines" id="lignes">${doc.lignes.map(ligneHtml).join('')}</div>
      </div>
      <button type="button" class="btn btn-sm" id="aj" style="margin-top:10px">${ic('plus')} Ajouter une ligne</button>
      <div class="totals" id="totaux"></div>
      <label style="margin-top:16px">Notes (visibles sur le document)<textarea name="notes" placeholder="Conditions particulières, délais, acompte demandé…">${esc(doc.notes)}</textarea></label>
      ${franchise ? '<p class="faint" style="font-size:.82rem;margin-top:8px">TVA non applicable (art. 293 B du CGI) — modifiable dans les Paramètres.</p>' : ''}
    </form>`,
    pied: `${id ? `<button class="btn btn-danger left" id="del">Supprimer</button>
        <a class="btn" href="imprimer.php?id=${id}" target="_blank" rel="noopener">${ic('print')} PDF / Imprimer</a>
        <button class="btn" id="dup">Dupliquer</button>
        ${type === 'devis' ? '<button class="btn" id="conv">Transformer en facture</button>' : ''}
        ${type === 'facture' && doc.statut !== 'payee' ? '<button class="btn" id="paye">Marquer payée</button>' : ''}` : ''}
      <button class="btn btn-primary" id="ok">Enregistrer</button>`,
    onOpen: (m, fermer) => {
      const f = $('#f', m);
      const zone = $('#lignes', m);
      const num = (v) => parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;

      const recalcul = () => {
        let ht = 0, tva = 0;
        $$('.line', zone).forEach((l) => {
          const t = Math.round(num($('[name=quantite]', l).value) * Math.round(num($('[name=prix_ht]', l).value) * 100));
          ht += t;
          if (!franchise) tva += Math.round(t * num($('[name=tva]', l).value) / 100);
          $('.tot', l).textContent = euros(t);
        });
        $('#totaux', m).innerHTML = `<div><span>Total HT</span><span>${euros(ht)}</span></div>
          ${franchise ? '' : `<div><span>TVA</span><span>${euros(tva)}</span></div>`}
          <div class="ttc"><span>Total ${franchise ? '' : 'TTC'}</span><span>${euros(ht + tva)}</span></div>`;
      };
      const brancher = (l) => {
        $$('input, textarea', l).forEach((i) => i.addEventListener('input', recalcul));
        const ta = $('textarea', l);
        const ajuste = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
        ta.addEventListener('input', ajuste); setTimeout(ajuste);
        $('[data-suppr]', l).onclick = () => { if ($$('.line', zone).length > 1) { l.remove(); recalcul(); } };
      };
      $$('.line', zone).forEach(brancher);
      recalcul();

      $('#aj', m).onclick = () => {
        zone.insertAdjacentHTML('beforeend', ligneHtml({ designation: '', quantite: 1, unite: '', prix_ht: 0, tva: tvaDefaut }));
        const l = zone.lastElementChild; brancher(l); $('textarea', l).focus(); recalcul();
      };
      $('[name=client_id]', f).addEventListener('change', (e) => { $('[name=chantier_id]', f).innerHTML = optsChantiers(e.target.value); });
      $('#nc', m).onclick = async () => {
        const nouveau = await editerClient(null, true);
        if (nouveau) $('[name=client_id]', f).innerHTML = await optionsClients(nouveau);
      };

      const lignes = () => $$('.line', zone).map((l) => ({
        designation: $('[name=designation]', l).value.trim(), quantite: $('[name=quantite]', l).value,
        unite: $('[name=unite]', l).value.trim(), prix_ht: $('[name=prix_ht]', l).value, tva: franchise ? 0 : $('[name=tva]', l).value,
      })).filter((l) => l.designation);

      const enregistrer = async (extra = {}) => {
        if (!f.reportValidity()) return null;
        const v = valeurs(f);
        delete v.designation; delete v.quantite; delete v.unite; delete v.prix_ht; delete v.tva;
        return action(() => api('documents.save', { ...v, ...extra, type, id: doc.id, lignes: lignes() }), 'Enregistré');
      };

      $('#ok', m).onclick = async () => { const r = await enregistrer(); if (r) { fermer(); router(); } };
      if (verrou) toast('Document payé ou annulé : vérifie avant de le modifier.');

      if (id) {
        $('#del', m).onclick = async () => {
          if (!(await confirmer(`Supprimer ${titre} ?`))) return;
          await action(() => api('documents.delete', { id }), 'Supprimé'); fermer(); router();
        };
        $('#dup', m).onclick = async () => {
          const r = await action(() => api('documents.dupliquer', { id }), 'Copie créée');
          fermer(); editerDocument(type, r.id);
        };
        $('#conv', m)?.addEventListener('click', async () => {
          await enregistrer();
          const r = await action(() => api('documents.convertir', { id }), 'Facture créée à partir du devis');
          fermer(); location.hash = 'factures'; setTimeout(() => editerDocument('facture', r.id), 200);
        });
        $('#paye', m)?.addEventListener('click', async () => {
          await enregistrer();
          await action(() => api('documents.statut', { id, statut: 'payee' }), 'Facture marquée payée 🎉');
          fermer(); router();
        });
      }
    },
  });
}

/* =========================================================
   DEMANDES DU SITE
========================================================= */
async function vueDemandes(vue) {
  const liste = await api('demandes.list');
  compteDemandes = liste.filter((x) => x.statut === 'nouvelle').length;
  dessinerNav('demandes');
  vue.innerHTML = liste.length ? `<div class="list card glass">${liste.map((x) => `
      <div class="row" style="align-items:flex-start;flex-wrap:wrap">
        <div class="grow" style="min-width:220px">
          <div class="t">${esc(x.nom)} ${x.statut === 'nouvelle' ? '<span class="badge b-warn">Nouvelle</span>' : '<span class="badge b-neutre">Traitée</span>'}</div>
          <div class="s">${esc(dateFr(x.created_at.slice(0, 10)))} à ${esc(x.created_at.slice(11, 16).replace(':', 'h'))} · ${esc(x.objet)}</div>
          <p style="margin-top:8px;white-space:pre-line;font-size:.94rem">${esc(x.message)}</p>
          <div class="chips" style="margin-top:10px">
            ${x.telephone ? `<a class="chip" href="tel:${telLien(x.telephone)}">${ic('tel')} ${esc(x.telephone)}</a>` : ''}
            ${x.email ? `<a class="chip" href="mailto:${esc(x.email)}?subject=${encodeURIComponent('Votre demande : ' + x.objet)}">${ic('mail')} ${esc(x.email)}</a>` : ''}
            <button class="chip" data-conv="${x.id}">→ Créer le client + devis</button>
            ${x.statut === 'nouvelle' ? `<button class="chip" data-ok="${x.id}">Marquer traitée</button>` : ''}
            <button class="chip" data-del="${x.id}" style="color:var(--bad)">Supprimer</button>
          </div>
        </div>
      </div>`).join('')}</div>`
    : '<div class="card glass"><div class="empty">Aucune demande pour l\'instant. Les messages envoyés depuis le formulaire de ton site arriveront ici automatiquement.</div></div>';

  $$('[data-ok]', vue).forEach((b) => (b.onclick = async () => { await action(() => api('demandes.statut', { id: +b.dataset.ok, statut: 'traitee' })); router(); }));
  $$('[data-del]', vue).forEach((b) => (b.onclick = async () => {
    if (!(await confirmer('Supprimer cette demande ?'))) return;
    await action(() => api('demandes.delete', { id: +b.dataset.del }), 'Demande supprimée'); router();
  }));
  $$('[data-conv]', vue).forEach((b) => (b.onclick = async () => {
    const r = await action(() => api('demandes.client', { id: +b.dataset.conv }), 'Client créé');
    await clients(true);
    editerDocument('devis', null, { client_id: r.client_id, objet: r.objet, notes: '' });
  }));
}

/* =========================================================
   PLUS (mobile) & PARAMÈTRES
========================================================= */
async function vuePlus(vue) {
  vue.innerHTML = `<div class="list card glass">
    ${ROUTES.filter((r) => !r.tab && !r.cache).map((r) => `<a class="row" href="#${r.id}">${ic(r.icone)}<div class="grow"><div class="t">${r.label}</div></div>${r.id === 'demandes' && compteDemandes ? `<span class="badge b-warn">${compteDemandes}</span>` : ''}${ic('droite')}</a>`).join('')}
    <a class="row" href="${esc($('.logout').getAttribute('href'))}" style="color:var(--bad)">${ic('close')}<div class="grow"><div class="t">Déconnexion</div></div></a>
  </div>`;
}

async function vueParametres(vue) {
  const p = await params(true);
  const champ = (n, l, extra = '') => `<label>${l}<input name="${n}" value="${esc(p[n])}" ${extra}></label>`;
  vue.innerHTML = `
    <form id="fp" class="card glass">
      <h2>Mon entreprise <span class="faint" style="font-size:.8rem;font-weight:400">affiché sur les devis et factures</span></h2>
      <div class="grid-form">
        ${champ('entreprise_nom', 'Nom commercial', 'placeholder="Brico\'Go"')}
        ${champ('entreprise_statut', 'Statut / nom légal', 'placeholder="Ex. Huseyin D. — Entrepreneur individuel"')}
        <label class="full">Adresse<textarea name="entreprise_adresse" rows="2">${esc(p.entreprise_adresse)}</textarea></label>
        ${champ('entreprise_tel', 'Téléphone', 'type="tel"')}
        ${champ('entreprise_email', 'Email', 'type="email"')}
        ${champ('entreprise_siret', 'SIRET')}
        ${champ('entreprise_tva_intra', 'N° TVA intracommunautaire')}
        ${champ('iban', 'IBAN (pour les virements)')}
        ${champ('bic', 'BIC')}
      </div>
      <h2 style="margin-top:22px">Facturation</h2>
      <div class="grid-form">
        <label class="check full"><input type="checkbox" name="tva_franchise" value="1" ${p.tva_franchise !== '0' ? 'checked' : ''}> Franchise de TVA (auto-entrepreneur) : « TVA non applicable, art. 293 B du CGI »</label>
        ${champ('tva_defaut', 'Taux de TVA par défaut (%)', 'inputmode="decimal" placeholder="20"')}
        ${champ('delai_paiement', 'Délai de paiement des factures (jours)', 'inputmode="numeric" placeholder="30"')}
        ${champ('validite_devis', 'Validité des devis (jours)', 'inputmode="numeric" placeholder="30"')}
        <label class="full">Mentions sur les devis<textarea name="mentions_devis" placeholder="Devis gratuit. Ce devis est valable 30 jours…">${esc(p.mentions_devis)}</textarea></label>
        <label class="full">Mentions sur les factures<textarea name="mentions_facture" placeholder="Pénalités de retard, indemnité forfaitaire de 40 €…">${esc(p.mentions_facture)}</textarea></label>
        <label class="full">Assurance professionnelle (obligatoire pour les artisans)<textarea name="assurance" rows="2" placeholder="Assurance RC Pro : nom de l'assureur, n° de contrat, zone couverte">${esc(p.assurance)}</textarea></label>
      </div>
      <div class="modal-foot" style="border:0;padding-top:4px"><button class="btn btn-primary" type="submit">Enregistrer</button></div>
    </form>

    <section class="card glass" style="margin-top:16px">
      <h2>Calendrier Apple</h2>
      <p class="help">Abonne ton iPhone ou ton Mac à ce lien pour voir tes chantiers dans l'app Calendrier, mis à jour automatiquement.</p>
      <div class="copy-box" style="margin-top:12px"><input readonly value="${esc(p.ics_url)}" id="ics"><button class="btn" id="cp">Copier</button></div>
      <div class="chips" style="margin-top:12px"><a class="chip" href="${esc(p.ics_url)}">${ic('cal')} S'abonner sur cet appareil</a><button class="chip" id="regen">Changer le lien (l'ancien ne marchera plus)</button></div>
    </section>

    <form id="fm" class="card glass" style="margin-top:16px">
      <h2>Mot de passe</h2>
      <div class="grid-form">
        <label>Mot de passe actuel<input type="password" name="ancien" required autocomplete="current-password"></label>
        <label>Nouveau mot de passe (10 caractères min.)<input type="password" name="nouveau" required minlength="10" autocomplete="new-password"></label>
      </div>
      <div class="modal-foot" style="border:0;padding-top:4px"><button class="btn" type="submit">Changer le mot de passe</button></div>
    </form>

    <section class="card glass" style="margin-top:16px">
      <h2>Sauvegarde</h2>
      <p class="help">Toutes tes données sont dans le fichier <b>gestion/data/gestion.sqlite</b> sur ton hébergement. Télécharge-le de temps en temps depuis le Gestionnaire de fichiers de cPanel pour en garder une copie.</p>
    </section>`;

  $('#fp').onsubmit = async (e) => {
    e.preventDefault();
    const v = valeurs(e.target);
    v.tva_franchise = e.target.tva_franchise.checked ? '1' : '0';
    await action(() => api('settings.save', v), 'Paramètres enregistrés');
    await params(true);
  };
  $('#fm').onsubmit = async (e) => {
    e.preventDefault();
    await action(() => api('compte.mdp', valeurs(e.target)), 'Mot de passe changé');
    e.target.reset();
  };
  $('#cp').onclick = () => copier($('#ics').value);
  $('#regen').onclick = async () => {
    if (!(await confirmer('Créer un nouveau lien ? Les appareils déjà abonnés devront se réabonner.', 'Changer le lien'))) return;
    const r = await action(() => api('settings.ics_regen'), 'Nouveau lien créé');
    $('#ics').value = r.ics_url;
  };
}

/* ---------- Démarrage ---------- */
router();
if (location.hash && location.hash !== '#tableau-de-bord') {
  api('dashboard').then((d) => { compteDemandes = d.demandes; dessinerNav(location.hash.slice(1)); }).catch(() => {});
}
