import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { CardSkeleton } from './SkeletonLoader';

const IndexCard = ({ idx }) => {
  const isPositive = idx.change_pct >= 0;
  return (
    <div className={`card p-5 border-t-2 ${isPositive ? 'border-t-accent-green' : 'border-t-accent-red'} hover:bg-bg-hover transition-colors`}>
      <p className="label mb-3">{idx.name}</p>
      <p className="font-mono font-bold text-2xl text-text-primary mb-1">
        {idx.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className={`flex items-center gap-1.5 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
        {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        <span className="text-sm font-bold font-mono">
          {isPositive ? '+' : ''}{idx.change?.toFixed(2)} ({isPositive ? '+' : ''}{idx.change_pct?.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};

const SectorBar = ({ sector }) => {
  const isPositive = sector.change_pct >= 0;
  const absVal = Math.abs(sector.change_pct);
  const barWidth = Math.min(absVal * 25, 100);

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-subtle last:border-0">
      <p className="text-sm font-medium text-text-secondary w-20 shrink-0">{sector.name}</p>
      <div className="flex-1 h-1.5 bg-border-subtle rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-accent-green' : 'bg-accent-red'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className={`text-sm font-bold font-mono w-16 text-right ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
        {isPositive ? '+' : ''}{sector.change_pct?.toFixed(2)}%
      </span>
    </div>
  );
};

const MarketPulse = () => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await axios.get('/api/market/indices');
      if (r.data?.indices?.length) setIndices(r.data.indices);
    } catch {
      // use empty state — will show placeholders
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const mainIndices = indices.slice(0, 3);
  const sectorIndices = indices.slice(3);

  // Breadth stats from available data
  const gainers = indices.filter(i => i.change_pct > 0).length;
  const losers = indices.filter(i => i.change_pct < 0).length;
  const breadthBull = gainers > losers;

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="w-full h-12 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 size={18} className="text-text-muted" />
          <h2 className="text-base font-semibold text-text-primary">Market Pulse</h2>
        </div>
        <div className="flex items-center gap-3">
          {!loading && indices.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="badge-neutral">{gainers} Gainers</span>
              <span className="badge-neutral">{losers} Losers</span>
            </div>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-border hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary disabled:opacity-40"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1400px] w-full mx-auto flex flex-col gap-6">

        {/* Main Indices */}
        <div>
          <h3 className="section-title mb-4">Benchmark Indices</h3>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <CardSkeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mainIndices.length ? mainIndices.map((idx, i) => <IndexCard key={i} idx={idx} />) : (
                <p className="text-sm text-text-muted col-span-3 text-center py-8">Unable to fetch live index data. Please check your connection.</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Performance */}
          <div>
            <h3 className="section-title mb-4">Sector Performance</h3>
            {loading ? (
              <CardSkeleton className="h-64" />
            ) : (
              <div className="card p-5">
                {sectorIndices.length ? sectorIndices.map((s, i) => (
                  <SectorBar key={i} sector={s} />
                )) : (
                  <p className="text-sm text-text-muted text-center py-6">Sector data loading from live APIs...</p>
                )}
              </div>
            )}
          </div>

          {/* Market Breadth */}
          <div className="flex flex-col gap-4">
            <h3 className="section-title">Market Breadth</h3>

            {/* Breadth meter */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="label">Advance / Decline</p>
                <span className={breadthBull ? 'badge-green' : 'badge-red'}>
                  {breadthBull ? 'Bullish Breadth' : 'Bearish Breadth'}
                </span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden mb-2">
                <div className="bg-accent-green transition-all" style={{ width: `${(gainers / (gainers + losers || 1)) * 100}%` }} />
                <div className="bg-accent-red flex-1" />
              </div>
              <div className="flex justify-between text-xs text-text-muted font-mono">
                <span><span className="text-accent-green font-bold">{gainers}</span> Advancing</span>
                <span><span className="text-accent-red font-bold">{losers}</span> Declining</span>
              </div>
            </div>

            {/* Key levels */}
            <div className="card p-5">
              <p className="label mb-4">Key Support / Resistance</p>
              <div className="space-y-3">
                {(() => {
                  const nifty = mainIndices[0];
                  const val = nifty?.value ?? 0;
                  // Dynamic: resistance +2%, support -2%
                  const resistance = Math.round(val * 1.02 / 50) * 50;
                  const support = Math.round(val * 0.98 / 50) * 50;
                  return [
                    { label: 'Nifty Resistance', value: resistance ? resistance.toLocaleString('en-IN') : '—', type: 'resist' },
                    { label: 'Nifty Current', value: val ? val.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—', type: 'current' },
                    { label: 'Nifty Support', value: support ? support.toLocaleString('en-IN') : '—', type: 'support' },
                  ].map((level, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${level.type === 'resist' ? 'bg-accent-red' : level.type === 'current' ? 'bg-white' : 'bg-accent-green'}`} />
                      <span className="text-sm text-text-secondary">{level.label}</span>
                    </div>
                    <span className="font-mono font-bold text-sm text-text-primary">{level.value}</span>
                  </div>
                ));
                })()}
              </div>
            </div>

            {/* Market sentiment */}
            <div className="card p-5 border-l-4 border-l-white/10">
              <p className="label mb-2">Today's Market Mood</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {gainers > losers
                  ? `Positive breadth with ${gainers} indices advancing. FII buying supporting the rally in broader markets.`
                  : `Negative breadth with ${losers} indices declining. Profit-booking in key sectors amid global cues.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
