// ============================================
// home.js — Homepage interactivity for Be Ahead
// Adds: fluid cursor-tracking tilt on language cards
// (Entrance animations + shine sweep already handled
//  by style.css, so JS only adds what CSS can't do.)
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  // Mobile nav toggle now lives in nav.js (shared with the language
  // pages) — see that file.

  // ---------- HERO TERMINAL: typewriter effect ----------
  // Purely decorative (aria-hidden container), so reduced-motion just
  // shows the final text immediately rather than skipping content.
  const terminalEl = document.getElementById("terminal-typed");
  if (terminalEl) {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lines = [
      { prompt: "$ ", text: "be_ahead --start", pause: 500 },
      { prompt: "> ", text: "Learning Python, JavaScript, Java, Go, HTML, Rust, C++...", pause: 350 },
      { prompt: "> ", text: "Be AI ready. Arena loaded. Bug Hunter armed.", pause: 350 },
      { prompt: "> ", text: "Status: ahead.", pause: 0 },
    ];

    if (prefersReducedMotion) {
      terminalEl.innerHTML = lines
        .map((l) => `<span class="prompt">${l.prompt}</span>${l.text}`)
        .join("\n");
    } else {
      typeLines(terminalEl, lines);
    }
  }

  function typeLines(el, lines) {
    let lineIndex = 0;
    let charIndex = 0;
    let built = "";

    function step() {
      if (lineIndex >= lines.length) {
        el.innerHTML = built + '<span class="cursor"></span>';
        return;
      }

      const line = lines[lineIndex];

      if (charIndex === 0) {
        built += `<span class="prompt">${line.prompt}</span>`;
      }

      if (charIndex < line.text.length) {
        built += line.text[charIndex];
        el.innerHTML = built + '<span class="cursor"></span>';
        charIndex++;
        setTimeout(step, 22);
      } else {
        built += "\n";
        lineIndex++;
        charIndex = 0;
        setTimeout(step, line.pause);
      }
    }

    step();
  }

  // ---------- FLUID CARD TILT (lerped, not snapped) ----------
  // Eases toward the cursor's tilt angle every frame instead of
  // jumping straight to it — this is what makes it feel smooth.
  // Only affects `transform`, so your existing hover box-shadow /
  // border-glow / shine-sweep from style.css still work as-is.

  const cards = document.querySelectorAll(".language-card");
  const LERP_SPEED = 0.12; // lower = smoother/slower, higher = snappier

  cards.forEach((card) => {
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let hovering = false;
    let raf = null;

    const tick = () => {
      currentX += (targetX - currentX) * LERP_SPEED;
      currentY += (targetY - currentY) * LERP_SPEED;

      const scale = hovering ? 1.045 : 1;
      const lift = hovering ? -10 : 0;

      card.style.transform = `
        perspective(700px)
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
        raf = requestAnimationFrame(tick);
      } else {
        card.style.transform = ""; // hand back control to CSS
        raf = null;
      }
    };

    const startLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    card.addEventListener("mousemove", (e) => {
      hovering = true;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      targetX = ((x - centerX) / centerX) * 9;
      targetY = ((y - centerY) / centerY) * -9;

      startLoop();
    });

    card.addEventListener("mouseleave", () => {
      hovering = false;
      targetX = 0;
      targetY = 0;
      startLoop();
    });
  });


  // ---------- SMOOTH SCROLL FOR IN-PAGE ANCHOR LINKS ----------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

});
