/* components.jsx — shared primitives (exported to window) */
const { useState, useEffect, useRef, useCallback } = React;

/* ---- scroll reveal hook ---- */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
}

/* ---- small SVG arrow ---- */
function Arrow({ size = 16 }) {
  return (
    <svg className="arr" width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Kicker({ num, children }) {
  return (
    <span className="kicker">
      {num && <span className="num">{num}</span>}
      {children}
    </span>
  );
}

function Btn({ variant = "pop", children, href, arrow, onClick, style }) {
  const cls = `btn btn--${variant}`;
  const inner = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  );
  if (href) return <a className={cls} href={href} onClick={onClick} style={style}>{inner}</a>;
  return <button className={cls} onClick={onClick} style={style}>{inner}</button>;
}

/* ---- image slot wrapper for React ---- */
function Slot({ id, w, h, shape = "rounded", radius = 18, placeholder, src, fit, style, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("id", id);
    el.setAttribute("shape", shape);
    if (radius != null) el.setAttribute("radius", radius);
    if (placeholder) el.setAttribute("placeholder", placeholder);
    if (src) el.setAttribute("src", src);
    if (fit) el.setAttribute("fit", fit);
  }, [id, shape, radius, placeholder, src, fit]);
  return (
    <image-slot
      ref={ref}
      class={className}
      style={{ width: w || "100%", height: h || "100%", display: "block", ...style }}
    />
  );
}

/* ---- marquee ---- */
function Marquee({ children, speed = 32 }) {
  return (
    <div className="marquee" aria-hidden="false">
      <div className="marquee__track" style={{ animationDuration: `${speed}s` }}>
        {children}
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { useReveal, Arrow, Kicker, Btn, Slot, Marquee });
