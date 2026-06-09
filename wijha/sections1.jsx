/* sections1.jsx — Nav, Hero, Logos, Manifesto */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    ["Why now", "#why"],
    ["Roadmap", "#roadmap"],
    ["Tracks", "#tracks"],
    ["Work", "#work"],
    ["FAQ", "#faq"],
  ];
  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav__inner">
        <a className="brand" href="#top">
          <span className="brand__mark">W</span>
          <span>
            <span className="brand__name">WIJHA</span>
            <span className="brand__sub" style={{ display: "block" }}>Academy</span>
          </span>
        </a>
        <div className="nav__links">
          {links.map(([l, h]) => (
            <a key={l} href={h}>{l}</a>
          ))}
        </div>
        <div className="nav__right">
          <Btn variant="ink" href="#reserve" arrow>Reserve a spot</Btn>
          <button className="burger" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="hero section--tight" id="top">
      <div className="glow" style={{ width: 520, height: 520, background: "var(--pop-soft)", top: -120, right: -80 }} />
      <div className="glow" style={{ width: 420, height: 420, background: "color-mix(in oklab, var(--warm) 60%, transparent)", bottom: -160, left: -120, opacity: .7 }} />
      <div className="wrap">
        <div className="hero__grid">
          <div className="hero__copy">
            <div className="reveal in eyebrow-row">
              <Kicker>New cohort · open now</Kicker>
            </div>
            <h1 className="display reveal in" data-d="1">
              Master the<br />
              <span className="italic pop-text">skills of</span><br />
              <span className="italic">the future.</span>
            </h1>
            <p className="lede reveal in" data-d="2">
              From zero to client-ready with AI, no-code &amp; web.
              No experience needed — whatever your age.
            </p>
            <div className="hero__cta reveal in" data-d="3">
              <Btn variant="pop" href="#reserve" arrow>Join the next cohort</Btn>
              <Btn variant="ghost" href="#roadmap" arrow>See the roadmap</Btn>
            </div>
            <div className="hero__trust reveal in" data-d="4">
              <div className="avatars">
                <Slot id="hero-av-1" shape="circle" placeholder="" />
                <Slot id="hero-av-2" shape="circle" placeholder="" />
                <Slot id="hero-av-3" shape="circle" placeholder="" />
                <Slot id="hero-av-4" shape="circle" placeholder="" />
              </div>
              <div>
                <div className="stars">★★★★★</div>
                <div className="muted" style={{ fontSize: 13.5 }}>
                  <strong style={{ color: "var(--ink)" }}>500+</strong> students · 4.9 avg
                </div>
              </div>
            </div>
          </div>

          <div className="hero__media reveal in" data-d="2">
            <Slot id="hero-main" className="main" placeholder="Drop a hero photo — student building / learning" fit="cover" />
            <div className="chip chip--rating glass">
              <span className="big">4.9</span>
              <span className="lbl">avg rating</span>
            </div>
            <div className="chip chip--students glass">
              <Slot id="hero-chip-av" shape="circle" w="44px" h="44px" placeholder="" />
              <div>
                <div className="big" style={{ fontSize: 22 }}>500+</div>
                <span className="lbl">trained</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logos() {
  const items = ["ChatGPT", "Figma", "Notion", "Supabase", "Google Meet", "Cursor", "v0", "Claude"];
  return (
    <section className="section--tight" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className="logos-label reveal">The tools you'll actually use — every day</div>
      </div>
      <div className="reveal">
        <Marquee speed={34}>
          {items.map((l, i) => (
            <span className="logo-item" key={i}>
              <span className="dot" />
              {l}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="section manifesto" id="why">
      <div className="glow" style={{ width: 460, height: 460, background: "var(--pop-soft)", top: 40, left: -160, opacity: .8 }} />
      <div className="wrap">
        <div className="reveal"><Kicker num="01">Why now</Kicker></div>
        <h2 className="manifesto__statement reveal" data-d="1" style={{ marginTop: 24 }}>
          AI isn't the future. It's the <span className="italic pop-text">unfair advantage</span> you can learn today.
        </h2>

        <div className="manifesto__grid">
          <div className="reveal" data-d="1">
            <Slot id="why-media" placeholder="Drop a workspace / building-with-AI shot" style={{ borderRadius: "var(--radius-lg)" }} />
          </div>
          <div className="reveal" data-d="2">
            <p className="lede">
              The people who win the next decade won't be the ones who know the most —
              they'll be the ones who <strong style={{ color: "var(--ink)" }}>build the fastest.</strong>
            </p>
            <div className="stat-line">
              <div>
                <div className="v">10×</div>
                <div className="k">faster shipping</div>
              </div>
              <div>
                <div className="v pop-text">0→1</div>
                <div className="k">no prior code</div>
              </div>
              <div>
                <div className="v">∞</div>
                <div className="k">what you can make</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, Logos, Manifesto });
