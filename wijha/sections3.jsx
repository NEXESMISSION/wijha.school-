/* sections3.jsx — Work gallery, Testimonials, FAQ, Final CTA, Footer */

const WORK = [
  { id: "w1", t: "Personal portfolio", a: "Ahmed", ratio: "3/4" },
  { id: "w2", t: "Restaurant site", a: "Sara", ratio: "4/3" },
  { id: "w3", t: "AI chat assistant", a: "Youssef", ratio: "1/1" },
  { id: "w4", t: "Task app", a: "Amani", ratio: "3/4" },
  { id: "w5", t: "SaaS landing", a: "Mehdi", ratio: "4/3" },
  { id: "w6", t: "Analytics dashboard", a: "Oumaima", ratio: "1/1" },
];

function Work() {
  return (
    <section className="section" id="work">
      <div className="wrap">
        <div className="work__head">
          <div>
            <div className="reveal"><Kicker num="05">Made by students</Kicker></div>
            <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "15ch" }}>
              They learned. Then they <span className="italic pop-text">built.</span>
            </h2>
          </div>
          <p className="lede reveal" data-d="2" style={{ maxWidth: "32ch" }}>
            Real projects shipped by real students — most with zero experience before they started.
          </p>
        </div>

        <div className="gallery">
          {WORK.map((w, i) => (
            <div className="work-card reveal" data-d={(i % 3) + 1} key={w.id}>
              <Slot id={w.id} className="ph" style={{ aspectRatio: w.ratio }} placeholder={`Drop "${w.t}"`} radius={0} shape="rect" />
              <div className="cap">
                <span className="t">{w.t}</span>
                <span className="a">by {w.a}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const small = [
    { id: "t-sara", q: "The sessions are clear and practical. The support is unreal.", nm: "Sara M.", rl: "Student" },
    { id: "t-yssf", q: "In 2 months I learned more than a year of self-teaching.", nm: "Youssef T.", rl: "Entrepreneur" },
  ];
  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <div className="reveal"><Kicker num="06">They trust us</Kicker></div>
        <h2 className="h2 reveal" data-d="1" style={{ marginTop: 22, maxWidth: "16ch" }}>
          Proof, in their <span className="italic pop-text">own words.</span>
        </h2>

        <div className="tests">
          <div className="test-feature reveal" data-d="1">
            <div className="glow" />
            <p className="q">
              "Thanks to WIJHA I built my first site and landed my <span className="pop-text">first freelance clients</span> — I never thought that was possible for me."
            </p>
            <div className="test-who">
              <Slot id="t-ahmed" shape="circle" placeholder="" />
              <div>
                <div className="nm">Ahmed B.</div>
                <div className="rl">Freelance developer</div>
              </div>
            </div>
          </div>
          <div className="test-col">
            {small.map((t, i) => (
              <div className="test-sm reveal" data-d={i + 1} key={t.id}>
                <div className="stars">★★★★★</div>
                <p>"{t.q}"</p>
                <div className="test-who">
                  <Slot id={t.id} shape="circle" placeholder="" />
                  <div>
                    <div className="nm">{t.nm}</div>
                    <div className="rl">{t.rl}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "I'm a total beginner — is this for me?", a: "Absolutely. The roadmap starts at zero with no jargon. Most of our students had never written a line of code or built anything before joining." },
  { q: "Is it online or in person?", a: "Fully online, with weekly live sessions so you're never learning alone. Recordings are available if you miss one." },
  { q: "Do I get a certificate?", a: "Yes — you finish with a recognized certificate and, more importantly, a portfolio of real projects to show clients and employers." },
  { q: "Do I need a powerful computer?", a: "No. Any modern laptop works. The tools we use are mostly cloud-based and lightweight." },
  { q: "Is there any age limit?", a: "None at all. We've trained teenagers and people well into their careers. If you can follow simple steps, you can do this." },
  { q: "How do I pay and reserve my spot?", a: "Spots are limited per cohort. Reserve online in a few minutes — we accept international payments, so wherever you are, you're covered." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="faq">
          <div className="reveal">
            <Kicker num="07">Questions</Kicker>
            <h2 className="h2" style={{ marginTop: 22 }}>
              Everything you<br />need to know.
            </h2>
          </div>
          <div className="faq__list reveal" data-d="1">
            {FAQS.map((f, i) => (
              <div className={`faq__item ${open === i ? "open" : ""}`} key={i}>
                <button className="faq__q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                  {f.q}
                  <span className="ic">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                  </span>
                </button>
                <div className="faq__a" style={{ maxHeight: open === i ? 240 : 0 }}>
                  <div className="faq__a-inner">{f.a}</div>
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
  const meta = [
    { ic: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z", t: "Limited seats" },
    { ic: "M16 4h4v16H4V4h4M9 2h6v4H9z", t: "20 students only" },
    { ic: "M8 2v4M16 2v4M3 10h18M5 6h14v14H5z", t: "Starts May 25" },
  ];
  return (
    <section className="section final" id="reserve">
      <div className="wrap">
        <div className="final__card reveal">
          <div className="glow" />
          <div>
            <h2 className="h2">
              Ready to learn the <span className="italic">skill of the future?</span>
            </h2>
            <p className="lede" style={{ marginTop: 18 }}>
              Join the next cohort and build your future — starting today.
            </p>
            <div className="final__meta">
              {meta.map((m) => (
                <span className="m" key={m.t}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={m.ic} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {m.t}
                </span>
              ))}
            </div>
          </div>
          <div className="final__cta">
            <Btn variant="paper" href="#" arrow>Reserve my spot</Btn>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, opacity: .8 }}>No experience required ·  any age</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Explore", links: ["Why now", "Roadmap", "Tracks", "Work", "FAQ"] },
    { h: "Tracks", links: ["Vibe Coding — Web", "Build Apps with AI"] },
    { h: "Contact", links: ["WhatsApp", "Instagram", "Email"] },
  ];
  const socials = [
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm5.5-.5h.01",
    "M23 7s-.2-1.6-.9-2.3c-.8-.9-1.7-.9-2.1-1C17 3.4 12 3.4 12 3.4h0s-5 0-8 .3c-.4.1-1.3.1-2.1 1C1.2 5.4 1 7 1 7S.8 8.9.8 10.8v1.4C.8 14.1 1 16 1 16s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.7.3 7.7.3s5 0 8-.3c.4-.1 1.3-.1 2.1-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4C23.2 8.9 23 7 23 7ZM9.8 14.6V8.4l5.2 3.1-5.2 3.1Z",
    "M22 6 12 13 2 6M2 6h20v12H2z",
  ];
  return (
    <footer className="footer">
      <hr className="divider" />
      <div className="wrap">
        <div className="footer__grid" style={{ marginTop: 56 }}>
          <div>
            <a className="brand" href="#top">
              <span className="brand__mark">W</span>
              <span><span className="brand__name">WIJHA</span><span className="brand__sub" style={{ display: "block" }}>Academy</span></span>
            </a>
            <p className="muted" style={{ marginTop: 20, maxWidth: "30ch", fontSize: 15.5 }}>
              Learn. Build. Evolve. Practical AI, no-code &amp; web — to build your future.
            </p>
            <div className="footer__socials" style={{ marginTop: 22 }}>
              {socials.map((d, i) => (
                <a href="#" key={i} aria-label="social"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h5>{c.h}</h5>
              {c.links.map((l) => <a className="fl" href="#" key={l}>{l}</a>)}
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <span>© 2026 WIJHA Academy — All rights reserved.</span>
          <span style={{ fontFamily: "var(--mono)", letterSpacing: ".04em" }}>Learn · Build · Evolve</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Work, Testimonials, FAQ, FinalCTA, Footer });
