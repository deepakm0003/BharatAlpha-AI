import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, TrendingUp, TrendingDown, X, Briefcase, BarChart2, Loader2 } from 'lucide-react';

const TYPE_ICONS = {
  stock: BarChart2,
  mutual_fund: Briefcase,
  index: TrendingUp,
};

const TYPE_LABELS = {
  stock: 'Stock',
  mutual_fund: 'Mutual Fund',
  index: 'Index',
};

const SearchBar = ({ onNavigate, variant = 'hero' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get('/api/search', { params: { q } });
      setResults(res.data);
      setOpen(true);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedQuote(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val.trim()), 350);
  };

  const handleSelectStock = async (symbol) => {
    setOpen(false);
    setQuery(symbol);
    setLoading(true);
    try {
      const res = await axios.get(`/api/search/quote/${symbol}`);
      setSelectedQuote(res.data);
    } catch {
      setSelectedQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFund = (fund) => {
    setOpen(false);
    setQuery(fund.name);
    setSelectedQuote({
      type: 'mutual_fund',
      name: fund.name,
      nav: fund.nav,
      date: fund.date,
      category: fund.category,
      source: fund.source,
    });
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSelectedQuote(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const isHero = variant === 'hero';

  return (
    <div ref={wrapperRef} className={`relative ${isHero ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}>
      {/* Search Input */}
      <div className={`relative z-50 flex items-center gap-3 rounded-xl border transition-all duration-200 ${
        isHero
          ? 'bg-bg-card border-border hover:border-border-strong focus-within:border-white/30 focus-within:shadow-glow px-5 py-4'
          : 'bg-bg-elevated border-border-subtle hover:border-border focus-within:border-white/20 px-3 py-2'
      }`}>
        {loading ? (
          <Loader2 size={isHero ? 18 : 14} className="text-text-muted animate-spin shrink-0" />
        ) : (
          <Search size={isHero ? 18 : 14} className="text-text-muted shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          placeholder={isHero ? 'Search stocks, mutual funds, indices... (e.g. RELIANCE, SBI Small Cap)' : 'Search...'}
          className={`flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-disabled ${
            isHero ? 'text-base' : 'text-sm'
          }`}
        />
        {query && (
          <button onClick={clearSearch} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={isHero ? 16 : 14} />
          </button>
        )}
      </div>

      {/* Modal Backdrop + Dropdown Results */}
      {open && results && results.total > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xl z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto">
          {/* Stocks */}
          {results.stocks?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-text-muted tracking-widest uppercase">NSE Stocks</p>
              {results.stocks.map((s, i) => {
                const up = (s.change_pct ?? 0) >= 0;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectStock(s.symbol)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors text-left border-b border-border-subtle last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
                        <BarChart2 size={13} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{s.symbol}</p>
                        <p className="text-[10px] text-text-muted">NSE · Stock</p>
                      </div>
                    </div>
                    {s.price && (
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-white">₹{s.price.toLocaleString('en-IN')}</p>
                        <p className={`text-[11px] font-mono font-semibold ${up ? 'text-accent-green' : 'text-accent-red'}`}>
                          {up ? '+' : ''}{s.change_pct?.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mutual Funds */}
          {results.mutual_funds?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-text-muted tracking-widest uppercase">Mutual Funds (AMFI Live)</p>
              {results.mutual_funds.map((f, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectFund(f)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors text-left border-b border-border-subtle last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                      <Briefcase size={13} className="text-accent-green" />
                    </div>
                    <div className="max-w-[300px]">
                      <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                      <p className="text-[10px] text-text-muted">{f.category} · AMFI Live</p>
                    </div>
                  </div>
                  {f.nav && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono font-bold text-white">₹{f.nav}</p>
                      <p className="text-[10px] text-text-muted">{f.date}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Indices */}
          {results.indices?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-text-muted tracking-widest uppercase">Market Indices</p>
              {results.indices.map((idx, i) => (
                <button
                  key={i}
                  onClick={() => { setOpen(false); onNavigate?.('market'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left border-b border-border-subtle last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                    <TrendingUp size={13} className="text-accent-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{idx.name}</p>
                    <p className="text-[10px] text-text-muted">Index · Click to view Market Pulse</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 bg-bg-primary border-t border-border-subtle">
            <p className="text-[10px] text-text-disabled text-center">
              {results.total} results · Live data from NSE + AMFI India + yfinance
            </p>
          </div>
          </div>
        </>
      )}

      {/* No results */}
      {open && results && results.total === 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xl z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-bg-secondary border border-border rounded-xl shadow-2xl p-6 text-center">
            <Search size={24} className="text-text-disabled mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No results found for "{query}"</p>
            <p className="text-xs text-text-muted mt-1">Try searching NSE stock symbols (e.g. RELIANCE, TCS) or mutual fund names</p>
          </div>
        </>
      )}

      {/* Selected Quote Detail Card */}
      {selectedQuote && !open && (
        <div className="mt-4 card border border-border rounded-xl p-5 animate-slide-in">
          {selectedQuote.type === 'mutual_fund' ? (
            <>
              <p className="font-semibold text-text-primary mb-1">{selectedQuote.name}</p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="label text-[9px]">NAV</p>
                  <p className="font-mono font-bold text-lg text-white">₹{selectedQuote.nav}</p>
                </div>
                <div>
                  <p className="label text-[9px]">Date</p>
                  <p className="font-mono text-sm text-text-secondary">{selectedQuote.date}</p>
                </div>
                <div>
                  <p className="label text-[9px]">Category</p>
                  <p className="text-sm text-text-secondary">{selectedQuote.category}</p>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={14} className="text-accent-blue" />
                <span className="text-[10px] font-bold text-accent-blue tracking-wider uppercase">{selectedQuote.symbol} · NSE Live</span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <p className="font-mono font-black text-3xl text-white">₹{selectedQuote.price?.toLocaleString('en-IN')}</p>
                {selectedQuote.change_pct != null && (
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                    selectedQuote.change_pct >= 0 ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                  }`}>
                    {selectedQuote.change_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {selectedQuote.change_pct >= 0 ? '+' : ''}{selectedQuote.change_pct?.toFixed(2)}%
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Open', value: selectedQuote.open },
                  { label: 'Prev Close', value: selectedQuote.prev_close },
                  { label: 'Day High', value: selectedQuote.high },
                  { label: 'Day Low', value: selectedQuote.low },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="label text-[9px]">{item.label}</p>
                    <p className="font-mono text-sm text-text-secondary">₹{item.value?.toLocaleString('en-IN') ?? '—'}</p>
                  </div>
                ))}
              </div>
              {selectedQuote.volume && (
                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-6">
                  <div>
                    <p className="label text-[9px]">Volume</p>
                    <p className="font-mono text-sm text-text-secondary">{selectedQuote.volume.toLocaleString('en-IN')}</p>
                  </div>
                  {selectedQuote.market_cap && (
                    <div>
                      <p className="label text-[9px]">Market Cap</p>
                      <p className="font-mono text-sm text-text-secondary">₹{(selectedQuote.market_cap / 1e7).toFixed(0)} Cr</p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[9px] text-text-disabled mt-3">Source: {selectedQuote.source || 'yfinance (live)'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
