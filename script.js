/* =========================================================
   Light Pump ($LIGHT) — script.js
   No dependencies. Everything is feature-detected and
   degrades to a fully readable static page.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1. Footer year
     --------------------------------------------------------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     2. Sticky nav: background state + scroll progress bar
     --------------------------------------------------------- */
  var nav = $("#nav");
  var progress = $("#nav-progress");

  function onScrollChrome() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 24);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (y / max) * 100 : 0;
      progress.style.width = pct.toFixed(2) + "%";
    }
  }

  /* ---------------------------------------------------------
     3. Mobile menu
     --------------------------------------------------------- */
  var burger = $("#burger");
  var links = $("#nav-links");

  function setMenu(open) {
    if (!burger || !links) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
  }

  if (burger && links) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        burger.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!links.classList.contains("is-open")) return;
      if (e.target.closest("#nav-links") || e.target.closest("#burger")) return;
      setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setMenu(false);
    });
  }

  /* ---------------------------------------------------------
     4. Scroll reveal
     --------------------------------------------------------- */
  var revealItems = $$("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    // Stagger siblings inside the same grid/list for a softer cascade.
    var groups = new Map();
    revealItems.forEach(function (el) {
      var parent = el.parentElement;
      var list = groups.get(parent) || [];
      list.push(el);
      groups.set(parent, list);
    });
    groups.forEach(function (list) {
      list.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i * 70, 350) + "ms";
      });
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     5. Active nav link
     --------------------------------------------------------- */
  var navAnchors = $$('#nav-links a[href^="#"]');
  var sections = navAnchors
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------------------------------------------------------
     6. Parallax + timeline progress (single rAF loop)
     --------------------------------------------------------- */
  var parallaxItems = $$("[data-parallax]");
  var timeline = $("#timeline");
  var tlSteps = $$(".tl", timeline || document);
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;

    if (!reduceMotion) {
      parallaxItems.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        el.style.transform = "translate3d(0," + (-rect.top * speed).toFixed(1) + "px,0)";
      });
    }

    if (timeline) {
      var box = timeline.getBoundingClientRect();
      var anchor = window.innerHeight * 0.62;
      var ratio = (anchor - box.top) / box.height;
      ratio = Math.max(0, Math.min(1, ratio));
      timeline.style.setProperty("--tl-progress", ratio.toFixed(3));

      tlSteps.forEach(function (step) {
        var dotTop = step.getBoundingClientRect().top + 24;
        step.classList.toggle("is-reached", dotTop <= anchor);
      });
    }

    onScrollChrome();
  }

  function requestFrame() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);
  frame();

  /* ---------------------------------------------------------
     7. Hero: the parallax layer is inside .hero, so reset its
        transform reference when the page loads from an anchor
     --------------------------------------------------------- */
  window.addEventListener("load", requestFrame);

  /* ---------------------------------------------------------
     8. Community counter
     --------------------------------------------------------- */
  var counter = $(".counter__num");

  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var format = function (n) { return n.toLocaleString("en-US"); };

    if (reduceMotion) { el.textContent = format(target); return; }

    var duration = 1600;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (counter) {
    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      countObserver.observe(counter);
    } else {
      runCounter(counter);
    }
  }

  /* ---------------------------------------------------------
     9. FAQ accordion
     --------------------------------------------------------- */
  $$(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq__item");
      var open = btn.getAttribute("aria-expanded") === "true";

      // Close siblings for a single-open accordion.
      $$(".faq__item.is-open").forEach(function (other) {
        if (other === item) return;
        other.classList.remove("is-open");
        var q = $(".faq__q", other);
        if (q) q.setAttribute("aria-expanded", "false");
      });

      item.classList.toggle("is-open", !open);
      btn.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---------------------------------------------------------
     10. Particle field — embers drifting up toward the light
     --------------------------------------------------------- */
  var canvas = $("#particles");

  if (canvas && !reduceMotion && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var particles = [];
    var dpr = 1;
    var w = 0, h = 0;
    var raf = null;
    var visible = true;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var density = w < 640 ? 14000 : 9000;
      var count = Math.min(Math.round((w * h) / density), 110);
      particles = [];
      for (var i = 0; i < count; i++) particles.push(spawn(true));
    }

    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + Math.random() * 60,
        r: Math.random() * 1.9 + 0.5,
        vy: -(Math.random() * 0.26 + 0.09),
        vx: (Math.random() - 0.5) * 0.14,
        a: Math.random() * 0.5 + 0.12,
        tw: Math.random() * Math.PI * 2,
        red: Math.random() > 0.45
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.02;

        if (p.y < -20 || p.x < -30 || p.x > w + 30) {
          particles[i] = spawn(false);
          continue;
        }

        var alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        if (p.red) {
          ctx.fillStyle = "rgba(255,45,70," + alpha.toFixed(3) + ")";
          ctx.shadowColor = "rgba(255,45,70,.85)";
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = "rgba(246,243,244," + (alpha * 0.55).toFixed(3) + ")";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = window.requestAnimationFrame(draw);
    }

    function play() {
      if (raf === null && visible) raf = window.requestAnimationFrame(draw);
    }
    function pause() {
      if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
    }

    size();
    play();

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(size, 180);
    });

    // Stop drawing when the hero is off-screen or the tab is hidden.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? play() : pause();
      }, { threshold: 0 }).observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      document.hidden ? pause() : play();
    });
  }
})();
