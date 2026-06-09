/* analytics.js — WIJHA first-party analytics + survey (sans dépendance, respectueux).
   Capture : page vue, source/référent, UTM, type d'appareil, OS, navigateur, écran,
   langue, fuseau, et TEMPS PASSÉ (temps actif) par visiteur/session.
   Envoi : POST vers /api/track (production, voir ANALYTICS-SETUP.md) ET copie locale
   dans localStorage pour que /admin-me fonctionne tout de suite (mode démo).
   Sondage : petite carte après ~12 s (comment nous as-tu trouvés + intérêts). */
(function () {
  var ENDPOINT = "/api/track";
  var LS_EVENTS = "wijha_events";       // miroir local (démo /admin-me)
  var VID_KEY = "wijha_vid";
  var SURVEY_DONE = "wijha_survey_done";

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function qp(n) { try { return new URLSearchParams(location.search).get(n) || ""; } catch (e) { return ""; } }

  /* ---- visiteur (anonyme, 1er-party) ---- */
  var visitorId = localStorage.getItem(VID_KEY);
  var isNew = false;
  if (!visitorId) { visitorId = uid(); try { localStorage.setItem(VID_KEY, visitorId); } catch (e) {} isNew = true; }
  var sessionId = uid();

  /* ---- source / référent ---- */
  function sourceFromRef(ref) {
    if (!ref) return "Direct";
    try {
      var h = new URL(ref).hostname.replace(/^www\./, "");
      if (h && location.hostname.indexOf(h) > -1) return "Interne";
      var map = { google: "Google", bing: "Bing", "duckduckgo": "DuckDuckGo",
        instagram: "Instagram", facebook: "Facebook", fb: "Facebook",
        tiktok: "TikTok", youtube: "YouTube", "t.co": "Twitter/X", twitter: "Twitter/X", "x.com": "Twitter/X",
        linkedin: "LinkedIn", whatsapp: "WhatsApp", "t.me": "Telegram", reddit: "Reddit", snapchat: "Snapchat" };
      for (var k in map) { if (h.indexOf(k) > -1) return map[k]; }
      return h;
    } catch (e) { return "Autre"; }
  }

  /* ---- appareil / OS / navigateur ---- */
  function detect() {
    var u = navigator.userAgent;
    var os = /Windows/.test(u) ? "Windows" : (/Mac OS X|Macintosh/.test(u) ? "macOS" :
      /Android/.test(u) ? "Android" : /iPhone|iPad|iPod/.test(u) ? "iOS" : /Linux/.test(u) ? "Linux" : "Autre");
    var br = /Edg\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /SamsungBrowser/.test(u) ? "Samsung" :
      /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "Autre";
    var dev = /Mobi|Android|iPhone|iPod/.test(u) ? "Mobile" : (/iPad|Tablet/.test(u) ? "Tablette" : "Ordinateur");
    return { os: os, browser: br, device: dev };
  }
  var det = detect();

  var base = {
    vid: visitorId, sid: sessionId, isNew: isNew,
    page: (location.pathname.split("/").pop() || "index.html"),
    ref: document.referrer || "",
    source: qp("utm_source") || sourceFromRef(document.referrer),
    utm_source: qp("utm_source"), utm_medium: qp("utm_medium"), utm_campaign: qp("utm_campaign"),
    device: det.device, os: det.os, browser: det.browser,
    screen: (screen.width + "x" + screen.height),
    viewport: (window.innerWidth + "x" + window.innerHeight),
    lang: navigator.language || "",
    tz: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ""; } })()
  };

  function saveLocal(ev) {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_EVENTS) || "[]");
      arr.push(ev); if (arr.length > 3000) arr = arr.slice(-3000);
      localStorage.setItem(LS_EVENTS, JSON.stringify(arr));
    } catch (e) {}
  }
  function send(type, extra) {
    var ev = Object.assign({ type: type, ts: new Date().toISOString() }, base, extra || {});
    saveLocal(ev);
    try {
      var body = JSON.stringify(ev);
      if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      else fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  /* ---- page vue ---- */
  send("pageview");

  /* ---- temps passé (actif) ---- */
  var active = 0, last = Date.now(), visible = !document.hidden;
  function tick() { if (visible) active += Date.now() - last; last = Date.now(); }
  document.addEventListener("visibilitychange", function () { tick(); visible = !document.hidden; last = Date.now(); });
  var beat = setInterval(function () { tick(); send("ping", { active: Math.round(active / 1000) }); }, 15000);
  function finalize() {
    tick(); clearInterval(beat);
    var ev = Object.assign({ type: "duration", ts: new Date().toISOString(), active: Math.round(active / 1000) }, base);
    saveLocal(ev);
    try { navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(ev)], { type: "application/json" })); } catch (e) {}
  }
  window.addEventListener("pagehide", finalize);
  window.addEventListener("beforeunload", finalize);

  /* ====================== SONDAGE (après ~12 s) ====================== */
  var QUESTIONS = [
    { key: "source", q: "Comment nous as-tu trouvés ?", opts: ["Instagram", "Facebook", "TikTok", "Google", "Un ami", "Autre"] },
    { key: "interet", q: "Qu'est-ce qui t'intéresse le plus ?", opts: ["Créer un site web", "Créer une app", "Gagner en ligne", "Apprendre l'IA"] },
    { key: "profil", q: "Tu es plutôt…", opts: ["Étudiant(e)", "Lycéen(ne)", "Parent", "Pro / freelance", "Autre"] }
  ];
  function showSurvey() {
    if (document.getElementById("wsurvey")) return;
    var answers = {};
    var wrap = document.createElement("div");
    wrap.id = "wsurvey"; wrap.className = "wsurvey";
    var groups = QUESTIONS.map(function (g) {
      return '<div class="wsurvey__q"><p>' + g.q + '</p><div class="wsurvey__opts" data-key="' + g.key + '">' +
        g.opts.map(function (o) { return '<button type="button" class="wsurvey__opt" data-v="' + o.replace(/"/g, "&quot;") + '">' + o + '</button>'; }).join("") +
        '</div></div>';
    }).join("");
    wrap.innerHTML =
      '<div class="wsurvey__card">' +
        '<button class="wsurvey__close" aria-label="Fermer">&times;</button>' +
        '<div class="wsurvey__head"><b>Aide-nous en 5 secondes 🙏</b><span>3 petites questions, anonymes.</span></div>' +
        groups +
        '<button class="wsurvey__send btn btn--pop" disabled>Envoyer</button>' +
        '<div class="wsurvey__ok">Merci ! 🎉</div>' +
      '</div>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add("in"); });

    var sendBtn = wrap.querySelector(".wsurvey__send");
    function refresh() { sendBtn.disabled = Object.keys(answers).length < QUESTIONS.length; }
    wrap.querySelectorAll(".wsurvey__opts").forEach(function (grp) {
      grp.addEventListener("click", function (e) {
        var b = e.target.closest(".wsurvey__opt"); if (!b) return;
        grp.querySelectorAll(".wsurvey__opt").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); answers[grp.getAttribute("data-key")] = b.getAttribute("data-v"); refresh();
      });
    });
    function done() { try { localStorage.setItem(SURVEY_DONE, "1"); } catch (e) {} }
    function close() { wrap.classList.remove("in"); setTimeout(function () { wrap.remove(); }, 300); }
    wrap.querySelector(".wsurvey__close").addEventListener("click", function () { done(); close(); });
    sendBtn.addEventListener("click", function () {
      if (sendBtn.disabled) return;
      send("survey", { survey: answers });
      done();
      wrap.querySelector(".wsurvey__card").classList.add("sent");
      setTimeout(close, 1400);
    });
  }
  if (!localStorage.getItem(SURVEY_DONE)) setTimeout(showSurvey, 12000);
})();
