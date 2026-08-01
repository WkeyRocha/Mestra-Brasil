const body = document.body;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOutQuint = (value) => 1 - (1 - value) ** 5;
const easeInOutCubic = (value) =>
  value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

class CityScene {
  constructor(canvas, mode) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.mode = mode;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.buildings = [];
    this.active = mode === "hero";
    this.startedAt = null;
    this.progress = mode === "intro" ? 0 : 1;
    this.resize();
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(bounds.width));
    const height = Math.max(320, Math.round(bounds.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (width === this.width && height === this.height && dpr === this.dpr) return;

    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.generate();
  }

  generate() {
    const seeds = { intro: 1926, hero: 2026, territory: 3946 };
    const random = seededRandom(seeds[this.mode] + this.width * 3 + this.height);
    const palettes = {
      intro: ["#0b5663", "#e07350", "#d1ad72", "#7aa8b4", "#123f51", "#b55445"],
      hero: ["#0b4a5c", "#164c5d", "#76534c", "#426b73", "#123a4b", "#8b624e"],
      territory: ["#0d5062", "#1c6170", "#345b66", "#875547", "#183f50", "#b06b4f"],
    };
    const palette = palettes[this.mode];
    const layers = this.width < 600 ? 3 : 4;
    const buildings = [];

    for (let layer = 0; layer < layers; layer += 1) {
      const depth = layer / Math.max(1, layers - 1);
      const step = Math.max(34, this.width / (14 + layer * 5));
      const count = Math.ceil(this.width / step) + 3;
      const base = this.height * (0.72 + depth * 0.28);

      for (let index = -1; index < count; index += 1) {
        const width = step * (0.8 + random() * 1.05);
        const height = this.height * (0.09 + random() * (0.14 + depth * 0.14));
        const x = index * step + (random() - 0.5) * step * 0.75;
        const delay = clamp(index / count * 0.42 + layer * 0.075 + random() * 0.08, 0, 0.72);
        const hasTower = random() > 0.82;

        buildings.push({
          x,
          width,
          height,
          base: base + (random() - 0.5) * this.height * 0.025,
          delay,
          duration: 0.28 + random() * 0.23,
          color: palette[Math.floor(random() * palette.length)],
          depth,
          side: 5 + random() * 10,
          rows: 2 + Math.floor(random() * 5),
          columns: 1 + Math.floor(random() * 4),
          hasTower,
          towerHeight: height * (0.16 + random() * 0.22),
          lightSeed: random() * 10,
        });
      }
    }

    this.buildings = buildings.sort((a, b) => a.depth - b.depth);
  }

  drawGround(time) {
    const ctx = this.context;
    const horizon = this.height * 0.68;
    const alpha = this.mode === "intro" ? 0.14 : 0.09;
    ctx.save();
    ctx.strokeStyle = `rgba(185, 216, 231, ${alpha})`;
    ctx.lineWidth = 1;

    for (let index = -8; index <= 8; index += 1) {
      const sway = Math.sin(time * 0.00015 + index) * 2;
      ctx.beginPath();
      ctx.moveTo(this.width * 0.52 + index * 7, horizon);
      ctx.lineTo(this.width * 0.5 + index * this.width * 0.12 + sway, this.height);
      ctx.stroke();
    }

    for (let index = 0; index < 7; index += 1) {
      const t = index / 6;
      const y = horizon + (t ** 2) * (this.height - horizon);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBuilding(building, globalProgress, time) {
    const local = clamp((globalProgress - building.delay) / building.duration);
    if (local <= 0) return;

    const ctx = this.context;
    const rise = easeInOutCubic(local);
    const currentHeight = building.height * rise;
    const top = building.base - currentHeight;
    const side = building.side * (0.35 + building.depth * 0.65);
    const alpha = 0.54 + building.depth * 0.46;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x, top, building.width, currentHeight + 2);

    ctx.globalAlpha = alpha * 0.58;
    ctx.fillStyle = "#021824";
    ctx.beginPath();
    ctx.moveTo(building.x + building.width, top);
    ctx.lineTo(building.x + building.width + side, top - side * 0.55);
    ctx.lineTo(building.x + building.width + side, building.base - side * 0.55);
    ctx.lineTo(building.x + building.width, building.base);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = alpha * 0.82;
    ctx.fillStyle = "rgba(210, 230, 235, 0.22)";
    ctx.beginPath();
    ctx.moveTo(building.x, top);
    ctx.lineTo(building.x + side, top - side * 0.55);
    ctx.lineTo(building.x + building.width + side, top - side * 0.55);
    ctx.lineTo(building.x + building.width, top);
    ctx.closePath();
    ctx.fill();

    if (building.hasTower && local > 0.82) {
      const towerProgress = easeOutQuint(clamp((local - 0.82) / 0.18));
      const towerHeight = building.towerHeight * towerProgress;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = building.color;
      ctx.fillRect(
        building.x + building.width * 0.56,
        top - towerHeight,
        building.width * 0.18,
        towerHeight,
      );
      ctx.strokeStyle = "rgba(220, 237, 241, 0.45)";
      ctx.beginPath();
      ctx.moveTo(building.x + building.width * 0.65, top - towerHeight);
      ctx.lineTo(building.x + building.width * 0.65, top - towerHeight - towerHeight * 0.65);
      ctx.stroke();
    }

    const windowProgress = clamp((local - 0.64) / 0.36);
    if (windowProgress > 0 && currentHeight > 30 && building.width > 24) {
      const gapX = building.width / (building.columns + 1);
      const gapY = currentHeight / (building.rows + 1);
      const windowWidth = Math.min(6, Math.max(2, gapX * 0.24));
      const windowHeight = Math.min(8, Math.max(3, gapY * 0.25));

      for (let row = 1; row <= building.rows; row += 1) {
        for (let column = 1; column <= building.columns; column += 1) {
          const flicker = Math.sin(time * 0.0012 + building.lightSeed + row * column) > -0.25;
          ctx.globalAlpha = alpha * windowProgress * (flicker ? 0.78 : 0.25);
          ctx.fillStyle = flicker ? "#f1c478" : "#b8d5df";
          ctx.fillRect(
            building.x + gapX * column - windowWidth / 2,
            top + gapY * row - windowHeight / 2,
            windowWidth,
            windowHeight,
          );
        }
      }
    }

    if (local < 0.98) {
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = "#d5e6eb";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.strokeRect(building.x - 4, top - 5, building.width + 8, currentHeight + 7);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(building.x - 8, top - 5);
      ctx.lineTo(building.x + building.width + 14, top - 5);
      ctx.stroke();
    }

    ctx.restore();
  }

  draw(progress = this.progress, time = performance.now()) {
    this.resize();
    const ctx = this.context;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.drawGround(time);
    const idleShift = this.mode === "intro" ? 0 : Math.sin(time * 0.00015) * 2.5;
    ctx.save();
    ctx.translate(0, idleShift);
    this.buildings.forEach((building) => this.drawBuilding(building, progress, time));
    ctx.restore();
  }
}

const canvasElements = [...document.querySelectorAll("[data-city-canvas]")];
const scenes = new Map(
  canvasElements.map((canvas) => [canvas.dataset.cityCanvas, new CityScene(canvas, canvas.dataset.cityCanvas)]),
);

const intro = document.querySelector("#intro");
const skipIntroButton = document.querySelector("[data-skip-intro]");
const introCounter = document.querySelector("[data-intro-counter]");
const introScene = scenes.get("intro");
let introFrame;
let introStart;
let introClosed = false;

function closeIntro() {
  if (introClosed) return;
  introClosed = true;
  window.cancelAnimationFrame(introFrame);
  intro?.classList.add("is-done");
  body.classList.remove("is-loading");
  body.classList.add("is-entered");
  window.setTimeout(() => intro?.setAttribute("aria-hidden", "true"), 1400);
}

function animateIntro(time) {
  if (!introStart) introStart = time;
  const elapsed = time - introStart;
  const constructionProgress = clamp(elapsed / 4800);
  const displayProgress = Math.min(100, Math.round(clamp(elapsed / 7000) * 100));

  introScene?.draw(constructionProgress, time);
  if (introCounter) introCounter.textContent = String(displayProgress).padStart(2, "0");

  if (elapsed >= 7450) {
    closeIntro();
    return;
  }

  introFrame = window.requestAnimationFrame(animateIntro);
}

function startIntro() {
  intro?.classList.add("is-playing");
  if (prefersReducedMotion) {
    introScene?.draw(1);
    window.setTimeout(closeIntro, 500);
    return;
  }
  introFrame = window.requestAnimationFrame(animateIntro);
}

skipIntroButton?.addEventListener("click", closeIntro);
window.requestAnimationFrame(startIntro);

const animatedScenes = [...scenes.values()].filter((scene) => scene.mode !== "intro");

if ("IntersectionObserver" in window) {
  const sceneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const mode = entry.target.dataset.cityCanvas;
        const scene = scenes.get(mode);
        if (!scene) return;
        scene.active = entry.isIntersecting;
        if (entry.isIntersecting && scene.startedAt === null) scene.startedAt = performance.now();
      });
    },
    { rootMargin: "15% 0px 15% 0px" },
  );
  animatedScenes.forEach((scene) => sceneObserver.observe(scene.canvas));
}

function animateScenes(time) {
  animatedScenes.forEach((scene) => {
    if (!scene.active) return;
    const duration = scene.mode === "territory" ? 3600 : 1;
    const progress = scene.mode === "territory"
      ? clamp((time - (scene.startedAt || time)) / duration)
      : 1;
    scene.draw(progress, time);
  });
  window.requestAnimationFrame(animateScenes);
}

if (!prefersReducedMotion) {
  window.requestAnimationFrame(animateScenes);
} else {
  animatedScenes.forEach((scene) => scene.draw(1));
}

window.addEventListener("resize", () => {
  scenes.forEach((scene) => {
    scene.width = 0;
    scene.resize();
    scene.draw(scene.progress || 1);
  });
}, { passive: true });

const header = document.querySelector("[data-header]");
const progressBar = document.querySelector(".scroll-progress span");

function updateScrollUI() {
  const scrollTop = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? scrollTop / scrollable : 0;
  header?.classList.toggle("is-scrolled", scrollTop > 36);
  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
}

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

const parallaxElements = [...document.querySelectorAll("[data-parallax]")];
let parallaxFrame;

function updateParallax() {
  parallaxFrame = undefined;
  const viewportCenter = window.innerHeight / 2;

  parallaxElements.forEach((element) => {
    const bounds = element.getBoundingClientRect();
    if (bounds.bottom < -200 || bounds.top > window.innerHeight + 200) return;
    const speed = Number(element.dataset.parallax) || 0.03;
    const center = bounds.top + bounds.height / 2;
    const offset = clamp((viewportCenter - center) * speed, -42, 42);
    element.style.setProperty("--parallax-y", `${offset}px`);
  });
}

function requestParallax() {
  if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
}

if (parallaxElements.length && !prefersReducedMotion) {
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax, { passive: true });
  requestParallax();
}

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav a");

menuToggle?.addEventListener("click", () => {
  const open = header?.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(Boolean(open)));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header?.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menu");
  });
});

const reveals = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
  );
  reveals.forEach((element) => revealObserver.observe(element));
}

const topicData = {
  memoria: {
    count: "01",
    eyebrow: "Raízes que explicam o presente",
    title: "História & memória",
    description: "Das primeiras ocupações aos marcos que moldaram a cidade e permanecem na memória coletiva.",
    items: ["Passado e presente", "Histórias que moldaram a cidade", "Fundação, origem e personalidades"],
  },
  sociedade: {
    count: "02",
    eyebrow: "Pessoas, vínculos e expressão",
    title: "Cidade & sociedade",
    description: "Convívio, patrimônio e manifestações culturais como partes vivas da formação de uma comunidade.",
    items: ["Patrimônio e formação cultural", "Expressões, aspectos e valores", "Transformações urbanas"],
  },
  ambiente: {
    count: "03",
    eyebrow: "Território que ensina",
    title: "Meio ambiente",
    description: "Geografia local e relação com a natureza estimulam uma leitura responsável do território.",
    items: ["Clima, relevo e vegetação", "Vivendo em harmonia", "Preservação e sustentabilidade"],
  },
  cidadania: {
    count: "04",
    eyebrow: "Participação que transforma",
    title: "Política & cidadania",
    description: "Direitos, deveres e participação social revelam o papel de cada pessoa na construção da cidade.",
    items: ["Direitos e deveres", "Participação da comunidade", "Cidadania em prática"],
  },
  turismo: {
    count: "05",
    eyebrow: "Descobrir para valorizar",
    title: "Lazer & turismo",
    description: "Festas, culinária, artesanato e paisagens convidam a redescobrir o lugar onde se vive.",
    items: ["Descobrindo a nossa cidade", "Passeios e aventuras", "Cultura e patrimônio local"],
  },
};

const topicTabs = document.querySelectorAll(".topic-tab");
const topicPanel = document.querySelector(".topic-panel");
const topicFields = {
  count: document.querySelector("[data-topic-count]"),
  eyebrow: document.querySelector("[data-topic-eyebrow]"),
  title: document.querySelector("[data-topic-title]"),
  description: document.querySelector("[data-topic-description]"),
  list: document.querySelector("[data-topic-list]"),
};

topicTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const topic = topicData[tab.dataset.topic];
    if (!topic) return;

    topicTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });

    topicPanel?.classList.remove("is-changing");
    void topicPanel?.offsetWidth;
    topicFields.count.textContent = topic.count;
    topicFields.eyebrow.textContent = topic.eyebrow;
    topicFields.title.textContent = topic.title;
    topicFields.description.textContent = topic.description;
    topicFields.list.replaceChildren(
      ...topic.items.map((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        return listItem;
      }),
    );
    topicPanel?.classList.add("is-changing");
  });
});

const cursor = document.querySelector("[data-cursor]");
const cursorLabel = document.querySelector("[data-cursor-label]");
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

if (cursor && cursorLabel && hasFinePointer && !prefersReducedMotion) {
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let cursorX = pointerX;
  let cursorY = pointerY;

  const renderCursor = () => {
    cursorX += (pointerX - cursorX) * 0.18;
    cursorY += (pointerY - cursorY) * 0.18;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    window.requestAnimationFrame(renderCursor);
  };

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.classList.add("is-visible");
    const interactive = event.target.closest("[data-cursor-text]");
    const label = interactive?.dataset.cursorText || "";
    cursor.classList.toggle("is-active", Boolean(label));
    cursorLabel.textContent = label;
  }, { passive: true });

  document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
  renderCursor();
}

if (hasFinePointer && !prefersReducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - (bounds.left + bounds.width / 2)) * 0.14;
      const y = (event.clientY - (bounds.top + bounds.height / 2)) * 0.18;
      element.style.setProperty("--magnetic-x", `${x}px`);
      element.style.setProperty("--magnetic-y", `${y}px`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--magnetic-x", "0px");
      element.style.setProperty("--magnetic-y", "0px");
    });
  });
}

const contactForm = document.querySelector("[data-contact-form]");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = data.get("name");
  const city = data.get("city");
  const email = data.get("email");
  const subject = encodeURIComponent(`Projeto História da Gente — ${city}`);
  const message = encodeURIComponent(
    `Olá, equipe Mestra Brasil!\n\nMeu nome é ${name} e gostaria de conversar sobre uma edição do projeto História da Gente para ${city}.\n\nMeu e-mail para retorno é ${email}.`,
  );
  window.location.href = `mailto:mestrabrasileducacao@gmail.com?subject=${subject}&body=${message}`;
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
