/* sections1.jsx — Nav, Hero, Logos, Manifesto */

/* drapeaux SVG (les emojis 🇫🇷/🇹🇳 ne s'affichent pas sur Windows → on dessine) */
const FLAG_FR = (
  <svg className="flag" viewBox="0 0 60 40" aria-hidden="true">
    <rect width="60" height="40" fill="#fff" />
    <rect width="20" height="40" fill="#0055A4" />
    <rect x="40" width="20" height="40" fill="#EF4135" />
  </svg>
);
const FLAG_TN = (
  <svg className="flag" viewBox="0 0 60 40" aria-hidden="true">
    <rect width="60" height="40" fill="#E70013" />
    <circle cx="30" cy="20" r="11" fill="#fff" />
    <circle cx="31.4" cy="20" r="8" fill="#E70013" />
    <circle cx="34.2" cy="20" r="8" fill="#fff" />
    <path d="M35.5 16.6 36.32 18.87 38.73 18.95 36.83 20.43 37.5 22.75 35.5 21.4 33.5 22.75 34.17 20.43 32.27 18.95 34.68 18.87Z" fill="#E70013" />
  </svg>
);

function Nav() {
  const { lang, setLang } = useLang();
  const tr = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    [tr("Formations"), "#tracks"],
    [tr("FAQ"), "#faq"],
  ];
  const LangSwitch = (
    <div className="lang" role="group" aria-label="Langue / اللغة">
      <button type="button" className={`lang__opt ${lang === "fr" ? "on" : ""}`} onClick={() => setLang("fr")} aria-label="Français" aria-pressed={lang === "fr"}>{FLAG_FR}</button>
      <button type="button" className={`lang__opt ${lang === "ar" ? "on" : ""}`} onClick={() => setLang("ar")} aria-label="Tounsi / تونسي" aria-pressed={lang === "ar"}>{FLAG_TN}</button>
    </div>
  );
  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav__inner">
        <a className="brand" href="#top">
          <img className="brand__mark" src="logo.png" alt="WIJHA Academy" />
          <span>
            <span className="brand__name">WIJHA</span>
            <span className="brand__sub" style={{ display: "block" }}>Academy</span>
          </span>
        </a>
        <div className="nav__links">
          {links.map(([l, h]) => (
            <a key={h} href={h}>{l}</a>
          ))}
        </div>
        <div className="nav__right">
          {LangSwitch}
          <Btn variant="pop" href="static-web-apps.html#reserver" arrow>{tr("Réserver")}</Btn>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const tr = useT();
  return (
    <header className="hero hero--stack section--tight" id="top">
      <div className="wrap">
        <div className="hero__lead">
          <div className="reveal in" data-d="0">
            <span className="hero__eyebrow">{tr("🔴 Prochaine session live : 26 juin · 20 places max")}</span>
          </div>
          <h1 className="display reveal in" data-d="1">
            {tr("Crée ton site web")}<br />
            <span className="pop-text">{tr("avec l'IA, en live.")}</span>
          </h1>
          <p className="lede reveal in" data-d="2">
            {tr("Des sessions en direct où tu construis de vrais projets avec l'IA, guidé pas à pas — sans taper le code toi-même.")}
          </p>
          <div className="hero__cta reveal in" data-d="3">
            <Btn variant="pop" href="static-web-apps.html#reserver" arrow>{tr("Réserver ma place — 90 DT")}</Btn>
            <a className="hero__how" href="#tracks">{tr("Voir les formations")}</a>
          </div>
        </div>

        <div className="hero__flow reveal in" data-d="4">
          <picture>
            <source media="(max-width: 760px)" srcSet="img/hero-flow-mobile.webp" />
            <img className="hero__flow-img" src="img/hero-flow-desktop.webp"
                 width="1400" height="696" decoding="async" fetchpriority="high"
                 alt="Comment ça marche : Idée → Session IA → Site en ligne" />
          </picture>
          <p className="hero__microcopy" style={{ textAlign: "center" }}>
            {tr("Tout ça en une seule session live de 3h, guidé pas à pas.")}
          </p>
        </div>
      </div>
    </header>
  );
}

function Logos() {
  const tr = useT();
  const items = ["ChatGPT", "Cursor", "Claude Code", "Figma", "GitHub", "Vercel", "Google Meet"];
  return (
    <section className="section--tight" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className="logos-label reveal">{tr("Les outils que tu vas maîtriser — guidés pas à pas")}</div>
        <div className="logos-row reveal" data-d="1">
          {items.map((l, i) => (
            <span className="logo-item" key={i}>
              <span className="dot" />
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="section manifesto" id="why">
      <div className="glow" style={{ width: 460, height: 460, background: "var(--pop-soft)", top: 40, left: -160, opacity: .8 }} />
      <div className="wrap">
        <div className="reveal"><Kicker num="01">Pourquoi maintenant</Kicker></div>
        <h2 className="manifesto__statement reveal" data-d="1" style={{ marginTop: 24 }}>
          L'IA n'est pas le futur. C'est l'<span className="italic pop-text">avantage décisif</span> que tu peux apprendre dès aujourd'hui.
        </h2>

        <div className="manifesto__grid">
          <div className="reveal" data-d="1">
            <Slot id="why-media" src="img/why.webp" placeholder="Dépose une photo d'espace de travail / création avec l'IA" style={{ aspectRatio: "5 / 4", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)" }} />
          </div>
          <div className="reveal" data-d="2">
            <p className="lede">
              Ceux qui gagneront la prochaine décennie ne seront pas ceux qui en savent le plus —
              ce seront ceux qui <strong style={{ color: "var(--ink)" }}>construisent le plus vite.</strong>
            </p>
            <div className="stat-line">
              <div>
                <div className="v">10×</div>
                <div className="k">plus rapide à livrer</div>
              </div>
              <div>
                <div className="v pop-text">0→1</div>
                <div className="k">sans coder avant</div>
              </div>
              <div>
                <div className="v">∞</div>
                <div className="k">de possibilités</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Galerie : deux marquees d'images en boucle infinie (1080×1350) ──
   Chaque carte = une illustration (remplace "placeholder.svg", format ~1080×1350)
   + une icône + un libellé court. Ajoute/retire autant de cartes que tu veux. */
const SHOWCASE_TOP = [
  { ico: "💻", label: "Crée des sites web", img: "placeholder.svg" },
  { ico: "🤖", label: "Maîtrise l'IA", img: "placeholder.svg" },
  { ico: "🎨", label: "Imagine & design", img: "placeholder.svg" },
  { ico: "🚀", label: "Lance tes projets", img: "placeholder.svg" },
  { ico: "💰", label: "Gagne en ligne", img: "placeholder.svg" },
];
const SHOWCASE_BOTTOM = [
  { ico: "🏆", label: "Ton portfolio", img: "placeholder.svg" },
  { ico: "💬", label: "Assistant IA", img: "placeholder.svg" },
  { ico: "📄", label: "Landing page", img: "placeholder.svg" },
  { ico: "📜", label: "Certificat", img: "placeholder.svg" },
  { ico: "✨", label: "Pensée créative", img: "placeholder.svg" },
];

function ShowcaseRow({ items, reverse }) {
  // on duplique la liste : la 2e copie rend la boucle parfaitement continue
  const loop = [...items, ...items];
  return (
    <div className="showcase__row">
      <div className="showcase__viewport">
        <div className={`showcase__track ${reverse ? "showcase__track--rev" : ""}`}>
          {loop.map((it, i) => (
            <div className="showcase__card" key={i}>
              <div className="ph"><img src={it.img} alt="" loading="lazy" draggable="false" /></div>
              <div className="lbl"><span className="ico">{it.ico}</span><b>{it.label}</b></div>
            </div>
          ))}
        </div>
      </div>
      <span className="showcase__arrow showcase__arrow--l" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span className="showcase__arrow showcase__arrow--r" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  );
}

function Showcase() {
  return (
    <section className="showcase" id="showcase" aria-label="Ce que tu apprends">
      <ShowcaseRow items={SHOWCASE_TOP} reverse={false} />
      <ShowcaseRow items={SHOWCASE_BOTTOM} reverse={true} />
    </section>
  );
}

Object.assign(window, { Nav, Hero, Logos, Manifesto, Showcase });
