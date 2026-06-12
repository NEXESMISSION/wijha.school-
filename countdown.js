/* countdown.js — compte à rebours vers la session live.
   Usage : <div data-countdown="2026-06-26T17:00:00+01:00" data-countdown-label="Le live commence dans"></div>
   Variante compacte (carte bleue) : ajouter class="cdown--sm" sur le conteneur. */
(function () {
  var UNITS = [
    ["j", "Jours"],
    ["h", "Heures"],
    ["m", "Min"],
    ["s", "Sec"],
  ];

  function build(el) {
    if (el.dataset.cdownReady) return; // idempotent (React peut re-déclencher init)
    el.dataset.cdownReady = "1";
    var target = new Date(el.getAttribute("data-countdown")).getTime();
    if (!isFinite(target)) return;
    var label = el.getAttribute("data-countdown-label") || "Le live commence dans";

    el.classList.add("cdown");
    el.innerHTML =
      '<div class="cdown__head"><span class="cdown__dot"></span>' + label + "</div>" +
      '<div class="cdown__units">' +
      UNITS.map(function (u) {
        return (
          '<div class="cdown__unit" data-u="' + u[0] + '">' +
            '<span class="cdown__num">--</span>' +
            '<span class="cdown__lbl">' + u[1] + "</span>" +
          "</div>"
        );
      }).join('<span class="cdown__sep" aria-hidden="true">:</span>') +
      "</div>";

    var nums = {};
    el.querySelectorAll(".cdown__unit").forEach(function (unit) {
      nums[unit.getAttribute("data-u")] = unit.querySelector(".cdown__num");
    });

    var prev = {};
    function set(key, val) {
      var txt = String(val).padStart(2, "0");
      if (prev[key] === txt) return;
      prev[key] = txt;
      var n = nums[key];
      n.textContent = txt;
      // glissement doux à chaque changement de valeur
      n.classList.remove("tick");
      void n.offsetWidth;
      n.classList.add("tick");
    }

    function render() {
      var left = target - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        el.classList.add("cdown--live");
        el.innerHTML =
          '<div class="cdown__live"><span class="cdown__dot"></span> La session est en cours — la prochaine date arrive bientôt.</div>';
        return;
      }
      var s = Math.floor(left / 1000);
      set("j", Math.floor(s / 86400));
      set("h", Math.floor((s % 86400) / 3600));
      set("m", Math.floor((s % 3600) / 60));
      set("s", s % 60);
    }

    var timer = setInterval(render, 1000);
    render();
  }

  function init() {
    document.querySelectorAll("[data-countdown]").forEach(build);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Les pages React (accueil) rendent leur contenu APRÈS le chargement :
  // on observe le DOM et on initialise les compteurs ajoutés plus tard.
  window.initCountdowns = init;
  new MutationObserver(init).observe(document.documentElement, { childList: true, subtree: true });
})();
