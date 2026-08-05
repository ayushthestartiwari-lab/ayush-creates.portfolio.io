```javascript
// ============================================================
// home.js — Be Ahead Homepage Interactivity
// ============================================================
// Includes:
// 1. Smooth 3D cursor-following tilt for language cards
// 2. Scroll-reactive animated background / parallax
// 3. Smooth in-page anchor scrolling
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ==========================================================
  // LANGUAGE CARD 3D TILT
  // ==========================================================

  const cards = document.querySelectorAll(".language-card");

  const LERP_SPEED = 0.12;
  const MAX_TILT = 9;

  cards.forEach((card) => {

    let targetX = 0;
    let targetY = 0;

    let currentX = 0;
    let currentY = 0;

    let hovering = false;
    let animationFrame = null;

    function animateCard() {

      currentX += (targetX - currentX) * LERP_SPEED;
      currentY += (targetY - currentY) * LERP_SPEED;

      const scale = hovering ? 1.035 : 1;
      const lift = hovering ? -6 : 0;

      card.style.transform = `
        perspective(900px)
        rotateX(${currentY}deg)
        rotateY(${currentX}deg)
        translateY(${lift}px)
        scale(${scale})
      `;

      const stillMoving =
        Math.abs(targetX - currentX) > 0.01 ||
        Math.abs(targetY - currentY) > 0.01 ||
        hovering;

      if (stillMoving) {
        animationFrame = requestAnimationFrame(animateCard);
      } else {
        card.style.transform = "";
        animationFrame = null;
      }
    }

    function startAnimation() {
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(animateCard);
      }
    }

    card.addEventListener("mouseenter", () => {
      hovering = true;
      startAnimation();
    });

    card.addEventListener("mousemove", (event) => {

      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      targetX =
        ((x - centerX) / centerX) * MAX_TILT;

      targetY =
        ((y - centerY) / centerY) * -MAX_TILT;

      startAnimation();
    });

    card.addEventListener("mouseleave", () => {

      hovering = false;

      targetX = 0;
      targetY = 0;

      startAnimation();
    });

  });


  // ==========================================================
  // SCROLL-REACTIVE BACKGROUND
  // ==========================================================

  const aurora = document.querySelector(".aurora-bg");

  if (aurora) {

    let currentScroll = 0;
    let targetScroll = 0;

    let backgroundFrame = null;

    function animateBackground() {

      currentScroll +=
        (targetScroll - currentScroll) * 0.08;

      // Move the complete aurora layer very slightly.
      aurora.style.transform = `
        translate3d(
          0,
          ${currentScroll * -0.045}px,
          0
        )
      `;

      backgroundFrame =
        requestAnimationFrame(animateBackground);
    }

    window.addEventListener(
      "scroll",
      () => {
        targetScroll = window.scrollY;
      },
      { passive: true }
    );

    animateBackground();
  }


  // ==========================================================
  // INDIVIDUAL AURORA ELEMENT PARALLAX
  // ==========================================================

  const auroraSpans =
    document.querySelectorAll(".aurora-bg > span");

  const planet =
    document.querySelector(".aurora-planet");

  let scrollPosition = 0;
  let targetPosition = 0;

  let parallaxFrame = null;

  function animateParallax() {

    scrollPosition +=
      (targetPosition - scrollPosition) * 0.07;

    auroraSpans.forEach((blob, index) => {

      const speeds = [
        0.035,
        -0.025,
        0.02
      ];

      const speed = speeds[index] || 0.02;

      const x =
        Math.sin(scrollPosition * 0.002 + index) *
        18;

      const y =
        scrollPosition * speed;

      blob.style.transform =
        `translate3d(${x}px, ${y}px, 0)`;
    });


    if (planet) {

      const planetY =
        scrollPosition * -0.06;

      const planetX =
        Math.sin(scrollPosition * 0.0015) * 15;

      planet.style.transform =
        `translate3d(${planetX}px, ${planetY}px, 0)`;
    }

    parallaxFrame =
      requestAnimationFrame(animateParallax);
  }

  window.addEventListener(
    "scroll",
    () => {
      targetPosition = window.scrollY;
    },
    { passive: true }
  );

  animateParallax();


  // ==========================================================
  // SMOOTH IN-PAGE SCROLL
  // ==========================================================

  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {

      link.addEventListener("click", (event) => {

        const selector =
          link.getAttribute("href");

        if (!selector || selector === "#") {
          return;
        }

        const target =
          document.querySelector(selector);

        if (target) {

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      });

    });


  // ==========================================================
  // REDUCED MOTION ACCESSIBILITY
  // ==========================================================

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

  if (prefersReducedMotion.matches) {

    cards.forEach((card) => {
      card.style.transform = "";
    });

  }

});
```
