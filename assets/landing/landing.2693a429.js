/* MUSA — landing. Sin dependencias. Todo lo que hace es opcional: sin JS la página se lee entera. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento: no pasa nada */ } }
  };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  // Vuelve a lanzar una animación CSS de un solo uso
  function replay(el, cls) {
    if (reduce || !el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---- Pasión elegida: tiñe la página y sincroniza chips, círculos y explorador
  var chips = $$("#chips .chip");
  var tabs = $$("#passgrid .passcard");
  var panels = $$("#explorer [data-panel]");
  var lines = $$("#lensLines .lens-line");
  var lensWord = $("#lensWord");

  function select(id, focusTab) {
    root.setAttribute("data-p", id);
    chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-p") === id ? "true" : "false"); });
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-p") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
      if (on) replay(t, "pop");
    });
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
    lines.forEach(function (l) {
      var on = l.getAttribute("data-p") === id;
      l.hidden = !on;
      if (on) replay(l, "swap");
    });
    chips.forEach(function (c) { if (c.getAttribute("data-p") === id && lensWord) lensWord.textContent = c.getAttribute("data-word"); });
    replay(lensWord, "swap");
  }
  chips.forEach(function (c) { c.addEventListener("click", function () { select(c.getAttribute("data-p")); }); });
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(t.getAttribute("data-p")); });
    t.addEventListener("keydown", function (e) {
      var n = tabs.length, j = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % n;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j > -1) { e.preventDefault(); select(tabs[j].getAttribute("data-p"), true); }
    });
  });

  // ---- Muestra de voz
  var audio = $("#sample"), btn = $("#playbtn"), icon = $("#playicon"), fill = $("#fill"), voice = $(".voice"), err = $("#audioErr");
  var PLAY = "M8 5v14l11-7z", PAUSE = "M6 5h4v14H6zm8 0h4v14h-4z";
  function ui(playing) {
    icon.setAttribute("d", playing ? PAUSE : PLAY);
    btn.setAttribute("aria-label", btn.getAttribute(playing ? "data-pause" : "data-play"));
    voice.classList.toggle("playing", playing);
  }
  if (audio && btn && icon) {
    btn.addEventListener("click", function () {
      err.hidden = true;
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { err.hidden = false; ui(false); });
      } else { audio.pause(); }
    });
    audio.addEventListener("play", function () { ui(true); });
    audio.addEventListener("pause", function () { ui(false); });
    audio.addEventListener("ended", function () { ui(false); fill.style.width = "0"; });
    audio.addEventListener("error", function () { err.hidden = false; ui(false); });
    audio.addEventListener("timeupdate", function () {
      if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + "%";
    });
  }

  // ---- Menú móvil: se cierra al elegir un enlace o con Escape
  var menu = $("#menu");
  if (menu) {
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; $("summary", menu).focus(); } });
  }

  // ---- Aviso de idioma (sin redirecciones): solo si el navegador está en el otro idioma
  var notice = $("#langNotice");
  if (notice) {
    var target = notice.getAttribute("data-target"), key = notice.getAttribute("data-key");
    // Hispanohablante: español, catalán, gallego o euskera
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]);
    var isEs = function (l) { return /^(es|ca|gl|eu)(-|$)/i.test(String(l)); };
    // página en es: aviso si ninguno es español; página en en: aviso solo si el primero es español
    var show = target === "en" ? !langs.some(isEs) : isEs(langs[0]);
    if (show && !store.get(key)) notice.hidden = false;
    var close = $("#langNoticeClose");
    if (close) close.addEventListener("click", function () { notice.hidden = true; store.set(key, "1"); });
  }

  // ---- Movimiento. Con «reducir movimiento» no se hace nada de esto y la página queda quieta.
  if (!reduce) {
    // Parte un texto en palabras (spans) para animarlas una a una
    var splitWords = function (el, cls) {
      var words = el.textContent.split(" "), out = [];
      el.textContent = "";
      words.forEach(function (w, i) {
        var s = document.createElement("span");
        s.className = cls; s.textContent = w; s.style.setProperty("--i", i);
        el.appendChild(s); out.push(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      return out;
    };

    // Titular palabra a palabra
    var h1 = $(".hero h1");
    if (h1 && !h1.children.length) { splitWords(h1, "w"); h1.classList.add("split"); }

    // Las cifras de la portada cuentan hasta su valor (el lector de pantalla lee el número real)
    var stats = $(".hero-stats");
    if (stats) {
      stats.innerHTML = stats.innerHTML.replace(/\d[\d.,]*\d|\d/g, function (m) {
        return '<span class="sr-only">' + m + '</span><span class="num" aria-hidden="true" data-n="' + m + '">0</span>';
      });
      $$(".num", stats).forEach(function (el) {
        var txt = el.getAttribute("data-n"), sep = (txt.match(/[.,]/) || [""])[0];
        var target = parseInt(txt.replace(/[.,]/g, ""), 10), t0 = null;
        var fmt = function (n) { var v = String(n); return sep ? v.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : v; };
        var step = function (t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 1400);
          el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf(step);
        };
        setTimeout(function () { raf(step); }, 650);
      });
    }

    // Barra de lectura, sombra de la cabecera y la frase de la banda, que se enciende al pasar
    var bar = document.createElement("div");
    bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var header = $("header"), band = $(".band p");
    var bandWords = band ? splitWords(band, "bw") : [];
    var ticking = false;
    var onScroll = function () {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop, max = root.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      if (header) header.classList.toggle("scrolled", y > 40);
      if (bandWords.length) {
        var r = band.getBoundingClientRect(), vh = window.innerHeight;
        var p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (vh * 0.5)));
        bandWords.forEach(function (w, i) { w.style.opacity = Math.max(0.15, Math.min(1, p * bandWords.length - i)); });
      }
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    // Apariciones escalonadas: los hijos de cada grupo entran uno detrás de otro
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          (e.target._kids || [e.target]).forEach(function (k, i) {
            k.style.transitionDelay = (i * 70) + "ms";
            k.classList.add("go");
            setTimeout(function () { k.classList.remove("pre", "go"); k.style.transitionDelay = ""; }, 900 + i * 70);
          });
          if (e.target.parentNode && e.target.parentNode.classList.contains("cta")) e.target.parentNode.classList.add("in");
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      $$(".sec-head, .voice-card, .ways, .versus, .passgrid, .steps, .cards, .city-photos, .citylist, .plans, .faq-list, .cta .wrap").forEach(function (g) {
        g._kids = Array.prototype.slice.call(g.children);
        g._kids.forEach(function (k) { k.classList.add("pre"); });
        io.observe(g);
      });
      $$(".explorer, .local .dropcap, .local .today, .plans-fine").forEach(function (el) { el.classList.add("pre"); io.observe(el); });
    }

    // Tarjetas que siguen al puntero: un foco de luz del color de la pasión y, en las sueltas, una leve inclinación
    if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      $$(".card, .way, .vs, .plan, .today").forEach(function (el) {
        var tilt = !el.classList.contains("way") && !el.classList.contains("vs");   // .ways y .versus recortan lo que sobresale
        el.classList.add("glow");
        if (tilt) el.classList.add("tilt");
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
          if (tilt) {
            el.style.setProperty("--rx", ((x - 0.5) * 5).toFixed(2) + "deg");
            el.style.setProperty("--ry", ((0.5 - y) * 5).toFixed(2) + "deg");
          }
          el.classList.add("hot");
        });
        el.addEventListener("pointerleave", function () {
          el.classList.remove("hot");
          el.style.setProperty("--rx", "0deg");
          el.style.setProperty("--ry", "0deg");
        });
      });
    }
  }
})();
