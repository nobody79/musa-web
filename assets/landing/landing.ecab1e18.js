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
    });
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
    lines.forEach(function (l) { l.hidden = l.getAttribute("data-p") !== id; });
    chips.forEach(function (c) { if (c.getAttribute("data-p") === id && lensWord) lensWord.textContent = c.getAttribute("data-word"); });
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

  // ---- Aparición suave al hacer scroll (solo si el navegador sabe y el usuario no la ha desactivado)
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.05 });
    $$("main > section:not(.hero)").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
