import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Briefcase, Plus, X, ArrowRight, Loader2, CheckCircle, 
  AlertTriangle, TrendingUp, Search, Info, ExternalLink,
  ShieldCheck, BarChart4, PieChart as PieChartIcon, Zap
} from 'lucide-react';

const HealthBadge = ({ health }) => {
  if (health === 'GOOD') return <span className="px-2.5 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-[10px] font-black uppercase tracking-widest border border-accent-green/20">Institutional Grade</span>;
  if (health === 'NEEDS_ATTENTION') return <span className="px-2.5 py-0.5 rounded-full bg-accent-red/10 text-accent-red text-[10px] font-black uppercase tracking-widest border border-accent-red/20">Review Required</span>;
  return <span className="px-2.5 py-0.5 rounded-full bg-accent-yellow/10 text-accent-yellow text-[10px] font-black uppercase tracking-widest border border-accent-yellow/20">Moderate Risk</span>;
};

const MetricCard = ({ label, value, sub, accent, icon: Icon }) => (
  <div className={`bg-bg-card border border-border rounded-2xl p-5 hover:border-white/10 transition-all ${accent}`}>
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={14} className="text-text-muted" />}
      <p className="text-[10px] font-bold text-text-disabled uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-2xl font-black text-white mb-1.5">{value}</p>
    {sub && <p className="text-[12px] text-text-secondary leading-normal">{sub}</p>}
  </div>
);

const PortfolioXRay = ({ setUserFunds }) => {
  const [funds, setFunds] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const suggestionRef = useRef(null);

  // Live Search Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 3) {
        setSuggestions([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await axios.get(`/api/portfolio/search?q=${inputValue}`);
        setSuggestions(res.data.results || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const addFund = (fundName) => {
    const v = fundName || inputValue.trim();
    if (v && !funds.includes(v) && funds.length < 10) {
      setFunds([...funds, v]);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const removeFund = (f) => setFunds(funds.filter(x => x !== f));

  const analyzePortfolio = async () => {
    if (!funds.length) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/portfolio/analyze', { funds });
      setResult(response.data);
      if (setUserFunds) setUserFunds(funds);
    } catch (err) {
      setError('Analysis failed. Please confirm the backend is running with valid API keys.');
    } finally {
      setLoading(false);
    }
  };

  // ─── RESULTS VIEW ───────────────────────────────────────────
  if (result) {
    const { analysis, funds_analyzed } = result;

    return (
      <div className="flex flex-col w-full min-h-screen bg-bg-primary">
        {/* Sticky Header */}
        <div className="w-full h-14 border-b border-border bg-bg-secondary/90 backdrop-blur-xl sticky top-[92px] z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-text-muted" />
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Institutional X-Ray</h2>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <HealthBadge health={analysis?.overall_health} />
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] text-text-disabled font-bold flex items-center gap-1.5 uppercase">
               <Zap size={10} className="text-accent-yellow" /> OpenAI GPT-4o Analyzed
             </span>
             <button onClick={() => setResult(null)} className="text-[11px] font-bold text-white hover:text-accent-blue transition-colors underline underline-offset-4 decoration-white/20">New Analysis</button>
          </div>
        </div>

        <div className="p-8 max-w-[1400px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Health Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-bg-card border border-border rounded-3xl p-8 relative overflow-hidden group shadow-glow">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={120} className="text-white" />
              </div>
              
              <div className="relative z-10">
                <p className="text-[10px] font-black text-text-disabled uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <BarChart4 size={14} className="text-accent-blue" /> Executive Summary
                </p>
                <h1 className="text-4xl font-black text-white tracking-tight mb-6 leading-tight">
                  {analysis?.overall_health === 'GOOD' ? 'Portfolio is Well Optimized' : 
                   analysis?.overall_health === 'FAIR' ? 'Stable with Room for Growth' : 
                   'Portfolio Strategy Requires Update'}
                </h1>
                <p className="text-lg text-text-secondary leading-relaxed max-w-2xl font-medium">
                  {analysis?.summary}
                </p>
                
                <div className="mt-8 flex flex-wrap gap-4">
                   <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <TrendingUp size={14} className="text-accent-green" />
                      <span className="text-xs font-bold text-text-secondary">Est. Ret: <span className="text-white">{analysis?.estimated_xirr_range}</span></span>
                   </div>
                   <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-accent-yellow" />
                      <span className="text-xs font-bold text-text-secondary">Exp. Drag: <span className="text-white">{analysis?.expense_drag}</span></span>
                   </div>
                </div>
              </div>
            </div>

            {/* Top Recommendation */}
            <div className="bg-white rounded-3xl p-8 flex flex-col justify-between shadow-glow relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gray-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-6">
                  <Zap size={20} className="text-accent-yellow fill-accent-yellow" />
                </div>
                <h3 className="text-xl font-black text-black leading-tight mb-4 tracking-tight">Key Action Item</h3>
                <p className="text-sm font-semibold text-gray-600 leading-relaxed italic">
                  "{analysis?.top_recommendation}"
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 relative z-10">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle size={12} className="text-accent-green" /> Verified Insight
                 </p>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              label="Overlap Analysis"
              value="Cluster Risk"
              sub={analysis?.overlap_analysis}
              icon={PieChartIcon}
            />
            
            {/* Alternatives */}
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight size={14} className="text-accent-blue" />
                <p className="text-[10px] font-bold text-text-disabled uppercase tracking-widest">Growth Alternatives</p>
              </div>
              <div className="space-y-3">
                {analysis?.suggested_alternatives?.map((alt, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary border border-border group hover:border-white/20 transition-all cursor-pointer">
                    <span className="text-[13px] font-bold text-white group-hover:text-accent-blue transition-colors">{alt}</span>
                    <ExternalLink size={12} className="text-text-disabled group-hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Funds Table */}
          <div className="bg-bg-card border border-border rounded-3xl overflow-hidden">
            <div className="px-8 py-5 border-b border-border bg-bg-secondary flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Dynamic Asset Feed</h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5 text-[10px] text-text-disabled font-bold">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle"></div> LIVE SYNC
                 </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary/50">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-text-disabled uppercase tracking-[0.2em]">Asset Name</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-text-disabled uppercase tracking-[0.2em]">Price / NAV</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-text-disabled uppercase tracking-[0.2em]">Source</th>
                    <th className="px-8 py-4 text-center text-[10px] font-black text-text-disabled uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {funds_analyzed?.map((fund, idx) => {
                    const isFlagged = analysis?.funds_to_consider_replacing?.includes(fund.name);
                    return (
                      <tr key={idx} className="group hover:bg-white/2 transition-colors">
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-bold text-white group-hover:text-accent-blue transition-colors ml-0.5">{fund.name}</p>
                            <p className="text-[10px] text-text-disabled font-bold uppercase mt-1">Category: {fund.category || 'Equity'}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="font-mono font-bold text-white text-md">₹{fund.nav?.toLocaleString()}</p>
                          <p className="text-[10px] text-text-disabled font-medium mt-1 uppercase tracking-tighter">As of {fund.date}</p>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-[10px] text-text-secondary">
                          <span className="px-2 py-1 rounded bg-bg-secondary border border-border uppercase font-black tracking-tight">{fund.source || 'mfapi.in'}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {isFlagged ? (
                            <span className="px-3 py-1 rounded-full bg-accent-red/10 text-accent-red text-[10px] font-black uppercase tracking-widest border border-accent-red/20">Replace</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-accent-green/10 text-accent-green text-[10px] font-black uppercase tracking-widest border border-accent-green/20">Optimized</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── INPUT STATE ───────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05)_0%,transparent_50%)]"></div>
      
      {/* Search Bar Container */}
      <div className="w-full h-14 border-b border-border bg-bg-secondary/50 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase size={18} className="text-text-muted" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Portfolio Builder</h2>
        </div>
        <div className="flex items-center gap-4">
           {funds.length > 0 && (
             <button 
               onClick={analyzePortfolio}
               disabled={loading}
               className="btn-primary px-4 py-1.5 text-[11px] h-auto font-black flex items-center gap-2 group"
             >
               {loading ? <Loader2 size={12} className="animate-spin" /> : <><Zap size={12} className="group-hover:text-accent-yellow" /> Launch X-Ray</>}
             </button>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-12 relative z-10">
          
          {/* Hero */}
          <div className="text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-card border border-border shadow-sm mb-2">
               <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse-subtle"></span>
               <span className="text-[10px] font-black text-text-disabled uppercase tracking-[0.2em]">Institutional Engine</span>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter leading-tight italic">
               See Inside Your <span className="text-accent-blue not-italic">Wealth</span>.
             </h1>
             <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed font-medium">
               Enter your mutual funds or stock tickers. Get instant ChatGPT-4o powered X-Ray analysis using live market data.
             </p>
          </div>

          {/* Builder UI */}
          <div className="space-y-6">
            <div className="relative" ref={suggestionRef}>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                {searchLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search funds (e.g. Parag Parikh...) or add stocks (e.g. TCS)"
                className="w-full bg-bg-card border border-border focus:border-white/20 rounded-2xl pl-12 pr-4 py-5 text-md text-white font-medium focus:outline-none focus:ring-4 focus:ring-accent-blue/10 transition-all placeholder:text-text-disabled"
              />
              
              {/* Suggestion Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        addFund(s.schemeName);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-white/5 border-b border-border last:border-0 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors">{s.schemeName}</p>
                        <p className="text-[10px] text-text-disabled uppercase tracking-widest font-bold mt-1">Scheme Code: {s.schemeCode}</p>
                      </div>
                      <Plus size={14} className="text-text-disabled group-hover:text-white" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fund Tags */}
            <div className="flex flex-wrap gap-2 justify-center">
              {funds.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 bg-bg-card border border-border rounded-xl group hover:border-white/20 transition-all shadow-sm">
                  <span className="text-[13px] font-bold text-white">{f}</span>
                  <button onClick={() => removeFund(f)} className="text-text-muted hover:text-accent-red transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {funds.length > 0 && (
                <p className="w-full text-center text-[10px] font-black text-text-disabled uppercase tracking-widest mt-4">
                  {funds.length}/10 assets added
                </p>
              )}
            </div>
          </div>

          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
             <div className="flex flex-col items-center gap-3 text-center">
               <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center">
                 <ShieldCheck size={18} className="text-accent-green" />
               </div>
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Live API Sync</p>
             </div>
             <div className="flex flex-col items-center gap-3 text-center">
               <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center">
                 <Zap size={18} className="text-accent-yellow" />
               </div>
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">ChatGPT-4o Insight</p>
             </div>
             <div className="flex flex-col items-center gap-3 text-center">
               <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center">
                 <BarChart4 size={18} className="text-accent-blue" />
               </div>
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Stock + MF Support</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioXRay;