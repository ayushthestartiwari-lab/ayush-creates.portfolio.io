// animations.js
// Uses Motion (https://motion.dev) loaded globally via CDN in home.html.
// Must load AFTER the Motion <script> tag and BEFORE/independent of home.js.

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

// ---- Language cards: reveal as they scroll into view ----
inView(
  ".language-card",
  (element) => {
    animate(
      element,
      { opacity: [0, 1], y: [30, 0] },
      { duration: 0.5, easing: [0.22, 1, 0.36, 1] }
    );
  },
  { margin: "-10% 0px -10% 0px" }
);

// ---- Be Ahead Live section ----
inView(".live-cta", (element) => {
  animate(
    element,
    { opacity: [0, 1], y: [30, 0] },
    { duration: 0.6, easing: [0.22, 1, 0.36, 1] }
  );
});

// ---- Why Be Ahead box ----
inView(".why-box", (element) => {
  animate(
    element,
    { opacity: [0, 1], y: [30, 0] },
    { duration: 0.6, easing: [0.22, 1, 0.36, 1] }
  );
});

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
