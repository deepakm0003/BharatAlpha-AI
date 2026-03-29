import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartSkeleton, TableSkeleton, StatCardSkeleton } from './SkeletonLoader';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

const TrendIcon = ({ trend }) => {
  if (trend === 'BULLISH') return <TrendingUp size={20} className="text-accent-green" />;
  if (trend === 'BEARISH') return <TrendingDown size={20} className="text-accent-red" />;
  return <Minus size={20} className="text-accent-yellow" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border rounded-lg p-3 shadow-card text-xs font-mono">
      <p className="text-text-secondary mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }} className="font-bold">
          {p.name}: {p.value > 0 ? '+' : ''}₹{p.value?.toLocaleString('en-IN')} Cr
        </p>
      ))}
    </div>
  );
};

const SmartMoneyFlow = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await axios.get('/api/smartmoney');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch smart money flows.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { flows = [], analysis } = data || {};

  const chartData = [...flows].reverse().map(f => ({
    date: f.date?.split('-').slice(0, 2).join(' '),
    FII: parseFloat(f.fiiNetValue) || 0,
    DII: parseFloat(f.diiNetValue) || 0,
  }));

  const trendColor = analysis?.trend === 'BULLISH'
    ? 'text-accent-green border-accent-green bg-accent-green/5'
    : analysis?.trend === 'BEARISH'
    ? 'text-accent-red border-accent-red bg-accent-red/5'
    : 'text-accent-yellow border-accent-yellow bg-accent-yellow/5';

  // compute 5-day totals
  const last5 = flows.slice(0, 5);
  const fiiTotal = last5.reduce((a, f) => a + (parseFloat(f.fiiNetValue) || 0), 0);
  const diiTotal = last5.reduce((a, f) => a + (parseFloat(f.diiNetValue) || 0), 0);

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="w-full h-12 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-[92px] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} className="text-text-muted" />
          <h2 className="text-base font-semibold text-text-primary">Smart Money Flow</h2>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-border hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary disabled:opacity-40"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-6 flex-1 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
        {error ? (
          <div className="card p-8 text-center text-accent-red border-accent-red/20 bg-accent-red/5">{error}</div>
        ) : (
          <>
            {/* Trend Banner */}
            {loading ? <StatCardSkeleton /> : (
              <div className={`card border-l-4 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${trendColor}`}>
                <div className="flex items-center gap-4">
                  <TrendIcon trend={analysis?.trend} />
                  <div>
                    <p className="label mb-0.5">Market Trend</p>
                    <h1 className="text-3xl font-black tracking-tight">{analysis?.trend || 'NEUTRAL'}</h1>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-bg-secondary/60 rounded-lg px-4 py-2 border border-border-subtle">
                    <p className="label mb-1">FII (5d)</p>
                    <p className={`font-mono font-bold text-lg ${fiiTotal >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {fiiTotal >= 0 ? '+' : ''}₹{fiiTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
                    </p>
                  </div>
                  <div className="bg-bg-secondary/60 rounded-lg px-4 py-2 border border-border-subtle">
                    <p className="label mb-1">DII (5d)</p>
                    <p className={`font-mono font-bold text-lg ${diiTotal >= 0 ? 'text-accent-blue' : 'text-accent-red'}`}>
                      {diiTotal >= 0 ? '+' : ''}₹{diiTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
                    </p>
                  </div>
                  {analysis?.sectors_to_watch?.length > 0 && (
                    <div className="bg-bg-secondary/60 rounded-lg px-4 py-2 border border-border-subtle">
                      <p className="label mb-1">Watch</p>
                      <p className="text-sm font-medium text-text-primary">{analysis.sectors_to_watch.slice(0, 3).join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Chart */}
              <div className="lg:w-[60%] flex flex-col gap-4">
                <h3 className="section-title">Net Flows — Last 10 Days (₹ Cr)</h3>
                {loading ? <ChartSkeleton /> : (
                  <div className="card p-5 h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                        <XAxis dataKey="date" stroke="#555" tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: '#2a2a2a' }} />
                        <YAxis stroke="#555" tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <ReferenceLine y={0} stroke="#2a2a2a" />
                        <Bar dataKey="FII" name="FII Net" fill="#00ff88" radius={[3, 3, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="DII" name="DII Net" fill="#4cc9f0" radius={[3, 3, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {!loading && analysis?.pattern_detected && (
                  <div className="card p-4 flex items-start gap-3 border-l-4 border-l-accent-yellow">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow mt-1.5 shrink-0" />
                    <div>
                      <p className="label mb-1.5">Pattern Detected</p>
                      <p className="text-sm text-text-secondary leading-relaxed">{analysis.pattern_detected}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Table & Outlook */}
              <div className="lg:w-[40%] flex flex-col gap-4">
                <h3 className="section-title">Daily Breakdown</h3>
                {loading ? <TableSkeleton rows={8} /> : (
                  <div className="flex flex-col gap-4">
                    <div className="card overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-bg-elevated border-b border-border-subtle">
                          <tr>
                            <th className="px-4 py-3 label">Date</th>
                            <th className="px-4 py-3 label text-right">FII</th>
                            <th className="px-4 py-3 label text-right">DII</th>
                            <th className="px-4 py-3 label text-right">Net</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {flows.map((flow, idx) => {
                            const fii = parseFloat(flow.fiiNetValue) || 0;
                            const dii = parseFloat(flow.diiNetValue) || 0;
                            const total = fii + dii;
                            return (
                              <tr key={idx} className="hover:bg-bg-hover transition-colors">
                                <td className="px-4 py-2.5 text-text-secondary text-xs font-medium">{flow.date?.split('-').slice(0, 2).join(' ')}</td>
                                <td className={`px-4 py-2.5 text-right font-mono text-xs font-bold ${fii >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                  {fii >= 0 ? '+' : ''}{fii.toFixed(0)}
                                </td>
                                <td className={`px-4 py-2.5 text-right font-mono text-xs font-bold ${dii >= 0 ? 'text-accent-blue' : 'text-accent-red'}`}>
                                  {dii >= 0 ? '+' : ''}{dii.toFixed(0)}
                                </td>
                                <td className={`px-4 py-2.5 text-right font-mono text-xs ${total >= 0 ? 'text-text-primary' : 'text-accent-red'}`}>
                                  {total >= 0 ? '+' : ''}{total.toFixed(0)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {analysis?.outlook && (
                      <div className="card p-4 border-l-4 border-l-white/20">
                        <p className="label mb-2">AI Outlook</p>
                        <p className="text-sm text-text-secondary leading-relaxed">{analysis.outlook}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartMoneyFlow;