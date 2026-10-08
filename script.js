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
   MOTION DESIGN
=========================== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Intro : retirée du DOM une fois le rideau levé */
const intro = document.querySelector('.intro');
if (intro) {
    if (document.documentElement.classList.contains('has-intro')) {
        setTimeout(() => intro.remove(), 2200);
    } else {
        intro.remove();
    }
}

/* Titre du hero découpé en mots */
const heroTitle = document.querySelector('.split');
if (heroTitle) {
    heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());
    let wi = 0;
    const splitWords = node => {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) { splitWords(child); return; }
            if (child.nodeType !== Node.TEXT_NODE) return;
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (!part.trim()) { frag.append(part); return; }
                const w = document.createElement('span');
                const inner = document.createElement('span');
                w.className = 'w';
                w.setAttribute('aria-hidden', 'true');
                inner.textContent = part;
                inner.style.setProperty('--wi', wi++);
                w.append(inner);
                frag.append(w);
            });
            child.replaceWith(frag);
        });
    };
    splitWords(heroTitle);
    requestAnimationFrame(() => requestAnimationFrame(() => heroTitle.classList.add('in')));
}

/* Fil lumineux entre les étapes */
document.querySelectorAll('.steps').forEach(el => revealObserver.observe(el));

/* Ondes radar calées sur le repère de Huttenheim (image en object-fit: cover) */
const zoneMap = document.querySelector('.zone-map');
if (zoneMap) {
    const img = zoneMap.querySelector('img');
    const pings = zoneMap.querySelector('.zone-pings');
    const PIN = { x: 0.7435, y: 0.385 }; // position du repère dans l'image
    const placePings = () => {
        const W = zoneMap.clientWidth, H = zoneMap.clientHeight;
        const nw = img.naturalWidth || 3508, nh = img.naturalHeight || 2320;
        const scale = Math.max(W / nw, H / nh);
        pings.style.setProperty('--x', `${(W - nw * scale) / 2 + PIN.x * nw * scale}px`);
        pings.style.setProperty('--y', `${(H - nh * scale) / 2 + PIN.y * nh * scale}px`);
    };
    new ResizeObserver(placePings).observe(zoneMap);
    img.addEventListener('load', placePings);
}

if (!reduceMotion) {
    const ambient = document.querySelector('.ambient');
    const progress = document.querySelector('.progress');
    const marquee = document.querySelector('.marquee');
    const marqueeAnim = marquee && marquee.querySelector('.marquee-track').getAnimations()[0];
    const glow = document.querySelector('.cursor-glow');

    let lastY = window.scrollY, velocity = 0, direction = 1, lastSkew = 0;
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;

    const frame = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - innerHeight;

        // progression + parallaxe du fond
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        ambient.style.setProperty('--sy', y.toFixed(0));

        // bandeau : accélère, change de sens et s'incline selon le scroll
        velocity += ((y - lastY) - velocity) * 0.12;
        lastY = y;
        if (Math.abs(velocity) > 0.5) direction = Math.sign(velocity);
        if (marqueeAnim) marqueeAnim.playbackRate = direction * (1 + Math.min(Math.abs(velocity) * 0.35, 8));
        const skew = Math.max(-10, Math.min(10, velocity * -0.4));
        if (marquee && Math.abs(skew - lastSkew) > 0.05) {
            marquee.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
            lastSkew = skew;
        }

        // halo du curseur, avec inertie
        if (glow && finePointer) {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
        }
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    if (finePointer) {
        window.addEventListener('pointermove', e => {
            tx = e.clientX; ty = e.clientY;
            glow.classList.add('on');
        }, { passive: true });
        document.addEventListener('pointerleave', () => glow.classList.remove('on'));

        // cartes flottantes du hero en parallaxe
        const hero = document.querySelector('.hero');
        const heroVisual = document.querySelector('.hero-visual');
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            heroVisual.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
            heroVisual.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
        hero.addEventListener('pointerleave', () => {
            heroVisual.style.setProperty('--px', 0);
            heroVisual.style.setProperty('--py', 0);
        });

        // boutons magnétiques
        document.querySelectorAll('.btn-primary, .card-arrow').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * 0.25;
                const y = (e.clientY - r.top - r.height / 2) * 0.35;
                el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
            });
            el.addEventListener('pointerleave', () => { el.style.translate = ''; });
        });
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
