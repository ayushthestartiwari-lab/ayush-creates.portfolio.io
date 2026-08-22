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
//   2. Motion-driven animations (hero, images, aurora layers, buttons,
//      cards) — everything else. Where an element has both an entrance
//      animation and a continuous scroll-linked one (the coding
//      images), the scroll-linked one is deferred until the entrance
//      has fully finished, so the two never fight over `transform`.
//
// Every phase in runAnimations() is wrapped so a failure in one
// (missing element, older Motion build without scroll()/inView(),
// etc.) can't take down the rest of the script.

// ---- Constants (must exist before runAnimations() can be called) ----

// Springs
