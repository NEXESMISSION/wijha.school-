/* sections3.jsx — Work gallery, Testimonials, FAQ, Final CTA, Footer */

const WORK = [
  { id: "w1", t: "Portfolio personnel", a: "Ahmed", ratio: "3/4", img: "img/work-portfolio.webp" },
  { id: "w2", t: "Site de restaurant", a: "Sara", ratio: "4/3", img: "img/work-restaurant.webp" },
  { id: "w3", t: "Assistant chat IA", a: "Youssef", ratio: "1/1", img: "img/work-aichat.webp" },
  { id: "w4", t: "App de tâches", a: "Amani", ratio: "3/4", img: "img/work-taskapp.webp" },
  { id: "w5", t: "Landing SaaS", a: "Mehdi", ratio: "4/3", img: "img/work-saas.webp" },
  { id: "w6", t: "Dashboard analytics", a: "Oumaima", ratio: "1/1", img: "img/work-dashboard.webp" },
];

function Work() {
  return (
    <section className="section" id="work">
      <div className="wrap">
        <div className="work__head">
          <div>
            <div className="reveal"><Kicker num="05">Réalisé par les étudiants</Kicker></div>
            <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "15ch" }}>
              Ils ont appris. Puis ils ont <span className="italic pop-text">créé.</span>
            </h2>
          </div>
          <p className="lede reveal" data-d="2" style={{ maxWidth: "32ch" }}>
            De vrais projets livrés par de vrais étudiants — la plupart sans aucune expérience avant de commencer.
          </p>
        </div>

        <div className="gallery">
          {WORK.map((w, i) => (
            <div className="work-card reveal" data-d={(i % 3) + 1} key={w.id}>
              <Slot id={w.id} className="ph" style={{ aspectRatio: w.ratio }} src={w.img} placeholder={`Dépose « ${w.t} »`} radius={0} shape="rect" />
              <div className="cap">
                <span className="t">{w.t}</span>
                <span className="a">par {w.a}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { id: "t-ahmed", q: <>Grâce à WIJHA, j'ai créé mon premier site et décroché mes <span className="pop-text">premiers clients en freelance</span> — je ne pensais pas ça possible pour moi.</>, nm: "Ahmed B.", rl: "Développeur freelance" },
    { id: "t-sara", q: "Les sessions sont claires et pratiques. L'accompagnement est incroyable.", nm: "Sara M.", rl: "Étudiante" },
    { id: "t-yssf", q: "En 2 mois, j'ai appris plus qu'en un an en autodidacte.", nm: "Youssef T.", rl: "Entrepreneur" },
  ];
  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <div className="sec-head center reveal">
          <Kicker num="06">Ils nous font confiance</Kicker>
          <h2 className="h2" style={{ marginTop: 16 }}>
            La preuve, dans <span className="pop-text">leurs propres mots.</span>
          </h2>
        </div>

        <div className="tcards">
          {items.map((t, i) => (
            <figure className="tcard reveal" data-d={(i % 3) + 1} key={t.id}>
              <div className="tcard__stars">★★★★★</div>
              <div className="tcard__quote" aria-hidden="true">“</div>
              <blockquote className="tcard__q">{t.q}</blockquote>
              <figcaption className="tcard__who">
                <span className="tcard__av" aria-hidden="true">{t.nm.charAt(0)}</span>
                <div>
                  <div className="nm">{t.nm}</div>
                  <div className="rl">{t.rl}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// La PREUVE : le fondateur a vraiment construit & vendu des produits.
// → remplace les images placeholder par des captures de chaque produit (img/proof-*.png).
const PROOF_PRODUCTS = [
  { name: "TraceMate", tag: "SaaS · application web", desc: "Un vrai SaaS pensé, construit et mis en ligne de A à Z.", badge: "SaaS en ligne", url: "tracemate.art", href: "https://tracemate.art" },
  { name: "Scaniha", tag: "Menus QR · restaurants", desc: "Crée des menus QR pour les restos — déjà adopté par 5 clients payants.", badge: "5 clients payants", url: "scaniha.com", href: "https://scaniha.com" },
  { name: "Kesti Pro", tag: "Système de caisse (POS)", desc: "Un logiciel de caisse complet pour commerces — produit réel, lancé.", badge: "Produit lancé", url: "", href: "" },
  { name: "Agence web", tag: "Sites livrés à des clients", desc: "3 sites livrés à de vrais clients — payés, décrochés 100% en ligne.", badge: "3 clients · payés", url: "", href: "" },
];
const _slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Expert() {
  const tr = useT();
  return (
    <section className="section proof" id="proof">
      <div className="wrap">
        <div className="sec-head center reveal">
          <Kicker num="03">{tr("La preuve, pas des promesses")}</Kicker>
          <h2 className="h2" style={{ marginTop: 16 }}>
            {tr("Ce n'est pas de la théorie.")} <span className="pop-text">{tr("C'est du concret.")}</span>
          </h2>
          <p className="lede" style={{ marginTop: 16, maxWidth: "54ch", marginInline: "auto" }}>
            {tr("WIJHA est enseigné par un fondateur qui construit et vend vraiment. Voici ses produits réels — exactement ce que tu vas apprendre à faire.")}
          </p>
        </div>

        <div className="proof__grid reveal" data-d="1">
          {PROOF_PRODUCTS.map((p) => (
            <article className="proof__card" key={p.name}>
              <div className="proof__ph">
                <Slot id={"proof-" + _slug(p.name)} src="placeholder.svg" placeholder={"Capture de " + p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                <span className="proof__badge">{p.badge}</span>
              </div>
              <div className="proof__meta">
                <b>{p.name}</b>
                {p.url
                  ? <a className="proof__url" href={p.href} target="_blank" rel="noopener">{p.url} →</a>
                  : <span className="proof__tagline">{p.tag}</span>}
              </div>
            </article>
          ))}
        </div>

        <p className="proof__note reveal" data-d="3">
          {tr("👉 Tu apprends avec quelqu'un qui l'a déjà fait — et qui te montre exactement comment refaire pareil.")}
        </p>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Je suis totalement débutant — est-ce pour moi ?", a: "Absolument. Ce parcours est conçu pour les débutants complets : on part de zéro, sans jargon, étape par étape. Pas besoin d'avoir déjà codé ou créé quoi que ce soit." },
  { q: "Pourquoi payer alors que ChatGPT et les tutos YouTube sont gratuits ?", a: "Parce que l'info gratuite est partout — mais éparpillée, contradictoire et sans accompagnement. Ici tu as un chemin clair, en direct, avec un mentor qui répond à TES questions et te corrige en temps réel. Tu repars avec un vrai projet fini, pas 40 onglets ouverts et zéro résultat. Tu paies pour le raccourci et le résultat, pas pour l'information." },
  { q: "L'IA évolue si vite — ce que j'apprends ne sera-t-il pas vite dépassé ?", a: "Non, parce qu'on ne t'apprend pas à cliquer dans un outil précis qui changera demain — on t'apprend à raisonner, construire et t'adapter à n'importe quel outil. Les fondations (structure, design, logique, mise en ligne) restent valables des années, et comme c'est en live, on enseigne toujours les outils du moment, pas une vidéo enregistrée il y a deux ans." },
  { q: "C'est en ligne ou en présentiel ?", a: "100% en ligne, en direct sur Google Meet. Tu reçois la date et l'heure à l'inscription, et tu construis ton projet en live avec nous." },
  { q: "Est-ce que j'obtiens un certificat ?", a: "Oui — tu repars avec un certificat WIJHA et, surtout, un portfolio de vrais projets à montrer à tes clients et employeurs." },
  { q: "Ai-je besoin d'un ordinateur puissant ?", a: "Non. N'importe quel ordinateur portable récent suffit. Les outils qu'on utilise sont surtout en ligne et légers." },
  { q: "Y a-t-il une limite d'âge ?", a: "Aucune. Que tu sois lycéen, étudiant ou en pleine carrière — si tu sais suivre des étapes simples, tu peux le faire." },
  { q: "Combien ça coûte et comment réserver ?", a: "Site Web : 1 session live de 3h — 90 DT en early-bird (10 premières places), 120 DT ensuite. Application Web : 4 sessions live (8h au total, 1 par jour) — 350 DT en pré-inscription, 700 DT au lancement. 20 places max. Tu réserves en 2 minutes, puis tu confirmes ta place par paiement (D17 / Flouci / international)." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  const tr = useT();
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="faq">
          <div className="reveal">
            <Kicker num="03">{tr("Questions")}</Kicker>
            <h2 className="h2" style={{ marginTop: 22 }}>
              {tr("Tout ce que tu dois savoir.")}
            </h2>
          </div>
          <div className="faq__list reveal" data-d="1">
            {FAQS.map((f, i) => (
              <div className={`faq__item ${open === i ? "open" : ""}`} key={i}>
                <button className="faq__q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                  {tr(f.q)}
                  <span className="ic">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                  </span>
                </button>
                <div className="faq__a" style={{ maxHeight: open === i ? 360 : 0 }}>
                  <div className="faq__a-inner">{tr(f.a)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const tr = useT();
  const meta = [
    { ic: "M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01", t: "À partir de 90 DT" },
    { ic: "M16 4h4v16H4V4h4M9 2h6v4H9z", t: "20 places par session" },
    { ic: "M8 2v4M16 2v4M3 10h18M5 6h14v14H5z", t: "Sessions live · Google Meet" },
  ];
  return (
    <section className="section final" id="reserve">
      <div className="wrap">
        <div className="final__card reveal">
          <div className="glow" />
          <div>
            <h2 className="h2">
              {tr("Prêt à")} <span className="italic">{tr("commencer ?")}</span>
            </h2>
            <p className="lede" style={{ marginTop: 18 }}>
              {tr("Choisis ta formation. Repars avec un vrai projet.")}
            </p>
            <div className="final__meta">
              {meta.map((m) => (
                <span className="m" key={m.t}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={m.ic} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {tr(m.t)}
                </span>
              ))}
            </div>
          </div>
          <div className="final__cta">
            <Btn variant="paper" href="static-web-apps.html#reserver" arrow>{tr("Site Web · 90 DT")}</Btn>
            <Btn variant="paper" href="web-apps.html#reserver" arrow>{tr("Application Web · pré-inscription")}</Btn>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, opacity: .8 }}>{tr("Aucune expérience requise · tout âge")}</span>
          </div>
        </div>

        <div className="pay-methods pay-methods--center reveal" data-d="2">
          <span className="pay-methods__label">{tr("💳 Paiement accepté")}</span>
          <div className="pay-methods__logos">
            <span className="pay-logo"><img src="img/pay-visa.svg" alt="Visa" /></span>
            <span className="pay-logo"><img src="img/pay-mastercard.svg" alt="Mastercard" /></span>
            <span className="pay-logo"><img src="img/pay-d17.svg" alt="D17" /></span>
            <span className="pay-logo"><img src="img/pay-flouci.svg" alt="Flouci" /></span>
            <span className="pay-logo"><img src="img/pay-btl.svg" alt="Banque BTL" /></span>
            <span className="pay-logo"><img src="img/pay-bte.svg" alt="Banque BTE" /></span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const tr = useT();
  const cols = [
    { h: "Explorer", links: [["Les formations", "#tracks"], ["FAQ", "#faq"], ["Réserver", "#reserve"]] },
    { h: "Formations", links: [["Site Web — 90 DT", "static-web-apps.html"], ["Application Web — 350 DT", "web-apps.html"]] },
    { h: "Contact", links: [
      ["Instagram", "https://www.instagram.com/wijha.academy/"],
      ["Facebook", "https://www.facebook.com/profile.php?id=61583639767223"],
      ["Email", "mailto:nexesmission@gmail.com"],
    ] },
  ];
  const socials = [
    { d: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm5.5-.5h.01", href: "https://www.instagram.com/wijha.academy/", label: "Instagram" },
    { d: "M14 9h3l.4-3H14V4.3c0-.9.25-1.4 1.5-1.4H17.5V.3C17.1.2 16 .1 14.9.1 12.4.1 11 1.6 11 4.1V6H8v3h3v9h3V9Z", href: "https://www.facebook.com/profile.php?id=61583639767223", label: "Facebook" },
    { d: "M22 6 12 13 2 6M2 6h20v12H2z", href: "mailto:nexesmission@gmail.com", label: "Email" },
  ];
  return (
    <footer className="footer">
      <hr className="divider" />
      <div className="wrap">
        <div className="footer__grid" style={{ marginTop: 56 }}>
          <div>
            <a className="brand" href="#top">
              <img className="brand__mark" src="logo.png" alt="WIJHA Academy" />
              <span><span className="brand__name">WIJHA</span><span className="brand__sub" style={{ display: "block" }}>Academy</span></span>
            </a>
            <p className="muted" style={{ marginTop: 20, maxWidth: "30ch", fontSize: 15.5 }}>
              {tr("Apprendre. Créer. Évoluer.")}
            </p>
            <div className="footer__socials" style={{ marginTop: 22 }}>
              {socials.map((s, i) => (
                <a href={s.href} key={i} aria-label={s.label || "réseau social"}
                   {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={s.d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h5>{tr(c.h)}</h5>
              {c.links.map(([l, href]) => (
                <a className="fl" href={href} key={l}
                   {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>{tr(l)}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <span>{tr("© 2026 WIJHA Academy — Tous droits réservés.")}</span>
          <span className="footer__legal">
            <a href="confidentialite.html">Confidentialité</a>
            <a href="conditions.html">Conditions</a>
          </span>
          <span style={{ fontFamily: "var(--mono)", letterSpacing: ".04em" }}>{tr("Apprendre · Créer · Évoluer")}</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Work, Testimonials, Expert, FAQ, FinalCTA, Footer });
