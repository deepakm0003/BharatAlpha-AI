import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, Briefcase, BarChart2, Star, Zap, GitBranch, Radar, MessageSquare, Home, Search } from 'lucide-react';

const TABS = [
  { id: 'home',        label: 'Home',               icon: Home,           dot: false },
  { id: 'signals',     label: 'Signal Radar',       icon: Activity,       dot: true  },
  { id: 'smartmoney',  label: 'Smart Money',        icon: TrendingUp,     dot: false },
  { id: 'radar',       label: 'Opportunity Radar',  icon: Radar,          dot: true  },
  { id: 'market',      label: 'Market Pulse',       icon: BarChart2,      dot: false },
  { id: 'watchlist',   label: 'Watchlist',          icon: Star,           dot: false },
  { id: 'patterns',    label: 'Chart Patterns',     icon: GitBranch,      dot: false },
  { id: 'portfolio',   label: 'Portfolio X-Ray',    icon: Briefcase,      dot: false },
  { id: 'chat',        label: 'AI Chat',            icon: MessageSquare,  dot: false },
  { id: 'search',      label: 'Search',             icon: Search,         dot: false },
];

const Navbar = ({ activeTab, setActiveTab }) => {
  const [time, setTime]       = useState(new Date());
  const [indices, setIndices] = useState([]);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Ticker data
  useEffect(() => {
    const load = () =>
      axios.get('/api/market/indices')
        .then(r => { if (r.data?.indices?.length) setIndices(r.data.indices); })
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const isMarketOpen = () => {
    const ist = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = ist.getDay();
    if (day === 0 || day === 6) return false;
    const mins = ist.getHours() * 60 + ist.getMinutes();
    return mins >= 555 && mins <= 930;
  };

  const marketOpen = isMarketOpen();
  const tickerItems = [...indices, ...indices]; // duplicate for seamless scroll

  const timeStr = time.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-secondary border-b border-border">

      {/* ── Row 1: Logo + Tabs + Status ── */}
      <div className="h-14 px-4 flex items-center gap-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 pr-5 mr-2 border-r border-border-subtle">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-glow">
            <Zap size={13} className="text-black fill-black" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[14px] font-bold text-white leading-none tracking-tight">BharatAlpha AI</p>
            <p className="text-[8px] text-text-muted tracking-[0.18em] uppercase mt-0.5">ET AI Hackathon 2026</p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none px-2">
          {TABS.map(({ id, label, icon: Icon, dot }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium
                  transition-all duration-200 whitespace-nowrap shrink-0
                  ${active
                    ? 'bg-white text-black shadow-glow'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'}
                `}
              >
                <Icon size={13} className={active ? 'text-black' : 'text-current'} />
                <span className="hidden md:inline">{label}</span>
                {dot && !active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle" />
                )}
                {/* animated underline */}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-black rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Market status + clock */}
        <div className="flex items-center gap-3 shrink-0 pl-3 border-l border-border-subtle ml-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-accent-green animate-pulse-subtle' : 'bg-border-strong'}`}
            />
            <span className={`text-[10px] font-bold tracking-wider ${marketOpen ? 'text-accent-green' : 'text-text-muted'}`}>
              NSE {marketOpen ? 'LIVE' : 'CLOSED'}
            </span>
          </div>
          <span className="hidden sm:block font-mono text-[10px] text-text-muted">{timeStr}</span>
        </div>
      </div>

      {/* ── Row 2: Ticker Tape (hidden on home — home has its own strip) ── */}
      {activeTab !== 'home' && (
        <div className="h-9 border-t border-border-subtle bg-bg-primary overflow-hidden flex items-center">
          <div className="ticker-tape flex items-center">
            {tickerItems.map((idx, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2 px-5 shrink-0">
                  <span className="font-mono text-[11px] font-semibold text-text-secondary whitespace-nowrap">
                    {idx.name}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-white whitespace-nowrap">
                    {idx.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold whitespace-nowrap ${idx.change_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
                  >
                    {idx.change_pct >= 0 ? '+' : ''}{idx.change_pct?.toFixed(2)}%
                  </span>
                </div>
                <div className="w-px h-3 bg-border-subtle shrink-0" />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
