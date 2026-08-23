// animations.js
// Uses Motion (https://motion.dev) loaded globally via CDN in home.html.
// Must load AFTER the Motion <script> tag.

// INITIALIZATION ORDER
// Everything in this file — constants, config, and every function — is
// declared BEFORE the code at the bottom that actually decides whether
// to run any of it.

// Two independent systems share this file:
//
//   1. Reveal system (.language-card, .live-cta, .why-box)
//      100% CSS-driven. This script only toggles the ".is-visible"
//      class.
//
//   2. Motion-driven animations (hero, images, geometric background
//      layers, buttons, cards) — everything else.
//
// Every phase in runAnimations() is wrapped so a failure in one
// can't take down the rest of the animation system.

// ---- Constants ----

// Springs are reserved for direct user interaction (hover/press).
// Time- or scroll-driven animations use easing curves instead.
const SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];

const IS_NARROW_VIEWPORT =
  window.matchMedia("(max-width: 640px)").matches;

// ---- Utility functions ----

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

// ---- Main animation runner ----

function runAnimations() {
  const { animate, stagger, inView, scroll } = Motion;

  const dom = {
    heroTitle: document.querySelector(".hero h1"),
    heroQuote: document.querySelector(".hero .quote"),
    hero: document.querySelector(".hero"),

    images: document.querySelectorAll(".images img"),

    languageCards: document.querySelectorAll(".language-card"),
    liveCta: document.querySelectorAll(".live-cta"),
    whyBox: document.querySelectorAll(".why-box"),

    geoBack: document.querySelectorAll(".geo-shape.geo-back"),
    geoMid: document.querySelectorAll(".geo-shape.geo-mid"),
    geoFront: document.querySelectorAll(".geo-shape.geo-front"),
  };

  safely(() => animateHero(animate, dom));

  const imagesEntrance = safely(() =>
    animateCodingImages(animate, stagger, dom)
  );

  safely(() =>
    setupScrollReveal(inView, stagger, dom)
  );

  safely(() =>
    setupScrollDepth(animate, scroll, dom, imagesEntrance)
  );

  safely(() =>
    setupMicroInteractions(animate, dom)
  );
}

// ---- Hero entrance animation ----

function animateHero(animate, { heroTitle, heroQuote }) {
  if (heroTitle) {
    animate(
      heroTitle,
      {
        opacity: [0, 1],
        y: [30, 0],
      },
      {
        duration: 0.8,
        easing: EASE_OUT_EXPO,
      }
    );
  }

  if (heroQuote) {
    animate(
      heroQuote,
      {
        opacity: [0, 1],
        y: [20, 0],
      },
      {
        duration: 0.7,
        delay: 0.25,
        easing: EASE_OUT_EXPO,
      }
    );
  }
}

// ---- Coding images entrance animation ----

function animateCodingImages(animate, stagger, { images }) {
  if (!images.length) return null;

  return animate(
    images,
    {
      opacity: [0, 1],
      scale: [0.96, 1],
      y: [12, 0],
    },
    {
      duration: 0.7,
      delay: stagger(0.15, {
        startDelay: 0.3,
      }),
      easing: EASE_OUT_EXPO,
    }
  );
}

// ---- Scroll reveal ----

function setupScrollReveal(
  inView,
  stagger,
  { languageCards, liveCta, whyBox }
) {
  if (typeof inView !== "function") return;

  const groups = [
    languageCards,
    liveCta,
    whyBox,
  ];

  const delayFor = stagger(0.08);

  groups.forEach((elements) => {
    if (!elements.length) return;

    const stop = inView(
      elements[0],
      () => {
        elements.forEach((el, i) => {
          const delaySeconds =
            elements.length > 1
              ? delayFor(i, elements.length)
              : 0;

          setTimeout(() => {
            el.classList.add("is-visible");
          }, delaySeconds * 1000);
        });

        stop();
      },
      {
        margin: "0px 0px -10% 0px",
      }
    );
  });
}

// ---- Geometric background scroll depth ----

function bindGeoDepthLayer(
  animate,
  scroll,
  shapes,
  {
    baseRate,
    rateStep,
    rotateStep,
  }
) {
  if (!shapes.length) return;

  shapes.forEach((shape, i) => {
    const direction =
      i % 2 === 0 ? 1 : -1;

    const rate =
      baseRate + (i % 4) * rateStep;

    const rotateAmount =
      ((i % 5) + 1) *
      rotateStep *
      direction;

    scroll(
      animate(
        shape,
        {
          y: [
            "0%",
            `${direction * rate}%`,
          ],
          rotate: [
            0,
            rotateAmount,
          ],
        },
        {
          easing: "linear",
        }
      ),
      {
        target: shape,
        offset: [
          "start end",
          "end start",
        ],
      }
    );
  });
}

// ---- Scroll-linked depth system ----

function setupScrollDepth(
  animate,
  scroll,
  {
    hero,
    geoBack,
    geoMid,
    geoFront,
    images,
  },
  imagesEntrance
) {
  if (typeof scroll !== "function") return;

  // Geometric background works on all screen sizes.
  // Mobile-specific thinning is handled in CSS.
  bindGeoDepthLayer(
    animate,
    scroll,
    geoBack,
    {
      baseRate: 4,
      rateStep: 2,
      rotateStep: 3,
    }
  );

  bindGeoDepthLayer(
    animate,
    scroll,
    geoMid,
    {
      baseRate: 9,
      rateStep: 3,
      rotateStep: 5,
    }
  );

  bindGeoDepthLayer(
    animate,
    scroll,
    geoFront,
    {
      baseRate: 15,
      rateStep: 4,
      rotateStep: 7,
    }
  );

  // Hero and coding-image parallax stay desktop-only.
  if (IS_NARROW_VIEWPORT) return;

  // ---- Hero scroll depth ----

  if (hero) {
    scroll(
      animate(
        hero,
        {
          opacity: [1, 1, 0.35],
          y: [
            "0%",
            "0%",
            "-8%",
          ],
          scale: [
            1,
            1,
            0.97,
          ],
        },
        {
          easing: "linear",
        }
      ),
      {
        target: hero,
        offset: [
          "start start",
          "35% start",
          "end start",
        ],
      }
    );
  }

  // ---- Coding images scroll depth ----

  if (images.length) {
    const attachImageDepth = () => {
      images.forEach((img, i) => {
        const rate =
          6 + (i % 3) * 4;

        scroll(
          animate(
            img,
            {
              y: [
                "0%",
                `${rate}%`,
              ],
            },
            {
              easing: "linear",
            }
          ),
          {
            target: img,
            offset: [
              "start end",
              "end start",
            ],
          }
        );
      });
    };

    if (
      imagesEntrance &&
      imagesEntrance.finished
    ) {
      imagesEntrance.finished
        .then(attachImageDepth)
        .catch(attachImageDepth);
    } else {
      attachImageDepth();
    }
  }
}

// ---- Micro-interactions ----

function setupMicroInteractions(
  animate,
  { languageCards }
) {
  const supportsHover =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

  if (!supportsHover) return;

  languageCards.forEach((card) => {
    card.addEventListener(
      "mouseenter",
      () => {
        animate(
          card,
          {
            y: -6,
            scale: 1.015,
          },
          SPRING
        );
      }
    );

    card.addEventListener(
      "mouseleave",
      () => {
        animate(
          card,
          {
            y: 0,
            scale: 1,
          },
          SPRING
        );
      }
    );
  });
}

// ---- Trigger ----

if (typeof Motion === "undefined") {
  console.warn(
    "Motion failed to load (CDN blocked or offline) — falling back to plain reveal."
  );

  revealImmediately();
} else {
  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (prefersReducedMotion) {
    // Reveal content immediately and leave geometric shapes static.
    revealImmediately();
  } else {
    runAnimations();
  }
}
