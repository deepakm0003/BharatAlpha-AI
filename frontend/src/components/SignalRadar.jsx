import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignalCard from './SignalCard';
import { SignalSkeleton, TableSkeleton } from './SkeletonLoader';
import { RefreshCw, Activity, Play, Check, Loader2, Zap, Filter, X } from 'lucide-react';

// ── Portfolio relevance mapping (which funds hold which top stocks) ──
const FUND_HOLDINGS = {
  HDFCBANK:   ['HDFC Flexi Cap', 'Mirae Asset Emerging', 'ICICI Prudential Bluechip', 'hdfc', 'mirae'],
  INFY:       ['Parag Parikh', 'UTI Flexi Cap', 'Axis Bluechip', 'parag parikh', 'uti'],
  TCS:        ['Axis Bluechip', 'ICICI Prudential Bluechip', 'Mirae', 'axis bluechip', 'icici'],
  RELIANCE:   ['Nippon India', 'HDFC Mid Cap', 'Kotak Emerging', 'nippon', 'kotak'],
  BAJFINANCE: ['Nippon India', 'DSP Midcap', 'Franklin India', 'nippon', 'dsp'],
  WIPRO:      ['UTI Flexi Cap', 'Canara Robeco', 'uti flexi', 'canara'],
  ICICIBANK:  ['Mirae Asset Emerging', 'ICICI Prudential', 'mirae', 'icici prudential'],
};

const AGENT_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'BAJFINANCE', 'AXISBANK', 'WIPRO'];

// ── DealTable sub-component ──
const DealTable = ({ deals, title }) => (
  <div>
    <h3 className="section-title mb-3">{title}</h3>
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-elevated border-b border-border-subtle">
          <tr>
            <th className="px-4 py-3 label">Stock</th>
            <th className="px-4 py-3 label">Current Price</th>
            <th className="px-4 py-3 label">Deal Client</th>
            <th className="px-4 py-3 label">Type</th>
            <th className="px-4 py-3 label text-right">Deal Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {deals.map((deal, idx) => {
            const isBuy = deal.dealType?.toUpperCase() === 'BUY';
            const val = (Number(deal.quantity || 0) * Number(deal.price || 0) / 10000000).toFixed(1);
            const priceChange = deal.stock_change_pct || 0;
            const priceChangeColor = priceChange >= 0 ? 'text-accent-green' : 'text-accent-red';
            return (
              <tr key={idx} className="hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-text-primary text-xs">{deal.symbol}</td>
                <td className="px-4 py-3 text-text-primary">
                  {deal.stock_price ? (
                    <div className="text-xs">
                      <p className="font-bold font-mono">₹{deal.stock_price.toFixed(2)}</p>
                      <p className={`text-[10px] font-mono ${priceChangeColor}`}>
                        {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
                      </p>
                    </div>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs truncate max-w-[120px]">{deal.clientName}</td>
                <td className="px-4 py-3">
                  <span className={isBuy ? 'badge-green' : 'badge-red'}>{deal.dealType}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-primary text-xs">₹{val}Cr</td>
              </tr>
            );
          })}
          {deals.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-text-muted text-sm">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ── SearchModal for Signals ──
const SignalSearchModal = ({ isOpen, searchTerm, results, onClose }) => {
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
              <p className="text-xs text-text-muted mt-1">Found {results.length} signal{results.length !== 1 ? 's' : ''} for "{searchTerm.toUpperCase()}"</p>
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
              results.map((trade, idx) => (
                <SignalCard
                  key={idx}
                  trade={trade}
                  analysis={trade.analysis}
                />
              ))
            ) : (
              <div className="py-12 text-center text-text-muted">
                <p className="text-sm">No signals found for "{searchTerm.toUpperCase()}"</p>
                <p className="text-xs mt-2">Try searching for a different stock symbol</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ── AgentPipeline UI ──
const AgentPipeline = () => {
  const [symbol, setSymbol]   = useState('RELIANCE');
  const [running, setRunning] = useState(false);
  const [steps, setSteps]     = useState([]);
  const [alert, setAlert]     = useState(null);

  const runPipeline = async () => {
    setRunning(true);
    setSteps([]);
    setAlert(null);
    try {
      const res = await axios.get(`/api/signals/agent-run?symbol=${symbol}`);
      const { steps: s, final_alert } = res.data;
      for (const step of s) {
        await new Promise(r => setTimeout(r, 900));
        setSteps(prev => [...prev, step]);
      }
      await new Promise(r => setTimeout(r, 500));
      setAlert(final_alert);
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  };

  const verdictColor = {
    STRONG_BUY: 'text-accent-green', BUY: 'text-accent-green',
    NEUTRAL: 'text-accent-yellow', AVOID: 'text-accent-red',
  }[alert?.verdict] || 'text-text-primary';

  return (
    <div className="card border-l-4 border-l-accent-purple p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Zap size={16} className="text-accent-purple" />
          <h3 className="text-sm font-bold text-text-primary">Autonomous Agent Pipeline</h3>
          <span className="text-[9px] font-black bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded-full tracking-widest uppercase border border-accent-purple/30">
            3-STEP AGENTIC
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            disabled={running}
            className="h-8 bg-bg-tertiary border border-border text-text-primary text-xs rounded-lg px-3 outline-none focus:border-border-focus disabled:opacity-50"
          >
            {AGENT_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={runPipeline}
            disabled={running}
            className="h-8 px-4 bg-accent-purple text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? 'Running…' : 'Run Agent'}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2 mb-4">
        {[
          { n: 1, label: 'Signal Detection',   desc: 'Scan NSE for insider trading activity' },
          { n: 2, label: 'Context Enrichment',  desc: 'Enrich with sector & macro intelligence' },
          { n: 3, label: 'Alert Generation',    desc: 'Generate specific entry/target/stop alert' },
        ].map(({ n, label, desc }) => {
          const done  = steps.find(s => s.step === n);
          const current = running && !done && steps.length === n - 1;
          return (
            <div
              key={n}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                done    ? 'border-accent-purple/40 bg-accent-purple/5'
                : current ? 'border-accent-purple/30 bg-accent-purple/5 animate-pulse'
                : 'border-border-subtle bg-bg-tertiary opacity-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border transition-colors ${
                done ? 'bg-accent-purple border-accent-purple text-white' : 'border-border text-text-muted'
              }`}>
                {done ? <Check size={12} /> : current ? <Loader2 size={11} className="animate-spin" /> : n}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold mb-0.5 ${done ? 'text-accent-purple' : 'text-text-muted'}`}>{label}</p>
                {done
                  ? <p className="text-xs text-text-secondary leading-relaxed">{done.output}</p>
                  : <p className="text-xs text-text-muted">{desc}</p>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Alert */}
      {alert && (
        <div className="border border-accent-green/30 bg-accent-green/5 rounded-xl p-4 animate-slide-in">
          <p className="label mb-3 text-accent-green">FINAL ALERT — {symbol}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
              <p className="label mb-1">Verdict</p>
              <p className={`text-base font-black font-mono ${verdictColor}`}>{alert.verdict?.replace('_', ' ')}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{alert.confidence}% confidence</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
              <p className="label mb-1">Entry Zone</p>
              <p className="text-xs font-semibold text-text-primary leading-snug">{alert.entry_zone || 'Near CMP'}</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
              <p className="label mb-1 text-accent-green">Target</p>
              <p className="text-xs font-semibold text-accent-green leading-snug">{alert.target || '10-15%'}</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
              <p className="label mb-1 text-accent-red">Stop Loss</p>
              <p className="text-xs font-semibold text-accent-red leading-snug">{alert.stop_loss || '-7%'}</p>
            </div>
          </div>
          {alert.action && (
            <div className="mt-3 bg-bg-tertiary rounded-lg p-3 border-l-4 border-l-accent-green">
              <p className="label mb-1">Recommended Action</p>
              <p className="text-sm text-text-primary leading-relaxed">{alert.action}</p>
            </div>
          )}
        </div>
      )}

      {!running && steps.length === 0 && !alert && (
        <p className="text-center text-text-muted text-xs py-2">
          Select a stock and click "Run Agent" to watch the 3-step pipeline execute autonomously.
        </p>
      )}
    </div>
  );
};

// ── Main SignalRadar ──
const SignalRadar = ({ userFunds = [] }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [refreshing, setRefresh] = useState(false);
  const [filterPortfolio, setFilterPortfolio] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefresh(true);
    else setLoading(true);
    try {
      const res = await axios.get('/api/signals', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      setData(res.data);
      setLastFetchTime(new Date());
      setError(null);
    } catch {
      setError('Failed to fetch signals. Is the backend running?');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Check if a signal relates to user's mutual fund holdings
  const isPortfolioRelevant = (symbol) => {
    if (!userFunds.length) return false;
    const holdings = FUND_HOLDINGS[symbol?.toUpperCase()] || [];
    return userFunds.some(f =>
      holdings.some(h => f.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(f.toLowerCase().split(' ')[0]))
    );
  };

  const validSignals = data?.insider_trades?.filter(t => t.analysis?.confidence) || [];
  const avgConfidence = validSignals.length
    ? Math.round(validSignals.reduce((a, t) => a + (t.analysis.confidence || 0), 0) / validSignals.length)
    : 0;
  const buyCount = validSignals.filter(t => ['BUY', 'STRONG BUY', 'STRONG_BUY'].includes(t.analysis?.verdict)).length;

  let displayTrades = data?.insider_trades || [];
  if (filterPortfolio && userFunds.length > 0) {
    displayTrades = displayTrades.filter(t => isPortfolioRelevant(t.symbol));
  }
  
  // Search results for modal (not for main display)
  const searchResults = searchSymbol.trim()
    ? displayTrades.filter(t => t.symbol.toUpperCase().includes(searchSymbol.toUpperCase()))
    : [];

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Page sub-header */}
      <div className="w-full h-12 border-b border-border-subtle bg-bg-primary/90 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={15} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Signal Radar</h2>
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-subtle" />
          {lastFetchTime && (
            <span className="text-[10px] text-text-muted font-mono ml-2">
              Updated: {lastFetchTime.toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && data && (
            <>
              <span className="badge-neutral hidden sm:inline">{data.insider_trades?.length || 0} Signals</span>
              <span className="badge-neutral hidden sm:inline">{avgConfidence}% Avg</span>
              {buyCount > 0 && <span className="badge-green hidden sm:inline">{buyCount} Buy</span>}
              {userFunds.length > 0 && (
                <button
                  onClick={() => setFilterPortfolio(f => !f)}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${
                    filterPortfolio
                      ? 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue'
                      : 'border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Filter size={10} /> My Portfolio
                </button>
              )}
            </>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-border hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary disabled:opacity-40"
            title="Refresh data (no cache)"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 max-w-[1600px] w-full mx-auto">
        {error ? (
          <div className="card p-8 text-center text-accent-red border border-accent-red/20 bg-accent-red/5">
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Agentic Pipeline */}
            {!loading && <AgentPipeline />}

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left — Signal Cards */}
              <div className="lg:w-[62%] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">Insider Trade Signals</h3>
                  {filterPortfolio && userFunds.length > 0 && (
                    <span className="text-[10px] text-accent-blue font-medium">Filtered: portfolio-relevant only</span>
                  )}
                </div>
                {!loading && (
                  <input
                    type="text"
                    placeholder="Search by stock symbol (e.g., RELIANCE, TCS)..."
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                  />
                )}
                {/* Search Modal */}
                <SignalSearchModal
                  isOpen={searchSymbol.trim().length > 0}
                  searchTerm={searchSymbol}
                  results={searchResults}
                  onClose={() => setSearchSymbol('')}
                />
                <div className="flex flex-col gap-4">
                  {loading ? (
                    <><SignalSkeleton /><SignalSkeleton /><SignalSkeleton /></>
                  ) : displayTrades.length > 0 ? (
                    displayTrades.map((trade, idx) => (
                      <SignalCard
                        key={idx}
                        trade={trade}
                        analysis={trade.analysis}
                        portfolioRelevant={isPortfolioRelevant(trade.symbol)}
                      />
                    ))
                  ) : (
                    <div className="card p-12 text-center text-text-muted border-dashed">
                      {filterPortfolio
                        ? 'No signals relevant to your portfolio holdings today.'
                        : 'No significant insider trades detected today.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Deals & News */}
              <div className="lg:w-[38%] flex flex-col gap-6">
                <div className="sticky top-[116px] flex flex-col gap-6">
                  {loading ? (
                    <><TableSkeleton rows={5} /><TableSkeleton rows={3} /></>
                  ) : (
                    <>
                      <DealTable deals={(data?.bulk_deals || []).slice(0, 8)} title="Bulk Deals" />
                      {/* Market News */}
                      {(data?.market_news || []).length > 0 && (
                        <div>
                          <h3 className="section-title mb-3">Market News</h3>
                          <div className="card divide-y divide-border-subtle">
                            {(data?.market_news || []).slice(0, 5).map((n, i) => (
                              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                                className="block px-4 py-3 hover:bg-bg-hover transition-colors">
                                <p className="text-xs font-medium text-text-primary leading-snug mb-1 line-clamp-2">{n.headline}</p>
                                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                  <span>{n.source}</span>
                                  <span>·</span>
                                  <span className="font-mono">{n.datetime}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignalRadar;
