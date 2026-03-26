const animate = ScrollReveal({
    distance: '60px',
    duration: 1500,
    delay: 200,
    reset: false
});

/* ===========================
   NAVBAR
=========================== */
animate.reveal('.header', { origin: 'top' });


/* ===========================
   HERO
=========================== */
animate.reveal('.hero h2', { origin: 'left' });
animate.reveal('.hero p', { origin: 'bottom', delay: 300 });

animate.reveal('.glass-btn', { origin: 'bottom', delay: 400 });
animate.reveal('.hero-actions .pill', { origin: 'bottom', delay: 500 });

animate.reveal('.hero-meta span', { origin: 'bottom', interval: 120 });

animate.reveal('.hero-card', { origin: 'right', delay: 300 });
animate.reveal('.hero-card-left', { origin: 'left', delay: 400 });
animate.reveal('.hero-illustration', { origin: 'right', delay: 500 });


/* ===========================
   SERVICES
=========================== */
animate.reveal('#services .section-header', { origin: 'top' });

animate.reveal('#services .card', {
    origin: 'bottom',
    interval: 120
});


/* ===========================
   POURQUOI NOUS CHOISIR
=========================== */
animate.reveal('#why .section-header', { origin: 'top' });

animate.reveal('#why .card', {
    origin: 'bottom',
    interval: 120
});


/* ===========================
   ZONE D’INTERVENTION
=========================== */
animate.reveal('#zone .section-header', { origin: 'top' });

animate.reveal('.zone-map-card', { origin: 'left', delay: 300 });
animate.reveal('.zone-info', { origin: 'right', delay: 400 });

animate.reveal('.zone-tag', { origin: 'bottom', interval: 100 });
animate.reveal('.zone-badges span', { origin: 'bottom', interval: 120 });


/* ===========================
   CONTACT
=========================== */
animate.reveal('#contact .section-header', { origin: 'top' });

animate.reveal('#contact form', { origin: 'left', delay: 300 });
animate.reveal('.contact-infos', { origin: 'right', delay: 400 });

animate.reveal('.contact-badges .badge', {
    origin: 'bottom',
    interval: 120,
    delay: 500
});


/* ===========================
   FOOTER
=========================== */
animate.reveal('.footer-col', { origin: 'bottom', interval: 120 });
animate.reveal('.footer-bottom', { origin: 'bottom', delay: 300 });


document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    if (!header) {
        console.log('Header non trouvé');
        return;
    }

    let lastScroll = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > lastScroll && currentScroll > 80) {
            header.classList.add('hide');   // on descend
        } else {
            header.classList.remove('hide'); // on remonte
        }

        lastScroll = currentScroll;
    });
});


const hamburger = document.getElementById("hamburger");
const navbar = document.getElementById("navbar");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navbar.classList.toggle("active");
});