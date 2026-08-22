// ========================================
// BE AHEAD — PREMIUM UPGRADED ANIMATIONS
// Modern 3D/Scroll-driven Interactive UI
// Uses Motion (https://motion.dev) loaded globally via CDN
// ========================================

// ---- Constants ----
const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 };
const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 26, mass: 0.6 };
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];
const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1];
const IS_NARROW_VIEWPORT = window.matchMedia("(max-width: 640px)").matches;
const SUPPORTS_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- Utility Functions ----
function revealImmediately() {
  document.querySelectorAll(".language-card, .live-cta, .why-box").forEach((el) => el.classList.add("is-visible"));
}

function safely(fn) {
  try {
    return fn();
  } catch (err) {
    console.warn("Animation phase skipped:", err);
    return null;
  }
}

// ---- Main Animation Runner ----
function runAnimations() {
  const { animate, stagger, inView, scroll } = Motion;

  const dom = {
    hero: document.querySelector(".hero"),
    heroTitle: document.querySelector(".hero h1"),
    heroQuote: document.querySelector(".hero .quote"),
    images: document.querySelectorAll(".images img"),
    languageCards: document.querySelectorAll(".language-card"),
    liveCta: document.querySelectorAll(".live-cta"),
    whyBox: document.querySelectorAll(".why-box"),
    auroraBg: document.querySelector(".aurora-bg"),
    auroraPlanets: document.querySelectorAll(".aurora-planet"),
    auroraFloaters: document.querySelectorAll(".aurora-floater"),
    arenaBtn: document.querySelector("#arena-btn"),
    bugBtn: document.querySelector("#bughunter-btn"),
    beaiChatbot: document.querySelector("#beai-chatbot"),
    liveBtn: document.querySelector(".live-cta a.live-btn"),
    enhancerBtn: document.querySelector("#enhancer-btn"),
  };

  safely(() => animateHeroEntrance(animate, dom));
  const imagesEntrance = safely(() => animateImagesEntrance(animate, stagger, dom));
  safely(() => setupScrollReveal(inView, stagger, dom));
  safely(() => setupScrollDepth(animate, scroll, dom, imagesEntrance));
  safely(() => setupHeroParallax(animate, dom));
  safely(() => setupCardTilt(dom));
  safely(() => setupMagneticButtons(animate, dom));
  safely(() => setupBackgroundMotion(animate, dom));
}

// 1. HERO ENTRANCE
function animateHeroEntrance(animate, { heroTitle, heroQuote }) {
  if (heroTitle) {
    animate(heroTitle, { opacity: [0, 1], y: [40, 0], scale: [0.96, 1] }, { duration: 0.9, easing: EASE_OUT_EXPO });
  }
  if (heroQuote) {
    animate(heroQuote, { opacity: [0, 1], y: [28, 0], scale: [0.97, 1] }, { duration: 0.8, delay: 0.28, easing: EASE_OUT_EXPO });
  }
}

// 2. IMAGES ENTRANCE
function animateImagesEntrance(animate, stagger, { images }) {
  if (!images.length) return null;
  return animate(images, { opacity: [0, 1], scale: [0.94, 1], y: [16, 0] }, { duration: 0.8, delay: stagger(0.14, { startDelay: 0.35 }), easing: EASE_OUT_EXPO });
}

// 3. SCROLL REVEAL
function setupScrollReveal(inView, stagger, { languageCards, liveCta, whyBox }) {
  const groups = [languageCards, liveCta, whyBox];
  const delayFor = stagger(0.09);
  groups.forEach((elements) => {
    if (!elements.length) return;
    const stop = inView(elements[0], () => {
      elements.forEach((el, i) => {
        const delaySeconds = elements.length > 1 ? delayFor(i, elements.length) : 0;
        setTimeout(() => el.classList.add("is-visible"), delaySeconds * 1000);
      });
      stop();
    }, { margin: "0px 0px -12% 0px" });
  });
}

// 4. SCROLL DEPTH
function setupScrollDepth(animate, scroll, { hero, auroraBg, auroraPlanets, auroraFloaters, images }, imagesEntrance) {
  if (typeof scroll !== "function" || IS_NARROW_VIEWPORT || PREFERS_REDUCED_MOTION) return;
  
  if (hero) {
    scroll(animate(hero, { opacity: [1, 1, 0.4], y: ["0%", "0%", "-10%"], scale: [1, 1, 0.96] }, { easing: "linear" }), { target: hero, offset: ["start start", "35% start", "end start"] });
  }
  
  if (auroraBg) {
    scroll(animate(auroraBg, { y: ["0%", "18%"], opacity: [1, 0.7] }, { easing: "linear" }), { target: auroraBg, offset: ["start start", "end start"] });
  }
  
  auroraPlanets.forEach((planet, i) => {
    const rate = 12 + i * 7;
    scroll(animate(planet, { y: ["0%", rate + "%"], scale: [1, 1 + i * 0.035] }, { easing: "linear" }), { target: planet, offset: ["start end", "end start"] });
  });
  
  if (auroraFloaters.length) {
    auroraFloaters.forEach((floater, i) => {
      const rate = 8 + i * 5;
      scroll(animate(floater, { y: ["0%", rate + "%"] }, { easing: "linear" }), { target: floater, offset: ["start end", "end start"] });
    });
  }
  
  if (images.length) {
    const attachImageDepth = () => {
      images.forEach((img, i) => {
        const rate = 7 + (i % 3) * 4;
        scroll(animate(img, { y: ["0%", rate + "%"] }, { easing: "linear" }), { target: img, offset: ["start end", "end start"] });
      });
    };
    if (imagesEntrance && imagesEntrance.finished) {
      imagesEntrance.finished.then(attachImageDepth).catch(attachImageDepth);
    } else {
      attachImageDepth();
    }
  }
}

// 5. HERO PARALLAX
function setupHeroParallax(animate, { hero, heroTitle, heroQuote }) {
  if (IS_NARROW_VIEWPORT || PREFERS_REDUCED_MOTION || !SUPPORTS_HOVER || !hero) return;
  
  const heroRect = hero.getBoundingClientRect();
  const heroCenterX = heroRect.left + heroRect.width / 2;
  const heroCenterY = heroRect.top + heroRect.height / 2;
  let currentX = 0, currentY = 0, targetX = 0, targetY = 0, animationFrame = null;
  
  function updateParallax() {
    if (heroTitle) heroTitle.style.transform = "translate(" + (currentX * 0.3) + "px, " + (currentY * 0.3) + "px) translateZ(20px)";
    if (heroQuote) heroQuote.style.transform = "translate(" + (currentX * 0.5) + "px, " + (currentY * 0.5) + "px) translateZ(10px)";
    animationFrame = null;
  }
  
  function onPointerMove(e) {
    const deltaX = (e.clientX - heroCenterX) / heroRect.width;
    const deltaY = (e.clientY - heroCenterY) / heroRect.height;
    targetX = deltaX * 25;
    targetY = deltaY * 25;
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(() => {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        updateParallax();
      });
    }
  }
  
  function onPointerLeave() {
    targetX = 0;
    targetY = 0;
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(() => {
        const animateReturn = () => {
          currentX *= 0.92;
          currentY *= 0.92;
          updateParallax();
          if (Math.abs(currentX) > 0.5 || Math.abs(currentY) > 0.5) requestAnimationFrame(animateReturn);
          else animationFrame = null;
        };
        animateReturn();
      });
    }
  }
  
  hero.addEventListener("pointermove", onPointerMove);
  hero.addEventListener("pointerleave", onPointerLeave);
}

// 6. CARD TILT
function setupCardTilt({ languageCards }) {
  if (IS_NARROW_VIEWPORT || PREFERS_REDUCED_MOTION || !SUPPORTS_HOVER) return;
  
  languageCards.forEach((card) => {
    let currentRotateX = 0, currentRotateY = 0, targetRotateX = 0, targetRotateY = 0, animationFrame = null;
    
    function updateTilt() {
      card.style.transform = "perspective(1000px) rotateX(" + currentRotateX + "deg) rotateY(" + currentRotateY + "deg) translateZ(8px)";
      animationFrame = null;
    }
    
    function onPointerMove(e) {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      targetRotateY = deltaX * 6;
      targetRotateX = -deltaY * 6;
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(() => {
          currentRotateX += (targetRotateX - currentRotateX) * 0.15;
          currentRotateY += (targetRotateY - currentRotateY) * 0.15;
          updateTilt();
        });
      }
    }
    
    function onPointerLeave() {
      targetRotateX = 0;
      targetRotateY = 0;
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(() => {
          const animateReturn = () => {
            currentRotateX *= 0.88;
            currentRotateY *= 0.88;
            updateTilt();
            if (Math.abs(currentRotateX) > 0.3 || Math.abs(currentRotateY) > 0.3) requestAnimationFrame(animateReturn);
            else {
              animationFrame = null;
              card.style.transform = "";
            }
          };
          animateReturn();
        });
      }
    }
    
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerleave", onPointerLeave);
  });
}

// 7. MAGNETIC BUTTONS
function setupMagneticButtons(animate, { arenaBtn, bugBtn, liveBtn, enhancerBtn, beaiChatbot }) {
  if (!SUPPORTS_HOVER || PREFERS_REDUCED_MOTION) return;
  
  const buttons = [arenaBtn, bugBtn, liveBtn, enhancerBtn, beaiChatbot].filter(Boolean);
  
  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => animate(btn, { scale: 1.08, y: -3 }, { ...SPRING, duration: 0.35 }));
    btn.addEventListener("mouseleave", () => animate(btn, { scale: 1, y: 0 }, { ...SPRING, duration: 0.35 }));
    btn.addEventListener("mousedown", () => animate(btn, { scale: 0.96 }, SPRING_SNAPPY));
    btn.addEventListener("mouseup", () => animate(btn, { scale: 1.08 }, { ...SPRING, duration: 0.3 }));
  });
}

// 8. BACKGROUND MOTION
function setupBackgroundMotion(animate, { auroraBg, auroraPlanets, auroraFloaters }) {
  if (IS_NARROW_VIEWPORT || PREFERS_REDUCED_MOTION) return;
  
  if (auroraBg) {
    animate(auroraBg, { opacity: [0.85, 1, 0.85] }, { duration: 8, repeat: Infinity, repeatType: "mirror", easing: "ease-in-out" });
  }
  
  auroraPlanets.forEach((planet, i) => {
    animate(planet, { y: [0, 8 + i * 3, 0], scale: [1, 1.02 + i * 0.01, 1] }, { duration: 6 + i * 2, repeat: Infinity, repeatType: "mirror", easing: "ease-in-out", delay: i * 0.5 });
  });
  
  if (auroraFloaters.length) {
    auroraFloaters.forEach((floater, i) => {
      animate(floater, { y: [0, -12 + i * 4, 0], x: [0, 6 - i * 2, 0] }, { duration: 7 + i * 1.5, repeat: Infinity, repeatType: "mirror", easing: "ease-in-out", delay: i * 0.4 });
    });
  }
}

// INITIALIZATION
if (typeof Motion === "undefined") {
  console.warn("Motion failed to load — falling back to plain reveal.");
  revealImmediately();
} else {
  if (PREFERS_REDUCED_MOTION) {
    revealImmediately();
  } else {
    runAnimations();
  }
}
