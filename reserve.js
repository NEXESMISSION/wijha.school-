/* reserve.js — réservations WIJHA → enregistrées sur le serveur (table Supabase),
   visibles dans /admin (onglet Réservations), reçu de paiement inclus.
   → Guide : ADMIN-SETUP.md
*/
(function () {
  var CONFIG = {
    // [PROD] URL de la fonction qui enregistre la réservation côté serveur.
    endpoint: "/api/reserve",

    // [FALLBACK] si l'envoi échoue, on propose WhatsApp (sinon email).
    whatsapp: "",                       // [placeholder] n° international SANS + , ex "21612345678"
    email: "nexesmission@gmail.com",

    // [PAIEMENT] pour confirmer la place APRÈS la réservation (anti no-show).
    //   Remplis ce que tu utilises ; laisse "" pour masquer. Si tout est vide,
    //   on dit simplement « on t'envoie le lien de paiement tout de suite ».
    pay: {
      d17: "",        // [placeholder] ton numéro D17 / e-Dinar, ex "22 333 444"
      flouci: "",     // [placeholder] ton lien Flouci, ex "https://flouci.com/..."
      konnect: "",    // [placeholder] ton lien Konnect, ex "https://konnect.network/..."
      note: "Ta place est gardée 24h et confirmée dès réception du paiement.",
    },

  };

  var IS_LOCAL = ["localhost", "127.0.0.1", "0.0.0.0", ""].indexOf(location.hostname) !== -1;

  function payloadFrom(form) {
    return {
      formation: form.getAttribute("data-formation") || "Formation WIJHA",
      amount: (form.getAttribute("data-amount") || "").trim(),  // "" = pré-inscription (sans paiement)
      nom: ((form.nom && form.nom.value) || "").trim(),
      email: ((form.email && form.email.value) || "").trim(),
      tel: ((form.tel && form.tel.value) || "").trim(),
      company: ((form.company && form.company.value) || "").trim(), // honeypot anti-spam
      page: location.pathname.split("/").pop() || location.href,
      ts: new Date().toISOString(),
    };
  }

  // Production : navigateur → fonction serverless → enregistrée en base (visible dans /admin).
  function sendEndpoint(p) {
    return fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then(function (r) { if (!r.ok) throw new Error("endpoint " + r.status); return true; });
  }

  // Lit l'image du reçu et la réduit (≤1280px, JPEG) pour un envoi léger → dataURL.
  function readDataUrl(file) {
    return new Promise(function (resolve) {
      if (!file) return resolve("");
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1280, w = img.width, h = img.height;
        if (Math.max(w, h) > max) { var s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        try { resolve(c.toDataURL("image/jpeg", 0.82)); } catch (e) { resolve(""); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(""); };
      img.src = url;
    });
  }

  function send(p, file) {
    if (CONFIG.endpoint) {
      // le reçu (image réduite en base64) part dans le JSON → enregistré avec la réservation
      return (file ? readDataUrl(file) : Promise.resolve("")).then(function (dataUrl) {
        if (dataUrl) p.recu = dataUrl;
        return sendEndpoint(p);
      });
    }
    return Promise.reject(new Error("no-transport"));
  }

  function fallbackUrl(p) {
    var msg = "Bonjour WIJHA 👋\nJe veux réserver : " + p.formation +
      "\n\nNom : " + p.nom + "\nEmail : " + p.email + "\nWhatsApp : " + p.tel;
    if (CONFIG.whatsapp) return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
    return "mailto:" + CONFIG.email +
      "?subject=" + encodeURIComponent("Réservation — " + p.formation) +
      "&body=" + encodeURIComponent(msg);
  }

  /* ---- UI helpers ---- */
  function setLoading(btn, on, original) {
    if (!btn) return;
    if (on) { btn.disabled = true; btn.dataset.t = btn.innerHTML; btn.innerHTML = "Envoi en cours…"; btn.style.opacity = ".7"; }
    else { btn.disabled = false; btn.innerHTML = original || btn.dataset.t || btn.innerHTML; btn.style.opacity = ""; }
  }
  function hide(ok) { if (ok) { ok.style.display = "none"; ok.classList.remove("is-err"); } }
  function showOk(ok, text) { if (!ok) return; ok.classList.remove("is-err"); ok.textContent = text; ok.style.display = "block"; }
  function showErr(ok, p) {
    if (!ok) return;
    ok.classList.add("is-err");
    ok.textContent = "Oups, l'envoi a échoué. ";
    var a = document.createElement("a");
    a.href = fallbackUrl(p); a.target = "_blank"; a.rel = "noopener";
    a.textContent = CONFIG.whatsapp ? "Réserver via WhatsApp →" : "Réserver par email →";
    ok.appendChild(a);
    ok.style.display = "block";
  }

  // Bloc « paiement pour confirmer » (anti no-show). Renvoie du HTML (ou "").
  function payBlockHtml(amount) {
    if (!amount) return "";
    var P = CONFIG.pay || {};
    var rows = "";
    if (P.flouci)  rows += '<a class="rpay__m" href="' + P.flouci + '" target="_blank" rel="noopener">💳 Payer avec Flouci →</a>';
    if (P.konnect) rows += '<a class="rpay__m" href="' + P.konnect + '" target="_blank" rel="noopener">💳 Payer avec Konnect →</a>';
    if (P.d17)     rows += '<div class="rpay__m rpay__m--info">📲 D17 / e-Dinar : <b>' + P.d17 + '</b></div>';
    var body = rows
      ? '<div class="rpay__methods">' + rows + '</div>'
      : '<p class="rpay__soon">On t\'envoie le lien de paiement tout de suite sur WhatsApp. 📲</p>';
    return (
      '<div class="rpay">' +
        '<div class="rpay__amt">Pour confirmer ta place : <b>' + amount + ' DT</b></div>' +
        body +
        (P.note ? '<p class="rpay__note">' + P.note + '</p>' : '') +
      '</div>'
    );
  }

  // Popup de confirmation (modal centré, fermable au clic / Échap).
  // extraHtml (optionnel) = bloc inséré avant le bouton (ex : instructions de paiement).
  function showPopup(title, message, extraHtml) {
    var prev = document.getElementById("reserve-modal");
    if (prev) prev.remove();

    var modal = document.createElement("div");
    modal.id = "reserve-modal";
    modal.className = "rmodal";
    modal.innerHTML =
      '<div class="rmodal__scrim"></div>' +
      '<div class="rmodal__card" role="dialog" aria-modal="true" aria-live="polite">' +
        '<button class="rmodal__close" aria-label="Fermer">&times;</button>' +
        '<div class="rmodal__check">' +
          '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17.5 19.5 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<h3 class="rmodal__title"></h3>' +
        '<p class="rmodal__msg"></p>' +
        '<div class="rmodal__extra"></div>' +
        '<button class="btn btn--pop rmodal__ok">Parfait&nbsp;→</button>' +
      '</div>';
    modal.querySelector(".rmodal__title").textContent = title;
    modal.querySelector(".rmodal__msg").textContent = message;
    modal.querySelector(".rmodal__extra").innerHTML = extraHtml || "";
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    void modal.offsetWidth;            // force un reflow → la transition d'entrée se joue de façon fiable
    modal.classList.add("in");

    function close() {
      modal.classList.remove("in");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { if (modal.parentNode) modal.remove(); }, 260);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    modal.querySelector(".rmodal__scrim").addEventListener("click", close);
    modal.querySelector(".rmodal__close").addEventListener("click", close);
    modal.querySelector(".rmodal__ok").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    modal.querySelector(".rmodal__ok").focus();
  }

  function handle(form) {
    var btn = form.querySelector("button[type=submit]");
    var ok = form.querySelector(".reserve__ok");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = payloadFrom(form);
      var file = (form.recu && form.recu.files && form.recu.files[0]) || null;

      // honeypot : un bot a rempli le champ caché → on ignore en silence.
      if (p.company) { showOk(ok, "Merci !"); form.reset(); return; }

      setLoading(btn, true);
      hide(ok);

      send(p, file).then(function () {
        setLoading(btn, false);
        hide(ok);
        if (p.amount) {
          // Réservation payante → étape de paiement pour confirmer la place (anti no-show).
          showPopup("Presque fini, " + (p.nom || "") + " ! 🎉",
            "Ta place est réservée. Dernière étape : règle le paiement pour la confirmer.",
            payBlockHtml(p.amount));
        } else {
          // Pré-inscription (sans paiement maintenant).
          showPopup("Merci " + (p.nom || "") + " ! 🎉", "Ta pré-inscription est bien reçue — on te prévient dès l'ouverture, avec ton tarif bloqué.");
        }
        form.reset();
        var rfi = form.querySelector("input[type=file]"); if (rfi) syncFilebox(rfi);
      }).catch(function (err) {
        setLoading(btn, false);
        if (IS_LOCAL) {
          // Aucun transport configuré en local : on montre quand même le flux (aperçu).
          console.warn("[WIJHA reserve] Serveur non configuré — aperçu local (mode démo). Détail :", err && err.message);
          hide(ok);
          showPopup("Réservation envoyée ✅",
            p.amount ? "(Aperçu local) Étape de paiement ci-dessous — configure Supabase pour enregistrer la demande (ADMIN-SETUP.md)." : "(Aperçu local) Configure Supabase pour l'enregistrer pour de vrai — voir ADMIN-SETUP.md.",
            payBlockHtml(p.amount));
          form.reset();
        } else {
          showErr(ok, p);
        }
      });
    });
  }

  // Affiche le nom du fichier reçu choisi (et l'état "rempli" de la zone d'upload).
  function syncFilebox(inp) {
    var box = inp.closest(".filebox"); if (!box) return;
    var ph = box.querySelector(".filebox__ph"); if (!ph) return;
    if (inp.files && inp.files[0]) { ph.textContent = "✅ " + inp.files[0].name; box.classList.add("has"); }
    else { ph.textContent = ph.getAttribute("data-default") || "📎 Ajoute ta capture"; box.classList.remove("has"); }
  }
  document.querySelectorAll(".reserve__form input[type=file]").forEach(function (inp) {
    inp.addEventListener("change", function () { syncFilebox(inp); });
  });

  document.querySelectorAll("form.reserve__form").forEach(handle);
})();
