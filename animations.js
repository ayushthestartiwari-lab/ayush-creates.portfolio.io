// animations.js
// Uses Motion (https://motion.dev) loaded globally via CDN in home.html.
// Must load AFTER the Motion <script> tag.
//
// ARCHITECTURE
// Two independent systems share this file, and they are kept strictly
// separate so they never write to the same property on the same element
// at the same time:
//
//   1. Reveal system (.language-card, .live-cta, .why-box)
//      100% CSS-driven. This script only ever toggles the ".is-visible"
//      class — it never touches these elements' opacity/transform via
//      Motion. The stagger between siblings is computed in JS (via
//      Motion's stagger()) and applied as a per-element setTimeout
//      before the class is added, so nothing here depends on any
//      transition-delay rule existing in style.css.
//
//   2. Motion-driven animations (hero, images, aurora layers, buttons,
//      cards) — everything else. Each element is only ever animated by
//      ONE Motion call for a given property at a given time; where an
//      element has both an entrance animation and a continuous
//      scroll-linked one (the coding images), the scroll-linked one is
//      deferred until the entrance has fully finished.
//
// Every phase below is wrapped so a failure in one (missing element,
// older Motion build without scroll()/inView(), etc.) can't take down
// the rest of the script.

if (typeof Motion === "undefined") {
  console.warn("Motion failed to load (CDN blocked or offline) — falling back to plain reveal.");
  revealImmediately();
} else {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Reveal immediately, no animation — CSS's own reduced-motion
    // handling on .aurora-bg/.aurora-planet covers the background, and
    // skipping the hero/image entrance calls is safe because those
    // elements aren't hidden by default in CSS (their keyframes force
    // an opacity:0 start, they aren't hidden at rest).
    revealImmediately();
  } else {
    runAnimations();
  }
}

function revealImmediately() {
  document
    .querySelectorAll(".language-card, .live-cta, .why-box")
    .forEach((el) => el.classList.add("is-visible"));
}

// Shared motion language. Springs are reserved for direct user
// interaction (hover/press) — everything time- or scroll-driven uses a
// plain easing curve, which is both cheaper and reads as more
// "premium/controlled" than a spring would for passive motion.
const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 };
const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 26, mass: 0.6 };
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];
const IS_NARROW_VIEWPORT = window.matchMedia("(max-width: 640px)").matches;

function runAnimations() {
  const { animate, stagger, inView, scroll } = Motion;

  // Query once, reuse everywhere — avoids repeating the same
  // querySelectorAll across independent phases.
  const dom = {
    heroTitle: document.querySelector(".hero h1"),
    heroQuote: document.querySelector(".hero .quote"),
    hero: document.querySelector(".hero"),
    images: document.querySelectorAll(".images img"),
    languageCards: document.querySelectorAll(".language-card"),
    liveCta: document.querySelectorAll(".live-cta"),
    whyBox: document.querySelectorAll(".why-box"),
    auroraBg: document.querySelector(".aurora-bg"),
    auroraPlanets: document.querySelectorAll(".aurora-planet"),
    arenaBtn: document.querySelector("#arena-btn"),
    bugBtn: document.querySelector("#bughunter-btn"),
  };

  // Each phase is independent and defensively isolated: a missing
  // element is already a no-op inside each function, but this also
  // catches a genuinely missing/older Motion API (e.g. no scroll())
  // without letting it cancel the rest of the animation system.
  safely(() => animateHero(animate, dom));
  const imagesEntrance = safely(() => animateCodingImages(animate, stagger, dom));
  safely(() => setupScrollReveal(inView, stagger, dom));
  safely(() => setupScrollDepth(animate, scroll, dom, imagesEntrance));
  safely(() => setupMicroInteractions(animate, dom));
}

function safely(fn) {
  try {
    return fn();
  } catch (err) {
    console.warn("Animation phase skipped:", err);
    return null;
  }
}

// ---- Hero: fade + rise on load ----
function animateHero(animate, { heroTitle, heroQuote }) {
  if (heroTitle) {
    animate(
      heroTitle,
      { opacity: [0, 1], y: [30, 0] },
      { duration: 0.8, easing: EASE_OUT_EXPO }
    );
  }
  if (heroQuote) {
    animate(
      heroQuote,
      { opacity: [0, 1], y: [20, 0] },
      { duration: 0.7, delay: 0.25, easing: EASE_OUT_EXPO }
    );
  }
}

// ---- Coding images: fade in on load ----
// Returns the animation controls so the scroll-depth phase can wait for
// `.finished` before it ever touches these same elements' transform —
// see setupScrollDepth for why that matters.
function animateCodingImages(animate, stagger, { images }) {
  if (!images.length) return null;
  return animate(
    images,
    { opacity: [0, 1], scale: [0.96, 1], y: [12, 0] },
    {
      duration: 0.7,
      delay: stagger(0.15, { startDelay: 0.3 }),
      easing: EASE_OUT_EXPO,
    }
  );
}

// ---- Scroll reveal: language cards, Be Ahead Live, Why Be Ahead ----
// Deliberately does not call Motion's animate() on these elements at
// all. The opacity/transform transition is entirely CSS's job (a
// ".is-visible" class flip); this only decides *when* each element's
// class flips. Watching the first element of a group is enough to know
// the group has reached the viewport — each sibling's class is then
// added on its own JS-computed delay (via Motion's stagger, called
// directly as a plain function rather than passed to animate) so the
// group visibly cascades in without any transition-delay CSS required.
function setupScrollReveal(inView, stagger, { languageCards, liveCta, whyBox }) {
  const groups = [languageCards, liveCta, whyBox];
  const delayFor = stagger(0.08);

  groups.forEach((elements) => {
    if (!elements.length) return;

    const stop = inView(
      elements[0],
      () => {
        elements.forEach((el, i) => {
          const delaySeconds = elements.length > 1 ? delayFor(i, elements.length) : 0;
          setTimeout(() => el.classList.add("is-visible"), delaySeconds * 1000);
        });
        stop();
      },
      { margin: "0px 0px -10% 0px" }
    );
  });
}

// ---- Scroll depth: continuous, scroll-progress-linked motion for the
// hero and decorative background layers. Bound directly to scroll
// position via Motion's scroll(), so it plays forward/backward in sync
// with the scrollbar automatically — no separate reverse handling
// needed. Skipped on narrow viewports: the parallax range is barely
// visible on a small screen and isn't worth the continuous scroll work
// on typically weaker hardware.
function setupScrollDepth(animate, scroll, { hero, auroraBg, auroraPlanets, images }, imagesEntrance) {
  if (typeof scroll !== "function" || IS_NARROW_VIEWPORT) return;

  // Hero content recedes as the page scrolls past it — foreground
  // layer of the depth stack. Targets the .hero container itself,
  // never the h1/quote the load-in animation already owns, so the two
  // systems never compete for the same element's transform.
  if (hero) {
    scroll(
      animate(
        hero,
        { opacity: [1, 1, 0.35], y: ["0%", "0%", "-8%"], scale: [1, 1, 0.97] },
        { easing: "linear" }
      ),
      { target: hero, offset: ["start start", "35% start", "end start"] }
    );
  }

  // Background aurora glow: slower, further-back layer.
  if (auroraBg) {
    scroll(
      animate(auroraBg, { y: ["0%", "20%"], opacity: [1, 0.6] }, { easing: "linear" }),
      { target: auroraBg, offset: ["start start", "end start"] }
    );
  }

  // Each planet drifts at its own rate/scale so the group reads as
  // layered depth rather than one flat background.
  auroraPlanets.forEach((planet, i) => {
    const rate = 10 + i * 6;
    scroll(
      animate(
        planet,
        { y: ["0%", `${rate}%`], scale: [1, 1 + i * 0.03] },
        { easing: "linear" }
      ),
      { target: planet, offset: ["start end", "end start"] }
    );
  });

  // Coding images: a subtle continuous drift as the section transits
  // the viewport. This targets the same elements and the same `y`
  // value as the load-in entrance above, so it's only ever attached
  // after that entrance's `.finished` promise resolves — otherwise the
  // two animations would both be writing to `transform` on the same
  // images at the same time. If the entrance didn't run (or already
  // settled) the attachment happens immediately instead.
  if (images.length) {
    const attachImageDepth = () => {
      images.forEach((img, i) => {
        const rate = 6 + (i % 3) * 4;
        scroll(
          animate(img, { y: ["0%", `${rate}%`] }, { easing: "linear" }),
          { target: img, offset: ["start end", "end start"] }
        );
      });
    };

    if (imagesEntrance && imagesEntrance.finished) {
      imagesEntrance.finished.then(attachImageDepth).catch(attachImageDepth);
    } else {
      attachImageDepth();
    }
  }
}

// ---- Micro-interactions: spring-based hover/press feedback.
// Gated on (hover: hover) and (pointer: fine) so touch devices never
// get a hover state stuck on after a tap. ----
function setupMicroInteractions(animate, { arenaBtn, bugBtn, languageCards }) {
  const supportsHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!supportsHover) return;

  [arenaBtn, bugBtn].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("mouseenter", () => animate(btn, { scale: 1.08 }, SPRING));
    btn.addEventListener("mouseleave", () => animate(btn, { scale: 1 }, SPRING));
    btn.addEventListener("mousedown", () => animate(btn, { scale: 0.97 }, SPRING_SNAPPY));
    btn.addEventListener("mouseup", () => animate(btn, { scale: 1.08 }, SPRING_SNAPPY));
  });

  languageCards.forEach((card) => {
    card.addEventListener("mouseenter", () =>
      animate(card, { y: -6, scale: 1.015 }, SPRING)
    );
    card.addEventListener("mouseleave", () =>
      animate(card, { y: 0, scale: 1 }, SPRING)
    );
  });
}
