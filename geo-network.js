/* Geometric background — glowing connected-node network, styled after
 * the reference: dense mesh of small glowing nodes in mixed colors
 * (violet/blue, pink/magenta, amber/orange), thin connecting lines,
 * and a handful of larger soft "bokeh" orbs for depth. The site's
 * own background gradient is left untouched — this canvas only adds
 * the network on top of it, it never changes the page's colors.
 *
 * Deliberately plain vanilla JS with zero dependency on Motion.dev or
 * any other external script: it only needs canvas 2D, which every
 * supported browser already has, so it can never fail to load like a
 * CDN script can. Runs once as a static frame on page load, then
 * redraws only from inside a scroll event handler (rAF-throttled) —
 * there is no continuous requestAnimationFrame loop, so the network
 * is provably idle (zero JS work) whenever the user isn't scrolling,
 * and every position update is driven directly by scrollY, not by a
 * timer, so it can't drift out of sync with the scrollbar.
 */
(function () {
  "use strict";

  var canvas = document.querySelector(".geo-bg-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var isNarrow = window.matchMedia("(max-width: 640px)").matches;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0;
  var height = 0;

  // Colors reuse the site's existing accent variables (violet / pink
  // / amber) — no new palette is introduced — but instead of one
  // fixed color per depth layer, every node independently picks from
  // this palette, which is what gives the reference image its mixed
  // blue/magenta/orange look rather than solid-colored clusters.
  var PALETTE = [
    "124,58,237", // --accent-violet (reads as the "blue" family here)
    "236,72,153", // --accent-pink-bright (magenta)
    "247,160,114", // --accent-amber (orange/gold)
  ];

  // Node counts and linkDist are tuned together: linkDist needs to be
  // comfortably larger than the average spacing between nodes (area /
  // count) or almost no pairs ever qualify for a line, which is what
  // made the previous version look like scattered dots instead of a
  // connected mesh.
  var VIRTUAL_HEIGHT_MULT = 2.3;

  var LAYERS = [
    {
      count: isNarrow ? 70 : 150,
      speed: 0.04,
      radius: [0.8, 1.6],
      glow: 4.5,
      lineOpacity: 0.26,
      nodeOpacity: 0.5,
      linkDist: 190,
      bokehChance: 0.04,
      bokehScale: 5,
    },
    {
      count: isNarrow ? 50 : 110,
      speed: 0.1,
      radius: [1.1, 2],
      glow: 6.5,
      lineOpacity: 0.32,
      nodeOpacity: 0.65,
      linkDist: 220,
      bokehChance: 0.07,
      bokehScale: 6,
    },
    {
      count: isNarrow ? 32 : 70,
      speed: 0.19,
      radius: [1.4, 2.6],
      glow: 8,
      lineOpacity: 0.38,
      nodeOpacity: 0.8,
      linkDist: 250,
      bokehChance: 0.1,
      bokehScale: 7,
    },
  ];

  var layerNodes = [];

  // Deterministic PRNG (mulberry32): the field layout is fixed by a
  // constant seed, not regenerated randomly per load — the "random"
  // look comes from the layout itself, not from re-rolling it, so the
  // motion stays controlled and predictable, per the same
  // "no uncontrolled randomness" rule the rest of the background
  // follows.
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildNodes() {
    layerNodes = LAYERS.map(function (layer, li) {
      var rand = mulberry32(1000 + li * 97);
      var virtualH = height * VIRTUAL_HEIGHT_MULT;
      var nodes = [];
      for (var i = 0; i < layer.count; i++) {
        var isBokeh = rand() < layer.bokehChance;
        nodes.push({
          x: rand() * width,
          y: rand() * virtualH,
          r: layer.radius[0] + rand() * (layer.radius[1] - layer.radius[0]),
          color: PALETTE[Math.floor(rand() * PALETTE.length)],
          bokeh: isBokeh,
        });
      }
      return nodes;
    });
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildNodes();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    var scrollY = window.scrollY || window.pageYOffset || 0;

    LAYERS.forEach(function (layer, li) {
      var nodes = layerNodes[li];
      var virtualH = height * VIRTUAL_HEIGHT_MULT;
      var offset = (scrollY * layer.speed) % virtualH;

      var pts = nodes.map(function (n) {
        var y = ((n.y - offset) % virtualH + virtualH) % virtualH;
        if (y > virtualH - height) y -= virtualH;
        return { x: n.x, y: y, r: n.r, color: n.color, bokeh: n.bokeh };
      });

      // Connecting lines: each line's color comes from one of the two
      // nodes it joins (alternating), so a violet-to-amber connection
      // still reads as belonging to the network rather than every
      // line being a single flat color, matching the reference's mix.
      ctx.lineWidth = 1;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x;
          var dy = pts[i].y - pts[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < layer.linkDist) {
            var alpha = layer.lineOpacity * (1 - dist / layer.linkDist);
            var lineColor = (i + j) % 2 === 0 ? pts[i].color : pts[j].color;
            ctx.strokeStyle = "rgba(" + lineColor + "," + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      pts.forEach(function (p) {
        var glowMult = layer.glow * (p.bokeh ? layer.bokehScale : 1);
        var glowR = p.r * glowMult;
        var glowAlpha = p.bokeh ? layer.nodeOpacity * 0.55 : layer.nodeOpacity;

        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, "rgba(" + p.color + "," + glowAlpha + ")");
        grad.addColorStop(1, "rgba(" + p.color + ",0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        if (!p.bokeh) {
          // Sharp bright core, only on the small "star point" nodes —
          // bokeh orbs stay pure soft glow, like an out-of-focus light.
          ctx.fillStyle =
            "rgba(" + p.color + "," + Math.min(1, layer.nodeOpacity + 0.3) + ")";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }

  // First paint: fully static until the user actually scrolls.
  resize();
  draw();

  var resizeTimer;
  window.addEventListener(
    "resize",
    function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        draw();
      }, 150);
    },
    { passive: true }
  );

  // Respect prefers-reduced-motion: never attach the scroll listener,
  // so the network stays exactly as first painted, permanently.
  if (prefersReducedMotion) return;

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        draw();
        ticking = false;
      });
    },
    { passive: true }
  );
})();
