/* ===========================
   NAVBAR : masquage au scroll + lien actif
=========================== */
const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const navbar = document.getElementById('navbar');

let lastScroll = window.scrollY;
window.addEventListener('scroll', () => {
    const current = window.scrollY;
    const menuOpen = navbar.classList.contains('active');
    header.classList.toggle('hide', !menuOpen && current > lastScroll && current > 120);
    lastScroll = current;
}, { passive: true });

function closeMenu() {
    hamburger.classList.remove('active');
    navbar.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => {
    const open = navbar.classList.toggle('active');
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
});

navbar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', e => {
    if (!header.contains(e.target)) closeMenu();
});

const navLinks = [...navbar.querySelectorAll('a[href^="#"]:not(.nav-links-cta)')];
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionObserver.observe(s));

/* ===========================
   APPARITIONS AU SCROLL
=========================== */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
    // décalage en cascade entre éléments frères
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
    revealObserver.observe(el);
});

/* ===========================
   LIQUID GLASS : reflet au curseur + inclinaison
=========================== */
const finePointer = window.matchMedia('(pointer: fine)').matches;
if (finePointer) {
    document.querySelectorAll('.glass').forEach(el => {
        el.addEventListener('pointermove', e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${e.clientX - r.left}px`);
            el.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });

    const tilt = document.querySelector('.tilt');
    if (tilt) {
        tilt.addEventListener('pointermove', e => {
            const r = tilt.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            tilt.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        });
        tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
    }
}

/* ===========================
   FORMULAIRE (EmailJS)
=========================== */
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    let valid = true;
    form.querySelectorAll('.field input, .field textarea').forEach(field => {
        const ok = field.checkValidity();
        field.closest('.field').classList.toggle('invalid', !ok);
        if (!ok && valid) { field.focus(); valid = false; }
    });
    if (!valid) {
        status.className = 'err';
        status.textContent = 'Merci de remplir correctement tous les champs.';
        return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.className = '';
    status.textContent = 'Envoi en cours…';

    fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'fetch' }
    })
        .then(res => res.json())
        .then(data => {
            if (!data.ok) throw new Error(data.message);
            status.className = 'ok';
            status.textContent = data.message;
            form.reset();
        })
        .catch(err => {
            status.className = 'err';
            status.textContent = err instanceof SyntaxError || err instanceof TypeError || !err.message
                ? "Erreur lors de l'envoi. Appelez-nous au 07 81 56 05 38."
                : err.message;
        })
        .finally(() => { button.disabled = false; });
});

form.querySelectorAll('.field input, .field textarea').forEach(field => {
    field.addEventListener('input', () => field.closest('.field').classList.remove('invalid'));
});

/* Retour après un envoi sans JavaScript */
const envoi = new URLSearchParams(location.search).get('envoi');
if (envoi) {
    status.className = envoi === 'ok' ? 'ok' : 'err';
    status.textContent = envoi === 'ok'
        ? 'Message envoyé avec succès ! Nous vous répondons rapidement.'
        : "Erreur lors de l'envoi. Appelez-nous au 07 81 56 05 38.";
}

/* ===========================
   FOOTER
=========================== */
document.getElementById('year').textContent = new Date().getFullYear();
