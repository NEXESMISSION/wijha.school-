/* sections2.jsx — How we teach, Roadmap, Tracks */

function HowWeTeach() {
  const principles = [
    { n: "01", t: "Apprendre en créant", d: "Tu livres quelque chose de réel dès la première semaine. Pas de théorie poussiéreuse — juste des projets dont tu es fier.", icon: "M4 17l5-5-5-5M11 17h6" },
    { n: "02", t: "En live, jamais seul", d: "Des sessions live chaque semaine avec un mentor qui a lancé de vrais produits et décroché de vrais clients.", icon: "M3 11l9-7 9 7M5 10v8h14v-8" },
    { n: "03", t: "Que l'essentiel", d: "On coupe le superflu et on enseigne le chemin le plus simple vers les résultats — la stack exacte des pros.", icon: "M5 12l4 4 10-10" },
  ];
  return (
    <section className="section" id="method">
      <div className="wrap">
        <div className="teach__head">
          <div>
            <div className="reveal"><Kicker num="02">Notre méthode</Kicker></div>
            <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "14ch" }}>
              L'essentiel, de la manière la plus <span className="italic pop-text">simple</span>.
            </h2>
          </div>
          <p className="lede reveal" data-d="2">
            Pas de blabla, pas de surcharge. On te donne le chemin le plus court entre
            « je n'ai jamais fait ça » et « je viens de le lancer ».
          </p>
        </div>
        <div className="principles">
          {principles.map((p, i) => (
            <div className="principle reveal" data-d={i + 1} key={p.n}>
              <div className="principle__num">{p.n}</div>
              <div className="principle__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d={p.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROAD = [
  {
    n: "01", title: "Partir de zéro", sub: "Sans code. Sans peur.",
    h: "Aucune expérience ? Parfait.",
    p: "On commence tout au début. Pas de jargon, pas de barrières — juste des étapes claires que tout le monde peut suivre, quel que soit ton âge.",
    tags: ["État d'esprit", "Tes premiers outils", "L'IA comme coéquipier"],
    slot: "road-1", img: "img/road-1.webp",
  },
  {
    n: "02", title: "Bâtir les fondations", sub: "Les bases, rendues simples.",
    h: "Apprends les essentiels vite.",
    p: "La poignée de concepts qui comptent vraiment — structure, design, logique — enseignés de la manière la plus simple et renforcés par la pratique.",
    tags: ["Bases du web", "Sens du design", "Travailler avec l'IA"],
    slot: "road-2", img: "img/road-2.webp",
  },
  {
    n: "03", title: "Créer de vrais projets", sub: "Ton portfolio, en ligne.",
    h: "Crée des choses utilisables.",
    p: "Chaque semaine, tu livres. À la fin, tu as un portfolio de vrais projets aboutis — pas des exercices, mais des produits.",
    tags: ["Vrais projets", "Portfolio", "Retours réguliers"],
    slot: "road-3", img: "img/road-3.webp",
  },
  {
    n: "04", title: "Mettre en ligne", sub: "Déploiement. Domaine. Finitions.",
    h: "Du local au monde entier.",
    p: "Publie pour le monde : déploie, connecte un domaine, rends le site rapide et beau. La finition 100% professionnelle.",
    tags: ["Vercel", "GitHub", "Hébergement", "Performance"],
    slot: "road-4", img: "img/road-4.webp",
  },
  {
    n: "05", title: "Décrocher tes clients", sub: "Convaincre. Tarifer. Livrer.",
    h: "Transforme tes compétences en revenus.",
    p: "Comment trouver des missions, bien les tarifer, accepter les paiements partout dans le monde, et livrer comme un pro. D'apprenant à freelance.",
    tags: ["Prospection", "Tarification", "Dodo Payments", "Livraison"],
    slot: "road-5", img: "img/road-5.webp",
  },
];

function Roadmap() {
  const [active, setActive] = useState(0);
  const step = ROAD[active];
  return (
    <section className="section" id="roadmap">
      <div className="wrap">
        <div className="roadmap">
          <div className="glow" style={{ width: 520, height: 520, top: -160, right: -120, opacity: .55 }} />
          <div className="roadmap__inner">
            <div className="reveal"><Kicker num="03">Le parcours</Kicker></div>
            <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "16ch" }}>
              De <span className="italic">zéro</span> à la gestion de <span className="italic pop-text">vrais clients.</span>
            </h2>

            <div className="road__layout">
              <div className="road__steps reveal" data-d="1">
                {ROAD.map((s, i) => (
                  <button
                    key={s.n}
                    className={`road__step ${i === active ? "active" : ""}`}
                    onClick={() => setActive(i)}
                  >
                    <span className="road__dot">{s.n}</span>
                    <span>
                      <h4>{s.title}</h4>
                      <p className="sub">{s.sub}</p>
                    </span>
                  </button>
                ))}
                <div className="road__age">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Aucune limite d'âge · aucun prérequis
                </div>
              </div>

              <div className="road__panel reveal" data-d="2">
                <div className="road__media">
                  <Slot id={step.slot} src={step.img} placeholder={`Dépose un visuel pour « ${step.title} »`} key={step.slot} />
                </div>
                <div className="road__detail">
                  <h3>{step.h}</h3>
                  <p>{step.p}</p>
                  <div className="road__tags">
                    {step.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const TRACKS = [
  {
    key: "static",
    name: "Site Web",
    badge: "Niveau 1 · débutant",
    title: "Des sites web modernes, sans backend.",
    price: "90",
    oldPrice: "120", // prix standard barré (90 = tarif early-bird)
    per: "/ formation",
    chip: "🐦 90 DT · 10 premières places",
    metaLine: "🔴 En live · 26 juin, 17h-20h · 🎟️ 20 places",
    countdown: "2026-06-26T17:00:00+01:00",
    reassure: "Sans code · paiement à la réservation",
    cta: "Réserver ma place",
    ctaHref: "static-web-apps.html",
    ribbon: "★ Commence ici",
    page: "static-web-apps.html",
    meta: [
      { ic: "🔴", t: "Live · Google Meet" },
      { ic: "⏱️", t: "3h en direct" },
      { ic: "📅", t: "Prochaine session : 26 juin, 17h-20h" },
      { ic: "🎟️", t: "20 places" },
    ],
    outcomes: [
      "Des sites rapides, avec l'IA",
      "Design moderne, mobile-first",
      "En ligne, avec ton domaine",
    ],
    stack: ["HTML · CSS · JS", "Tailwind", "Figma", "GitHub", "Vercel", "Assistance IA"],
    iconPaths: ["M3 5h18v14H3z", "M3 9h18", "M6.5 7h.01"],
  },
  {
    key: "apps",
    name: "Application Web",
    badge: "Niveau 2 · avancé",
    title: "De vraies apps — base de données & paiements.",
    price: "350",
    oldPrice: "700", // prix réel après lancement (350 = tarif pré-inscription, 1ères places)
    per: "/ pré-inscription",
    chip: "🎟️ Pré-inscription · prix réel 700 DT",
    metaLine: "🎓 4 sessions live · 8h · après Site Web",
    reassure: "Aucun paiement maintenant · garde ta place",
    cta: "Je me pré-inscris",
    ctaHref: "web-apps.html",
    softtag: "🚧 En préparation",
    soon: true,      // formation en préparation → on ouvre la pré-inscription
    page: "web-apps.html",
    meta: [
      { ic: "🔴", t: "Live · Google Meet" },
      { ic: "⏱️", t: "Sessions en direct" },
      { ic: "📅", t: "Prochaine date : bientôt annoncée" },
      { ic: "🎟️", t: "20 places" },
    ],
    outcomes: [
      "Apps complètes (front + back) avec l'IA",
      "Base de données, comptes & APIs",
      "Encaisse des paiements (Dodo Payments)",
    ],
    stack: ["React / Next.js", "Supabase", "Vercel", "Cloudflare", "GitHub", "Dodo Payments"],
    iconPaths: ["M12 2 2 7l10 5 10-5-10-5Z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  },
];

function Tracks() {
  const tr = useT();
  return (
    <section className="section" id="tracks">
      <div className="wrap">
        <div className="sec-head center reveal">
          <Kicker num="01">{tr("Les formations")}</Kicker>
          <h2 className="h2" style={{ marginTop: 16 }}>
            {tr("Deux niveaux.")} <span className="pop-text">{tr("Choisis le tien.")}</span>
          </h2>
        </div>

        <div className="offers reveal" data-d="1">
          {TRACKS.map((t) => {
            const primary = !t.soon;
            return (
              <article className={`offer ${primary ? "offer--primary" : "offer--soon"}`} key={t.key}>
                {primary
                  ? <span className="offer__ribbon">{tr(t.ribbon)}</span>
                  : <span className="offer__softtag">{tr(t.softtag)}</span>}

                <header className="offer__head">
                  <span className="offer__level">{tr(t.badge)}</span>
                  <h3 className="offer__name">{tr(t.name)}</h3>
                  <p className="offer__tag">{tr(t.title)}</p>
                </header>

                <div className="offer__price">
                  <span className="offer__promo">{tr(t.chip)}</span>
                  <div className="offer__amount">
                    <span className="amt">{t.price}</span>
                    <span className="cur">DT</span>
                    <span className="per">{tr(t.per)}</span>
                    {t.oldPrice && <s className="old">{t.oldPrice} DT</s>}
                    {t.oldPrice && <span className="offer__save">−{t.oldPrice - t.price} DT</span>}
                  </div>
                  <p className="offer__meta">{tr(t.metaLine)}</p>
                  {t.countdown && (
                    <div className="cdown--card" data-countdown={t.countdown} data-countdown-label={tr("Début du live dans")} />
                  )}
                </div>

                <ul className="offer__feats">
                  {t.outcomes.map((o) => (
                    <li key={o}>
                      <span className="ck"><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      <span>{tr(o)}</span>
                    </li>
                  ))}
                </ul>

                <div className="offer__cta">
                  <Btn variant={primary ? "pop" : "ghost"} href={t.ctaHref} arrow>{tr(t.cta)}</Btn>
                </div>
                <p className="offer__reassure">{tr(t.reassure)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Live vs. recorded-video — the differentiator vs. generic AI video courses.
   Le concurrent reste anonyme : on oppose juste « la vidéo classique » au live. */
const COMPARE = {
  video: {
    label: "100% vidéo",
    sub: "Le format classique",
    items: [
      "Tu regardes seul → tu abandonnes",
      "Personne quand tu bloques",
      "Contenu figé, pareil pour tous",
      "Tu finis avec des notes, pas un projet",
      "Souvent chère",
    ],
  },
  wijha: {
    label: "WIJHA, en live",
    sub: "On construit ensemble",
    items: [
      "En direct : on avance ensemble",
      "Tu bloques ? On débloque, en direct",
      "Petits groupes : 20 places",
      "Tu repars avec un projet en ligne",
      "Dès 90 DT en early-bird",
    ],
  },
};

function LiveVsRecorded() {
  const tr = useT();
  return (
    <section className="section compare" id="live">
      <div className="wrap">
        <div className="sec-head center reveal">
          <Kicker num="02">{tr("Le live change tout")}</Kicker>
          <h2 className="h2" style={{ marginTop: 16 }}>
            {tr("Pas une vidéo de plus à")} <span className="pop-text">{tr("regarder seul.")}</span>
          </h2>
          <p className="lede" style={{ margin: "16px auto 0", textAlign: "center" }}>
            {tr("Les autres te laissent seul devant des vidéos. Nous, on construit avec toi — en direct.")}
          </p>
        </div>

        <div className="compare-grid">
          <article className="compare-card is-mute reveal" data-d="1">
            <header className="compare-card__head">
              <span className="compare-card__tag">{tr(COMPARE.video.label)}</span>
              <span className="compare-card__sub">{tr(COMPARE.video.sub)}</span>
            </header>
            <ul className="compare-list">
              {COMPARE.video.items.map((it) => (
                <li key={it}>
                  <span className="mk mk--no" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </span>
                  {tr(it)}
                </li>
              ))}
            </ul>
          </article>

          <article className="compare-card is-pop reveal" data-d="2">
            <span className="compare-card__pill">{tr("Recommandé")}</span>
            <header className="compare-card__head">
              <span className="compare-card__tag">{tr(COMPARE.wijha.label)}</span>
              <span className="compare-card__sub">{tr(COMPARE.wijha.sub)}</span>
            </header>
            <ul className="compare-list">
              {COMPARE.wijha.items.map((it) => (
                <li key={it}>
                  <span className="mk mk--yes" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {tr(it)}
                </li>
              ))}
            </ul>
            <div className="compare-card__cta">
              <Btn variant="pop" href="#tracks" arrow>{tr("Voir les formations live")}</Btn>
              <p className="compare-card__note">{tr("Prochaine session : 26 juin · 20 places max")}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HowWeTeach, Roadmap, Tracks, LiveVsRecorded });
