/* ============================================================
   RIBES — interaction layer
   GSAP + ScrollTrigger (CDN) · Lenis smooth scroll (CDN)
   Everything degrades gracefully: content is visible without JS.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var loader = document.getElementById("loader");

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!REDUCED && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* anchor navigation (works with or without lenis) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.4 });
      else el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      closeMenu();
    });
  });

  /* ---------- nav state + progress ---------- */
  var nav = document.getElementById("nav");
  var progress = document.querySelector("#progress i");
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle("scrolled", y > 40);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("nav-burger");
  var menu = document.getElementById("mobile-menu");
  function closeMenu() {
    burger.classList.remove("open");
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
  }
  burger.addEventListener("click", function () {
    var open = !menu.classList.contains("open");
    burger.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  });

  /* ---------- custom cursor ---------- */
  if (FINE && !REDUCED) {
    var cur = document.getElementById("cursor");
    var ring = document.getElementById("cursor-ring");
    var cx = -100, cy = -100, rx = -100, ry = -100, shown = false;
    document.addEventListener("mousemove", function (e) {
      cx = e.clientX; cy = e.clientY;
      if (!shown) { shown = true; document.body.classList.add("cursor-on"); }
    });
    (function loop() {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      cur.style.transform = "translate(" + (cx - 3) + "px," + (cy - 3) + "px)";
      ring.style.transform = "translate(" + (rx - 17) + "px," + (ry - 17) + "px)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('[data-cursor="hover"], .qa summary, .tour-tabs button').forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-hover"); });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-hover"); });
    });
  }

  /* ---------- hero particle mesh ---------- */
  var mesh = document.getElementById("mesh");
  if (mesh && !REDUCED) {
    var ctx = mesh.getContext("2d");
    var pts = [], W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: -9999, y: -9999 };
    var running = true;

    function sizeMesh() {
      var r = mesh.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      mesh.width = W * DPR; mesh.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.min(120, Math.floor((W * H) / 16000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.6
        });
      }
    }
    sizeMesh();
    window.addEventListener("resize", sizeMesh);
    mesh.parentElement.addEventListener("mousemove", function (e) {
      var r = mesh.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    mesh.parentElement.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });

    var io = new IntersectionObserver(function (en) { running = en[0].isIntersecting; }, { threshold: 0 });
    io.observe(mesh);

    (function draw() {
      requestAnimationFrame(draw);
      if (!running || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      var LINK = 130;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dxm = p.x - mouse.x, dym = p.y - mouse.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 140 && dm > 0.1) { p.x += (dxm / dm) * 0.9; p.y += (dym / dm) * 0.9; }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            var a = (1 - Math.sqrt(d) / LINK) * 0.34;
            ctx.strokeStyle = "rgba(165,22,255," + a.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(201,138,255,.7)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    })();
  }

  /* ---------- hero window live telemetry (illustrative) ---------- */
  var spark = document.getElementById("wspark");
  if (spark) {
    var bars = [];
    for (var i = 0; i < 26; i++) {
      var b = document.createElement("i");
      b.style.height = (25 + Math.random() * 70) + "%";
      spark.appendChild(b); bars.push(b);
    }
    if (!REDUCED) {
      setInterval(function () {
        var tps = (38 + Math.random() * 8);
        var vram = (7.1 + Math.random() * 0.6);
        var gpu = Math.round(82 + Math.random() * 11);
        var tpsEl = document.getElementById("wtps");
        if (tpsEl) tpsEl.textContent = tps.toFixed(1);
        var wv = document.getElementById("wv"), wu = document.getElementById("wu");
        var wgv = document.getElementById("wgv"), wgu = document.getElementById("wgu");
        if (wv) wv.textContent = vram.toFixed(1) + " / 12 GB";
        if (wu) wu.textContent = gpu + "%";
        if (wgv) wgv.style.width = Math.round((vram / 12) * 100) + "%";
        if (wgu) wgu.style.width = gpu + "%";
        var nb = document.createElement("i");
        nb.style.height = (25 + (tps - 38) / 8 * 70) + "%";
        spark.appendChild(nb);
        bars.push(nb);
        if (bars.length > 26) spark.removeChild(bars.shift());
      }, 900);
    }
  }

  /* ---------- loader + hero intro ---------- */
  function heroIntro() {
    if (!hasGSAP || REDUCED) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(".emblem", { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1 })
      .fromTo(".pill", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.75")
      .fromTo("h1 .l > span", { yPercent: 115 }, { yPercent: 0, duration: 1.15, stagger: 0.12 }, "-=0.6")
      .fromTo(".sub", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, "-=0.7")
      .fromTo(".hero-cta .btn", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.09 }, "-=0.65")
      .fromTo(".hero-note", { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.5")
      .fromTo(".win-wrap", { y: 70, opacity: 0, rotateX: 8 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.3 }, "-=0.75")
      .fromTo("#nav", { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=1.1");
  }

  function killLoader() {
    if (loader) loader.style.display = "none";
    document.body.style.overflow = "";
  }

  if (loader && hasGSAP && !REDUCED) {
    document.body.style.overflow = "hidden";
    var pctEl = document.getElementById("ld-pct");
    var fill = document.getElementById("ld-fill");
    var stateEl = document.getElementById("ld-state");
    var states = ["RESOLVING", "DOWNLOADING", "PROVISIONING", "LAUNCHING"];
    var winLoaded = document.readyState === "complete";
    window.addEventListener("load", function () { winLoaded = true; });

    var cnt = { v: 0 }, done = false;
    gsap.to(cnt, {
      v: 100, duration: 2.1, ease: "power2.inOut",
      onUpdate: function () {
        var v = Math.round(cnt.v);
        pctEl.textContent = v;
        fill.style.width = v + "%";
        stateEl.textContent = states[Math.min(3, Math.floor(v / 26))];
      },
      onComplete: function tryExit() {
        if (done) return;
        if (!winLoaded) { setTimeout(tryExit, 120); return; }
        done = true;
        var tl = gsap.timeline({ onComplete: killLoader });
        tl.to(".ld-center", { y: -26, opacity: 0, duration: 0.5, ease: "power2.in" })
          .set(".ld-curtain", { scaleY: 1 })
          .to("#loader", { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, "-=0.05")
          .to(".ld-curtain.c2", { yPercent: 45, duration: 1.0, ease: "expo.inOut" }, "<0.05");
        heroIntro();
      }
    });
    /* safety: never trap the user behind the loader */
    setTimeout(function () { if (!done) { done = true; killLoader(); heroIntro(); } }, 8000);
  } else {
    killLoader();
  }

  /* ---------- scroll reveals ---------- */
  if (hasGSAP && !REDUCED) {
    document.querySelectorAll(".rv").forEach(function (el) {
      var d = el.classList.contains("rv-d1") ? 0.1 : el.classList.contains("rv-d2") ? 0.2 : el.classList.contains("rv-d3") ? 0.3 : 0;
      gsap.fromTo(el, { y: 42, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.05, delay: d, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    /* stats count-up */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          var o = { v: 0 };
          gsap.to(o, {
            v: target, duration: 1.6, ease: "power2.out",
            onUpdate: function () { el.textContent = Math.round(o.v) + suffix; }
          });
        }
      });
    });

    /* parallax ambient orbs */
    gsap.to(".o1", { y: 220, scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 1.4 } });
    gsap.to(".o2", { y: -260, scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 1.8 } });
    gsap.to(".o3", { y: -160, scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 2.2 } });

    /* footer giant text drift */
    gsap.fromTo(".f-giant", { yPercent: 40 }, {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: "footer", start: "top bottom", end: "bottom bottom", scrub: 1 }
    });

    /* ---------- lifecycle: pinned horizontal scroll (desktop) ---------- */
    var track = document.getElementById("lc-track");
    var lcBar = document.getElementById("lc-progress");
    if (track) {
      var mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", function () {
        var dist = function () { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); };
        var tween = gsap.to(track, {
          x: function () { return -dist(); },
          ease: "none",
          scrollTrigger: {
            trigger: "#lifecycle",
            start: "top top",
            end: function () { return "+=" + (dist() + window.innerHeight * 0.35); },
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: function (st) { if (lcBar) lcBar.style.width = (st.progress * 100) + "%"; }
          }
        });
        return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); gsap.set(track, { x: 0 }); };
      });
      /* mobile: native horizontal scroll drives the bar */
      track.addEventListener("scroll", function () {
        if (window.innerWidth >= 900 || !lcBar) return;
        var m = track.scrollWidth - track.clientWidth;
        lcBar.style.width = (m > 0 ? (track.scrollLeft / m) * 100 : 0) + "%";
      }, { passive: true });
    }
  }

  /* ---------- terminal typing ---------- */
  var termBody = document.getElementById("term-body");
  if (termBody) {
    var LINES = [
      [["t-cmd", "$ ribes launch acme.llama-vision"]],
      [["t-dim", "[core] hardware gate · verdict: "], ["t-ok", "pass"], ["t-dim", " · vram budget 11.2 GB"]],
      [["t-dim", "[core] session created · sandbox: job-object · egress: "], ["t-ok", "denied"]],
      [["t-arr", "→ "], ["", '{"jsonrpc":"2.0","method":'], ["t-key", '"status"'], ["", ',"params":{"state":"warming"}}']],
      [["t-arr", "→ "], ["", '{"jsonrpc":"2.0","method":'], ["t-key", '"progress"'], ["", ',"params":{"value":74}}']],
      [["t-arr", "→ "], ["", '{"jsonrpc":"2.0","method":'], ["t-key", '"ready"'], ["", ',"params":{"ui_type":"web","ui_url":"http://127.0.0.1:7860"}}']],
      [["t-arr", "→ "], ["", '{"jsonrpc":"2.0","method":'], ["t-key", '"metric"'], ["", ',"params":{"tokens_per_sec":42.6}}']],
      [["t-ok", "[core] running"], ["t-dim", " · 0 B of your data sent to the cloud"]]
    ];

    function renderAll() {
      termBody.innerHTML = "";
      LINES.forEach(function (line) {
        line.forEach(function (seg) {
          var s = document.createElement("span");
          if (seg[0]) s.className = seg[0];
          s.textContent = seg[1];
          termBody.appendChild(s);
        });
        termBody.appendChild(document.createTextNode("\n"));
      });
      var c = document.createElement("span"); c.className = "term-caret";
      termBody.appendChild(c);
    }

    if (REDUCED) { renderAll(); }
    else {
      var typed = false;
      function typeTerm() {
        if (typed) return; typed = true;
        var caret = document.createElement("span");
        caret.className = "term-caret";
        termBody.appendChild(caret);
        var li = 0, si = 0, ci = 0, curSpan = null;
        function step() {
          if (li >= LINES.length) return;
          var line = LINES[li];
          if (si >= line.length) {
            termBody.insertBefore(document.createTextNode("\n"), caret);
            li++; si = 0; ci = 0; curSpan = null;
            setTimeout(step, li < LINES.length && LINES[li][0][0] === "t-arr" ? 260 : 420);
            return;
          }
          var seg = line[si];
          if (!curSpan) {
            curSpan = document.createElement("span");
            if (seg[0]) curSpan.className = seg[0];
            termBody.insertBefore(curSpan, caret);
          }
          curSpan.textContent += seg[1][ci];
          ci++;
          if (ci >= seg[1].length) { si++; ci = 0; curSpan = null; }
          setTimeout(step, 7 + Math.random() * 14);
        }
        step();
      }
      var tio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { typeTerm(); tio.disconnect(); }
      }, { threshold: 0.35 });
      tio.observe(termBody);
    }
  }

  /* ---------- client tour tabs ---------- */
  var tabs = document.querySelectorAll(".tour-tabs button");
  var panels = document.querySelectorAll(".tour-panel");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var i = parseInt(t.getAttribute("data-tab"), 10);
      tabs.forEach(function (x, k) {
        x.classList.toggle("on", k === i);
        x.setAttribute("aria-selected", String(k === i));
      });
      panels.forEach(function (p, k) { p.classList.toggle("on", k === i); });
    });
  });

  /* ---------- spotlight cards ---------- */
  if (FINE) {
    document.querySelectorAll(".card-fx").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- tilt ---------- */
  if (FINE && !REDUCED && hasGSAP) {
    var tiltEls = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));
    var winEl = document.getElementById("tilt-win");
    if (winEl) tiltEls.push(winEl);
    tiltEls.forEach(function (el) {
      var MAX = el.id === "tilt-win" ? 3 : 5;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * MAX, rotateX: -py * MAX, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.9, ease: "elastic.out(1,0.55)" });
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (FINE && !REDUCED && hasGSAP) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 22;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: x / r.width * strength, y: y / r.height * strength, duration: 0.4, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ---------- FAQ: close siblings ---------- */
  document.querySelectorAll(".qa").forEach(function (qa) {
    qa.querySelector("summary").addEventListener("click", function () {
      document.querySelectorAll(".qa[open]").forEach(function (o) {
        if (o !== qa) o.removeAttribute("open");
      });
    });
  });

})();

/* ============================================================
   RIBES — v2 interaction layer
   Seamless particle field, word reveals, manifesto scrub,
   dot nav, velocity skew, image parallax, code tabs.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- global drifting particle field (seamless bg) ---------- */
  var field = document.getElementById("field");
  if (field && !REDUCED) {
    var fctx = field.getContext("2d");
    var stars = [], FW = 0, FH = 0, LOOP = 0;
    function sizeField() {
      FW = field.width = window.innerWidth;
      FH = field.height = window.innerHeight;
      LOOP = FH * 1.5;
      var n = Math.min(110, Math.floor((FW * FH) / 15000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * FW,
          y: Math.random() * LOOP,
          d: 0.25 + Math.random() * 0.75,
          r: 0.5 + Math.random() * 1.4,
          tw: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.07
        });
      }
    }
    sizeField();
    window.addEventListener("resize", sizeField);
    (function drawField(t) {
      requestAnimationFrame(drawField);
      if (document.hidden) return;
      fctx.clearRect(0, 0, FW, FH);
      var sy = window.scrollY || 0;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx;
        if (s.x < -4) s.x = FW + 4; else if (s.x > FW + 4) s.x = -4;
        var y = (((s.y - sy * s.d * 0.14) % LOOP) + LOOP) % LOOP - (LOOP - FH) / 2;
        var a = (0.26 + Math.sin(t / 900 + s.tw) * 0.18) * s.d;
        if (a <= 0) continue;
        fctx.fillStyle = "rgba(201,138,255," + a.toFixed(3) + ")";
        fctx.beginPath();
        fctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        fctx.fill();
      }
    })(0);
  }

  /* ---------- word splitting util ---------- */
  function splitWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "w";
          var inner = document.createElement("span");
          inner.textContent = tok;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        splitWords(n);
      }
    });
  }

  if (hasGSAP && !REDUCED) {

    /* section headings: word-by-word rise */
    document.querySelectorAll(".sec-head h2, .lc-head h2").forEach(function (h) {
      splitWords(h);
      var spans = h.querySelectorAll(".w > span");
      if (!spans.length) return;
      gsap.fromTo(spans, { yPercent: 112 }, {
        yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.045,
        scrollTrigger: { trigger: h, start: "top 87%", once: true }
      });
    });

    /* manifesto: scroll-scrubbed word fill */
    var mani = document.getElementById("mani");
    if (mani) {
      splitWords(mani);
      gsap.fromTo(mani.querySelectorAll(".w > span"), { opacity: 0.13 }, {
        opacity: 1, ease: "none", stagger: 0.06,
        scrollTrigger: { trigger: mani, start: "top 80%", end: "bottom 52%", scrub: true }
      });
    }

    /* dot nav active section */
    var dotMap = {};
    document.querySelectorAll("#dots a").forEach(function (a) { dotMap[a.getAttribute("data-dot")] = a; });
    ["top", "platform", "models", "architecture", "lifecycle", "protocol", "developers", "download"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || !dotMap[id]) return;
      ScrollTrigger.create({
        trigger: el, start: "top 55%", end: "bottom 45%",
        onToggle: function (st) {
          if (!st.isActive) return;
          document.querySelectorAll("#dots a.on").forEach(function (o) { o.classList.remove("on"); });
          dotMap[id].classList.add("on");
        }
      });
    });

    /* marquee strips skew with scroll velocity */
    var strips = document.querySelectorAll(".strip");
    if (strips.length) {
      var lastY = window.scrollY, skew = 0;
      gsap.ticker.add(function () {
        var y = window.scrollY;
        var v = y - lastY; lastY = y;
        var target = Math.max(-9, Math.min(9, v * 0.32));
        skew += (target - skew) * 0.09;
        if (Math.abs(skew) < 0.02 && Math.abs(target) < 0.02) skew = 0;
        for (var i = 0; i < strips.length; i++) strips[i].style.transform = "skewX(" + skew.toFixed(2) + "deg)";
      });
    }

    /* duotone figures: slow parallax drift */
    document.querySelectorAll(".duo img").forEach(function (img) {
      img.classList.add("plx");
      gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, {
        yPercent: 7, scale: 1.16, ease: "none",
        scrollTrigger: { trigger: img.closest(".duo"), start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* hero depth: content and window drift apart on scroll */
    gsap.to(".hero .wrap", {
      yPercent: -5, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".win-wrap", {
      yPercent: 9, ease: "none",
      scrollTrigger: { trigger: ".win-wrap", start: "top 35%", end: "bottom top", scrub: true }
    });
    gsap.to(".emblem", {
      y: -46, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    /* stat cards: micro stagger pop for the numbers */
    gsap.utils.toArray(".stat .n").forEach(function (n, i) {
      gsap.fromTo(n, { scale: 0.92 }, {
        scale: 1, duration: 0.9, ease: "back.out(2)", delay: i * 0.08,
        scrollTrigger: { trigger: n, start: "top 88%", once: true }
      });
    });
  }

  /* ---------- no-animation fallback: show final stat values ---------- */
  if (REDUCED || !hasGSAP) {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var v = Math.round(parseFloat(el.getAttribute("data-count")) || 0);
      el.textContent = v + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- dev code tabs (works without gsap) ---------- */
  var dtabs = document.querySelectorAll(".dev-tabs button");
  var dpanes = document.querySelectorAll(".dev-pane");
  dtabs.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = parseInt(b.getAttribute("data-pane"), 10);
      dtabs.forEach(function (x, k) { x.classList.toggle("on", k === i); });
      dpanes.forEach(function (p, k) { p.classList.toggle("on", k === i); });
    });
  });

})();

/* ============================================================
   RIBES — v3 interaction layer
   Lifecycle active-state sync, card entrances, background
   image drift, dot-nav auto-hide during the pinned section.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* lifecycle: vertical sequence — line fill + cumulative activation */
  var lcItems = Array.prototype.slice.call(document.querySelectorAll(".lc-item"));
  var lcFill = document.getElementById("lc-line-fill");
  if (REDUCED || !hasGSAP) {
    if (lcFill) lcFill.style.height = "100%";
    lcItems.forEach(function (it) { it.classList.add("on"); });
  }

  if (hasGSAP && !REDUCED) {

    /* the progress line fills as the sequence scrolls past */
    if (lcFill) {
      gsap.fromTo(lcFill, { height: "0%" }, {
        height: "100%", ease: "none",
        scrollTrigger: { trigger: ".lc-flow", start: "top 60%", end: "bottom 60%", scrub: 0.6 }
      });
    }

    /* each state enters, then lights up as the line reaches it */
    lcItems.forEach(function (it) {
      gsap.fromTo(it, { y: 54, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.0, ease: "expo.out",
        scrollTrigger: { trigger: it, start: "top 88%", once: true }
      });
      ScrollTrigger.create({
        trigger: it, start: "top 60%",
        onEnter: function () { it.classList.add("on"); },
        onLeaveBack: function () { it.classList.remove("on"); }
      });
    });

    /* photographic backgrounds: slow drift + zoom */
    document.querySelectorAll(".hero-bg img, .lc-bg img, .cta-bg img").forEach(function (img) {
      var scope = img.closest("section, header") || img.parentElement;
      gsap.fromTo(img, { scale: 1.08, yPercent: -4 }, {
        scale: 1.16, yPercent: 4, ease: "none",
        scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* duotone figures: settle-in scale */
    gsap.utils.toArray(".duo").forEach(function (d) {
      gsap.fromTo(d, { scale: 0.95 }, {
        scale: 1, duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: d, start: "top 85%", once: true }
      });
    });

    /* gentle drift on section heads for depth (skip the pinned one) */
    gsap.utils.toArray(".sec-head").forEach(function (h) {
      if (h.closest("#lifecycle")) return;
      gsap.to(h, {
        yPercent: -3, ease: "none",
        scrollTrigger: { trigger: h, start: "top 80%", end: "bottom top", scrub: true }
      });
    });
  }

})();

/* ============================================================
   RIBES — v4 interaction layer
   Icon stroke draw-in, nav section highlight, chip cascades,
   scroll percent readout, security backdrop drift.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* scroll percent readout (bottom-right) */
  var pctV = document.getElementById("pct-v");
  if (pctV) {
    var updPct = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      pctV.textContent = Math.round((window.scrollY / (h || 1)) * 100);
    };
    window.addEventListener("scroll", updPct, { passive: true });
    updPct();
  }

  if (hasGSAP && !REDUCED) {

    /* feature + security icons: stroke draw-in on first reveal */
    document.querySelectorAll(".f-ic svg, .s-ic svg").forEach(function (svg) {
      var shapes = svg.querySelectorAll("path, rect, circle, polyline, ellipse");
      var ok = [];
      shapes.forEach(function (p) {
        try {
          var L = p.getTotalLength();
          p.style.strokeDasharray = L;
          p.style.strokeDashoffset = L;
          ok.push(p);
        } catch (e) { /* non-geometry shape */ }
      });
      if (!ok.length) return;
      ScrollTrigger.create({
        trigger: svg, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(ok, { strokeDashoffset: 0, duration: 1.3, ease: "power2.out", stagger: 0.12 });
        }
      });
    });

    /* architecture rows: tech chips cascade in */
    gsap.utils.toArray(".arch-row").forEach(function (row) {
      var tags = row.querySelectorAll(".arch-tags span");
      if (!tags.length) return;
      gsap.fromTo(tags, { y: 14, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.07,
        scrollTrigger: { trigger: row, start: "top 82%", once: true }
      });
    });

    /* faq: items cascade */
    gsap.fromTo(".qa", { y: 28, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: ".faq", start: "top 85%", once: true }
    });

    /* risk mitigation chips cascade */
    gsap.utils.toArray(".risk").forEach(function (r) {
      var chips = r.querySelectorAll(".risk-mit span");
      if (!chips.length) return;
      gsap.fromTo(chips, { y: 10, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.05,
        scrollTrigger: { trigger: r, start: "top 78%", once: true }
      });
    });

    /* nav: highlight the section you are in */
    document.querySelectorAll(".nav-l a").forEach(function (a) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: "top 45%", end: "bottom 45%",
        onToggle: function (st) { a.classList.toggle("on", st.isActive); }
      });
    });

    /* photographic section backdrops: slow drift (all of them) */
    document.querySelectorAll(".sec-bg img").forEach(function (im) {
      var sec = im.closest("section");
      gsap.fromTo(im, { scale: 1.06, yPercent: -4 }, {
        scale: 1.14, yPercent: 4, ease: "none",
        scrollTrigger: { trigger: sec || im.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* wall: subtle vertical drift of the whole strip */
    var wall = document.querySelector(".wall");
    if (wall) {
      gsap.fromTo(".wall-track", { y: 18 }, {
        y: -18, ease: "none",
        scrollTrigger: { trigger: wall, start: "top bottom", end: "bottom top", scrub: 1 }
      });
    }
  }

})();

/* ============================================================
   RIBES — v5 interaction layer
   Hardware-gate simulator, Ctrl+K quick-jump palette, copy
   button, OS auto-detect, click ripple, label decode, live term.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- hardware gate simulator (facts from the SDK example:
     vram_min 8192 MB, recommended 12288 MB, cpu_fallback true) ---------- */
  var gv = document.getElementById("gate-vram");
  if (gv) {
    var gb = document.getElementById("gate-gb");
    var verdict = document.getElementById("gate-verdict");
    var vb = verdict.querySelector("b");
    var vs = verdict.querySelector("span");
    var updGate = function () {
      var v = parseInt(gv.value, 10);
      gb.textContent = v;
      gv.style.setProperty("--fill", ((v - 2) / 22 * 100) + "%");
      if (v >= 12) {
        verdict.className = "gate-verdict ok";
        vb.textContent = "FITS";
        vs.textContent = "meets the recommended 12 GB";
      } else if (v >= 8) {
        verdict.className = "gate-verdict warn";
        vb.textContent = "TIGHT";
        vs.textContent = "meets the 8 GB minimum — below recommended";
      } else {
        verdict.className = "gate-verdict cpu";
        vb.textContent = "CPU-FALLBACK";
        vs.textContent = "below the 8 GB minimum — runs on CPU, slowly";
      }
    };
    gv.addEventListener("input", updGate);
    updGate();
  }

  /* ---------- quick-jump palette (Ctrl+K or /) ---------- */
  var palette = document.getElementById("palette");
  if (palette) {
    var palInput = document.getElementById("pal-input");
    var palList = document.getElementById("pal-list");
    var SECTIONS = [
      ["Platform", "#platform"], ["The store", "#models"], ["Architecture", "#architecture"],
      ["Lifecycle", "#lifecycle"], ["How it works", "#how"], ["Local vs cloud", "#compare"],
      ["Bridge protocol", "#protocol"], ["Security", "#security"], ["Engineering honesty", "#honesty"],
      ["Inside the client", "#client"], ["Developers", "#developers"], ["FAQ", "#faq"], ["Download", "#download"]
    ];
    SECTIONS.forEach(function (s) {
      var b = document.createElement("button");
      b.className = "pal-item";
      b.innerHTML = "<span>" + s[0] + "</span><small>" + s[1] + "</small>";
      b.addEventListener("click", function () {
        closePal();
        var el = document.querySelector(s[1]);
        if (el) el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      });
      palList.appendChild(b);
    });
    var openPal = function () {
      palette.classList.add("open");
      palette.setAttribute("aria-hidden", "false");
      palInput.value = "";
      filterPal("");
      setTimeout(function () { palInput.focus(); }, 60);
    };
    var closePal = function () {
      palette.classList.remove("open");
      palette.setAttribute("aria-hidden", "true");
      palInput.blur();
    };
    var filterPal = function (q) {
      q = q.toLowerCase();
      var first = true;
      palList.querySelectorAll(".pal-item").forEach(function (it) {
        var hit = it.textContent.toLowerCase().indexOf(q) !== -1;
        it.classList.toggle("hide", !hit);
        it.classList.toggle("sel", hit && first && q.length > 0);
        if (hit && first) first = false;
      });
    };
    palInput.addEventListener("input", function () { filterPal(palInput.value); });
    palInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var sel = palList.querySelector(".pal-item.sel") || palList.querySelector(".pal-item:not(.hide)");
        if (sel) sel.click();
      }
    });
    var palBtn = document.getElementById("pal-open");
    if (palBtn) palBtn.addEventListener("click", openPal);
    palette.addEventListener("click", function (e) { if (e.target === palette) closePal(); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPal(); }
      else if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); openPal(); }
      else if (e.key === "Escape" && palette.classList.contains("open")) closePal();
    });
  }

  /* ---------- copy the active code pane ---------- */
  var copyBtn = document.getElementById("code-copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var pane = document.querySelector(".dev-pane.on");
      if (!pane || !navigator.clipboard) return;
      navigator.clipboard.writeText(pane.innerText).then(function () {
        copyBtn.textContent = "COPIED";
        copyBtn.classList.add("done");
        setTimeout(function () { copyBtn.textContent = "COPY"; copyBtn.classList.remove("done"); }, 1500);
      });
    });
  }

  /* ---------- download: detect the visitor's OS ---------- */
  (function () {
    var ua = navigator.userAgent;
    var os = /Mac/i.test(ua) ? "mac" : (/Linux/i.test(ua) && !/Android/i.test(ua)) ? "linux" : "win";
    var target = document.querySelector('.dl-card[data-os="' + os + '"]');
    var badge = document.querySelector(".rec");
    /* only the Windows build ships today — never move the badge onto a coming-soon card */
    if (!target || !badge || target.classList.contains("dl-soon") || target.querySelector(".rec")) return;
    document.querySelectorAll(".dl-card.detected").forEach(function (c) { c.classList.remove("detected"); });
    target.classList.add("detected");
    target.insertBefore(badge, target.firstChild);
  })();

  /* coming-soon cards: swallow any residual activation (keyboard etc.) */
  document.querySelectorAll(".dl-soon a").forEach(function (a) {
    a.setAttribute("aria-disabled", "true");
    a.removeAttribute("download");
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---------- click ripple on primary buttons ---------- */
  if (!REDUCED) {
    document.querySelectorAll(".btn, .dl-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        var r = b.getBoundingClientRect();
        var d = Math.max(r.width, r.height);
        var s = document.createElement("span");
        s.className = "ripple";
        s.style.width = s.style.height = d + "px";
        s.style.left = (e.clientX - r.left - d / 2) + "px";
        s.style.top = (e.clientY - r.top - d / 2) + "px";
        b.appendChild(s);
        setTimeout(function () { s.remove(); }, 700);
      });
    });
  }

  /* ---------- eyebrow labels: decode-in effect ---------- */
  if (hasGSAP && !REDUCED) {
    var GLYPHS = "RIBES/01▮·";
    document.querySelectorAll(".eyebrow").forEach(function (e) {
      var node = e.lastChild;
      if (!node || node.nodeType !== 3) return;
      var final = node.textContent;
      ScrollTrigger.create({
        trigger: e, start: "top 90%", once: true,
        onEnter: function () {
          var f = 0, total = Math.max(12, final.length * 2);
          var iv = setInterval(function () {
            f++;
            var out = "";
            for (var i = 0; i < final.length; i++) {
              out += i < (f / total) * final.length ? final[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            node.textContent = out;
            if (f >= total) { node.textContent = final; clearInterval(iv); }
          }, 30);
        }
      });
    });
  }

  /* ---------- terminal: keep the metric line alive after typing ---------- */
  if (!REDUCED) {
    setInterval(function () {
      var tb = document.getElementById("term-body");
      if (!tb || tb.textContent.indexOf("[core] running") === -1) return;
      var caret = tb.querySelector(".term-caret");
      if (!caret) return;
      var v = (38 + Math.random() * 8).toFixed(1);
      var line = tb.querySelector(".t-live-metric");
      if (!line) {
        line = document.createElement("span");
        line.className = "t-live-metric";
        tb.insertBefore(line, caret);
      }
      line.innerHTML = '<span class="t-arr">→ </span>{"jsonrpc":"2.0","method":<span class="t-key">"metric"</span>,"params":{"tokens_per_sec":' + v + "}}\n";
    }, 2600);
  }

})();
