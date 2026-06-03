/* =================================================================
   בשבילנו — site behaviours
   nav · theme · mobile drawer · scroll-reveal · counters · lightbox
   FAQ accordion · back-to-top · scroll progress · contact form
   ================================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- THEME (apply early-saved theme is handled inline in <head>) ---------- */
  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("bishvili-theme", next); } catch (e) {}
    });
  }

  /* ---------- NAV: scrolled state + scroll progress ---------- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("scrollProgress");
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 8);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    var toTop = document.getElementById("toTop");
    if (toTop) toTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- MOBILE DRAWER ---------- */
  var hamburger = document.getElementById("hamburger");
  var drawer = document.getElementById("drawer");
  function setMenu(open) {
    if (!drawer || !hamburger || !nav) return;
    drawer.classList.toggle("open", open);
    nav.classList.toggle("menu-open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      setMenu(!drawer.classList.contains("open"));
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- BACK TO TOP ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      revealEls.forEach(function (el) { ro.observe(el); });
    }
  }

  /* ---------- ANIMATED COUNTERS ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-target"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, start = null;
    if (prefersReduced) { el.textContent = format(target) + ""; appendSuffix(el, suffix); return; }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step); else { el.textContent = format(target); appendSuffix(el, suffix); }
    }
    requestAnimationFrame(step);
  }
  function format(n) { return n.toLocaleString("en-US"); }
  function appendSuffix(el, suffix) {
    if (suffix) { var s = document.createElement("span"); s.className = "u"; s.textContent = suffix; el.appendChild(s); }
  }
  var counters = document.querySelectorAll(".count");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { animateCount(el); });
  }

  /* ---------- FAQ ACCORDION ---------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var ans = item.querySelector(".faq-a");
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0px";
    });
  });

  /* ---------- LIGHTBOX ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    var lbClose = lightbox.querySelector(".lb-close");
    function openLb(src, alt) {
      lbImg.src = src; lbImg.alt = alt || ""; lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeLb() { lightbox.classList.remove("open"); document.body.style.overflow = ""; lbImg.src = ""; }
    document.querySelectorAll(".zoomable img, img.zoomable").forEach(function (img) {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function () { openLb(img.currentSrc || img.src, img.alt); });
    });
    lbClose.addEventListener("click", closeLb);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
  }

  /* ---------- TOAST ---------- */
  function showToast(msg) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.querySelector(".msg").textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove("show"); }, 4200);
  }

  /* ---------- CONTACT FORM (client-side demo) ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // honeypot — silently drop bots
      var hp = form.querySelector(".hp input");
      if (hp && hp.value) return;

      var valid = true;
      form.querySelectorAll("[data-required]").forEach(function (input) {
        var field = input.closest(".field");
        var ok = input.value.trim() !== "";
        if (ok && input.type === "email") {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        field.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });
      if (!valid) { showToast("נא למלא את השדות המסומנים"); return; }

      // -------------------------------------------------------------
      // DEMO ONLY: no real submission yet.
      // To wire a backend later, POST `new FormData(form)` to your
      // endpoint / form service here, then show the toast on success.
      // -------------------------------------------------------------
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "שולח…"; }
      setTimeout(function () {
        form.reset();
        form.querySelectorAll(".field.invalid").forEach(function (f) { f.classList.remove("invalid"); });
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        showToast("תודה! פנייתכם נקלטה — נחזור אליכם בהקדם.");
      }, 700);
    });

    // clear error state as the user types
    form.querySelectorAll("[data-required]").forEach(function (input) {
      input.addEventListener("input", function () {
        input.closest(".field").classList.remove("invalid");
      });
    });
  }

  /* ---------- YEAR IN FOOTER ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
