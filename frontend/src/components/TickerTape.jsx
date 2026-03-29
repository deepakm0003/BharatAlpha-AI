import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FALLBACK = [
  { name: 'NIFTY 50', value: 24350.50, change_pct: 0.75 },
  { name: 'SENSEX', value: 80214.80, change_pct: 0.75 },
  { name: 'BANK NIFTY', value: 52840.30, change_pct: -0.23 },
  { name: 'NIFTY IT', value: 37210.40, change_pct: 1.14 },
  { name: 'NIFTY PHARMA', value: 19840.60, change_pct: 1.59 },
  { name: 'NIFTY AUTO', value: 23450.90, change_pct: -0.36 },
];

const TickerTape = () => {
  const [indices, setIndices] = useState(FALLBACK);

  useEffect(() => {
    axios.get('/api/market/indices')
      .then(r => { if (r.data?.indices?.length) setIndices(r.data.indices); })
      .catch(() => {});
    const interval = setInterval(() => {
      axios.get('/api/market/indices')
        .then(r => { if (r.data?.indices?.length) setIndices(r.data.indices); })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const items = [...indices, ...indices]; // duplicate for seamless loop

  return (
    <div className="h-9 border-b border-border-subtle bg-bg-secondary overflow-hidden flex items-center sticky top-0 z-40">
      <div className="ticker-tape flex items-center gap-0">
        {items.map((idx, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2 px-5 py-1 shrink-0">
              <span className="font-mono text-xs font-semibold text-text-secondary whitespace-nowrap">{idx.name}</span>
              <span className="font-mono text-xs font-bold text-white whitespace-nowrap">
                {idx.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`font-mono text-[10px] font-bold whitespace-nowrap ${idx.change_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {idx.change_pct >= 0 ? '+' : ''}{idx.change_pct?.toFixed(2)}%
              </span>
            </div>
            <div className="w-px h-3 bg-border-subtle shrink-0" />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;
