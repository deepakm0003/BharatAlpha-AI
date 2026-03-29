import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, GitBranch, TrendingUp, Target, ShieldAlert, ChevronDown, ChevronUp, X } from 'lucide-react';
import { LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PATTERN_META = {
  '52W_BREAKOUT': { label: '52W Breakout', color: 'text-accent-green', bgColor: 'bg-accent-green/10 border-accent-green/20', barColor: 'bg-accent-green' },
  GOLDEN_CROSS:   { label: 'Golden Cross',  color: 'text-accent-yellow', bgColor: 'bg-accent-yellow/10 border-accent-yellow/20', barColor: 'bg-accent-yellow' },
  RSI_OVERSOLD:   { label: 'RSI Oversold',  color: 'text-accent-blue', bgColor: 'bg-accent-blue/10 border-accent-blue/20', barColor: 'bg-accent-blue' },
  BELOW_200MA:    { label: 'Below 200 MA',  color: 'text-accent-red', bgColor: 'bg-accent-red/10 border-accent-red/20', barColor: 'bg-accent-red' },
};

const STRENGTH_BADGE = {
  STRONG:   'badge-green',
  MODERATE: 'badge-yellow',
  WEAK:     'text-text-muted bg-bg-tertiary border border-border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest',
};

// ── SearchModal Component ──
const SearchModal = ({ isOpen, searchTerm, results, onClose }) => {
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
              <p className="text-xs text-text-muted mt-1">Found {results.length} pattern{results.length !== 1 ? 's' : ''} for "{searchTerm.toUpperCase()}"</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="p-5 space-y-4">
            {results.length > 0 ? (
              results.map((item, idx) => <PatternCard key={idx} item={item} />)
            ) : (
              <div className="py-12 text-center text-text-muted">
                <p className="text-sm">No patterns found for "{searchTerm.toUpperCase()}"</p>
                <p className="text-xs mt-2">Try searching for a different stock symbol</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const PatternCard = ({ item }) => {
  const [showChart, setShowChart] = useState(false);
  const meta = PATTERN_META[item.pattern] || { label: item.pattern, color: 'text-text-primary', bgColor: 'bg-bg-tertiary border-border', barColor: 'bg-border-strong' };
  const strength = item.signal_strength || 'MODERATE';
  const successRate = item.historical_success_rate || 62;
  const chartData = item.chart_data || [];

  // Transform chart data for volume bars
  const chartWithVolume = chartData.map(d => ({
    ...d,
    volume_scaled: d.volume / 1000000, // Scale to millions
  }));

  return (
    <div className={`card border overflow-hidden animate-slide-in ${meta.bgColor}`}>
      {/* Top accent bar */}
      <div className={`h-[3px] w-full ${meta.barColor}`} />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-mono font-black text-xl text-text-primary tracking-tight">{item.symbol}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.color} bg-transparent uppercase tracking-widest ${meta.bgColor}`}>
                {meta.label}
              </span>
              <span className={STRENGTH_BADGE[strength] || STRENGTH_BADGE.MODERATE}>{strength}</span>
            </div>
            <p className="text-xs text-text-muted">{item.exchange || 'NSE'} · {item.scan_date || 'Today'} {item.scan_time && `at ${new Date(item.scan_time).toLocaleTimeString('en-IN')}`}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-bold text-lg text-text-primary">₹{item.current_price?.toFixed(2)}</p>
            <p className={`text-xs font-mono font-semibold ${Number(item.pct_change) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {Number(item.pct_change) >= 0 ? '+' : ''}{Number(item.pct_change).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Price context row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {item.week_52_high && (
            <div className="bg-bg-secondary/60 rounded-lg p-2.5 border border-border-subtle">
              <p className="label mb-1">52W High</p>
              <p className="text-xs font-mono font-semibold text-text-primary">₹{item.week_52_high}</p>
            </div>
          )}
          {item.rsi && (
            <div className="bg-bg-secondary/60 rounded-lg p-2.5 border border-border-subtle">
              <p className="label mb-1">RSI</p>
              <p className={`text-xs font-mono font-semibold ${Number(item.rsi) < 35 ? 'text-accent-blue' : Number(item.rsi) > 70 ? 'text-accent-red' : 'text-text-primary'}`}>
                {item.rsi}
              </p>
            </div>
          )}
          <div className="bg-bg-secondary/60 rounded-lg p-2.5 border border-border-subtle">
            <p className="label mb-1">Success Rate</p>
            <p className="text-xs font-mono font-semibold text-accent-yellow">{successRate}%</p>
          </div>
        </div>

        {/* Toggle Chart Button */}
        {chartData.length > 0 && (
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full mb-4 px-3 py-2 text-xs font-semibold text-text-primary bg-bg-secondary/60 border border-border-subtle rounded-lg hover:bg-bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            {showChart ? (
              <>
                <ChevronUp size={14} /> Hide Chart
              </>
            ) : (
              <>
                <ChevronDown size={14} /> View 60-Day Candlestick Chart
              </>
            )}
          </button>
        )}

        {/* Candlestick Chart with Volume */}
        {showChart && chartData.length > 0 && (
          <div className="bg-bg-secondary/40 rounded-lg p-3.5 border border-border-subtle mb-4">
            <p className="label mb-3 text-xs">60-Day Price & Volume</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartWithVolume} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} interval={Math.floor(chartData.length / 5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} domain="dataMin-5%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20,20,20,0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value, name) => {
                    if (name === 'volume_scaled') return [`${value.toFixed(1)}M`, 'Volume'];
                    return [`₹${value.toFixed(2)}`, name.toUpperCase()];
                  }}
                />
                {/* Candlestick as line with high/low range */}
                <Line yAxisId="left" type="monotone" dataKey="close" stroke="#6ee7b7" strokeWidth={2} dot={false} name="Close" />
                <Line yAxisId="left" type="monotone" dataKey="ma_50" stroke="rgba(255,193,7,0.5)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="50MA" />
                <Line yAxisId="left" type="monotone" dataKey="ma_200" stroke="rgba(100,149,237,0.5)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="200MA" />
                {/* Volume as bars */}
                <Bar yAxisId="right" dataKey="volume_scaled" fill="rgba(99,102,241,0.3)" name="Volume (Millions)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Plain English explanation */}
        {item.plain_english && (
          <div className="bg-bg-secondary/60 rounded-lg p-3.5 border border-border-subtle mb-4">
            <p className="label mb-1.5 flex items-center gap-1.5">
              <GitBranch size={10} /> Pattern Intelligence
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{item.plain_english}</p>
          </div>
        )}

        {/* Entry / Target / Stop row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg-secondary/60 rounded-lg p-2.5 border border-border-subtle">
            <p className="label mb-1 flex items-center gap-1"><Target size={9} /> Entry</p>
            <p className="text-[11px] font-medium text-text-primary leading-snug">{item.suggested_entry || 'Near CMP'}</p>
          </div>
          <div className="bg-bg-secondary/60 rounded-lg p-2.5 border border-border-subtle">
            <p className="label mb-1 text-accent-green flex items-center gap-1"><TrendingUp size={9} /> Target</p>
            <p className="text-[11px] font-semibold text-accent-green leading-snug">{item.suggested_target || '+10-15%'}</p>
          </div>
          <div className="bg-bg-secondary/60 rounded-lg p-2.5 border border-border-subtle">
            <p className="label mb-1 text-accent-red flex items-center gap-1"><ShieldAlert size={9} /> Stop</p>
            <p className="text-[11px] font-semibold text-accent-red leading-snug">{item.suggested_stop || '-7%'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatternSkeleton = () => (
  <div className="card border border-border animate-pulse overflow-hidden">
    <div className="h-[3px] bg-bg-elevated" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <div className="h-7 w-28 bg-bg-elevated rounded" />
        <div className="h-7 w-16 bg-bg-elevated rounded" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-12 bg-bg-elevated rounded-lg" />)}
      </div>
      <div className="h-16 bg-bg-elevated rounded-lg" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-12 bg-bg-elevated rounded-lg" />)}
      </div>
    </div>
  </div>
);

const ChartPatterns = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [filter, setFilter]   = useState('ALL');
  const [searchSymbol, setSearchSymbol] = useState('');

  const fetchPatterns = async (isRefresh = false) => {
    if (isRefresh) setRefresh(true);
    else setLoading(true);
    try {
      const res = await axios.get('/api/patterns', { headers: { 'Cache-Control': 'no-cache' } });
      setData(res.data.patterns || []);
      setError(null);
    } catch {
      setError('Failed to fetch chart patterns. Is the backend running?');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { fetchPatterns(); }, []);

  const patternTypes = ['ALL', '52W_BREAKOUT', 'GOLDEN_CROSS', 'RSI_OVERSOLD', 'BELOW_200MA'];
  let displayed = filter === 'ALL' ? data : data.filter(d => d.pattern === filter);
  
  // Search results for modal
  const searchResults = searchSymbol.trim()
    ? displayed.filter(d => d.symbol.toUpperCase().includes(searchSymbol.toUpperCase()))
    : [];
  
  const strongCount = data.filter(d => d.signal_strength === 'STRONG').length;

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Sub-header */}
      <div className="w-full h-12 border-b border-border-subtle bg-bg-primary/90 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch size={15} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Chart Pattern Intelligence</h2>
          {!loading && <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle" />}
        </div>
        <div className="flex items-center gap-2">
          {!loading && data.length > 0 && (
            <>
              <span className="badge-neutral hidden sm:inline">{data.length} Patterns Detected</span>
              <span className="badge-neutral hidden sm:inline">20 Stocks Scanned</span>
              {strongCount > 0 && <span className="badge-green hidden sm:inline">{strongCount} Strong</span>}
            </>
          )}
          <button
            onClick={() => fetchPatterns(true)}
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
            {/* Search bar - opens modal */}
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

            {/* Search Modal - Shows when user types */}
            <SearchModal
              isOpen={searchSymbol.trim().length > 0}
              searchTerm={searchSymbol}
              results={searchResults}
              onClose={() => setSearchSymbol('')}
            />

            {/* Pattern type filter tabs */}
            {!loading && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {patternTypes.map(pt => {
                  const meta = PATTERN_META[pt];
                  const count = pt === 'ALL' ? data.length : data.filter(d => d.pattern === pt).length;
                  return (
                    <button
                      key={pt}
                      onClick={() => setFilter(pt)}
                      className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold border transition-all ${
                        filter === pt
                          ? pt === 'ALL'
                            ? 'bg-white text-black border-white'
                            : `${meta?.bgColor} ${meta?.color} border-current`
                          : 'border-border text-text-muted hover:border-border-strong hover:text-text-primary'
                      }`}
                    >
                      {pt === 'ALL' ? 'All Patterns' : (meta?.label || pt)}
                      <span className="font-mono text-[10px] opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: 6 }, (_, i) => <PatternSkeleton key={i} />)
                : displayed.length > 0
                  ? displayed.map((item, idx) => <PatternCard key={idx} item={item} />)
                  : (
                    <div className="md:col-span-2 xl:col-span-3 card p-12 text-center text-text-muted border-dashed">
                      {searchSymbol ? `No patterns found for "${searchSymbol.toUpperCase()}".` : `No ${filter === 'ALL' ? '' : PATTERN_META[filter]?.label + ' '}patterns detected today.`}
                    </div>
                  )
              }
            </div>

            {/* Disclaimer */}
            {!loading && data.length > 0 && (
              <p className="mt-8 text-center text-[11px] text-text-muted">
                Pattern detection is for educational purposes only. Not a SEBI-registered investment advice.
                Always consult a financial advisor before trading.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChartPatterns;
