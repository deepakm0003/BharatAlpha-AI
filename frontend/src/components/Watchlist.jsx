import React, { useState } from 'react';
import axios from 'axios';
import { Star, Plus, X, Search, TrendingUp, TrendingDown, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

const DEFAULT_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'BAJFINANCE'];

const QuoteRow = ({ quote }) => {
  if (!quote) return null;
  const isPos = (quote.change_pct || 0) >= 0;
  return (
    <div className="flex items-center justify-between py-3 px-5 border-b border-border-subtle last:border-0 hover:bg-bg-hover transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
          <span className="text-xs font-bold text-text-secondary font-mono">{quote.symbol?.slice(0, 2)}</span>
        </div>
        <div>
          <p className="font-mono font-bold text-text-primary text-sm">{quote.symbol}</p>
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono mt-0.5">
            <span>H: ₹{quote.high?.toLocaleString('en-IN')}</span>
            <span className="text-border-strong">·</span>
            <span>L: ₹{quote.low?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <p className="font-mono font-bold text-text-primary text-base">
          {quote.price ? `₹${quote.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </p>
        {quote.change_pct !== null && quote.change_pct !== undefined && (
          <div className={`flex items-center justify-end gap-1 text-xs font-bold font-mono ${isPos ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPos ? '+' : ''}{quote.change_pct?.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
};

const Watchlist = () => {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addSymbol = () => {
    const s = input.trim().toUpperCase();
    if (s && !symbols.includes(s) && symbols.length < 10) {
      setSymbols([...symbols, s]);
      setInput('');
    }
  };

  const removeSymbol = (s) => setSymbols(symbols.filter(x => x !== s));

  const fetchQuotes = async () => {
    if (!symbols.length) return;
    setLoading(true);
    setError(null);
    try {
      const r = await axios.post('/api/watchlist/quotes', { symbols });
      setResult(r.data);
    } catch (e) {
      setError('Failed to fetch quotes. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const moodColor = result?.analysis?.overall_market_mood === 'BULLISH'
    ? 'text-accent-green border-l-accent-green'
    : result?.analysis?.overall_market_mood === 'BEARISH'
    ? 'text-accent-red border-l-accent-red'
    : 'text-accent-yellow border-l-accent-yellow';

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="w-full h-12 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star size={18} className="text-text-muted" />
          <h2 className="text-base font-semibold text-text-primary">Watchlist</h2>
        </div>
        {result && (
          <button
            onClick={fetchQuotes}
            disabled={loading}
            className="p-1.5 rounded-lg border border-border hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <div className="p-6 max-w-[1200px] w-full mx-auto flex flex-col gap-6">

        {/* Input row */}
        <div className="card p-5">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSymbol()}
                placeholder="Add NSE symbol e.g. WIPRO"
                className="w-full h-10 bg-bg-tertiary border border-border rounded-lg pl-9 pr-4 text-sm text-text-primary outline-none focus:border-border-focus transition-colors placeholder-text-muted"
              />
            </div>
            <button
              onClick={addSymbol}
              disabled={!input.trim() || symbols.length >= 10}
              className="h-10 px-4 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add
            </button>
            <button
              onClick={fetchQuotes}
              disabled={!symbols.length || loading}
              className="h-10 px-4 btn-ghost flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {loading ? 'Fetching...' : 'Get Quotes'}
            </button>
          </div>

          {/* Symbol tags */}
          <div className="flex flex-wrap gap-2">
            {symbols.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-bg-tertiary border border-border rounded-lg pl-2.5 pr-1.5 py-1">
                <span className="font-mono text-xs font-bold text-text-primary">{s}</span>
                <button onClick={() => removeSymbol(s)} className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-accent-red transition-colors">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="card p-4 flex items-center gap-2 text-accent-red border-accent-red/20 bg-accent-red/5 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {loading && (
          <div className="card p-12 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-text-muted animate-spin" />
            <p className="text-sm text-text-secondary">Fetching live quotes...</p>
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Quotes table */}
            <div className="lg:w-[60%]">
              <h3 className="section-title mb-3">Live Quotes</h3>
              <div className="card overflow-hidden">
                <div className="flex justify-between items-center px-5 py-3 bg-bg-elevated border-b border-border-subtle">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    <span className="w-[200px]">Symbol</span>
                    <span>Last Price / Change</span>
                  </div>
                </div>
                {result.quotes?.map((q, i) => <QuoteRow key={i} quote={q} />)}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="lg:w-[40%] flex flex-col gap-4">
              <h3 className="section-title">AI Watchlist Analysis</h3>

              {result.analysis && (
                <>
                  <div className={`card p-5 border-l-4 ${moodColor}`}>
                    <p className="label mb-1">Mood</p>
                    <h2 className="text-2xl font-black">{result.analysis.overall_market_mood}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="card p-4">
                      <p className="label mb-2">Strongest Pick</p>
                      <p className="font-mono font-bold text-accent-green text-lg">{result.analysis.strongest_pick}</p>
                    </div>
                    <div className="card p-4">
                      <p className="label mb-2">Weakest Pick</p>
                      <p className="font-mono font-bold text-accent-red text-lg">{result.analysis.weakest_pick}</p>
                    </div>
                  </div>

                  <div className="card p-5">
                    <p className="label mb-2">AI Insight</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{result.analysis.ai_insight}</p>
                  </div>

                  {result.analysis.risk_alert && (
                    <div className="card p-4 flex items-start gap-2 border-l-4 border-l-accent-red">
                      <AlertTriangle size={14} className="text-accent-red shrink-0 mt-0.5" />
                      <div>
                        <p className="label mb-1">Risk Alert</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{result.analysis.risk_alert}</p>
                      </div>
                    </div>
                  )}

                  {result.analysis.themes?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.themes.map((t, i) => (
                        <span key={i} className="badge-neutral">{t}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="card p-12 flex flex-col items-center gap-3 border-dashed">
            <Star size={32} className="text-text-muted" />
            <p className="text-text-secondary font-medium">Add symbols and click "Get Quotes"</p>
            <p className="text-text-muted text-sm">Live prices + AI analysis of your watchlist</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Watchlist;
