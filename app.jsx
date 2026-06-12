/* app.jsx — composition, tweaks, mount */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["oklch(0.55 0.225 264)", "oklch(0.46 0.22 266)"],
  "paperTone": "cream",
  "grain": true,
  "roundness": 22
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLangState] = useState(function () {
    try { return localStorage.getItem("wijha_lang") === "ar" ? "ar" : "fr"; } catch (e) { return "fr"; }
  });
  const setLang = function (l) {
    var v = l === "ar" ? "ar" : "fr";
    setLangState(v);
    try { localStorage.setItem("wijha_lang", v); } catch (e) {}
    document.documentElement.setAttribute("lang", v);
  };
  useEffect(function () { document.documentElement.setAttribute("lang", lang); }, [lang]);
  useReveal();

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--pop", t.accent[0]);
    r.style.setProperty("--pop-deep", t.accent[1]);
    r.style.setProperty("--radius", t.roundness + "px");
    r.style.setProperty("--radius-lg", (t.roundness + 8) + "px");
    const tones = {
      cream: ["oklch(0.968 0.013 78)", "oklch(0.945 0.016 78)", "oklch(0.992 0.006 84)"],
      cool:  ["oklch(0.972 0.004 250)", "oklch(0.95 0.006 250)", "oklch(0.995 0.002 250)"],
      sand:  ["oklch(0.96 0.022 70)", "oklch(0.935 0.026 68)", "oklch(0.99 0.012 78)"],
    };
    const p = tones[t.paperTone] || tones.cream;
    r.style.setProperty("--paper", p[0]);
    r.style.setProperty("--paper-2", p[1]);
    r.style.setProperty("--card", p[2]);
    document.body.style.setProperty("--grain-op", t.grain ? ".035" : "0");
  }, [t]);

  return (
    <LangCtx.Provider value={{ lang: lang, setLang: setLang }}>
      <Nav />
      <main>
        <Hero />
        {/* Offre en premier : on met les formations + prix tout de suite */}
        <Tracks />
        <Logos />
        <LiveVsRecorded />
        <FAQ />
        <FinalCTA />
        {/* Sections masquées (à réactiver plus tard) :
            <Expert /> = nos produits / notre travail — à réactiver quand on aura les vraies captures.
            <Showcase /> = galerie d'images défilantes sous le hero — masquée.
            <Manifesto /> <HowWeTeach /> <Work /> <Testimonials /> <Roadmap /> = redondantes / preuves non vérifiées. */}
      </main>
      <Footer />

      <TweaksPanel>
        <TweakSection label="Accent" />
        <TweakColor
          label="Couleur d'accent"
          value={t.accent}
          options={[
            ["oklch(0.55 0.225 264)", "oklch(0.46 0.22 266)"],
            ["oklch(0.64 0.2 33)", "oklch(0.55 0.2 32)"],
            ["oklch(0.62 0.16 162)", "oklch(0.52 0.15 162)"],
            ["oklch(0.58 0.22 312)", "oklch(0.49 0.21 312)"],
          ]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakSection label="Surface" />
        <TweakRadio
          label="Teinte du papier"
          value={t.paperTone}
          options={["cream", "cool", "sand"]}
          onChange={(v) => setTweak("paperTone", v)}
        />
        <TweakSlider label="Arrondi" value={t.roundness} min={6} max={34} step={2} unit="px"
          onChange={(v) => setTweak("roundness", v)} />
        <TweakToggle label="Grain de film" value={t.grain} onChange={(v) => setTweak("grain", v)} />
      </TweaksPanel>
    </LangCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
