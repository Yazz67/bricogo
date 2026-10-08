// ===== Carte du Moon Lounge =====
// Pour modifier la carte : changez simplement les noms, descriptions et prix ci-dessous.
const MENU = [
  {
    id: "chichas", label: "💨 Chichas",
    groups: [
      {
        title: "Classiques", note: "Tabac premium, tête terre cuite",
        items: [
          { name: "Double Pomme", desc: "Le grand classique, anisé et fruité", price: 18 },
          { name: "Menthe Fraîche", desc: "Menthe glaciale et rafraîchissante", price: 18 },
          { name: "Raisin Menthe", desc: "Raisin noir sucré, touche de menthe", price: 18 },
          { name: "Pastèque", desc: "Douce et désaltérante", price: 18 },
          { name: "Citron Menthe", desc: "Acidulé et frais", price: 18 },
          { name: "Pêche", desc: "Pêche juteuse et parfumée", price: 18 },
        ],
      },
      {
        title: "Signatures Moon", note: "Mélanges exclusifs de la maison",
        items: [
          { name: "Moonlight", desc: "Myrtille, glace, pointe de vanille", price: 22, badge: "Best-seller" },
          { name: "Eclipse", desc: "Fruits rouges, grenade, menthe", price: 22 },
          { name: "Full Moon", desc: "Mangue, passion, ananas", price: 22 },
          { name: "Lune Rousse", desc: "Cerise, framboise, cola", price: 22 },
          { name: "Galaxy", desc: "Raisin, myrtille, menthe polaire", price: 22, badge: "Nouveau" },
          { name: "Tête fruit", desc: "Servie dans un ananas ou un melon frais", price: 30 },
        ],
      },
      {
        title: "Options", note: "",
        items: [
          { name: "Changement de tête", desc: "Même arôme ou nouvel arôme", price: 12 },
          { name: "Base glace / eau parfumée", desc: "Pour une fumée encore plus douce", price: 3 },
          { name: "Embout personnel", desc: "Embout hygiénique offert", price: 0 },
        ],
      },
    ],
  },
  {
    id: "cocktails", label: "🍸 Cocktails",
    groups: [
      {
        title: "Cocktails Signature", note: "Avec alcool — 18 ans et +",
        items: [
          { name: "Moon Spritz", desc: "Apérol, prosecco, fruit de la passion", price: 12, badge: "Signature" },
          { name: "Blue Lagoon", desc: "Vodka, curaçao bleu, citron, limonade", price: 11 },
          { name: "Mojito Royal", desc: "Rhum, menthe, citron vert, champagne", price: 13 },
          { name: "Piña Colada", desc: "Rhum, coco, ananas", price: 11 },
          { name: "Sex on the Beach", desc: "Vodka, pêche, orange, cranberry", price: 11 },
          { name: "Espresso Martini", desc: "Vodka, liqueur de café, espresso", price: 12 },
          { name: "Margarita", desc: "Tequila, triple sec, citron vert", price: 11 },
          { name: "Long Island", desc: "Vodka, gin, rhum, tequila, triple sec, cola", price: 14 },
        ],
      },
      {
        title: "Mocktails", note: "Sans alcool",
        items: [
          { name: "Virgin Mojito", desc: "Menthe, citron vert, sucre de canne, eau gazeuse", price: 8 },
          { name: "Moon Dream", desc: "Fruits rouges, litchi, citron, eau pétillante", price: 9, badge: "Signature" },
          { name: "Passion Sunset", desc: "Passion, mangue, orange, grenadine", price: 9 },
          { name: "Virgin Colada", desc: "Ananas, coco, crème", price: 8 },
          { name: "Mojito Fraise", desc: "Fraise, menthe, citron vert", price: 9 },
          { name: "Blue Moon", desc: "Sirop curaçao, citron, limonade", price: 8 },
        ],
      },
    ],
  },
  {
    id: "boissons", label: "🥤 Boissons",
    groups: [
      {
        title: "Softs", note: "33 cl",
        items: [
          { name: "Coca-Cola / Zéro", price: 4.5 },
          { name: "Fanta / Sprite", price: 4.5 },
          { name: "Ice Tea pêche", price: 4.5 },
          { name: "Oasis Tropical", price: 4.5 },
          { name: "Red Bull", price: 6 },
          { name: "Eau minérale / pétillante", desc: "50 cl", price: 3.5 },
        ],
      },
      {
        title: "Jus & Milkshakes", note: "",
        items: [
          { name: "Jus pressé", desc: "Orange ou citron", price: 6 },
          { name: "Jus de fruits", desc: "Ananas, mangue, fraise, pomme", price: 5 },
          { name: "Milkshake", desc: "Vanille, chocolat, fraise, Oreo, Kinder", price: 8 },
          { name: "Smoothie du moment", desc: "Fruits frais mixés", price: 8 },
        ],
      },
      {
        title: "Boissons chaudes", note: "",
        items: [
          { name: "Thé à la menthe", desc: "Théière pour 2", price: 7 },
          { name: "Thé parfumé", desc: "Fruits rouges, jasmin, earl grey", price: 4 },
          { name: "Espresso", price: 2.5 },
          { name: "Café crème / Cappuccino", price: 4.5 },
          { name: "Chocolat chaud", desc: "Chantilly maison", price: 5 },
        ],
      },
    ],
  },
  {
    id: "desserts", label: "🍰 Desserts",
    groups: [
      {
        title: "Douceurs maison", note: "",
        items: [
          { name: "Fondant au chocolat", desc: "Cœur coulant, boule de glace vanille", price: 8, badge: "Coup de cœur" },
          { name: "Tiramisu", desc: "Classique, spéculoos ou Nutella", price: 7 },
          { name: "Cheesecake", desc: "Coulis fruits rouges ou caramel", price: 7 },
          { name: "Crêpe gourmande", desc: "Nutella, banane, chantilly", price: 7 },
          { name: "Gaufre", desc: "Sucre, Nutella ou caramel beurre salé", price: 7 },
          { name: "Assiette de pâtisseries orientales", desc: "Baklava, cornes de gazelle…", price: 9 },
        ],
      },
      {
        title: "Glaces & fruits", note: "",
        items: [
          { name: "Coupe glacée 3 boules", desc: "Parfums au choix", price: 8 },
          { name: "Brownie glacé", desc: "Brownie tiède, glace, sauce chocolat", price: 8 },
          { name: "Corbeille de fruits frais", desc: "À partager, 2–4 personnes", price: 15 },
        ],
      },
    ],
  },
  {
    id: "snacks", label: "🍟 À grignoter",
    groups: [
      {
        title: "Snacks", note: "Servis jusqu'à 1h",
        items: [
          { name: "Planche apéro", desc: "Nuggets, tenders, frites, onion rings", price: 18 },
          { name: "Tenders (6 pièces)", desc: "Sauce au choix", price: 9 },
          { name: "Frites maison", desc: "Nature ou cheddar", price: 5 },
          { name: "Nachos", desc: "Cheddar fondu, guacamole, salsa", price: 9 },
          { name: "Fruits secs & olives", price: 5 },
        ],
      },
    ],
  },
];

// ===== Rendu du menu =====
const tabsEl = document.getElementById("tabs");
const panelEl = document.getElementById("menuPanel");

const formatPrice = (p) =>
  p === 0 ? "Offert" : p.toLocaleString("fr-FR", { minimumFractionDigits: p % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";

function renderCategory(cat) {
  panelEl.innerHTML = cat.groups.map((g) => `
    <div class="menu__group">
      <h3>${g.title}</h3>
      ${g.note ? `<p>${g.note}</p>` : ""}
      <div class="menu__grid">
        ${g.items.map((it) => `
          <div class="item">
            <div class="item__top">
              <span class="item__name">${it.name}${it.badge ? `<span class="badge">${it.badge}</span>` : ""}</span>
              <span class="item__dots"></span>
              <span class="item__price">${formatPrice(it.price)}</span>
            </div>
            ${it.desc ? `<p class="item__desc">${it.desc}</p>` : ""}
          </div>`).join("")}
      </div>
    </div>`).join("");
  // relance l'animation d'apparition
  panelEl.style.animation = "none";
  void panelEl.offsetWidth;
  panelEl.style.animation = "";
}

MENU.forEach((cat, i) => {
  const btn = document.createElement("button");
  btn.className = "tab" + (i === 0 ? " active" : "");
  btn.textContent = cat.label;
  btn.setAttribute("role", "tab");
  btn.setAttribute("aria-selected", i === 0);
  btn.addEventListener("click", () => {
    tabsEl.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    renderCategory(cat);
  });
  tabsEl.appendChild(btn);
});
renderCategory(MENU[0]);

// ===== Navigation =====
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40), { passive: true });

burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  })
);

// ===== Apparition au scroll =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== Ciel étoilé =====
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
let stars = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const count = Math.floor((canvas.width * canvas.height) / 6000);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    a: Math.random(),
    s: Math.random() * 0.015 + 0.003,
  }));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach((st) => {
    st.a += st.s;
    const alpha = 0.3 + Math.abs(Math.sin(st.a)) * 0.7;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 245, 220, ${alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
resize();
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  stars.forEach((st) => (st.s = 0));
}
draw();

// ===== Formulaire de réservation =====
const form = document.getElementById("resaForm");
const statusEl = document.getElementById("formStatus");
form.date.min = new Date().toISOString().split("T")[0];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    const ok = field.value.trim() !== "";
    field.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
  });
  if (!valid) {
    statusEl.textContent = "Merci de remplir tous les champs obligatoires.";
    statusEl.className = "form__status err";
    return;
  }
  statusEl.textContent = `Merci ${form.nom.value.trim()} ! Votre demande a bien été envoyée, nous vous rappelons très vite.`;
  statusEl.className = "form__status ok";
  form.reset();
});

document.getElementById("year").textContent = new Date().getFullYear();
