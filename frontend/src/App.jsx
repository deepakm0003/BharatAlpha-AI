import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import SignalRadar from './components/SignalRadar';
import SmartMoneyFlow from './components/SmartMoneyFlow';
import PortfolioXRay from './components/PortfolioXRay';
import MarketPulse from './components/MarketPulse';
import Watchlist from './components/Watchlist';
import ChartPatterns from './components/ChartPatterns';
import MarketChat from './components/MarketChat';
import OpportunityRadar from './components/OpportunityRadar';
import SearchPage from './components/SearchPage';

function App() {
  const [activeTab, setActiveTab]         = useState('home');
  // Global portfolio context — set by PortfolioXRay, read by SignalRadar + Chat
  const [userFunds, setUserFunds]         = useState([]);
  const [userWatchlist, setUserWatchlist] = useState([]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':       return <HomePage onNavigate={setActiveTab} />;
      case 'signals':    return <SignalRadar    userFunds={userFunds} />;
      case 'smartmoney': return <SmartMoneyFlow />;
      case 'market':     return <MarketPulse />;
      case 'watchlist':  return <Watchlist setUserWatchlist={setUserWatchlist} />;
      case 'patterns':   return <ChartPatterns />;
      case 'portfolio':  return <PortfolioXRay setUserFunds={setUserFunds} />;
      case 'radar':      return <OpportunityRadar />;
      case 'chat':       return <MarketChat userFunds={userFunds} userWatchlist={userWatchlist} />;
      case 'search':     return <SearchPage onNavigate={setActiveTab} />;
      default:           return <HomePage onNavigate={setActiveTab} />;
    }
  };

  const isHome = activeTab === 'home';

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Home page has its own ticker strip inside; other pages get pt-[92px] */}
      <main className={isHome ? 'pt-14' : 'pt-[92px] min-h-screen'}>
        {renderTab()}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

import { Activity, TrendingUp, Briefcase, BarChart2, GitBranch, Radar, MessageSquare, Home, Search } from 'lucide-react';

const MOB_TABS = [
  { id: 'home',       icon: Home          },
  { id: 'signals',    icon: Activity      },
  { id: 'radar',      icon: Radar         },
  { id: 'patterns',   icon: GitBranch     },
  { id: 'chat',       icon: MessageSquare },
  { id: 'search',     icon: Search        },
  { id: 'portfolio',  icon: Briefcase     },
];

const MobileNav = ({ activeTab, setActiveTab }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-border-subtle z-50 flex justify-around items-center px-1 py-2">
    {MOB_TABS.map(({ id, icon: Icon }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${active ? 'text-white bg-bg-elevated' : 'text-text-muted'}`}
        >
          <Icon size={18} />
        </button>
      );
    })}
  </nav>
);

export default App;
