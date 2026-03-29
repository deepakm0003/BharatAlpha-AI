import React from 'react';

const Header = () => {
  return (
    <header className="w-full bg-black border-b border-gray-800 py-4 px-6 relative z-10">
      <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">BharatAlpha AI</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Live</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">Institutional intelligence for every Indian investor</p>
        </div>
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          ET AI Hackathon 2026
        </div>
      </div>
    </header>
  );
};

export default Header;
