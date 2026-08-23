// nav.js — shared mobile nav toggle for .site-header / #main-nav.
// Used on every page that includes the new header (home.html and the
// language pages), so this logic lives in one place instead of being
// copy-pasted per page.

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  if (!navToggle || !mainNav) return;

  function setOpen(isOpen) {
    mainNav.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  }

  navToggle.addEventListener("click", () => {
    setOpen(!mainNav.classList.contains("is-open"));
  });

  // Tapping a nav link should close the panel instead of leaving it
  // open behind whatever page/section it just navigated to.
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  // Escape closes the panel and returns focus to the toggle button.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
      setOpen(false);
      navToggle.focus();
    }
  });
});
