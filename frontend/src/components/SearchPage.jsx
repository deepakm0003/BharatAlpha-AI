import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, BarChart2, Briefcase, TrendingUp } from 'lucide-react';

const SearchPage = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search API call
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    
    setLoading(true);
    axios.get('/api/search', { params: { q: query } })
      .then(r => {
        const data = r.data;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        setResults({
          total: (arr.stocks?.length ?? 0) + (arr.mutual_funds?.length ?? 0) + (arr.indices?.length ?? 0),
          stocks: arr.stocks ?? [],
          mutual_funds: arr.mutual_funds ?? [],
          indices: arr.indices ?? [],
        });
      })
      .catch(() => setResults({ total: 0, stocks: [], mutual_funds: [], indices: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSelectStock = (symbol) => {
    onNavigate('market');
    setQuery('');
  };

  const handleSelectFund = (fund) => {
    setQuery('');
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-8 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6"
        >
          <ChevronLeft size={18} />
          Back to Home
        </button>
        
        <h1 className="text-4xl font-bold text-white mb-2">Search Market Data</h1>
        <p className="text-text-secondary">Find NSE stocks, mutual funds from AMFI, and market indices with live data</p>
      </div>

      {/* Search Input */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks (e.g. RELIANCE), mutual funds (e.g. SBI Small Cap), or indices..."
            autoFocus
            className="w-full bg-bg-card border border-border rounded-xl px-6 py-4 text-white placeholder:text-text-muted focus:outline-none focus:border-white/30 focus:shadow-glow transition-all"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto">
        {query && results ? (
          <>
            {results.total === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-lg">No results found for "{query}"</p>
                <p className="text-text-muted mt-2">Try searching NSE stock symbols, mutual fund names, or indices</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* NSE Stocks */}
                {results.stocks.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-text-muted tracking-wider uppercase mb-4">NSE Stocks ({results.stocks.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.stocks.map((s, i) => {
                        const up = (s.change_pct ?? 0) >= 0;
                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectStock(s.symbol)}
                            className="card border border-border rounded-xl p-5 hover:border-white/30 hover:bg-bg-elevated transition-all text-left"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-lg font-bold text-white">{s.symbol}</p>
                                <p className="text-sm text-text-muted mt-1">NSE Listed Stock</p>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
                                <BarChart2 size={14} className="text-accent-blue" />
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-mono font-bold text-white">₹{s.price?.toLocaleString('en-IN') ?? '—'}</p>
                              <p className={`text-sm font-mono font-bold ${up ? 'text-accent-green' : 'text-accent-red'}`}>
                                {up ? '+' : ''}{s.change_pct?.toFixed(2)}%
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Mutual Funds */}
                {results.mutual_funds.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-text-muted tracking-wider uppercase mb-4">Mutual Funds - AMFI Live ({results.mutual_funds.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.mutual_funds.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectFund(f)}
                          className="card border border-border rounded-xl p-5 hover:border-white/30 hover:bg-bg-elevated transition-all text-left"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-lg font-bold text-white line-clamp-2">{f.name}</p>
                              <p className="text-sm text-text-muted mt-1">{f.category}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center shrink-0 ml-2">
                              <Briefcase size={14} className="text-accent-green" />
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-mono font-bold text-white">₹{f.nav ?? '—'}</p>
                            <p className="text-xs text-text-muted">{f.date}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Indices */}
                {results.indices.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-text-muted tracking-wider uppercase mb-4">Market Indices ({results.indices.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.indices.map((idx, i) => (
                        <button
                          key={i}
                          onClick={() => { onNavigate('market'); setQuery(''); }}
                          className="card border border-border rounded-xl p-5 hover:border-white/30 hover:bg-bg-elevated transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-white">{idx.name}</p>
                              <p className="text-sm text-text-muted mt-1">Click to view Market Pulse</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                              <TrendingUp size={14} className="text-accent-blue" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-text-muted py-12">
            <p className="text-lg">Start typing to search for stocks, mutual funds, or market indices</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
