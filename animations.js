// animations.js
// Uses Motion (https://motion.dev) loaded globally via CDN in home.html.
// Must load AFTER the Motion <script> tag.
//
// INITIALIZATION ORDER
// Everything in this file — constants, config, and every function — is
// declared BEFORE the code at the bottom that actually decides whether
// to run any of it. `const` bindings are not hoisted the way function
// declarations are: they exist in the temporal dead zone until their
// declaration line runs, so anything that reads them has to appear
// after that line, top-to-bottom, no exceptions. The trigger logic
// (Motion feature-check → reduced-motion check → runAnimations()) is
// the very last thing in the file for exactly this reason.
//
// ARCHITECTURE
// Two independent systems share this file, kept strictly separate so
// they never write to the same property on the same element at the
// same time:
//
//   1. Reveal system (.language-card, .live-cta, .why-box)
//      100% CSS-driven. This script only ever toggles the ".is-visible"
//      class — it never touches these elements' opacity/transform via
//      Motion. The stagger between siblings is computed in JS (via
//      Motion's stagger()) and applied as a per-element setTimeout
//      before the class is added, so nothing here depends on any
//      transition-delay rule existing in style.css.
//
//   2. Motion-driven animations (hero, images, geometric background
//      clusters, buttons, cards) — everything else. Where an element
//      has both an entrance animation and a continuous scroll-linked
//      one (the coding images), the scroll-linked one is deferred
//      until the entrance has fully finished, so the two never fight
//      over `transform`.
//
// Every phase in runAnimations() is wrapped so a failure in one
// (missing element, older Motion build without scroll()/inView(),
// etc.) can't take down the rest of the script.

// ---- Constants (must exist before runAnimations() can be called) ----

// Springs are reserved for direct user interaction (hover/press) —
// everything time- or scroll-driven uses a plain easing curve, which is
// both cheaper and reads as more "premium/controlled" than a spring
// would for passive motion.
const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 };
const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 26, mass: 0.6 };
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];
const IS_NARROW_VIEWPORT = window.matchMedia("(max-width: 640px)").matches;

// ---- Functions (declarations are hoisted, but kept below the
// constants above for readability — they're only ever called after
// the trigger block at the bottom runs anyway) ----

function revealImmediately() {
  document
    .querySelectorAll(".language-card, .live-cta, .why-box")
    .forEach((el) => el.classList.add("is-visible"));
}

function safely(fn) {
  try {
    return fn();
  } catch (err) {
    console.warn("Animation phase skipped:", err);
    return null;
  }
}

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
    geoBg: document.querySelector(".geo-bg"),
    geoGrid: document.querySelector(".geo-grid"),
    geoClusters: document.querySelectorAll(".geo-cluster"),
  };

  // Each phase is independent and defensively isolated: a missing
  // element is already a no-op inside each function, but this also
  // catches a genuinely missing/older Motion API (e.g. no scroll())
  // without letting it cancel the rest of the animation system. This
  // is unrelated to — and does not paper over — the initialization-
  // order bug above; it only guards against optional-feature absence
  // at runtime, which is a different failure mode.
  safely(() => animateHero(animate, dom));
  const imagesEntrance = safely(() => animateCodingImages(animate, stagger, dom));
  safely(() => setupScrollReveal(inView, stagger, dom));
  safely(() => setupScrollDepth(animate, scroll, dom, imagesEntrance));
  safely(() => setupMicroInteractions(animate, dom));
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
function setupScrollDepth(animate, scroll, { hero, geoBg, geoGrid, geoClusters, images }, imagesEntrance) {
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

  // Background geometric layer: slower, further-back layer.
  if (geoBg) {
    scroll(
      animate(geoBg, { y: ["0%", "16%"], opacity: [1, 0.65] }, { easing: "linear" }),
      { target: geoBg, offset: ["start start", "end start"] }
    );
  }

  // Line grid drifts at its own slow rate, further back than the
  // clusters, so the layer reads with real depth rather than flat.
  if (geoGrid) {
    scroll(
      animate(geoGrid, { y: ["0%", "8%"] }, { easing: "linear" }),
      { target: geoGrid, offset: ["start start", "end start"] }
    );
  }

  // Each cluster gets exactly one scroll-linked transform — a small
  // translate plus a very slight rotate, rate/direction varied by
  // index so the 9 clusters read as independent depth layers rather
  // than one flat background. This is the only motion the clusters
  // get: there's no continuous idle animation running underneath, so
  // movement is tied to scroll position and stops the moment
  // scrolling does. Binding per cluster (9 calls) rather than per
  // node/link inside each cluster's SVG keeps this cheap regardless
  // of how many small shapes a given cluster contains.
  geoClusters.forEach((cluster, i) => {
    const rate = 6 + (i % 5) * 3;
    const rotate = (i % 2 === 0 ? 1 : -1) * (3 + (i % 4));
    scroll(
      animate(
        cluster,
        { y: ["0%", `${rate}%`], rotate: [0, rotate] },
        { easing: "linear" }
      ),
      { target: cluster, offset: ["start end", "end start"] }
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
function setupMicroInteractions(animate, { languageCards }) {
  const supportsHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!supportsHover) return;

  languageCards.forEach((card) => {
    card.addEventListener("mouseenter", () =>
      animate(card, { y: -6, scale: 1.015 }, SPRING)
    );
    card.addEventListener("mouseleave", () =>
      animate(card, { y: 0, scale: 1 }, SPRING)
    );
  });
}

// ---- Trigger (must be the LAST thing in the file — everything above
// this line, including SPRING/EASE_OUT_EXPO/IS_NARROW_VIEWPORT, has to
// already be initialized before this can safely call runAnimations()) ----

if (typeof Motion === "undefined") {
  console.warn("Motion failed to load (CDN blocked or offline) — falling back to plain reveal.");
  revealImmediately();
} else {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Reveal immediately, no animation — the background clusters have
    // no idle/continuous animation of their own (see .geo-cluster in
    // style.css), so skipping runAnimations() here already leaves
    // them static at their authored position; nothing extra to
    // disable. Skipping the hero/image entrance calls is likewise
    // safe because those elements aren't hidden by default in CSS
    // (their keyframes force an opacity:0 start, they aren't hidden
    // at rest).
    revealImmediately();
  } else {
    runAnimations();
  }
}
