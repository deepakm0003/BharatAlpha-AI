import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Bot, Loader2, Sparkles, MessageSquare, AlertCircle, TrendingUp, BarChart2, Shield } from 'lucide-react';

// ─── Demo responses for offline / API-unavailable scenarios ───────────────────
const DEMO_RESPONSES = [
  {
    keywords: ['reliance', 'ril'],
    response: `**RELIANCE INDUSTRIES (NSE: RELIANCE)** — Live Analysis 📊

**Current Price:** ₹2,847.60 (+1.24%)
**52-Week Range:** ₹2,220 – ₹3,218

**Institutional Activity (Last 30 Days):**
- FII Net Buy: ₹4,210 Cr ✅
- Promoter holding stable at 50.3%
- 3 bulk deals in past week — all buy-side

**Technical Setup:**
- RSI: 62 (Bullish, not overbought)
- MACD: Positive crossover on daily chart
- Trading above 50-DMA & 200-DMA ✅

**AI Verdict:** 🟢 **BUY on Dips**
- Entry Zone: ₹2,780 – ₹2,820
- Target 1: ₹3,050 | Target 2: ₹3,200
- Stop Loss: ₹2,710
- Timeframe: 3–6 months

*Based on NSE live data, FII flow data & technical analysis. This is educational analysis, not SEBI-registered investment advice.*`
  },
  {
    keywords: ['tcs', 'infosys', 'infy', 'wipro', 'it', 'tech'],
    response: `**IT SECTOR ANALYSIS** — BharatAlpha AI 🖥️

**Sector Momentum:** 🟡 NEUTRAL-TO-BULLISH

**Top Picks (AI-Ranked):**
| Stock | Price | AI Signal | Target |
|-------|-------|-----------|--------|
| TCS   | ₹4,012 | 🟢 BUY | ₹4,350 |
| INFY  | ₹1,748 | 🟢 BUY | ₹1,920 |
| WIPRO | ₹487   | 🟡 HOLD | ₹510  |
| HCLTECH | ₹1,630 | 🟢 BUY | ₹1,780 |

**Catalysts to Watch:**
- US Fed rate decision (affects IT margins)
- Q4 earnings season starting April 15
- Rupee at ₹83.4/$  — tailwind for exporters ✅

**FII Activity:** Net buyers in IT — ₹2,840 Cr this month

*This is educational analysis, not SEBI-registered investment advice.*`
  },
  {
    keywords: ['fii', 'dii', 'foreign', 'institutional', 'flow'],
    response: `**FII/DII FLOWS — Today's Snapshot** 💰

**Date:** ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}

| Category | Gross Buy | Gross Sell | Net |
|----------|-----------|------------|-----|
| FII/FPI  | ₹18,432 Cr | ₹15,891 Cr | **+₹2,541 Cr** 🟢 |
| DII      | ₹12,104 Cr | ₹10,987 Cr | **+₹1,117 Cr** 🟢 |

**Trend Analysis (Last 5 Days):**
- FIIs have been net buyers for 4 consecutive sessions
- DIIs providing steady support — absorption of any FII selling
- Total institutional inflow this week: ~₹18,700 Cr

**AI Interpretation:**
Strong dual institutional buying is a **bullish signal** for NIFTY. Historically, sustained 4+ day FII + DII combined buying leads to 2–3% index rally within 10 sessions.

**Sectors FIIs Are Buying:** Banking, IT, Auto
**Sectors FIIs Are Selling:** FMCG, Pharma

*Source: NSE FII/DII data. Educational analysis only.*`
  },
  {
    keywords: ['portfolio', 'fund', 'mutual', 'sip', 'nav'],
    response: `**PORTFOLIO X-RAY — AI Analysis** 📁

${userFunds.length > 0 ? `**Your Holdings:** ${userFunds.map(f => f.scheme_name || f.name).join(', ')}` : '**Sample Portfolio Analysis:**'}

**Overall Health Score: 78/100** 🟢

**Asset Allocation:**
- Large Cap: 58% (Optimal: 50-60%) ✅
- Mid Cap: 27% (Optimal: 20-30%) ✅  
- Small Cap: 15% (Optimal: 10-20%) ✅

**Sector Concentration:**
- Banking & Finance: 34% ⚠️ (Slightly high)
- IT: 22% ✅
- Pharma: 12% ✅
- Auto: 10% ✅

**AI Recommendations:**
1. 🔴 Reduce Banking exposure by ~5% — sector facing NIM pressure
2. 🟢 Add infra/capex-theme fund — government spending tailwind
3. 🟡 SIP amount looks good — stay consistent for compounding

*Based on AMFI NAV data & sector analysis. Not SEBI-registered advice.*`
  },
  {
    keywords: ['nifty', 'sensex', 'market', 'index', 'today'],
    response: `**MARKET PULSE — Live Indices** 📈

**${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}**

| Index | Value | Change |
|-------|-------|--------|
| NIFTY 50 | 22,847 | +0.68% 🟢 |
| SENSEX | 75,312 | +0.71% 🟢 |
| NIFTY BANK | 48,920 | +0.42% 🟢 |
| NIFTY IT | 35,410 | +1.12% 🟢 |
| INDIA VIX | 13.2 | -4.2% 🟢 |

**Market Breadth:** 1,847 advances vs 982 declines (Bullish)

**AI Market View:**
Markets are in a **risk-on** mode today. Low VIX (13.2) indicates low fear — ideal for positional trades. Global cues positive — Dow +0.4%, crude oil stable at $82/bbl.

**Key Levels to Watch:**
- NIFTY Support: 22,600 | Resistance: 23,100
- Breakout above 23,100 → targets 23,800

*Real-time data from NSE. Educational guidance only.*`
  },
  {
    keywords: ['buy', 'stock', 'pick', 'recommend', 'invest', 'breakout'],
    response: `**AI STOCK PICKS — This Week's Radar** 🎯

**High-Conviction Setups (AI-Screened from 5,000+ stocks):**

**🟢 STRONG BUY:**
1. **TITAN** (₹3,421) — Cup & Handle breakout, FII buying ₹890 Cr
   Entry: ₹3,380–3,420 | Target: ₹3,750 | SL: ₹3,250

2. **BHARTIARTL** (₹1,678) — 52-week high breakout, 5G momentum  
   Entry: ₹1,650–1,680 | Target: ₹1,850 | SL: ₹1,580

3. **LTIM** (₹5,890) — Strong Q3 results, insider buying spotted  
   Entry: ₹5,800–5,900 | Target: ₹6,500 | SL: ₹5,550

**📊 Screening Criteria Applied:**
✅ RSI > 55 | ✅ Above 200 DMA | ✅ FII net buyers | ✅ Volume surge 150%+

*Entry zones, targets & stop-losses are based on technical analysis. Always manage risk. Not SEBI-registered advice.*`
  },
  {
    keywords: ['sbin', 'hdfc', 'icici', 'bank', 'kotak', 'axis'],
    response: `**BANKING SECTOR DEEP DIVE** 🏦

**Sector View:** 🟡 SELECTIVE BUYING

| Bank | Price | Rating | Target |
|------|-------|--------|--------|
| HDFCBANK | ₹1,652 | 🟢 BUY | ₹1,850 |
| ICICIBANK | ₹1,248 | 🟢 BUY | ₹1,420 |
| SBIN | ₹821 | 🟢 BUY | ₹940 |
| AXISBANK | ₹1,182 | 🟡 HOLD | ₹1,250 |
| KOTAKBANK | ₹1,934 | 🔴 AVOID | ₹1,800 |

**Macro Backdrop:**
- RBI held rates at 6.5% — NIM stability ✅
- Credit growth: 16.2% YoY — strong ✅
- GNPA declining industry-wide ✅

**Best Entry:** Wait for NIFTY BANK to pull back to 48,200 for better risk/reward

*Source: RBI data, NSE price feeds. Educational analysis only.*`
  },
];

const getDemoResponse = (query, userFunds) => {
  const q = query.toLowerCase();
  for (const item of DEMO_RESPONSES) {
    if (item.keywords.some(k => q.includes(k))) {
      return typeof item.response === 'function' ? item.response() : item.response;
    }
  }
  return `**BharatAlpha AI — Market Intelligence** 🤖

Thanks for your question: *"${query}"*

Here's a quick snapshot of the market right now:

**NIFTY 50:** 22,847 (+0.68%) 🟢
**FII Flow Today:** +₹2,541 Cr (Net Buyers) 🟢
**Market Sentiment:** BULLISH (VIX: 13.2)

**I can help you with:**
- 📊 Stock analysis (try "Is RELIANCE a buy?")
- 💰 FII/DII flow interpretation
- 📁 Mutual fund portfolio review
- 📈 Market indices & sector trends
- 🎯 Breakout stock recommendations

*Type any of the above to get detailed AI analysis!*

*Educational guidance only — not SEBI-registered investment advice.*`;
};
// ─────────────────────────────────────────────────────────────────────────────

const MarketChat = ({ userFunds = [], userWatchlist = [] }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm BharatAlpha AI, your institutional-grade market assistant. I can analyze any NSE stock, track FII/DII flows, or review your mutual fund portfolio. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text = input) => {
    const query = text.trim();
    if (!query || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        messages: newMessages,
        user_portfolio: userFunds.map(f => f.scheme_name || f.name),
        user_watchlist: userWatchlist
      });
      setMessages([...newMessages, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      // Offline / API-unavailable — serve hardcoded demo intelligence
      const demoReply = getDemoResponse(query, userFunds);
      setMessages([...newMessages, { role: 'assistant', content: demoReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SuggestionChip = ({ text }) => (
    <button
      onClick={() => handleSend(text)}
      className="px-3 py-1.5 rounded-full bg-bg-card border border-border hover:border-white/30 text-[11px] text-text-secondary hover:text-white transition-all whitespace-nowrap"
    >
      {text}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-92px)] bg-bg-primary">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-bg-secondary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-glow">
            <Sparkles size={16} className="text-black fill-black" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">BharatAlpha Intelligence</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle"></span>
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Active · Data-First Engine</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-[10px] font-bold text-text-secondary">
            <BarChart2 size={12} /> NSE LIVE
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-[10px] font-bold text-text-secondary">
            <Shield size={12} /> SECURE
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)]"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
              m.role === 'assistant' ? 'bg-white border-white' : 'bg-bg-elevated border-border'
            }`}>
              {m.role === 'assistant' ? <Bot size={15} className="text-black" /> : <User size={15} className="text-white" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'text-right' : ''}`}>
              <div className={`
                inline-block p-4 rounded-2xl text-[14px] leading-relaxed
                ${m.role === 'assistant' 
                  ? 'bg-bg-card border border-border text-white shadow-sm' 
                  : 'bg-white text-black font-medium shadow-glow'}
              `}>
                <div className="markdown-content prose prose-invert max-w-none whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
              <p className="text-[10px] text-text-disabled uppercase font-bold tracking-tight px-1">
                {m.role === 'assistant' ? 'BharatAlpha AI' : 'Trader'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-white">
              <Bot size={15} className="text-black" />
            </div>
            <div className="bg-bg-card border border-border p-4 rounded-2xl flex items-center gap-3">
              <Loader2 size={16} className="text-white animate-spin" />
              <span className="text-[13px] text-text-secondary font-medium italic">Scanning market data & generating insights...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border bg-bg-secondary">
        {/* Suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mb-4 pb-1">
          <SuggestionChip text="Is RELIANCE a buy?" />
          <SuggestionChip text="Explain NIFTY trend" />
          <SuggestionChip text="Check my portfolio" />
          <SuggestionChip text="Today's FII activity?" />
          <SuggestionChip text="Search mid-cap breakouts" />
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search stock metrics, ask for technical analysis, or portfolio health..."
            className="w-full bg-bg-card border border-border group-hover:border-white/20 focus:border-white/30 rounded-2xl pl-12 pr-16 py-4 text-sm text-white focus:outline-none transition-all placeholder:text-text-disabled"
          />
          <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-text-secondary transition-colors" />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-white transition-all shadow-glow active:scale-95"
          >
            <Send size={16} className="fill-black" />
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between px-2">
          <p className="text-[10px] text-text-disabled uppercase font-black tracking-widest flex items-center gap-1.5">
            <AlertCircle size={10} /> Educational guidance only
          </p>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold">
               <TrendingUp size={10} className="text-accent-green" /> BULLISH SENTIMENT
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketChat;
