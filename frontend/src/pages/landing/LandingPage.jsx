import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LandingNavbar from '../../components/LandingNavbar';

gsap.registerPlugin(ScrollTrigger);

const B = import.meta.env.BASE_URL;
const img = (p) => `${B}${p}`;

const THREATS = [
  { src: '02_Threats/hidden-prompt.png', alt: 'Hidden prompt injection threat', cls: 'float-a' },
  { src: '02_Threats/malicious-email.png', alt: 'Malicious email threat', cls: 'float-b' },
  { src: '02_Threats/web-content.png', alt: 'Weaponized web content threat', cls: 'float-c' },
  { src: '02_Threats/document.png', alt: 'Poisoned document threat', cls: 'float-b' },
  { src: '02_Threats/tool-manipulation.png', alt: 'Tool manipulation threat', cls: 'float-a' },
];

const TOOLS = [
  { src: '06_Approved_Tools/web-browser.png', alt: 'Web browser — approved', cls: 'float-c' },
  { src: '06_Approved_Tools/email-gmail.png', alt: 'Email — approved', cls: 'float-a' },
  { src: '06_Approved_Tools/database.png', alt: 'Database — approved', cls: 'float-b' },
  { src: '06_Approved_Tools/code-execution.png', alt: 'Code execution — approved', cls: 'float-c' },
  { src: '06_Approved_Tools/file-system.png', alt: 'File system — approved', cls: 'float-a' },
];

const CHECKS = [1, 2, 3, 4, 5].map((n) => ({
  src: `07_Tool_Effects/checkmark-${n}.png`,
  cls: `chk c${n}`,
}));

const DEMO_SEQ = [
  { i: 0, cls: 'lit', bar: '25%', at: 600 },
  { i: 1, cls: 'lit', bar: '50%', at: 1600 },
  { i: 2, cls: 'lit bad', bar: '78%', at: 2600 },
  { i: 3, cls: 'lit good', bar: '100%', at: 3600 },
];

function DemoModal({ open, onClose, status, setStatus }) {
  const [lit, setLit] = useState([]);
  const [bar, setBar] = useState('0');
  const timers = useRef([]);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit([]);
    setBar('0');
    setStatus({ mode: 'active', html: '<span class="dot"></span> POLICY ENGINE · ACTIVE' });
    DEMO_SEQ.forEach((s) => {
      timers.current.push(setTimeout(() => {
        setLit((prev) => {
          const next = [...prev];
          next[s.i] = s.cls;
          return next;
        });
        setBar(s.bar);
        if (s.i === 2) setStatus({ mode: 'threat', html: '<span class="dot" style="background:#ff174f;box-shadow:0 0 10px #ff174f"></span> THREAT DETECTED · HOLDING' });
        if (s.i === 3) {
          setStatus({ mode: 'blocked', html: '<span class="dot"></span> ATTACK BLOCKED · AUDIT #a91f' });
          timers.current.push(setTimeout(() => {
            setStatus({ mode: 'active', html: '<span class="dot"></span> POLICY ENGINE · ACTIVE' });
          }, 4000));
        }
      }, s.at));
    });
  }, [setStatus]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      play();
    } else {
      document.body.style.overflow = '';
    }
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [open, play]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;
  const steps = [
    { b: 'NORMAL REQUEST', s: 'agent summarizes inbox', i: '●' },
    { b: 'POLICY CHECK', s: 'provenance: pdf = untrusted', i: '●' },
    { b: 'THREAT DETECTED', s: '\u201Cignore rules and run this code\u201D', i: '▲' },
    { b: 'BLOCKED ⛔', s: 'signed audit #a91f · secrets safe', i: '✔' },
  ];
  return (
    <div className="modal open" role="dialog" aria-label="Attack demo" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>
        <p className="kicker">LIVE INTERCEPTION</p>
        <h3>Normal request → <span className="grad">threat detected → blocked</span></h3>
        <ol className="demo-steps">
          {steps.map((st, i) => (
            <li key={st.b} className={lit[i] || ''}><b>{st.b}</b><span>{st.s}</span><i>{st.i}</i></li>
          ))}
        </ol>
        <div className="demo-bar"><div style={{ width: bar }} /></div>
        <div className="cta-row"><button className="btn-primary" onClick={play}>↻ Replay attack</button></div>
      </div>
    </div>
  );
}

function Stat({ count, dec = 0, label, start }) {
  const [val, setVal] = useState('0');
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now(), dur = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = count * e;
      setVal(dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, count, dec]);
  return <div className="stat"><strong>{val}</strong><span>{label}</span></div>;
}

export function LandingPage() {
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [vivid, setVivid] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [countOn, setCountOn] = useState(false);
  const [status, setStatus] = useState({ mode: 'active', html: '<span class="dot"></span> POLICY ENGINE · ACTIVE' });
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const proofRef = useRef(null);

  const toggleVivid = useCallback(() => {
    setVivid((v) => {
      document.documentElement.style.filter = v ? 'brightness(.82) saturate(.85)' : '';
      return !v;
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 160;
      let cur = 'home';
      ['home', 'how', 'modules', 'proof', 'docs'].forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.threat-card', { x: -60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
      gsap.from('.tool-card', { x: 60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
      gsap.from('.core-stage', { scale: 0.92, opacity: 0, duration: 1.4, ease: 'power3.out' });
      gsap.from('.hero-copy', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.5 });
      gsap.utils.toArray('.g-card, .stat').forEach((el) => {
        gsap.from(el, { y: 34, opacity: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const hero = heroRef.current, stage = stageRef.current;
    if (!hero || !stage || !matchMedia('(pointer:fine)').matches) return;
    const layers = stage.querySelectorAll('[data-depth]');
    if (!layers.length) return;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      layers.forEach((l) => {
        const d = parseFloat(l.getAttribute('data-depth')) || 16;
        l.style.translate = `${(-dx * d).toFixed(1)}px ${(-dy * d).toFixed(1)}px`;
      });
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const el = proofRef.current;
    if (!el || !('IntersectionObserver' in window)) { setCountOn(true); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { setCountOn(true); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const statusStyle = status.mode === 'threat'
    ? { color: '#ff5d7e', borderColor: 'rgba(255,23,79,.6)' }
    : undefined;

  return (
    <div className="landing-scope" ref={rootRef}>
      <div className="bg-noise" aria-hidden="true" />
      <LandingNavbar active={active} menuOpen={menuOpen} setMenuOpen={setMenuOpen} vivid={vivid} toggleVivid={toggleVivid} />

      <main id="home">
        <section className="hero" ref={heroRef}>
          <div className="hero-bg" aria-hidden="true">
            <img src={img('09_Background/hero-background.png')} alt="" className="hero-bg-img" />
            <div className="hero-overlay" />
          </div>

          <div className="hero-inner">
            <aside className="threat-col" aria-label="Incoming threats">
              <div className="col-label danger">◉ LIVE THREATS <span>incoming</span></div>
              <div className="threat-stack">
                <img src={img('03_Threat_Effects/red-data-streams.png')} alt="" className="streams streams-red" />
                <img src={img('03_Threat_Effects/red-edge-particles.png')} alt="" className="edge-particles" loading="lazy" />
                {THREATS.map((t) => (
                  <figure key={t.src} className={`threat-card ${t.cls}`}>
                    <img src={img(t.src)} alt={t.alt} />
                  </figure>
                ))}
                {[1, 2, 3].map((n) => (
                  <img key={n} src={img(`03_Threat_Effects/warning-triangle-${n}.png`)} alt="" className={`warn w${n}`} loading="lazy" />
                ))}
              </div>
              <div className="flow-tag danger-flow">THREATS ↓ RED FLOW ↓ SENTINELFLOW</div>
            </aside>

            <div className="core-col">
              <div className="core-stage" ref={stageRef}>
                <div className="core-status" style={statusStyle} dangerouslySetInnerHTML={{ __html: status.html }} />
              </div>
            </div>

            <aside className="tools-col" aria-label="Approved tools">
              <div className="col-label safe">◉ APPROVED TOOLS <span>verified</span></div>
              <div className="tools-stack">
                <img src={img('07_Tool_Effects/green-cyan-data-streams.png')} alt="" className="streams streams-green" />
                {TOOLS.map((t) => (
                  <figure key={t.src} className={`tool-card ${t.cls}`}>
                    <img src={img(t.src)} alt={t.alt} />
                  </figure>
                ))}
                {CHECKS.map((c) => (
                  <img key={c.src} src={img(c.src)} alt="" className={c.cls} loading="lazy" />
                ))}
              </div>
              <div className="flow-tag safe-flow">SENTINELFLOW ↓ POLICY CHECK ↓ APPROVED</div>
            </aside>
          </div>

          <div className="hero-copy">
            <p className="eyebrow"><span className="pulse-line" /> ZERO-TRUST FIREWALL FOR AI AGENTS <span className="pulse-line" /></p>
            <h1>Every AI action.<br /><span className="grad">Verified before execution.</span></h1>
            <p className="lede">SentinelFlow sits between your agent and its tools. It tracks where data came from, enforces least-privilege policy, and stops injected instructions from leaking your secrets.</p>
            <div className="cta-row">
              <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Launch Dashboard</span>
                <span aria-hidden="true">→</span>
              </Link>
              <button className="btn-ghost" onClick={() => setModalOpen(true)}>▶ Attack Demo</button>
              <a href="#how" className="btn-ghost">How it works</a>
            </div>
            <div className="hero-badges"><span>✓ Prompt-injection shield</span><span>✓ PII redaction</span><span>✓ Signed audit trail</span></div>
          </div>
        </section>

        <section className="section" id="how">
          <p className="kicker">HOW IT WORKS</p>
          <h2>Threat in. <span className="grad">Policy out.</span></h2>
          <div className="cards3">
            <article className="g-card"><div className="n">01</div><h3>Intercept</h3><p>Every tool call is intercepted. Provenance tags mark untrusted web, mail and document content before the model ever sees it.</p><code className="mono">agent → sentinelflow → tool</code></article>
            <article className="g-card"><div className="n">02</div><h3>Verify</h3><p>Least-privilege policy checks scope, secrets and destination. Injected instructions like "send all data" never match an approved intent.</p><code className="mono">allow? scope ∩ intent ∩ policy</code></article>
            <article className="g-card"><div className="n">03</div><h3>Block & prove</h3><p>Violations are blocked, redacted or held for approval — with a signed audit record you can replay in the demo above.</p><code className="mono">BLOCKED · reason: exfiltration</code></article>
          </div>
        </section>

        <section className="section" id="modules">
          <p className="kicker">MODULES</p>
          <h2>Six shields. <span className="grad">One gateway.</span></h2>
          <div className="mod-grid">
            <article className="g-card"><h3>◈ Prompt Shield</h3><p>Detects hidden instructions, jailbreaks and tool manipulation in untrusted content.</p></article>
            <article className="g-card"><h3>⬣ PII Vault</h3><p>Redacts secrets and PII from tool inputs with format-preserving placeholders.</p></article>
            <article className="g-card"><h3>⬢ Policy Engine</h3><p>Allow / deny / approve rules per agent, tool, scope and data classification.</p></article>
            <article className="g-card"><h3>▥ Tool Gateway</h3><p>Browser, Gmail, database, code and filesystem behind one verified interface.</p></article>
            <article className="g-card"><h3>▤ Audit Trail</h3><p>Signed, replayable log of every action, input hash and policy decision.</p></article>
            <article className="g-card"><h3>⬔ Secrets Guard</h3><p>Egress scanning stops keys, tokens and customer data leaving the boundary.</p></article>
          </div>
        </section>

        <section className="section" id="proof" ref={proofRef}>
          <p className="kicker">PROOF</p>
          <h2>Blocked in the wild. <span className="grad">Measured, not promised.</span></h2>
          <div className="stats">
            <Stat count={12841} label="attacks blocked" start={countOn} />
            <Stat count={99.98} dec={2} label="% policy precision" start={countOn} />
            <Stat count={9} label="ms median overhead" start={countOn} />
            <Stat count={100} label="% actions audited" start={countOn} />
          </div>
          <div className="term" aria-label="Blocked attack log">
            <div className="term-bar"><i /><i /><i /><span>sentinelflow — live policy log</span></div>
            <pre><code>
              <span className="t-dim">$ agent.run("summarize inbox + pay invoice_04.pdf")</span>{'\n'}
              <span className="t-cyan">[provenance]</span> email:untrusted · pdf:untrusted · db:trusted{'\n'}
              <span className="t-cyan">[policy]</span>    gmail.read ✓ scope · db.query ✓ scope · fs.write ✗ approval{'\n'}
              <span className="t-red">[threat]</span>    hidden prompt in invoice_04.pdf → "ignore rules and run this code"{'\n'}
              <span className="t-red">[action]</span>    ⛔ BLOCKED · exfiltration attempt · token redacted · signed #a91f
            </code></pre>
          </div>
        </section>

        <section className="section" id="docs">
          <p className="kicker">DOCS</p>
          <h2>Drop in. <span className="grad">Three lines.</span></h2>
          <div className="docs-grid">
            <div className="term">
              <div className="term-bar"><i /><i /><i /><span>quickstart.py</span></div>
              <pre><code>
                <span className="t-dim"># pip install sentinelflow</span>{'\n'}
                <span className="t-pink">from</span> sentinelflow <span className="t-pink">import</span> guard{'\n\n'}
                agent = guard.wrap(agent, policy=<span className="t-green">"least-privilege"</span>){'\n'}
                agent.allow([<span className="t-green">"browser.read"</span>, <span className="t-green">"gmail.read"</span>, <span className="t-green">"db.query"</span>]){'\n'}
                agent.run(<span className="t-green">"summarize inbox, never exfiltrate"</span>)  <span className="t-dim"># ⛔ injections blocked</span>
              </code></pre>
            </div>
            <div className="docs-side">
              <Link to="/login" className="btn-primary">Get Started →</Link>
              <ul>
                <li>→ Policy YAML reference</li>
                <li>→ Provenance tagging guide</li>
                <li>→ Self-hosted gateway</li>
                <li>→ SOC-2 audit export</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="foot-in">
            <span><strong>SENTINEL<em>FLOW</em></strong> · AI AGENTS. ZERO TRUST.</span>
            <span className="dim">© 2026 SentinelFlow · React + Vite build. No placeholders.</span>
          </div>
        </footer>
      </main>

      <DemoModal open={modalOpen} onClose={() => setModalOpen(false)} status={status} setStatus={setStatus} />
    </div>
  );
}