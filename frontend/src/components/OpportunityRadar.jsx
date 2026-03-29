import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Radar, TrendingUp, TrendingDown, AlertTriangle, Zap, Clock, Database, X } from 'lucide-react';

const URGENCY_STYLE = {
  HIGH:   { badge: 'badge-red',    bar: 'bg-accent-red',    dot: 'bg-accent-red' },
  MEDIUM: { badge: 'badge-yellow', bar: 'bg-accent-yellow', dot: 'bg-accent-yellow' },
  LOW:    { badge: 'badge-neutral', bar: 'bg-border-strong', dot: 'bg-border-strong' },
};

const ACTION_STYLE = {
  BUY_ALERT:        'badge-green',
  WATCH:            'badge-yellow',
  WAIT_FOR_RESULTS: 'text-accent-blue bg-accent-blue/10 border border-accent-blue/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest',
  AVOID:            'badge-red',
};

const TYPE_COLOR = {
  INSIDER_PURCHASE:     'text-accent-green bg-accent-green/10 border-accent-green/20',
  INSIDER_SALE:         'text-accent-red bg-accent-red/10 border-accent-red/20',
  'BULK DEAL — BUY':    'text-accent-green bg-accent-green/10 border-accent-green/20',
  'BULK DEAL — SELL':   'text-accent-red bg-accent-red/10 border-accent-red/20',
  'BOARD MEETING - RESULTS': 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
  DIVIDEND:             'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  BONUS:                'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  'FII BUYING FLOW':    'text-accent-green bg-accent-green/10 border-accent-green/20',
  'FII SELLING FLOW':   'text-accent-red bg-accent-red/10 border-accent-red/20',
};

const ScoreBar = ({ score }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1 bg-border-subtle rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${score >= 8 ? 'bg-accent-green' : score >= 6 ? 'bg-accent-yellow' : 'bg-border-strong'}`}
        style={{ width: `${score * 10}%` }}
      />
    </div>
    <span className={`font-mono text-xs font-bold ${score >= 8 ? 'text-accent-green' : score >= 6 ? 'text-accent-yellow' : 'text-text-muted'}`}>
      {score}/10
    </span>
  </div>
);

const OpportunityCard = ({ opp }) => {
  const urgency = URGENCY_STYLE[opp.urgency] || URGENCY_STYLE.LOW;
  const typeColor = Object.entries(TYPE_COLOR).find(([k]) => opp.type?.includes(k.split(' ')[0]))?.[1]
    || 'text-text-secondary bg-bg-tertiary border-border';

  return (
    <div className="card border border-border hover:border-border-strong transition-all duration-200 overflow-hidden animate-slide-in group">
      {/* Score accent bar */}
      <div
        className={`h-[3px] w-full transition-all ${opp.signal_score >= 8 ? 'bg-accent-green' : opp.signal_score >= 6 ? 'bg-accent-yellow' : 'bg-border-strong'}`}
      />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-black text-xl text-text-primary tracking-tight">
              {opp.symbol}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${typeColor}`}>
              {opp.type?.replace(' — ', ' ')}
            </span>
            <span className={urgency.badge}>{opp.urgency} URGENCY</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={ACTION_STYLE[opp.action] || 'badge-neutral'}>{opp.action?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Signal score */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="label">Signal Strength</span>
          </div>
          <ScoreBar score={opp.signal_score || 5} />
        </div>

        {/* AI one-liner */}
        {opp.one_liner && (
          <div className="bg-bg-tertiary rounded-lg p-3 border border-border-subtle mb-3">
            <p className="flex items-center gap-1.5 label mb-1">
              <Zap size={9} className="text-accent-yellow" /> AI INSIGHT
            </p>
            <p className="text-sm text-text-primary leading-relaxed">{opp.one_liner}</p>
          </div>
        )}

        {/* Details row */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock size={10} />
            <span className="font-mono">{opp.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Database size={9} />
            <span>{opp.source || 'NSE'}</span>
          </div>
        </div>

        {/* Company / details */}
        {opp.details && (
          <p className="text-xs text-text-secondary mt-2 leading-relaxed truncate" title={opp.details}>
            {opp.details}
          </p>
        )}
      </div>
    </div>
  );
};

const MarketSentimentBanner = ({ summary, fii }) => {
  if (!summary) return null;
  const isBullish  = summary.sentiment === 'BULLISH';
  const isBearish  = summary.sentiment === 'BEARISH';
  const borderColor = isBullish ? 'border-l-accent-green' : isBearish ? 'border-l-accent-red' : 'border-l-accent-yellow';
  const Icon = isBullish ? TrendingUp : isBearish ? TrendingDown : AlertTriangle;
  const iconColor = isBullish ? 'text-accent-green' : isBearish ? 'text-accent-red' : 'text-accent-yellow';

  return (
    <div className={`card border-l-4 ${borderColor} p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4`}>
      <div className="flex items-center gap-3">
        <Icon size={20} className={iconColor} />
        <div>
          <p className="label mb-0.5">Market Sentiment</p>
          <p className={`text-lg font-black font-mono ${iconColor}`}>{summary.sentiment}</p>
        </div>
      </div>
      {(summary.indices || []).slice(0, 4).map((idx, i) => (
        <div key={i} className="flex flex-col">
          <p className="label text-[9px] mb-0.5">{idx.name}</p>
          <p className="font-mono text-sm font-bold text-text-primary">{idx.value?.toLocaleString('en-IN')}</p>
          <p className={`font-mono text-xs ${idx.change_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {idx.change_pct >= 0 ? '+' : ''}{idx.change_pct?.toFixed(2)}%
          </p>
        </div>
      ))}
      {fii && (
        <div className="ml-auto flex gap-4 sm:border-l sm:border-border-subtle sm:pl-4 shrink-0">
          <div>
            <p className="label mb-0.5">FII Net</p>
            <p className={`font-mono text-sm font-bold ${fii.fiiNetValue >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              ₹{fii.fiiNetValue >= 0 ? '+' : ''}{fii.fiiNetValue?.toFixed(0)} Cr
            </p>
          </div>
          <div>
            <p className="label mb-0.5">DII Net</p>
            <p className={`font-mono text-sm font-bold ${fii.diiNetValue >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              ₹{fii.diiNetValue >= 0 ? '+' : ''}{fii.diiNetValue?.toFixed(0)} Cr
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── SearchModal for Opportunities ──
const OpportunitySearchModal = ({ isOpen, searchTerm, results, onClose }) => {
  if (!isOpen || !searchTerm.trim()) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-primary border border-border-subtle rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-bg-primary border-b border-border-subtle p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Search Results</h2>
              <p className="text-xs text-text-muted mt-1">Found {results.length} opportunit{results.length === 1 ? 'y' : 'ies'} for "{searchTerm.toUpperCase()}"</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.length > 0 ? (
              results.map((opp, i) => <OpportunityCard key={i} opp={opp} />)
            ) : (
              <div className="col-span-full py-12 text-center text-text-muted">
                <p className="text-sm">No opportunities found for "{searchTerm.toUpperCase()}"</p>
                <p className="text-xs mt-2">Try searching for a different stock symbol</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const OpportunitySkeleton = () => (
  <div className="card border border-border animate-pulse overflow-hidden">
    <div className="h-[3px] bg-bg-elevated" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <div className="flex gap-2">
          <div className="h-7 w-24 bg-bg-elevated rounded" />
          <div className="h-5 w-20 bg-bg-elevated rounded-full" />
        </div>
        <div className="h-5 w-16 bg-bg-elevated rounded-full" />
      </div>
      <div className="h-2 bg-bg-elevated rounded" />
      <div className="h-14 bg-bg-elevated rounded-lg" />
      <div className="h-3 w-32 bg-bg-elevated rounded" />
    </div>
  </div>
);

const OpportunityRadar = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [filter, setFilter]   = useState('ALL');
  const [searchSymbol, setSearchSymbol] = useState('');

  const fetchRadar = async (isRefresh = false) => {
    if (isRefresh) setRefresh(true);
    else setLoading(true);
    try {
      const res = await axios.get('/api/radar');
      setData(res.data);
      setError(null);
    } catch {
      setError('Failed to fetch radar data. Is the backend running?');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { fetchRadar(); }, []);

  const ALL_TYPES = ['ALL', 'INSIDER', 'BULK DEAL', 'EARNINGS', 'CORPORATE', 'FII'];
  const filterFn = (opp) => {
    // Type filter only (symbol search moved to modal)
    if (filter === 'ALL') return true;
    if (filter === 'INSIDER')   return opp.type?.includes('INSIDER');
    if (filter === 'BULK DEAL') return opp.type?.includes('BULK');
    if (filter === 'EARNINGS')  return opp.type?.includes('RESULTS');
    if (filter === 'CORPORATE') return ['DIVIDEND','BONUS','SPLIT','AGM','MERGER'].some(k => opp.type?.includes(k));
    if (filter === 'FII')       return opp.type?.includes('FII');
    return true;
  };

  const displayed = (data?.opportunities || []).filter(filterFn);
  
  // Search results for modal (not for main display)
  const searchResults = searchSymbol.trim()
    ? displayed.filter(d => d.symbol?.toUpperCase().includes(searchSymbol.toUpperCase()))
    : [];
  
  const highCount = (data?.opportunities || []).filter(o => o.urgency === 'HIGH').length;

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Sub-header */}
      <div className="w-full h-12 border-b border-border-subtle bg-bg-primary/90 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radar size={15} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Opportunity Radar</h2>
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle" />
        </div>
        <div className="flex items-center gap-2">
          {!loading && data && (
            <>
              <span className="badge-neutral hidden sm:inline">{data.total_signals} Signals</span>
              {highCount > 0 && <span className="badge-red hidden sm:inline">{highCount} High Urgency</span>}
              <span className="badge-neutral hidden md:inline text-[9px]">
                {(data.data_sources || []).length} sources
              </span>
            </>
          )}
          <button
            onClick={() => fetchRadar(true)}
            disabled={refresh}
            className="p-1.5 rounded-lg border border-border hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary disabled:opacity-40"
          >
            <RefreshCw size={13} className={refresh ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] w-full mx-auto">
        {error ? (
          <div className="card p-8 text-center text-accent-red border border-accent-red/20 bg-accent-red/5">
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Market sentiment banner */}
            {!loading && data && (
              <MarketSentimentBanner summary={data.market_summary} fii={data.fii_latest} />
            )}

            {/* Search bar */}
            {!loading && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by stock symbol (e.g., RELIANCE, TCS)..."
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                />
              </div>
            )}

            {/* Search Modal */}
            <OpportunitySearchModal
              isOpen={searchSymbol.trim().length > 0}
              searchTerm={searchSymbol}
              results={searchResults}
              onClose={() => setSearchSymbol('')}
            />

            {/* Filter tabs */}
            {!loading && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {ALL_TYPES.map(t => {
                  const count = t === 'ALL'
                    ? (data?.opportunities || []).length
                    : (data?.opportunities || []).filter(o => filterFn({ ...o, _type: t }) || (
                        t === 'INSIDER'   ? o.type?.includes('INSIDER')
                      : t === 'BULK DEAL' ? o.type?.includes('BULK')
                      : t === 'EARNINGS'  ? o.type?.includes('RESULTS')
                      : t === 'CORPORATE' ? ['DIVIDEND','BONUS','SPLIT','AGM'].some(k => o.type?.includes(k))
                      : t === 'FII'       ? o.type?.includes('FII')
                      : false
                    )).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold border transition-all ${
                        filter === t
                          ? 'bg-white text-black border-white'
                          : 'border-border text-text-muted hover:border-border-strong hover:text-text-primary'
                      }`}
                    >
                      {t}
                      <span className="font-mono text-[10px] opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Opportunity grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: 9 }, (_, i) => <OpportunitySkeleton key={i} />)
                : displayed.length > 0
                  ? displayed.map((opp, i) => <OpportunityCard key={i} opp={opp} />)
                  : (
                    <div className="md:col-span-2 xl:col-span-3 card p-12 text-center text-text-muted border-dashed">
                      No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}opportunities detected right now.
                    </div>
                  )
              }
            </div>

            {/* Data sources footer */}
            {!loading && data?.data_sources && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                <Database size={11} className="text-text-muted" />
                <span className="text-[11px] text-text-muted">
                  Data from: {data.data_sources.join(' · ')}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OpportunityRadar;
