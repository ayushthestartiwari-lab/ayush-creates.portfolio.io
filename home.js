```javascript
// ============================================================
// home.js — Be Ahead Homepage
// ============================================================
// Includes:
// 1. Vanta.js animated background
// 2. Smooth scroll-based background movement
// 3. Fluid language-card tilt
// 4. Smooth in-page anchor scrolling
// 5. Safe fallbacks
// ============================================================


document.addEventListener("DOMContentLoaded", () => {

  // ==========================================================
  // VANTA.JS LIVE BACKGROUND
  // ==========================================================

  let vantaEffect = null;

  const vantaElement = document.getElementById("vanta-bg");

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  function initializeVanta() {

    if (!vantaElement) {
      return;
    }

    if (prefersReducedMotion) {
      vantaElement.classList.add("reduced-motion");
      return;
    }

    // Make sure Vanta and THREE have loaded.
    if (
      typeof VANTA === "undefined" ||
      typeof THREE === "undefined" ||
      typeof VANTA.FOG !== "function"
    ) {

      vantaElement.classList.add("vanta-fallback");

      return;
    }


    try {

      vantaEffect = VANTA.FOG({

        el: vantaElement,

        THREE: THREE,

        mouseControls: true,
        touchControls: true,

        gyroControls: false,

        minHeight: 200,
        minWidth: 200,

        highlightColor: 0x7c3aed,
        midtoneColor: 0x6d28d9,
        lowlightColor: 0x170a30,

        baseColor: 0x170a30,

        blurFactor: 0.55,

        speed: 0.75,

        zoom: 0.85

      });

    } catch (error) {

      console.warn(
        "Be Ahead: Vanta background could not initialize.",
        error
      );

      vantaElement.classList.add("vanta-fallback");

    }

  }


  // Vanta loads before this file, but this tiny delay gives
  // the browser enough time to finish creating THREE/VANTA.
  window.setTimeout(initializeVanta, 50);


  // ==========================================================
  // SCROLL-BASED BACKGROUND MOVEMENT
  // ==========================================================

  let scrollY = 0;
  let targetScrollY = 0;

  let scrollAnimationFrame = null;


  function updateScrollPosition() {

    targetScrollY = window.scrollY || window.pageYOffset || 0;

    if (!scrollAnimationFrame) {

      scrollAnimationFrame =
        requestAnimationFrame(applyScrollMovement);

    }

  }


  function applyScrollMovement() {

    const difference = targetScrollY - scrollY;

    scrollY += difference * 0.08;


    document.documentElement.style.setProperty(
      "--scroll-y",
      `${scrollY}px`
    );


    const vanta = document.getElementById("vanta-bg");

    if (vanta && !prefersReducedMotion) {

      const movement =
        Math.min(scrollY * 0.035, 80);

      vanta.style.transform =
        `translate3d(0, ${movement}px, 0)`;

    }


    if (Math.abs(difference) > 0.1) {

      scrollAnimationFrame =
        requestAnimationFrame(applyScrollMovement);

    } else {

      scrollAnimationFrame = null;

    }

  }


  window.addEventListener(
    "scroll",
    updateScrollPosition,
    {
      passive: true
    }
  );


  // ==========================================================
  // FLUID LANGUAGE CARD TILT
  // ==========================================================

  const cards =
    document.querySelectorAll(".language-card");

  const LERP_SPEED = 0.12;


  cards.forEach((card) => {

    let targetX = 0;
    let targetY = 0;

    let currentX = 0;
    let currentY = 0;

    let hovering = false;

    let raf = null;


    const tick = () => {

      currentX +=
        (targetX - currentX) *
        LERP_SPEED;

      currentY +=
        (targetY - currentY) *
        LERP_SPEED;


      const scale =
        hovering ? 1.025 : 1;

      const lift =
        hovering ? -7 : 0;


      card.style.transform = `
        perspective(900px)
        rotateX(${currentY}deg)
        rotateY(${currentX}deg)
        translateY(${lift}px)
        scale(${scale})
      `;


      if (
        Math.abs(targetX - currentX) > 0.01 ||
        Math.abs(targetY - currentY) > 0.01 ||
        hovering
      ) {

        raf =
          requestAnimationFrame(tick);

      } else {

        card.style.transform = "";

        raf = null;

      }

    };


    const startLoop = () => {

      if (!raf) {

        raf =
          requestAnimationFrame(tick);

      }

    };


    card.addEventListener(
      "mousemove",
      (event) => {

        if (window.innerWidth <= 700) {
          return;
        }


        hovering = true;


        const rect =
          card.getBoundingClientRect();


        const x =
          event.clientX -
          rect.left;


        const y =
          event.clientY -
          rect.top;


        const centerX =
          rect.width / 2;


        const centerY =
          rect.height / 2;


        targetX =
          ((x - centerX) /
            centerX) * 7;


        targetY =
          ((y - centerY) /
            centerY) * -7;


        startLoop();

      }
    );


    card.addEventListener(
      "mouseleave",
      () => {

        hovering = false;

        targetX = 0;
        targetY = 0;

        startLoop();

      }
    );


    card.addEventListener(
      "touchstart",
      () => {

        hovering = false;

        targetX = 0;
        targetY = 0;

      },
      {
        passive: true
      }
    );

  });


  // ==========================================================
  // SMOOTH IN-PAGE ANCHOR SCROLLING
  // ==========================================================

  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

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

        }
      );

    });


  // ==========================================================
  // KEYBOARD ACCESS FOR BE AI BUTTON
  // ==========================================================

  const beAiButton =
    document.getElementById("beai-chatbot");


  if (beAiButton) {

    beAiButton.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          beAiButton.click();

        }

      }
    );

  }


  // ==========================================================
  // CLEANUP VANTA WHEN PAGE IS LEFT
  // ==========================================================

  window.addEventListener(
    "beforeunload",
    () => {

      if (
        vantaEffect &&
        typeof vantaEffect.destroy === "function"
      ) {

        vantaEffect.destroy();

      }

    }
  );

});
```
