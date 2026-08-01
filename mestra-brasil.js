const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const easeOut = 'cubic-bezier(.22, 1, .36, 1)';

/* ---------- MENU ---------- */
const menuButton = document.querySelector('.nav-burger');
const menu = document.querySelector('.nav-links');

function setMenu(open) {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

window.addEventListener('resize', () => {
  if (innerWidth > 680) setMenu(false);
}, { passive: true });

const year = document.querySelector('[data-current-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* ---------- ROLAGEM SUAVE AO CLICAR NAS CATEGORIAS ---------- */
function smoothScrollTo(target, duration = 1500) {
  const start = scrollY;
  const headerOffset = target.id === 'hero' ? 0 : 68;
  const destination = Math.max(
    target.getBoundingClientRect().top + scrollY - headerOffset,
    0,
  );
  const distance = destination - start;
  const startedAt = performance.now();

  if (reduceMotion) {
    scrollTo(0, destination);
    return;
  }

  const easeInOut = (value) => value < .5
    ? 16 * value * value * value * value * value
    : 1 - Math.pow(-2 * value + 2, 5) / 2;

  function frame(now) {
    const elapsed = Math.min((now - startedAt) / duration, 1);
    scrollTo(0, start + distance * easeInOut(elapsed));
    if (elapsed < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const selector = link.getAttribute('href');
    if (!selector || selector === '#') return;
    const target = document.querySelector(selector);
    if (!target) return;

    event.preventDefault();
    setMenu(false);
    smoothScrollTo(target);
    history.replaceState(null, '', selector);
  });
});

/* ---------- BARRA DE PROGRESSO ---------- */
const progress = document.createElement('div');
progress.className = 'js-scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

let scrollFrame = 0;
function updateScrollProgress() {
  scrollFrame = 0;
  const available = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  const ratio = Math.min(Math.max(scrollY / available, 0), 1);
  progress.style.transform = `scaleX(${ratio})`;
}

function requestProgressUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollProgress);
}

addEventListener('scroll', requestProgressUpdate, { passive: true });
addEventListener('resize', requestProgressUpdate, { passive: true });
updateScrollProgress();

/* ---------- ABERTURA DO BANNER — 100% JAVASCRIPT ---------- */
function playAndKeep(element, keyframes, options) {
  if (!element) return null;
  if (reduceMotion) {
    Object.assign(element.style, keyframes.at(-1));
    return null;
  }

  const animation = element.animate(keyframes, {
    duration: 700,
    easing: easeOut,
    fill: 'both',
    ...options,
  });

  animation.finished.then(() => {
    Object.assign(element.style, keyframes.at(-1));
    animation.cancel();
  }).catch(() => {});
  return animation;
}

function playHeroIntro() {
  playAndKeep(document.querySelector('.nav'), [
    { opacity: 0, transform: 'translateY(-18px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { delay: 80, duration: 820 });

  playAndKeep(document.querySelector('.hero-sun'), [
    { opacity: 0, transform: 'scale(.82)' },
    { opacity: 1, transform: 'scale(1)' },
  ], { delay: 100, duration: 1250 });

  playAndKeep(document.querySelector('#mtnFar'), [
    { opacity: 0, transform: 'translateY(70px)' },
    { opacity: .7, transform: 'translateY(0)' },
  ], { delay: 160, duration: 1150 });

  playAndKeep(document.querySelector('#mtnNear'), [
    { opacity: 0, transform: 'translateY(90px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { delay: 240, duration: 1200 });

  document.querySelectorAll('.building').forEach((building, index) => {
    playAndKeep(building, [
      { opacity: 0, transform: 'translateY(115%)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { delay: 300 + index * 34, duration: 850 });
  });

  playAndKeep(document.querySelector('.wires'), [
    { opacity: 0 },
    { opacity: 1 },
  ], { delay: 620, duration: 900 });

  playAndKeep(document.querySelector('.hero-logo-card'), [
    { opacity: 0, transform: 'translateY(24px) scale(.975)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' },
  ], { delay: 560, duration: 1100 });

  playAndKeep(document.querySelector('.hero-desc'), [
    { opacity: 0, transform: 'translateY(22px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { delay: 780, duration: 980 });

  playAndKeep(document.querySelector('.hero-tag'), [
    { opacity: 0, transform: 'translateY(18px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { delay: 940, duration: 900 });

  playAndKeep(document.querySelector('.scroll-cue'), [
    { opacity: 0, transform: 'translate(-50%, 12px)' },
    { opacity: 1, transform: 'translate(-50%, 0)' },
  ], { delay: 1100, duration: 850 });
}

playHeroIntro();

/* ---------- ILUSTRAÇÃO INSTITUCIONAL ---------- */
const cityArtwork = document.querySelector('#sobreArt');
if (cityArtwork && !reduceMotion && 'IntersectionObserver' in window) {
  const artLayers = cityArtwork.querySelectorAll(
    '.art-grid, .art-sun, .art-routes, .art-mtn, .art-ground, .sobre-quote, .art-label'
  );
  const artOpacity = new Map(
    [...artLayers].map((layer) => [layer, getComputedStyle(layer).opacity])
  );

  artLayers.forEach((layer) => {
    layer.style.opacity = '0';
    layer.style.transform = 'translateY(20px)';
  });

  const artworkObserver = new IntersectionObserver((entries) => {
    const entry = entries.find((item) => item.isIntersecting);
    if (!entry) return;

    artLayers.forEach((layer, index) => {
      playAndKeep(layer, [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: artOpacity.get(layer), transform: 'translateY(0)' },
      ], { delay: index * 85, duration: 900 });
    });

    cityArtwork.querySelectorAll('.mb').forEach((building, index) => {
      playAndKeep(building, [
        { opacity: 0, transform: 'scaleY(0)' },
        { opacity: .96, transform: 'scaleY(1)' },
      ], { delay: 420 + index * 65, duration: 720 });
    });

    const artSun = cityArtwork.querySelector('.art-sun');
    if (artSun) {
      artSun.animate([
        { transform: 'scale(.96)', opacity: .72 },
        { transform: 'scale(1.06)', opacity: 1 },
      ], {
        duration: 4200,
        direction: 'alternate',
        iterations: Infinity,
        easing: 'cubic-bezier(.45, 0, .55, 1)',
      });
    }

    artworkObserver.disconnect();
  }, { threshold: .28 });

  artworkObserver.observe(cityArtwork);
}

const scrollLine = document.querySelector('.scroll-cue .dot-line');
if (scrollLine && !reduceMotion) {
  scrollLine.animate([
    { opacity: .35, transform: 'scaleY(.55)' },
    { opacity: 1, transform: 'scaleY(1)' },
  ], {
    duration: 1600,
    direction: 'alternate',
    iterations: Infinity,
    easing: 'cubic-bezier(.16, 1, .3, 1)',
  });
}

/* ---------- ENTRADA DAS SEÇÕES ---------- */
const revealItems = document.querySelectorAll(
  '.eyebrow, .section-title, .section-lead, .sobre-block, .proposta-card, ' +
  '.empresa-card, .obj-card, .dif-item, .cont-card, .sum-card, .parc-chip, .legal-inner, .contato-info'
);

if (!reduceMotion && 'IntersectionObserver' in window) {
  revealItems.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(28px)';
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const group = [...element.parentElement.children];
      const order = Math.max(group.indexOf(element), 0);

      playAndKeep(element, [
        { opacity: 0, transform: 'translateY(28px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { delay: Math.min(order * 90, 630), duration: 850 });

      revealObserver.unobserve(element);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8%' });

  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ---------- CLASSES VISUAIS DOS CARTÕES ---------- */
const premiumCards = document.querySelectorAll(
  '.proposta-card, .empresa-card, .obj-card, .dif-item, .cont-card, .sum-card, .parc-chip'
);
premiumCards.forEach((card) => card.classList.add('premium-card'));

/* ---------- FAIXA HISTÓRIA DA GENTE ---------- */
const marquee = document.querySelector('.marquee');
const marqueeTrack = document.querySelector('.marquee-track');
let marqueeAnimation = null;

if (marqueeTrack && !reduceMotion) {
  marqueeAnimation = marqueeTrack.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-50%)' },
  ], {
    duration: 65000,
    iterations: Infinity,
    easing: 'linear',
  });

  marquee?.addEventListener('mouseenter', () => marqueeAnimation.pause());
  marquee?.addEventListener('mouseleave', () => marqueeAnimation.play());
}

/* ---------- ITEM ATIVO NO MENU ---------- */
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (!visible) return;

    navLinks.forEach((link) => {
      link.toggleAttribute(
        'aria-current',
        link.getAttribute('href') === `#${visible.target.id}`,
      );
    });
  }, { rootMargin: '-40% 0px -50%', threshold: 0 });

  sections.forEach((section) => sectionObserver.observe(section));
}
