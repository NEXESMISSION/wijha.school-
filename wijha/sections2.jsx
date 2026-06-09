/* sections2.jsx — How we teach, Roadmap, Tracks */

function HowWeTeach() {
  const principles = [
    { n: "01", t: "Learn by building", d: "You ship something real from week one. No dusty theory — just projects you're proud of.", icon: "M4 17l5-5-5-5M11 17h6" },
    { n: "02", t: "Live, never lonely", d: "Weekly live sessions with a mentor who's shipped real products and landed real clients.", icon: "M3 11l9-7 9 7M5 10v8h14v-8" },
    { n: "03", t: "Only what matters", d: "We cut the noise and teach the simplest path to results — the exact stack pros use.", icon: "M5 12l4 4 10-10" },
  ];
  return (
    <section className="section" id="method">
      <div className="wrap">
        <div className="teach__head">
          <div>
            <div className="reveal"><Kicker num="02">How we teach</Kicker></div>
            <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "14ch" }}>
              The important things, the <span className="italic pop-text">simplest</span> way.
            </h2>
          </div>
          <p className="lede reveal" data-d="2">
            No fluff, no overwhelm. We hand you the shortest road from
            "I've never done this" to "I just shipped that."
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
    n: "01", title: "Start from nothing", sub: "No code. No fear.",
    h: "Zero experience? Perfect.",
    p: "We start at the very beginning. No jargon, no gatekeeping — just clear steps anyone can follow, whatever your age.",
    tags: ["Mindset", "Your first tools", "AI as a teammate"],
    slot: "road-1",
  },
  {
    n: "02", title: "Build the foundations", sub: "The core skills, made easy.",
    h: "Learn the essentials fast.",
    p: "The handful of concepts that actually matter — structure, design, logic — taught the simplest way and reinforced by building.",
    tags: ["Web basics", "Design sense", "Working with AI"],
    slot: "road-2",
  },
  {
    n: "03", title: "Build real projects", sub: "Your portfolio, live.",
    h: "Make things people can use.",
    p: "Every week you ship. By the end you've got a portfolio of real, polished work — not exercises, but products.",
    tags: ["Real projects", "Portfolio", "Feedback loops"],
    slot: "road-3",
  },
  {
    n: "04", title: "Launch online", sub: "Deploy. Domain. Polish.",
    h: "Go from local to live.",
    p: "Ship to the world: deploy, connect a domain, make it fast and beautiful. The full professional finish.",
    tags: ["Vercel", "GitHub", "Hosting", "Performance"],
    slot: "road-4",
  },
  {
    n: "05", title: "Land your clients", sub: "Pitch. Price. Deliver.",
    h: "Turn skills into income.",
    p: "How to find work, price it right, accept payments worldwide, and deliver like a pro. From learner to freelancer.",
    tags: ["Pitching", "Pricing", "Dodo Payments", "Delivery"],
    slot: "road-5",
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
            <div className="reveal"><Kicker num="03">The roadmap</Kicker></div>
            <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "16ch" }}>
              From <span className="italic">zero</span> to handling <span className="italic pop-text">real clients.</span>
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
                  No age limit · no prerequisites
                </div>
              </div>

              <div className="road__panel reveal" data-d="2">
                <div className="road__media">
                  <Slot id={step.slot} placeholder={`Drop a visual for "${step.title}"`} key={step.slot} />
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
    key: "web",
    name: "Vibe Coding — Web",
    badge: "8 weeks · beginner-friendly",
    title: "Build modern websites that sell.",
    outcomes: [
      "Design & build fast, responsive sites",
      "A real portfolio you can show clients",
      "Deploy live with a custom domain",
    ],
    stack: ["HTML · CSS · JS", "Figma", "GitHub", "Vercel", "Hostinger", "AI assist"],
    slot: "track-web",
  },
  {
    key: "apps",
    name: "Build Apps with AI",
    badge: "10 weeks · most popular",
    title: "Ship real apps that take payments worldwide.",
    outcomes: [
      "Full web apps with AI + no-code",
      "Databases, auth & APIs the easy way",
      "Accept international payments out of the box",
    ],
    stack: ["Claude / Codex CLI", "Supabase", "Vercel", "Cloudflare", "GitHub", "Dodo Payments"],
    slot: "track-apps",
  },
];

function Tracks() {
  const [active, setActive] = useState(0);
  const t = TRACKS[active];
  const switchRef = useRef(null);
  const pillStyle = active === 0
    ? { transform: "translateX(0)", width: "calc(50% - 6px)" }
    : { transform: "translateX(calc(100% + 6px))", width: "calc(50% - 6px)" };
  return (
    <section className="section" id="tracks">
      <div className="wrap">
        <div className="reveal"><Kicker num="04">Choose your track</Kicker></div>
        <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "16ch" }}>
          Two paths. Both end with you <span className="italic pop-text">shipping.</span>
        </h2>

        <div className="tracks__switch reveal" data-d="2" ref={switchRef} style={{ width: "min(440px, 100%)" }}>
          <span className="pill" style={pillStyle} />
          {TRACKS.map((tr, i) => (
            <button key={tr.key} className={i === active ? "active" : ""} onClick={() => setActive(i)} style={{ flex: 1 }}>
              <span className="lbl">{i === 0 ? "Websites" : "AI Apps"}</span>
            </button>
          ))}
        </div>

        <div className="track__panel" key={t.key}>
          <div className="reveal in">
            <span className="track__badge">{t.badge}</span>
            <h3 className="track__title">{t.title}</h3>
            <ul className="track__outcomes">
              {t.outcomes.map((o) => (
                <li key={o}>
                  <span className="ck"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  {o}
                </li>
              ))}
            </ul>
            <div className="track__stack">
              <div className="lbl">Stack you'll master</div>
              <div className="stack-chips">
                {t.stack.map((s) => <span className="chipx" key={s}>{s}</span>)}
              </div>
            </div>
            <div className="track__cta">
              <Btn variant="ink" href="#reserve" arrow>See the full program</Btn>
            </div>
          </div>
          <div className="track__media reveal in" data-d="1">
            <Slot id={t.slot} placeholder={`Drop a UI screenshot — ${t.name}`} key={t.slot} />
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HowWeTeach, Roadmap, Tracks });
