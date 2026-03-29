import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Search, X, ArrowLeft, TrendingUp, TrendingDown, BarChart2,
  Briefcase, Zap, Clock, Star, ChevronRight, Loader2, Filter
} from 'lucide-react';

/* ── Popular tickers shown before any search ── */
const TRENDING = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'WIPRO', 'ADANIENT', 'BAJFINANCE'];
const POPULAR_FUNDS = ['SBI Small Cap', 'Mirae Asset', 'Axis Bluechip', 'HDFC Mid-Cap'];

const FILTERS = ['All', 'Stocks', 'Mutual Funds', 'Indices'];

/* ── Detail card for a selected stock ── */
const StockDetailCard = ({ quote, onClose }) => {
  if (!quote) return null;
  const up = (quote.change_pct ?? 0) >= 0;
  return (
    <div className="mt-6 rounded-2xl border border-border bg-bg-card overflow-hidden animate-slide-in">
      {/* Colored top bar */}
      <div className={`h-1 w-full ${up ? 'bg-accent-green' : 'bg-accent-red'}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={14} className="text-accent-blue" />
              <span className="text-[10px] font-bold text-accent-blue tracking-widest uppercase">{quote.symbol} · NSE Live</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <p className="font-mono font-black text-4xl text-white">₹{quote.price?.toLocaleString('en-IN')}</p>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${up ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {up ? '+' : ''}{quote.change_pct?.toFixed(2)}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center hover:border-white/30 transition-colors">
            <X size={14} className="text-text-muted" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border-subtle">
          {[
            { label: 'Open',       val: quote.open       },
            { label: 'Prev Close', val: quote.prev_close },
            { label: 'Day High',   val: quote.high       },
            { label: 'Day Low',    val: quote.low        },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-[9px] font-bold text-text-disabled tracking-wider uppercase mb-1">{label}</p>
              <p className="font-mono text-sm text-text-secondary">₹{val?.toLocaleString('en-IN') ?? '—'}</p>
            </div>
          ))}
        </div>
        {(quote.volume || quote.market_cap) && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-border-subtle">
            {quote.volume && (
              <div>
                <p className="text-[9px] font-bold text-text-disabled tracking-wider uppercase mb-1">Volume</p>
                <p className="font-mono text-sm text-text-secondary">{quote.volume?.toLocaleString('en-IN')}</p>
              </div>
            )}
            {quote.market_cap && (
              <div>
                <p className="text-[9px] font-bold text-text-disabled tracking-wider uppercase mb-1">Market Cap</p>
                <p className="font-mono text-sm text-text-secondary">₹{(quote.market_cap / 1e7).toFixed(0)} Cr</p>
              </div>
            )}
          </div>
        )}
        <p className="text-[9px] text-text-disabled mt-4">Source: {quote.source || 'yfinance (live)'}</p>
      </div>
    </div>
  );
};

/* ── Detail card for a selected fund ── */
const FundDetailCard = ({ fund, onClose }) => (
  <div className="mt-6 rounded-2xl border border-accent-green/30 bg-bg-card overflow-hidden animate-slide-in">
    <div className="h-1 w-full bg-accent-green" />
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={14} className="text-accent-green" />
            <span className="text-[10px] font-bold text-accent-green tracking-widest uppercase">AMFI Live · Mutual Fund</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">{fund.name}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center hover:border-white/30 transition-colors shrink-0">
          <X size={14} className="text-text-muted" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-subtle">
        <div>
          <p className="text-[9px] font-bold text-text-disabled tracking-wider uppercase mb-1">NAV</p>
          <p className="font-mono font-bold text-2xl text-white">₹{fund.nav}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-text-disabled tracking-wider uppercase mb-1">Date</p>
          <p className="font-mono text-sm text-text-secondary">{fund.date}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-text-disabled tracking-wider uppercase mb-1">Category</p>
          <p className="text-sm text-text-secondary">{fund.category}</p>
        </div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════ */
const SearchPage = ({ onNavigate }) => {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [filter, setFilter]         = useState('All');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ba_recent_searches') || '[]'); } catch { return []; }
  });
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);

  /* Auto-focus on mount */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Debounced search */
  const doSearch = useCallback((q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    axios.get('/api/search', { params: { q } })
      .then(r => {
        const d = r.data;
        setResults({
          total: (d.stocks?.length ?? 0) + (d.mutual_funds?.length ?? 0) + (d.indices?.length ?? 0),
          stocks: d.stocks ?? [],
          mutual_funds: d.mutual_funds ?? [],
          indices: d.indices ?? [],
        });
      })
      .catch(() => setResults({ total: 0, stocks: [], mutual_funds: [], indices: [] }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setSelectedQuote(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 350);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSelectedQuote(null);
    setFilter('All');
    inputRef.current?.focus();
  };

  const saveRecent = (label) => {
    setRecentSearches(prev => {
      const next = [label, ...prev.filter(x => x !== label)].slice(0, 6);
      localStorage.setItem('ba_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  /* Select a stock → fetch quote detail */
  const handleSelectStock = async (symbol) => {
    setQuery(symbol);
    setResults(null);
    setLoading(true);
    saveRecent(symbol);
    try {
      const r = await axios.get(`/api/search/quote/${symbol}`);
      setSelectedQuote({ ...r.data, type: 'stock' });
    } catch {
      setSelectedQuote(null);
    } finally {
      setLoading(false);
    }
  };

  /* Select a mutual fund */
  const handleSelectFund = (fund) => {
    setQuery(fund.name);
    setResults(null);
    saveRecent(fund.name);
    setSelectedQuote({ type: 'mutual_fund', ...fund });
  };

  /* Filter helper */
  const visible = results
    ? {
        stocks:       filter === 'All' || filter === 'Stocks'       ? results.stocks       : [],
        mutual_funds: filter === 'All' || filter === 'Mutual Funds' ? results.mutual_funds : [],
        indices:      filter === 'All' || filter === 'Indices'      ? results.indices      : [],
      }
    : null;

  const hasResults = visible && (visible.stocks.length + visible.mutual_funds.length + visible.indices.length) > 0;

  return (
    <div className="min-h-screen bg-bg-primary">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-bg-secondary border-b border-border-subtle">
        {/* Decorative glow blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-10 w-56 h-56 bg-accent-green/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14 relative">
          {/* Back link */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 text-text-muted hover:text-white transition-colors text-sm mb-8 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Search size={16} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Market Search</h1>
          </div>
          <p className="text-text-muted text-sm mb-8 pl-12">
            NSE stocks · AMFI mutual funds · Market indices — all with live data
          </p>

          {/* ── Big Search Bar ── */}
          <div className={`flex items-center gap-3 rounded-2xl border transition-all duration-200 bg-bg-card px-5 py-4 ${
            query ? 'border-white/25 shadow-glow' : 'border-border hover:border-border-strong'
          }`}>
            {loading
              ? <Loader2 size={20} className="text-text-muted animate-spin shrink-0" />
              : <Search size={20} className="text-text-muted shrink-0" />
            }
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search: RELIANCE, TCS, SBI Small Cap, NIFTY 50…"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-text-disabled text-base"
            />
            {query && (
              <button onClick={clearSearch} className="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center hover:border-white/20 transition-colors shrink-0">
                <X size={13} className="text-text-muted" />
              </button>
            )}
          </div>

          {/* Result count badge */}
          {results && query && (
            <p className="text-[11px] text-text-muted mt-3 pl-1">
              <span className="text-white font-semibold">{results.total}</span> results for "<span className="text-accent-blue">{query}</span>"
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">

        {/* ── Empty state: trending + recent ── */}
        {!query && !selectedQuote && (
          <div className="space-y-8">

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={13} className="text-text-muted" />
                  <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Recent Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); doSearch(s); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-border text-sm text-text-secondary hover:border-white/20 hover:text-white transition-all"
                    >
                      <Clock size={11} className="text-text-muted" />
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => { setRecentSearches([]); localStorage.removeItem('ba_recent_searches'); }}
                    className="px-3 py-1.5 rounded-full text-[11px] text-text-disabled hover:text-text-muted transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </section>
            )}

            {/* Trending stocks */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} className="text-accent-blue" />
                <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Popular NSE Stocks</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRENDING.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => { setQuery(sym); doSearch(sym); }}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-card border border-border hover:border-white/20 hover:bg-bg-elevated transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                        <BarChart2 size={11} className="text-accent-blue" />
                      </div>
                      <span className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">{sym}</span>
                    </div>
                    <ChevronRight size={13} className="text-text-disabled group-hover:text-text-muted transition-colors" />
                  </button>
                ))}
              </div>
            </section>

            {/* Popular funds */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Star size={13} className="text-accent-green" />
                <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Popular Mutual Funds</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_FUNDS.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setQuery(name); doSearch(name); }}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-card border border-border hover:border-accent-green/30 hover:bg-bg-elevated transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                        <Briefcase size={11} className="text-accent-green" />
                      </div>
                      <span className="text-sm text-text-secondary group-hover:text-white transition-colors truncate max-w-[180px]">{name}</span>
                    </div>
                    <ChevronRight size={13} className="text-text-disabled group-hover:text-text-muted transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Detail card (after selection) ── */}
        {selectedQuote && (
          selectedQuote.type === 'mutual_fund'
            ? <FundDetailCard fund={selectedQuote} onClose={() => { setSelectedQuote(null); setQuery(''); }} />
            : <StockDetailCard quote={selectedQuote} onClose={() => { setSelectedQuote(null); setQuery(''); }} />
        )}

        {/* ── Search results ── */}
        {query && results && !selectedQuote && (
          <>
            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Filter size={13} className="text-text-muted" />
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    filter === f
                      ? 'bg-white text-black'
                      : 'bg-bg-elevated border border-border text-text-muted hover:border-white/20 hover:text-text-primary'
                  }`}
                >
                  {f}
                  {f !== 'All' && results && (
                    <span className="ml-1 opacity-60">
                      ({f === 'Stocks' ? results.stocks.length
                        : f === 'Mutual Funds' ? results.mutual_funds.length
                        : results.indices.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {!hasResults ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-text-disabled" />
                </div>
                <p className="text-text-secondary text-lg font-semibold">No results found</p>
                <p className="text-text-muted text-sm mt-1">Try "{query.toUpperCase()}" or check for typos</p>
              </div>
            ) : (
              <div className="space-y-8">

                {/* Stocks section */}
                {visible.stocks.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 rounded-md bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                        <BarChart2 size={11} className="text-accent-blue" />
                      </div>
                      <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">NSE Stocks</h2>
                      <span className="ml-auto text-[11px] text-text-disabled">{visible.stocks.length} found</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {visible.stocks.map((s, i) => {
                        const up = (s.change_pct ?? 0) >= 0;
                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectStock(s.symbol)}
                            className="flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border hover:border-white/20 hover:bg-bg-elevated transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0">
                                <BarChart2 size={14} className="text-accent-blue" />
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm group-hover:text-white">{s.symbol}</p>
                                <p className="text-[10px] text-text-disabled mt-0.5">NSE · Stock</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-white text-sm">
                                {s.price ? `₹${s.price.toLocaleString('en-IN')}` : '—'}
                              </p>
                              {s.change_pct != null && (
                                <p className={`text-[11px] font-mono font-semibold ${up ? 'text-accent-green' : 'text-accent-red'}`}>
                                  {up ? '+' : ''}{s.change_pct.toFixed(2)}%
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Mutual Funds section */}
                {visible.mutual_funds.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 rounded-md bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                        <Briefcase size={11} className="text-accent-green" />
                      </div>
                      <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Mutual Funds · AMFI Live</h2>
                      <span className="ml-auto text-[11px] text-text-disabled">{visible.mutual_funds.length} found</span>
                    </div>
                    <div className="space-y-2">
                      {visible.mutual_funds.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectFund(f)}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border hover:border-accent-green/25 hover:bg-bg-elevated transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center shrink-0">
                              <Briefcase size={14} className="text-accent-green" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white text-sm truncate group-hover:text-white">{f.name}</p>
                              <p className="text-[10px] text-text-disabled mt-0.5">{f.category} · AMFI</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-mono font-bold text-white text-sm">₹{f.nav ?? '—'}</p>
                            <p className="text-[10px] text-text-disabled">{f.date}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Indices section */}
                {visible.indices.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 rounded-md bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                        <TrendingUp size={11} className="text-accent-blue" />
                      </div>
                      <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Market Indices</h2>
                      <span className="ml-auto text-[11px] text-text-disabled">{visible.indices.length} found</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {visible.indices.map((idx, i) => (
                        <button
                          key={i}
                          onClick={() => { saveRecent(idx.name); onNavigate('market'); }}
                          className="flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border hover:border-white/20 hover:bg-bg-elevated transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0">
                              <TrendingUp size={14} className="text-accent-blue" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{idx.name}</p>
                              <p className="text-[10px] text-text-disabled mt-0.5">Market Index</p>
                            </div>
                          </div>
                          <ChevronRight size={15} className="text-text-disabled group-hover:text-text-muted transition-colors" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <p className="text-[10px] text-text-disabled text-center pt-4">
                  Live data · NSE + AMFI India + yfinance
                </p>
              </div>
            )}
          </>
        )}

        {/* Loading skeleton while fetching */}
        {query && loading && !results && (
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-16 rounded-xl bg-bg-elevated border border-border animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
