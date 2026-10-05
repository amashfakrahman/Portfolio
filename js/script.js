document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const nav = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navItems = [...document.querySelectorAll('.nav-link')];
    const sections = [...document.querySelectorAll('main section[id]')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---------------------------------------------------------------------
    // App-like page progress + ready state
    // ---------------------------------------------------------------------
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    body.prepend(progress);

    requestAnimationFrame(() => body.classList.add('ui-ready'));

    const updateScrollProgress = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
        nav?.classList.toggle('is-scrolled', window.scrollY > 16);
    };

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                updateScrollProgress();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
    updateScrollProgress();

    // ---------------------------------------------------------------------
    // Mobile navigation
    // ---------------------------------------------------------------------
    const closeMobileMenu = () => {
        if (!navLinks || !mobileMenuBtn) return;
        navLinks.classList.remove('is-open');
        mobileMenuBtn.classList.remove('is-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        body.classList.remove('menu-open');
    };

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('is-open');
            mobileMenuBtn.classList.toggle('is-open', isOpen);
            mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
            body.classList.toggle('menu-open', isOpen);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 820) closeMobileMenu();
        });
    }

    // ---------------------------------------------------------------------
    // Smooth anchor navigation
    // ---------------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            closeMobileMenu();

            const offset = (nav?.offsetHeight || 72) + 14;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
                top,
                behavior: reducedMotion ? 'auto' : 'smooth'
            });
        });
    });

    // ---------------------------------------------------------------------
    // Active section navigation
    // ---------------------------------------------------------------------
    if ('IntersectionObserver' in window && sections.length) {
        const activeObserver = new IntersectionObserver(entries => {
            const visible = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visible) return;
            const id = visible.target.id;
            navItems.forEach(item => {
                const active = item.getAttribute('href') === `#${id}`;
                item.classList.toggle('active', active);
                if (active) item.setAttribute('aria-current', 'page');
                else item.removeAttribute('aria-current');
            });
        }, {
            rootMargin: '-28% 0px -52% 0px',
            threshold: [0.01, 0.2, 0.45]
        });

        sections.forEach(section => activeObserver.observe(section));
    }

    // ---------------------------------------------------------------------
    // Staggered scroll reveal system
    // ---------------------------------------------------------------------
    const revealTargets = document.querySelectorAll([
        '.section-title',
        '.section-subtitle',
        '.terminal-box',
        '.timeline-item',
        '.tech-marquee',
        '.project-card',
        '.list-card',
        '.contact-sidebar',
        '.terminal-form-box'
    ].join(','));

    revealTargets.forEach((element, index) => {
        element.classList.add('reveal-item');
        element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 70}ms`);
    });

    if (!reducedMotion && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

        revealTargets.forEach(element => revealObserver.observe(element));
    } else {
        revealTargets.forEach(element => element.classList.add('is-visible'));
    }

    // ---------------------------------------------------------------------
    // Fine-pointer cursor aura + page spotlight
    // ---------------------------------------------------------------------
    if (finePointer && !reducedMotion) {
        body.classList.add('custom-cursor-enabled');

        const dot = document.createElement('div');
        const ring = document.createElement('div');
        dot.className = 'pointer-dot';
        ring.className = 'pointer-ring';
        dot.setAttribute('aria-hidden', 'true');
        ring.setAttribute('aria-hidden', 'true');
        body.append(dot, ring);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;

        const renderCursor = () => {
            ringX += (mouseX - ringX) * 0.16;
            ringY += (mouseY - ringY) * 0.16;
            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
            requestAnimationFrame(renderCursor);
        };
        requestAnimationFrame(renderCursor);

        window.addEventListener('pointermove', event => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            body.style.setProperty('--pointer-x', `${event.clientX}px`);
            body.style.setProperty('--pointer-y', `${event.clientY}px`);
            body.classList.add('pointer-active');
        }, { passive: true });

        document.addEventListener('pointerleave', () => body.classList.remove('pointer-active'));
        document.addEventListener('pointerenter', () => body.classList.add('pointer-active'));

        const interactive = document.querySelectorAll('a, button, input, textarea, .project-card, .list-card, .experience-card, .tech-logo-item');
        interactive.forEach(element => {
            element.addEventListener('pointerenter', () => body.classList.add('pointer-hover'));
            element.addEventListener('pointerleave', () => body.classList.remove('pointer-hover'));
        });

        // Soft click pulse follows the cursor, without blocking interaction.
        document.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'mouse') return;
            const pulse = document.createElement('span');
            pulse.className = 'cursor-pulse';
            pulse.style.left = `${event.clientX}px`;
            pulse.style.top = `${event.clientY}px`;
            body.appendChild(pulse);
            pulse.addEventListener('animationend', () => pulse.remove(), { once: true });
        });
    }

    // ---------------------------------------------------------------------
    // Pointer-reactive cards: spotlight + subtle 3D tilt on desktop only
    // ---------------------------------------------------------------------
    if (finePointer && !reducedMotion) {
        const reactiveCards = document.querySelectorAll('.project-card, .experience-card, .list-card, .terminal-box, .terminal-form-box');

        reactiveCards.forEach(card => {
            card.classList.add('pointer-reactive');

            card.addEventListener('pointermove', event => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const rx = ((y / rect.height) - 0.5) * -3.5;
                const ry = ((x / rect.width) - 0.5) * 4.5;

                card.style.setProperty('--card-x', `${x}px`);
                card.style.setProperty('--card-y', `${y}px`);
                card.style.setProperty('--tilt-x', `${rx.toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${ry.toFixed(2)}deg`);
            });

            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

    // ---------------------------------------------------------------------
    // Contact form (sends to Formspree via fetch)
    // ---------------------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async event => {
            event.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            const originalText = submitBtn.innerHTML;
            const resetButton = delay => window.setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-success', 'is-loading');
            }, delay);

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="status-dot"></span> EXECUTING...';
            submitBtn.classList.add('is-loading');

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) throw new Error('Request failed');

                submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> SUCCESS';
                submitBtn.classList.remove('is-loading');
                submitBtn.classList.add('is-success');
                contactForm.reset();
                resetButton(2600);
            } catch (error) {
                submitBtn.innerHTML = 'ERROR - TRY AGAIN';
                submitBtn.classList.remove('is-loading');
                resetButton(3000);
            }
        });
    }
});
