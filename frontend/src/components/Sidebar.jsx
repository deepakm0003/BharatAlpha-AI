import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Briefcase, BarChart2, Star, Zap } from 'lucide-react';

const tabs = [
  { id: 'signals',    label: 'Signal Radar',   icon: Activity,   desc: 'Insider trades & bulk deals' },
  { id: 'smartmoney', label: 'Smart Money',    icon: TrendingUp, desc: 'FII/DII institutional flows' },
  { id: 'market',     label: 'Market Pulse',   icon: BarChart2,  desc: 'Live indices & sector view' },
  { id: 'watchlist',  label: 'Watchlist',      icon: Star,       desc: 'Track your stocks with AI' },
  { id: 'portfolio',  label: 'Portfolio X-Ray',icon: Briefcase,  desc: 'MF overlap & XIRR analysis' },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isMarketOpen = () => {
    const ist = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const h = ist.getHours();
    const m = ist.getMinutes();
    const dayOfWeek = ist.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const mins = h * 60 + m;
    return mins >= 555 && mins <= 930; // 9:15 - 15:30
  };

  const marketOpen = isMarketOpen();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-bg-secondary border-r border-border-subtle h-screen fixed left-0 top-0 z-50 overflow-hidden">
        
        {/* Logo */}
        <div className="px-6 pt-7 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-glow">
              <Zap size={14} className="text-black fill-black" />
            </div>
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">BharatAlpha AI</h1>
          </div>
          <p className="text-[10px] text-text-muted mt-1.5 font-medium tracking-widest uppercase">ET AI Hackathon 2026</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="label px-3 mb-2">Navigation</p>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-bg-elevated text-text-primary shadow-glow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                )}
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-text-muted group-hover:text-text-secondary'}`}
                />
                <span className="leading-none">{tab.label}</span>
                {tab.id === 'signals' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Market Status */}
        <div className="px-4 pb-6 mt-auto">
          <div className="bg-bg-tertiary border border-border-subtle rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="label">Markets</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-accent-green animate-pulse-subtle' : 'bg-border-strong'}`} />
                <span className={`text-[10px] font-bold ${marketOpen ? 'text-accent-green' : 'text-text-muted'}`}>
                  {marketOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">NSE / BSE</span>
                <span className={`text-[10px] font-medium ${marketOpen ? 'text-accent-green' : 'text-text-muted'}`}>
                  {marketOpen ? 'Live' : 'Closed'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-border-subtle">
              <span className="font-mono text-[11px] text-text-muted">
                {time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-border-subtle z-50 flex justify-around items-stretch px-2 pt-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all min-w-0 ${
                isActive ? 'text-white bg-bg-elevated' : 'text-text-muted'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium truncate">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;

