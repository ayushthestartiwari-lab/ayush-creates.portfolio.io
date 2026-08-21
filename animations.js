// animations.js
// Uses Motion (https://motion.dev) loaded globally via CDN in home.html.
// Must load AFTER the Motion <script> tag.
//
// Scroll-reveal elements (.language-card, .live-cta, .why-box) start
// hidden via CSS (opacity:0, translateY) and a CSS transition does the
// actual animating. This script's only job is to add ".is-visible" when
// Motion's inView() reports the element has entered the viewport. This
// is deliberately more robust than animating purely through the Web
// Animations API: it's inspectable in DevTools (you can literally see
// the class appear) and it can never silently no-op.

if (typeof Motion === "undefined") {
  console.warn("Motion failed to load (CDN blocked or offline) — falling back to plain reveal.");
  // Fallback: reveal everything immediately so content isn't stuck hidden
  document
    .querySelectorAll(".language-card, .live-cta, .why-box")
    .forEach((el) => el.classList.add("is-visible"));
} else {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Reveal immediately, no animation — CSS's own reduced-motion
    // handling on .aurora-bg/.aurora-planet covers the background.
    document
      .querySelectorAll(".language-card, .live-cta, .why-box")
      .forEach((el) => el.classList.add("is-visible"));
  } else {
    runAnimations();
  }
}

function runAnimations() {
  const { animate, stagger, inView } = Motion;

  // ---- Hero: fade + rise on load ----
  animate(
    ".hero h1",
    { opacity: [0, 1], y: [30, 0] },
    { duration: 0.8, easing: [0.22, 1, 0.36, 1] }
  );
  animate(
    ".hero .quote",
    { opacity: [0, 1], y: [20, 0] },
    { duration: 0.7, delay: 0.25, easing: [0.22, 1, 0.36, 1] }
  );

  // ---- Coding images: fade in on load ----
  animate(
    ".images img",
    { opacity: [0, 1], scale: [0.96, 1] },
    { duration: 0.7, delay: stagger(0.15, { startDelay: 0.3 }) }
  );

  // ---- Scroll reveal: language cards, Be Ahead Live, Why Be Ahead ----
  // Each one just gets a class; the actual fade/slide is a CSS transition
  // defined in style.css, so it's guaranteed visible and independent of
  // any WAAPI/Motion timing quirks.
  // NOTE: this version of Motion's inView() calls back with the raw
  // IntersectionObserverEntry, not the element — use entry.target.
  inView(
    ".language-card",
    (entry) => {
      entry.target.classList.add("is-visible");
    },
    { margin: "0px 0px -10% 0px" }
  );

  inView(
    ".live-cta",
    (entry) => {
      entry.target.classList.add("is-visible");
    },
    { margin: "0px 0px -10% 0px" }
  );

  inView(
    ".why-box",
    (entry) => {
      entry.target.classList.add("is-visible");
    },
    { margin: "0px 0px -10% 0px" }
  );

  // ---- Floating buttons: subtle hover lift (desktop only) ----
  const arenaBtn = document.querySelector("#arena-btn");
  const bugBtn = document.querySelector("#bughunter-btn");

  [arenaBtn, bugBtn].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("mouseenter", () =>
      animate(btn, { scale: 1.08 }, { duration: 0.2, easing: "ease-out" })
    );
    btn.addEventListener("mouseleave", () =>
      animate(btn, { scale: 1 }, { duration: 0.2, easing: "ease-out" })
    );
  });
}
