import { logoData } from "./logo.js";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

document.addEventListener("DOMContentLoaded", () => {
  initHeroIntro();
  initSmoothScroll();
  initHero();
});

// -----------------------------------------------------------------------
// Smooth scroll
// -----------------------------------------------------------------------
function initSmoothScroll() {
  const lenis = new Lenis();

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

// -----------------------------------------------------------------------
// Entrada
// -----------------------------------------------------------------------
function initHeroIntro() {
  const heroLogoImg = document.querySelector(".hero-img-logo img");
  const heroPersonImg = document.querySelector(".hero-img-person img");

  const introTl = gsap.timeline({ defaults: { ease: "expo.out" } });

  introTl.to(".reveal-curtain", {
    yPercent: -100,
    duration: 1.4,
    ease: "power4.inOut",
  });

  introTl.fromTo(
    [heroLogoImg, heroPersonImg],
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 1.2, stagger: 0.15 },
    "-=0.9",
  );
}

// -----------------------------------------------------------------------
// Seção 1: Hero
// -----------------------------------------------------------------------
let currentInitialOverlayScale = 350;

function initHero() {
  const heroImgContainer = document.querySelector(".hero-img-container");
  const heroImgLogo = document.querySelector(".hero-img-logo");
  const heroImgCopy = document.querySelector(".hero-img-copy");
  const fadeOverlay = document.querySelector(".fade-overlay");
  const svgOverlay = document.querySelector(".overlay");
  const overlayCopy = document.querySelector(".overlay-copy h1");

  // Define as configurações iniciais baseadas na tela
  setupResponsiveOverlay(svgOverlay);

  positionLogoMask();

  const heroTrigger = createHeroScrollTrigger({
    heroImgContainer,
    heroImgLogo,
    heroImgCopy,
    fadeOverlay,
    svgOverlay,
    overlayCopy,

    initialOverlayScale: currentInitialOverlayScale,
  });

  let lastWidth = window.innerWidth;

  // Atualiza tudo se o celular mudar de orientação ou tamanho
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;

    setupResponsiveOverlay(svgOverlay);
    positionLogoMask();

    ScrollTrigger.refresh();
    const realProgress = heroTrigger.progress;
    updateInitialFade(realProgress, heroImgLogo, heroImgCopy);
    updateMaskZoom(
      realProgress,
      heroImgContainer,
      svgOverlay,
      fadeOverlay,
      currentInitialOverlayScale,
    );
  });
}

//função auxiliar para Mobile vs Desktop
function setupResponsiveOverlay(svgOverlay) {
  gsap.set(svgOverlay, { opacity: 0 });

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    currentInitialOverlayScale = 600;

    const logoContainer = document.querySelector(".logo-container");
    if (logoContainer) {
      const logoRect = logoContainer.getBoundingClientRect();
      const logoCenterY = logoRect.top + logoRect.height / 2;
      const originYPercent = (logoCenterY / (window.innerHeight * 2)) * 100;

      gsap.set(svgOverlay, { transformOrigin: `center ${originYPercent}%` });
    }
  } else {
    // Mantém exatamente o seu padrão de design do desktop
    currentInitialOverlayScale = 350;
    gsap.set(svgOverlay, { transformOrigin: "center 10.45%" });
  }
}

function positionLogoMask() {
  const logoContainer = document.querySelector(".logo-container");
  const logoMask = document.getElementById("logoMask");

  // Garante que o path seja inserido antes de ler o BBox
  logoMask.setAttribute("d", logoData);

  const logoDimensions = logoContainer.getBoundingClientRect();
  const logoBoundingBox = logoMask.getBBox();

  const horizontalScaleRatio = logoDimensions.width / logoBoundingBox.width;
  const verticalScaleRatio = logoDimensions.height / logoBoundingBox.height;
  const logoScaleFactor = Math.min(horizontalScaleRatio, verticalScaleRatio);

  const logoHorizontalPosition =
    logoDimensions.left +
    (logoDimensions.width - logoBoundingBox.width * logoScaleFactor) / 2 -
    logoBoundingBox.x * logoScaleFactor;

  const logoVerticalPosition =
    logoDimensions.top +
    (logoDimensions.height - logoBoundingBox.height * logoScaleFactor) / 2 -
    logoBoundingBox.y * logoScaleFactor;

  logoMask.setAttribute(
    "transform",
    `translate(${logoHorizontalPosition}, ${logoVerticalPosition}) scale(${logoScaleFactor})`,
  );

  // Força o GSAP a resetar a escala inicial da overlay
  const svgOverlay = document.querySelector(".overlay");
  gsap.set(svgOverlay, { scale: currentInitialOverlayScale });
}

// Cria o ScrollTrigger que pina a hero
function createHeroScrollTrigger({
  heroImgContainer,
  heroImgLogo,
  heroImgCopy,
  fadeOverlay,
  svgOverlay,
  overlayCopy,
  initialOverlayScale,
}) {
  const trigger = ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: `${window.innerHeight * 5}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      const scrollProgress = self.progress;

      updateInitialFade(scrollProgress, heroImgLogo, heroImgCopy);
      updateMaskZoom(
        scrollProgress,
        heroImgContainer,
        svgOverlay,
        fadeOverlay,
        initialOverlayScale,
      );
      updateOverlayCopyReveal(scrollProgress, overlayCopy);
    },
  });

  return trigger;
}

// 0% -> 15% do scroll: logo e "scroll down to reveal" iniciais somem
function updateInitialFade(scrollProgress, heroImgLogo, heroImgCopy) {
  const fadeOpacity = 1 - scrollProgress * (1 / 0.15);

  if (scrollProgress <= 0.15) {
    gsap.set([heroImgLogo, heroImgCopy], { opacity: fadeOpacity });
  } else {
    gsap.set([heroImgLogo, heroImgCopy], { opacity: 0 });
  }
}

// 0% -> 85% do scroll: zoom-out do mask reveal + fade do overlay branco
function updateMaskZoom(
  scrollProgress,
  heroImgContainer,
  svgOverlay,
  fadeOverlay,
  initialOverlayScale,
) {
  if (scrollProgress > 0.85) return;

  const normalizedProgress = scrollProgress * (1 / 0.85);
  const heroImgContainerScale = 1.3 - 0.5 * normalizedProgress;
  const overlayScale =
    initialOverlayScale * Math.pow(1 / initialOverlayScale, normalizedProgress);

  // Fade-in: a máscara só começa a aparecer nos primeiros 5% do scroll,
  const overlayFadeInThreshold = 0.05;
  const overlayOpacity = Math.min(1, scrollProgress / overlayFadeInThreshold);

  gsap.set(heroImgContainer, { scale: heroImgContainerScale });
  gsap.set(svgOverlay, { scale: overlayScale, opacity: overlayOpacity });

  let fadeOverlayOpacity = 0;
  if (scrollProgress >= 0.25) {
    fadeOverlayOpacity = Math.min(1, (scrollProgress - 0.25) * (1 / 0.4));
  }
  gsap.set(fadeOverlay, { opacity: fadeOverlayOpacity });
}

// 60% -> 85% do scroll: revela o h1 com um gradiente de cor animado
function updateOverlayCopyReveal(scrollProgress, overlayCopy) {
  if (scrollProgress >= 0.6 && scrollProgress <= 0.85) {
    const revealProgress = (scrollProgress - 0.6) * (1 / 0.25);

    const gradientSpread = 100;
    const gradientBottomPosition = 240 - revealProgress * 280;
    const gradientTopPosition = gradientBottomPosition - gradientSpread;
    const overlayCopyScale = 1.25 - 0.25 * revealProgress;

    overlayCopy.style.background = `linear-gradient(to bottom, #111117 0%, #111117 ${gradientTopPosition}%, #e66461 ${gradientBottomPosition}%, #e66461 100%)`;
    overlayCopy.style.backgroundClip = "text";

    gsap.set(overlayCopy, {
      scale: overlayCopyScale,
      opacity: revealProgress,
    });
  } else if (scrollProgress < 0.6) {
    gsap.set(overlayCopy, { opacity: 0 });
  }
}

//Seção 03

function initShowcase() {
  const canvas = document.querySelector(".showcase__canvas");

  const context = canvas.getContext("2d");

  // Configurações dos frames
  const frameCount = 150;
  const currentFrame = (index) =>
    `images/frames/frame-${index.toString().padStart(3, "0")}.webp`;

  // Array para armazenar as imagens pré-carregadas
  const images = [];
  const airbnbSequence = { frame: 1 };

  // 1. Pré-carregamento das imagens
  let loadedImages = 0;
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    img.onload = () => {
      loadedImages++;
      if (loadedImages === frameCount) {
        // Inicia o ScrollTrigger apenas quando TODAS as imagens carregarem
        startScrollAnimation();
      }
    };
    images.push(img);
  }

  function startScrollAnimation() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    renderFrame(1);

    const fadeInOverlay = document.querySelector(".showcase__fade-in");
    const fadeOutOverlay = document.querySelector(".showcase__fade-out");
    const textElements = document.querySelectorAll(
      ".showcase__copy h2, .showcase__copy p",
    );

    // Timeline principal atrelada ao ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".showcase",
        start: "top top",
        end: `+=${window.innerHeight * 4}px`,
        pin: true,
        scrub: 1,
      },
    });

    // 1. O VÍDEO
    tl.to(
      airbnbSequence,
      {
        frame: frameCount,
        snap: "frame",
        ease: "none",
        duration: 10,
        onUpdate: () => renderFrame(Math.ceil(airbnbSequence.frame)),
      },
      0,
    );

    // 2. FADE-IN INICIAL
    tl.to(
      fadeInOverlay,
      {
        opacity: 0,
        duration: 1.5,
        ease: "power1.out",
      },
      0,
    );

    // 3. ENTRADA DOS TEXTOS
    tl.to(
      textElements,
      {
        transform: "translateY(0%)",
        opacity: 1,
        stagger: 0.25,
        duration: 2,
        ease: "power2.out",
      },
      3.0,
    );

    // 4. SAÍDA DOS TEXTOS
    tl.to(
      textElements,
      {
        opacity: 0,
        y: -30,
        stagger: 0.1,
        duration: 1.5,
        ease: "power2.in",
      },
      7.5,
    );

    // 5. FADE-OUT FINAL
    tl.to(
      fadeOutOverlay,
      {
        opacity: 1,
        duration: 1.5,
        ease: "power1.in",
      },
      8.5,
    );
  }

  // 3. Função para renderizar a imagem
  function renderFrame(index) {
    const img = images[index - 1];
    if (!img) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const imgWidth = img.width;
    const imgHeight = img.height;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }

    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  // 4. Garante alta definição
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(Math.ceil(airbnbSequence.frame));
  }
}

// Chama a função após o DOM carregar
document.addEventListener("DOMContentLoaded", initShowcase);

// Seção 04: CTA
function initCTA() {
  const ctaSection = document.querySelector(".cta");
  const animElements = document.querySelectorAll(
    ".cta__badge, .cta__heading, .cta__text, .cta__button",
  );
  const button = document.querySelector(".cta__button");
  const flair = document.querySelector(".button__flair");

  if (!ctaSection) return;

  // Garante que o estado inicial (escondido)
  gsap.set(animElements, { y: 100, opacity: 0 });

  // 2. EFEITO HOVER FLAIR DINÂMICO
  if (button && flair) {
    button.addEventListener("mouseenter", function (e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.set(flair, { x: x, y: y, transformOrigin: "center center" });
      gsap.to(flair, { scale: 1, duration: 0.5, ease: "power2.out" });
    });

    button.addEventListener("mouseleave", function (e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(flair, {
        scale: 0,
        x: x,
        y: y,
        duration: 0.5,
        ease: "power2.inOut",
      });
    });
  }
}

// Inicializa após o carregamento
document.addEventListener("DOMContentLoaded", initCTA);

function initCtaBackground() {
  const canvas = document.querySelector(".cta__canvas");
  const context = canvas.getContext("2d");

  const frameCount = 180;
  const currentFrame = (index) =>
    `videos/frames-cta/frame-cta-${index.toString().padStart(3, "0")}.webp`;

  const images = [];
  const ctaSequence = { frame: 1 };

  let loadedImages = 0;
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    img.onload = () => {
      loadedImages++;
      if (loadedImages === frameCount) {
        startScrollAnimation();
      }
    };
    images.push(img);
  }

  function startScrollAnimation() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    renderFrame(1);

    const fadeInOverlay = document.querySelector(".cta__fade-in");
    const textElements = document.querySelectorAll(
      ".cta__badge, .cta__heading, .cta__text, .cta__button",
    );

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".cta",
        start: "top top",
        end: `+=${window.innerHeight * 4}px`,
        pin: true,
        scrub: 1,
      },
    });

    // 1. Sequência de frames
    tl.to(
      ctaSequence,
      {
        frame: frameCount,
        snap: "frame",
        ease: "none",
        duration: 10,
        onUpdate: () => renderFrame(Math.ceil(ctaSequence.frame)),
      },
      0,
    );

    // 2. Fade-in inicial
    tl.to(
      fadeInOverlay,
      {
        opacity: 0,
        duration: 1.5,
        ease: "power1.out",
      },
      0,
    );

    // 3. Entrada dos textos
    tl.to(
      textElements,
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 1.2,
        ease: "power3.out",
      },
      3.0,
    );
  }

  function renderFrame(index) {
    const img = images[index - 1];
    if (!img) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const imgWidth = img.width;
    const imgHeight = img.height;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }

    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(Math.ceil(ctaSequence.frame));
  }
}

document.addEventListener("DOMContentLoaded", initCtaBackground);

//CTA Button
class Button {
  constructor(buttonElement) {
    this.block = buttonElement;
    this.init();
    this.initEvents();
  }

  init() {
    const el = gsap.utils.selector(this.block);

    this.DOM = {
      button: this.block,
      flair: el(".button__flair"),
    };

    this.xSet = gsap.quickSetter(this.DOM.flair, "xPercent");
    this.ySet = gsap.quickSetter(this.DOM.flair, "yPercent");
  }

  getXY(e) {
    const { left, top, width, height } =
      this.DOM.button.getBoundingClientRect();

    const xTransformer = gsap.utils.pipe(
      gsap.utils.mapRange(0, width, 0, 100),
      gsap.utils.clamp(0, 100),
    );

    const yTransformer = gsap.utils.pipe(
      gsap.utils.mapRange(0, height, 0, 100),
      gsap.utils.clamp(0, 100),
    );

    return {
      x: xTransformer(e.clientX - left),
      y: yTransformer(e.clientY - top),
    };
  }

  initEvents() {
    this.DOM.button.addEventListener("mouseenter", (e) => {
      const { x, y } = this.getXY(e);

      this.xSet(x);
      this.ySet(y);

      gsap.to(this.DOM.flair, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    this.DOM.button.addEventListener("mouseleave", (e) => {
      const { x, y } = this.getXY(e);

      gsap.killTweensOf(this.DOM.flair);

      gsap.to(this.DOM.flair, {
        xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
        yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
        scale: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    this.DOM.button.addEventListener("mousemove", (e) => {
      const { x, y } = this.getXY(e);

      gsap.to(this.DOM.flair, {
        xPercent: x,
        yPercent: y,
        duration: 0.4,
        ease: "power2",
      });
    });
  }
}

const buttonElements = document.querySelectorAll('[data-block="button"]');

buttonElements.forEach((buttonElement) => {
  new Button(buttonElement);

  function initWhatsappCTA() {
    const numeroWhatsapp = "5541998773811";
    const nomeProjeto = "GTA 6 - Landing Page";

    const mensagem = `Olá, Rafael! Acabei de ver o projeto "${nomeProjeto}" em seu portfólio e gostaria de conversar sobre um projeto semelhante para meu negócio. Poderia me ajudar?`;

    const whatsappUrl = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;

    const link = document.getElementById("projWhatsapp");
    if (link) link.setAttribute("href", whatsappUrl);
  }

  document.addEventListener("DOMContentLoaded", initWhatsappCTA);
});
