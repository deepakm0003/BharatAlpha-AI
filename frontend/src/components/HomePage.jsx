import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Activity, TrendingUp, TrendingDown, Briefcase, BarChart2,
  Star, GitBranch, MessageSquare, Radar, Zap, ArrowRight,
  Users, Database, Brain, Shield, ChevronRight
} from 'lucide-react';
import SearchBar from './SearchBar';

/* ─── Animated counter ────────────────────────────────────────── */
const AnimCounter = ({ target, suffix = '', prefix = '', duration = 1800 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const pct = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - pct, 3);
        setVal(Math.round(ease * target));
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>;
};

/* ─── Floating particle ───────────────────────────────────────── */
const Particle = ({ style }) => (
  <div className="absolute w-px h-px bg-white/20 rounded-full animate-pulse-subtle" style={style} />
);

/* ─── Live index chip ─────────────────────────────────────────── */
const IndexChip = ({ idx }) => {
  const up = (idx.change_pct ?? 0) >= 0;
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl bg-bg-card border border-border hover:border-border-strong transition-all duration-300 min-w-[110px]">
      <span className="label text-[9px]">{idx.name}</span>
      <span className="font-mono font-bold text-base text-white">
        {(idx.value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>
      <span className={`font-mono text-[11px] font-semibold flex items-center gap-0.5 ${up ? 'text-accent-green' : 'text-accent-red'}`}>
        {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        {up ? '+' : ''}{(idx.change_pct ?? 0).toFixed(2)}%
      </span>
    </div>
  );
};

/* ─── Feature card ────────────────────────────────────────────── */
const FeatureCard = ({ feature, onClick, delay }) => (
  <button
    onClick={() => onClick(feature.tab)}
    className="group relative card border border-border hover:border-white/20 text-left transition-all duration-300 hover:shadow-glow p-5 rounded-xl overflow-hidden"
    style={{ animationDelay: `${delay}ms`, animation: 'slide-in 0.5s ease-out both' }}
  >
    {/* Subtle gradient on hover */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${feature.gradient} pointer-events-none`} />

    <div className="relative">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${feature.iconBg}`}>
        <feature.icon size={16} className={feature.iconColor} />
      </div>
      <p className="font-semibold text-sm text-white mb-1">{feature.title}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{feature.desc}</p>
      <div className="mt-3 flex items-center gap-1 text-[11px] text-text-muted group-hover:text-white transition-colors">
        <span>Open</span>
        <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
    {feature.live && (
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle" />
        <span className="text-[9px] text-accent-green font-bold">LIVE</span>
      </div>
    )}
  </button>
);

const FEATURES = [
  {
    tab: 'signals', title: 'Signal Radar', live: true,
    desc: '3-step AI agent: detect insider → enrich context → generate alert. NSE live data.',
    icon: Activity, gradient: 'from-accent-green/5 to-transparent',
    iconBg: 'bg-accent-green/10', iconColor: 'text-accent-green',
  },
  {
    tab: 'smartmoney', title: 'Smart Money Flow', live: true,
    desc: 'Track FII/DII flows, bulk deals, institutional block trades in real time.',
    icon: TrendingUp, gradient: 'from-accent-blue/5 to-transparent',
    iconBg: 'bg-accent-blue/10', iconColor: 'text-accent-blue',
  },
  {
    tab: 'radar', title: 'Opportunity Radar', live: true,
    desc: 'AI-scored unified feed: insider trades + corporate events + FII signals, ranked by urgency.',
    icon: Radar, gradient: 'from-accent-yellow/5 to-transparent',
    iconBg: 'bg-accent-yellow/10', iconColor: 'text-accent-yellow',
  },
  {
    tab: 'market', title: 'Market Pulse', live: true,
    desc: 'NIFTY 50 + sector indices, advance/decline breadth, live market health dashboard.',
    icon: BarChart2, gradient: 'from-white/3 to-transparent',
    iconBg: 'bg-white/10', iconColor: 'text-white',
  },
  {
    tab: 'patterns', title: 'Chart Patterns', live: true,
    desc: 'Real yfinance OHLC — detects 7 patterns: 52W breakout, Golden Cross, MACD, RSI, more.',
    icon: GitBranch, gradient: 'from-accent-purple/5 to-transparent',
    iconBg: 'bg-accent-purple/10', iconColor: 'text-accent-purple',
  },
  {
    tab: 'watchlist', title: 'Watchlist', live: true,
    desc: 'Track your stocks with live quotes, alerts, and price movement monitoring.',
    icon: Star, gradient: 'from-accent-yellow/5 to-transparent',
    iconBg: 'bg-accent-yellow/10', iconColor: 'text-accent-yellow',
  },
  {
    tab: 'portfolio', title: 'Portfolio X-Ray', live: true,
    desc: 'Paste your mutual fund holdings — get live NAV from AMFI, risk analysis, AI insights.',
    icon: Briefcase, gradient: 'from-accent-green/5 to-transparent',
    iconBg: 'bg-accent-green/10', iconColor: 'text-accent-green',
  },
  {
    tab: 'chat', title: 'AI Market Chat', live: true,
    desc: 'Ask anything. Real-time market data injected into every response. Portfolio-aware.',
    icon: MessageSquare, gradient: 'from-accent-blue/5 to-transparent',
    iconBg: 'bg-accent-blue/10', iconColor: 'text-accent-blue',
  },
];

const STATS = [
  { label: 'NSE Stocks Tracked',   value: 500,    suffix: '+',  icon: Database  },
  { label: 'Mutual Fund Schemes',  value: 10000,  suffix: '+',  icon: Briefcase },
  { label: 'AI Signals / Day',     value: 3,      suffix: '-step Agent', icon: Brain },
  { label: 'Data Sources',         value: 6,      suffix: ' APIs', icon: Shield  },
];

/* ─── News-style live feed strip ─────────────────────────────── */
const LiveFeedStrip = ({ indices }) => {
  if (!indices.length) return null;
  const items = [...indices, ...indices];
  return (
    <div className="w-full overflow-hidden bg-bg-secondary border-b border-border-subtle">
      <div className="ticker-tape flex items-center py-1.5">
        {items.map((idx, i) => {
          const up = (idx.change_pct ?? 0) >= 0;
          return (
            <React.Fragment key={i}>
              <span className="font-mono text-[11px] font-semibold text-text-secondary whitespace-nowrap px-2">{idx.name}</span>
              <span className="font-mono text-[11px] font-bold text-white whitespace-nowrap">
                {(idx.value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className={`font-mono text-[11px] font-semibold px-1 ${up ? 'text-accent-green' : 'text-accent-red'}`}>
                {up ? '▲' : '▼'} {Math.abs(idx.change_pct ?? 0).toFixed(2)}%
              </span>
              <span className="text-border-strong px-3">|</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ─── FII/DII Mini Badge ──────────────────────────────────────── */
const FIIBadge = ({ fii }) => {
  if (!fii) return null;
  const fiiUp = (fii.fiiNetValue ?? 0) >= 0;
  const diiUp = (fii.diiNetValue ?? 0) >= 0;
  
  // Get today's date in IST format
  const today = new Date();
  const todayIST = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayStr = todayIST.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const displayDate = fii.date || todayStr;
  
  return (
    <div className="flex items-center gap-4 bg-bg-card border border-border rounded-xl px-5 py-3">
      <div className="text-center">
        <p className="label mb-0.5">FII Net Today</p>
        <p className={`font-mono font-bold text-sm ${fiiUp ? 'text-accent-green' : 'text-accent-red'}`}>
          ₹{fiiUp ? '+' : ''}{(fii.fiiNetValue ?? 0).toFixed(0)} Cr
        </p>
      </div>
      <div className="w-px h-8 bg-border-subtle" />
      <div className="text-center">
        <p className="label mb-0.5">DII Net Today</p>
        <p className={`font-mono font-bold text-sm ${diiUp ? 'text-accent-green' : 'text-accent-red'}`}>
          ₹{diiUp ? '+' : ''}{(fii.diiNetValue ?? 0).toFixed(0)} Cr
        </p>
      </div>
      <div className="w-px h-8 bg-border-subtle hidden sm:block" />
      <div className="text-center hidden sm:block">
        <p className="label mb-0.5">Date</p>
        <p className="font-mono text-xs text-text-secondary">{displayDate}</p>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const HomePage = ({ onNavigate }) => {
  const [indices, setIndices] = useState([]);
  const [fii, setFii]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [mktRes, fiiRes] = await Promise.allSettled([
          axios.get('/api/market/indices'),
          axios.get('/api/market/fii'),
        ]);
        if (mktRes.status === 'fulfilled' && mktRes.value.data?.indices?.length) {
          setIndices(mktRes.value.data.indices);
        }
        if (fiiRes.status === 'fulfilled') {
          const d = fiiRes.value.data;
          const arr = Array.isArray(d) ? d : (d?.data ?? []);
          if (arr.length) setFii(arr[arr.length - 1]);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);

  // Particles (decorative background dots)
  const particles = Array.from({ length: 30 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    animationDelay: `${(i * 0.3) % 3}s`,
    width: `${1 + (i % 3)}px`,
    height: `${1 + (i % 3)}px`,
  }));

  const isMarketOpen = () => {
    const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = ist.getDay();
    if (day === 0 || day === 6) return false;
    const mins = ist.getHours() * 60 + ist.getMinutes();
    return mins >= 555 && mins <= 930;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Decorative particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
        {/* Radial glow centre */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.012] blur-3xl pointer-events-none" />
      </div>

      {/* Live ticker strip */}
      <LiveFeedStrip indices={indices} />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-12">
        {/* Live badge */}
        <div className="flex items-center gap-2 bg-accent-green/10 border border-accent-green/20 rounded-full px-4 py-1.5 mb-8"
             style={{ animation: 'slide-in 0.4s ease-out' }}>
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-subtle" />
          <span className="text-xs font-bold text-accent-green tracking-wider uppercase">
            {isMarketOpen() ? 'NSE Market Open — Live Data' : 'Market Closed — Last Close Data'}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tighter mb-4"
            style={{ animation: 'slide-in 0.5s ease-out 0.1s both' }}>
          BharatAlpha AI
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary max-w-xl leading-relaxed mb-2"
           style={{ animation: 'slide-in 0.5s ease-out 0.2s both' }}>
          India's first <span className="text-white font-semibold">agentic financial intelligence</span> platform.
          Real NSE data, real AMFI NAVs, real AI alpha.
        </p>
        <p className="text-sm text-text-muted mb-8"
           style={{ animation: 'slide-in 0.5s ease-out 0.25s both' }}>
          ET AI Hackathon 2026 · Problem Statement #6 · AI for the Indian Investor
        </p>

        {/* Universal Search — searches stocks, mutual funds, indices live */}
        <div className="w-full flex justify-center mb-10" style={{ animation: 'slide-in 0.5s ease-out 0.28s both' }}>
          <SearchBar onNavigate={onNavigate} variant="hero" />
        </div>

        {/* Live indices row */}
        {!loading && indices.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center mb-10"
               style={{ animation: 'slide-in 0.5s ease-out 0.3s both' }}>
            {indices.slice(0, 6).map((idx, i) => (
              <IndexChip key={i} idx={idx} />
            ))}
          </div>
        )}
        {loading && (
          <div className="flex gap-3 justify-center mb-10">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="w-[110px] h-[72px] rounded-xl bg-bg-card border border-border animate-pulse" />
            ))}
          </div>
        )}

        {/* FII/DII badge */}
        {fii && (
          <div className="mb-10" style={{ animation: 'slide-in 0.5s ease-out 0.35s both' }}>
            <FIIBadge fii={fii} />
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 justify-center" style={{ animation: 'slide-in 0.5s ease-out 0.4s both' }}>
          <button
            onClick={() => onNavigate('signals')}
            className="group flex items-center gap-2 px-8 py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-100 transition-all hover:shadow-glow active:scale-[0.98]"
          >
            <Zap size={15} className="fill-black" />
            Launch Signal Radar
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('chat')}
            className="group flex items-center gap-2 px-8 py-3.5 bg-transparent text-white font-semibold text-sm rounded-xl border border-border hover:border-border-strong hover:bg-bg-hover transition-all active:scale-[0.98]"
          >
            <MessageSquare size={15} />
            Ask AI a Question
          </button>
        </div>
      </section>

      {/* ── STATS ROW ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-12 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="card border border-border rounded-xl p-4 text-center"
              style={{ animation: `slide-in 0.5s ease-out ${0.5 + i * 0.08}s both` }}
            >
              <s.icon size={16} className="text-text-muted mx-auto mb-2" />
              <p className="font-mono font-black text-2xl text-white">
                <AnimCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="label text-[9px] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-16 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border-subtle" />
          <p className="label text-center px-4">8 Intelligence Modules</p>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.tab} feature={f} onClick={onNavigate} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── AGENTIC PIPELINE EXPLAINER ─────────────────────────── */}
      <section className="relative z-10 px-6 pb-16 max-w-4xl mx-auto w-full">
        <div className="card border border-border rounded-2xl p-8">
          <p className="label text-center mb-6">Agentic Architecture — 3-Step Pipeline</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {[
              { step: '01', title: 'Detect', desc: 'NSE APIs scan insider trades, bulk deals & corporate events in real time', color: 'text-accent-green', bg: 'bg-accent-green/10 border-accent-green/20' },
              { step: '02', title: 'Enrich', desc: 'Claude Haiku cross-references patterns, scores urgency 1-10 with context', color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/20' },
              { step: '03', title: 'Alert', desc: 'Claude Sonnet generates actionable trade alert with entry, target, stop loss', color: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue/20' },
            ].map((p, i) => (
              <React.Fragment key={i}>
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${p.bg}`}>
                    <span className={`font-mono text-xs font-black ${p.color}`}>{p.step}</span>
                  </div>
                  <p className={`font-bold text-sm ${p.color}`}>{p.title}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.desc}</p>
                </div>
                {i < 2 && (
                  <div className="sm:flex-none flex sm:flex-col items-center gap-1">
                    <div className="w-8 h-px bg-border-strong sm:w-px sm:h-8" />
                    <ChevronRight size={12} className="text-border-strong rotate-0 sm:rotate-90" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES ───────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-16 max-w-4xl mx-auto w-full">
        <p className="label text-center mb-4">Real Free Data Sources</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'AMFI India (portal.amfiindia.com)',
            'NSE Insider Trades API',
            'NSE Bulk Deals API',
            'NSE FII/DII Flow API',
            'NSE Event Calendar',
            'Yahoo Finance (yfinance)',
            'Claude Sonnet 4 (Analysis)',
            'Claude Haiku 4 (Scoring)',
          ].map((src, i) => (
            <span key={i} className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-bg-card border border-border text-text-secondary hover:text-white hover:border-border-strong transition-colors cursor-default">
              {src}
            </span>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border-subtle py-6 px-6 text-center">
        <p className="text-xs text-text-muted">
          BharatAlpha AI · ET AI Hackathon 2026 · Built for Problem Statement #6
        </p>
        <p className="text-[10px] text-text-disabled mt-1">
          For educational purposes only. Not SEBI-registered investment advice.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
