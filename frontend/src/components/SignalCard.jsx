import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';

const SignalCard = ({ trade, analysis, portfolioRelevant = false }) => {
  const [expanded, setExpanded] = useState(false);

  const verdict = analysis?.verdict || 'NEUTRAL';
  const isBuy = verdict === 'BUY' || verdict === 'STRONG BUY';
  const isAvoid = verdict === 'AVOID' || verdict === 'SELL';
  const isNeutral = !isBuy && !isAvoid;

  const verdictClass = isBuy
    ? 'badge-green'
    : isAvoid
    ? 'badge-red'
    : 'badge-yellow';

  const accentBar = isBuy
    ? 'bg-accent-green'
    : isAvoid
    ? 'bg-accent-red'
    : 'bg-border-strong';

  const actionBg = isBuy
    ? 'bg-accent-green/10 border-accent-green/20 border-l-accent-green'
    : isAvoid
    ? 'bg-accent-red/10 border-accent-red/20 border-l-accent-red'
    : 'bg-bg-elevated border-border border-l-border-strong';

  const actionText = isBuy ? 'text-accent-green' : isAvoid ? 'text-accent-red' : 'text-text-secondary';

  const confidence = analysis?.confidence || 0;

  return (
    <div className="card border border-border hover:border-border-strong transition-all duration-200 overflow-hidden animate-slide-in group">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentBar} opacity-80`} />

      <div className="p-5 pl-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-text-primary font-mono tracking-tight">{trade?.symbol}</h3>
              <span className={verdictClass}>{verdict}</span>
              {portfolioRelevant && (
                <span className="badge-green text-[9px] tracking-widest">IN YOUR PORTFOLIO</span>
              )}
            </div>
            <p className="text-sm text-text-secondary">
              {trade?.acquirerName}
              <span className="mx-1.5 text-border-strong">·</span>
              <span className={isBuy ? 'text-accent-green' : isAvoid ? 'text-accent-red' : 'text-text-secondary'}>
                {trade?.transactionType}
              </span>
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono text-text-primary">₹{trade?.valueOfSharesAcquired} Cr</p>
            <p className="text-xs text-text-muted font-mono mt-0.5">{(trade?.noOfSharesAcquired || 0).toLocaleString('en-IN')} shares</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="label">AI Confidence</span>
            <span className={`text-[11px] font-bold font-mono ${isBuy ? 'text-accent-green' : isAvoid ? 'text-accent-red' : 'text-accent-yellow'}`}>
              {confidence}%
            </span>
          </div>
          <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isBuy ? 'bg-accent-green' : isAvoid ? 'bg-accent-red' : 'bg-accent-yellow'}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Current Stock Price (REAL-TIME) */}
        {trade?.stock_quote && (
          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Current Stock Price</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold font-mono text-text-primary">₹{trade.stock_quote.price?.toFixed(2)}</p>
                <p className="text-xs text-text-muted mt-0.5">Live (NSE)</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold font-mono ${trade.stock_quote.change_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {trade.stock_quote.change_pct >= 0 ? '↑' : '↓'} {Math.abs(trade.stock_quote.change_pct).toFixed(2)}%
                </p>
                <p className={`text-xs font-mono ${trade.stock_quote.change >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {trade.stock_quote.change >= 0 ? '+' : ''}₹{trade.stock_quote.change?.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-text-muted mt-2 pt-2 border-t border-border-subtle">
              <span>H: ₹{trade.stock_quote.high?.toFixed(2)}</span>
              <span>L: ₹{trade.stock_quote.low?.toFixed(2)}</span>
              <span>Vol: {(trade.stock_quote.volume / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{analysis?.reasoning}</p>

        {/* Action Box */}
        <div className={`rounded-lg p-3 border border-l-4 ${actionBg} mb-3`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${actionText}`}>Recommended Action</p>
          <p className="text-sm text-text-primary font-medium leading-relaxed">{analysis?.action}</p>
        </div>

        {/* Expandable bottom */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-text-muted hover:text-text-secondary transition-colors pt-1"
        >
          <span className="text-xs font-medium">Details & History</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border-subtle space-y-3 animate-slide-in">
            {/* Entry / Target / Stop Loss row */}
            {(analysis?.entry_zone || analysis?.target || analysis?.stop_loss) && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-bg-tertiary rounded-lg p-2.5 border border-border-subtle">
                  <p className="label mb-1">Entry Zone</p>
                  <p className="text-xs font-medium text-text-primary leading-snug">{analysis.entry_zone || '—'}</p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-2.5 border border-border-subtle">
                  <p className="label mb-1 text-accent-green">Target</p>
                  <p className="text-xs font-semibold text-accent-green leading-snug">{analysis.target || '—'}</p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-2.5 border border-border-subtle">
                  <p className="label mb-1 text-accent-red">Stop Loss</p>
                  <p className="text-xs font-semibold text-accent-red leading-snug">{analysis.stop_loss || '—'}</p>
                </div>
              </div>
            )}
            {analysis?.historical_precedent && (
              <div className="bg-bg-tertiary rounded-lg p-3">
                <p className="label mb-1.5">Historical Precedent</p>
                <p className="text-sm text-text-secondary italic leading-relaxed">{analysis.historical_precedent}</p>
              </div>
            )}
            <div className="flex items-start gap-2 text-xs text-accent-red">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{analysis?.risk || 'Market risk applies.'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted font-mono">
              <span>Date: {trade?.dateOfAllotment}</span>
              <span>{trade?.noOfSharesAcquired} shares</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalCard;

