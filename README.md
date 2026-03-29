# 🇮🇳 BharatAlpha AI
### *Institutional-Grade Market Intelligence for Every Indian Investor*

> **ET AI Hackathon 2026** — Empowering 14 crore retail investors with the same edge as top-tier analysts.

---

## 🌟 What We Built

**BharatAlpha AI** is a full-stack, AI-powered financial intelligence platform that gives Indian retail investors real-time market signals, smart-money tracking, portfolio analysis, and an AI chat assistant — all in one beautifully designed dashboard.

---

## 🖥️ Live Features

### 1. 🏠 Home Dashboard
- Live **Ticker Tape** with NSE/BSE prices scrolling in real-time
- Market overview cards with NIFTY, SENSEX, NIFTY BANK at a glance
- Quick-access to all 7 intelligence modules
- Market sentiment indicator (Bullish / Neutral / Bearish)

### 2. 📡 Signal Radar
- Tracks **insider trades** and **bulk deals** from NSE in real time
- AI (Claude Sonnet 4) analyzes each trade: *Why is this significant? What does it signal?*
- Color-coded confidence scoring (High / Medium / Low)
- Filterable by sector, signal type, and market cap

### 3. 💰 Smart Money Flow
- Live **FII & DII daily net flows** from NSE
- 30-day trend charts (Recharts) with moving averages
- AI interpretation: *"FIIs have been net buyers for 4 consecutive sessions — historically bullish"*
- Sector-wise FII activity breakdown

### 4. 📁 Portfolio X-Ray
- Enter your **mutual fund holdings** (name + amount)
- Fetches live NAVs from **AMFI India** portal
- AI generates a full portfolio health report:
  - Asset allocation vs optimal benchmarks
  - Sector concentration risk alerts
  - Overlap analysis across funds
  - Rebalancing recommendations with specific actions
- Downloadable PDF report

### 5. 📊 Market Pulse
- Live market indices: NIFTY 50, SENSEX, NIFTY BANK, NIFTY IT, INDIA VIX
- Top gainers & losers with % change
- Sector heatmap (Banking, IT, Pharma, Auto, FMCG, Infra)
- Market breadth: advances vs declines
- Powered by **yfinance** + NSE public APIs

### 6. 👁️ Watchlist
- Add NSE stocks to a personal watchlist
- Live price tracking with change % and volume
- One-click AI analysis for any watchlist stock
- Price alerts (visual threshold markers)

### 7. 📈 Chart Patterns
- AI-detected **technical patterns** across 500+ NSE stocks:
  - Cup & Handle, Head & Shoulders, Double Top/Bottom
  - Bull/Bear Flags, Wedges, Triangles
  - 52-week breakouts with volume confirmation
- Pattern confidence score + entry/target/stop-loss for each
- Powered by real OHLCV data via **yfinance**

### 8. 🎯 Opportunity Radar
- AI-screened multi-factor stock scanner:
  - RSI momentum + MACD crossover
  - FII net buying + promoter activity
  - Volume surge detection (>150% of 20-day avg)
  - Fundamental filters (PE, ROE, Debt)
- Weekly shortlist of high-conviction setups

### 9. 🔍 Search
- Instant NSE/BSE stock search by name or ticker
- Live quote, 52-week range, P/E, market cap
- One-click deep-dive: technical + fundamental + AI summary

### 10. 🤖 BharatAlpha Intelligence (AI Chat)
- Conversational AI assistant for market questions
- **Portfolio-aware**: personalizes answers based on your holdings
- **Watchlist-aware**: tracks your stocks in context
- Injects live market data into every response (indices, FII, stock quotes)
- Powered by **Google Gemini** (primary) + **Claude Sonnet 4** (fallback)
- Works offline with built-in demo intelligence engine
- Example queries:
  - *"Is RELIANCE a buy right now?"*
  - *"Explain today's FII activity"*
  - *"Should I rebalance my Parag Parikh fund?"*
  - *"Find me a stock breaking out today"*

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    BharatAlpha AI v3.0                   │
│                                                          │
│  ┌──────────────────┐        ┌──────────────────────┐   │
│  │   React 18 SPA   │◄──────▶│   FastAPI Backend    │   │
│  │  Vite + Tailwind │  REST  │   Python 3.11        │   │
│  │  Recharts + Lucide│       │   Uvicorn ASGI       │   │
│  └──────────────────┘        └──────────┬───────────┘   │
│                                          │               │
│                               ┌──────────▼──────────┐   │
│                               │    Data Services    │   │
│                               │  ┌───────────────┐  │   │
│                               │  │  NSE Fetcher  │  │   │
│                               │  │  AMFI Fetcher │  │   │
│                               │  │  yfinance     │  │   │
│                               │  │  Finnhub      │  │   │
│                               │  └───────┬───────┘  │   │
│                               │          │           │   │
│                               │  ┌───────▼───────┐  │   │
│                               │  │   AI Engine   │  │   │
│                               │  │ Gemini (pri.) │  │   │
│                               │  │ Claude (fall.)│  │   │
│                               │  └───────────────┘  │   │
│                               └─────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide React |
| **Backend** | FastAPI (Python 3.11), Uvicorn, HTTPX, asyncio |
| **AI / LLM** | Google Gemini (primary), Anthropic Claude Sonnet 4 (fallback) |
| **Market Data** | NSE/BSE public APIs, AMFI India, yfinance, Finnhub |
| **PDF Export** | ReportLab (portfolio reports) |
| **Deployment** | Frontend: Vercel · Backend: Railway |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/signals` | Insider trades & bulk deals with AI analysis |
| `GET` | `/api/smartmoney` | FII/DII flows with trend interpretation |
| `POST` | `/api/portfolio/analyze` | Full mutual fund portfolio X-Ray |
| `GET` | `/api/market` | Live indices, gainers, losers, breadth |
| `GET` | `/api/patterns` | AI-detected chart patterns |
| `GET` | `/api/radar` | Multi-factor screened opportunities |
| `POST` | `/api/chat` | Portfolio-aware AI chat |
| `GET` | `/api/search` | NSE/BSE stock search |
| `GET/POST` | `/api/watchlist` | Personal watchlist management |

---

## 💡 Impact Model

```
14 crore demat accounts in India
× 95% have NO professional advisor
= 13.3 crore underserved retail investors

Average retail underperformance vs NIFTY = 4.2%/year (SEBI data)
On avg ₹3L portfolio → ₹12,600 lost per investor per year

BharatAlpha closes 50% of that gap
→ ₹6,300 value created per user per year

At ₹499/year subscription
→ ₹7,000 Cr TAM from just the top 1 crore users

ET's existing 50M+ digital users = ₹0 CAC for distribution 🚀
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- API Keys: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (Gemini), `FINNHUB_API_KEY`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### One-Command Start (Windows)

```bat
start.bat
```

### One-Command Start (Linux/Mac)

```bash
./start.sh
```

---

## 🔑 Environment Variables

```env
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_API_KEY=your_gemini_api_key
FINNHUB_API_KEY=your_finnhub_key
ALPHAVANTAGE_API_KEY=your_alphavantage_key   # optional
```

---

## 🚀 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | Auto-deploy from `frontend/dist` |
| Backend | Railway | Docker-free Python deploy |

---

## 📂 Project Structure

```
bharatalpha/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.jsx          # Landing dashboard
│   │   │   ├── SignalRadar.jsx        # Insider trade signals
│   │   │   ├── SmartMoneyFlow.jsx     # FII/DII tracker
│   │   │   ├── PortfolioXRay.jsx      # MF portfolio analyzer
│   │   │   ├── MarketPulse.jsx        # Live market indices
│   │   │   ├── ChartPatterns.jsx      # AI pattern detection
│   │   │   ├── OpportunityRadar.jsx   # Stock screener
│   │   │   ├── MarketChat.jsx         # AI chat assistant
│   │   │   ├── Watchlist.jsx          # Personal watchlist
│   │   │   └── SearchPage.jsx         # Stock search
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── routers/
│   │   ├── signals.py     # Insider trade API
│   │   ├── smartmoney.py  # FII/DII API
│   │   ├── portfolio.py   # Portfolio X-Ray API
│   │   ├── market.py      # Market data API
│   │   ├── patterns.py    # Chart patterns API
│   │   ├── radar.py       # Opportunity screener API
│   │   ├── chat.py        # AI chat API
│   │   ├── watchlist.py   # Watchlist API
│   │   └── search.py      # Search API
│   ├── services/
│   │   ├── claude_analyst.py    # Claude AI integration
│   │   ├── gemini_analyst.py    # Gemini AI integration
│   │   ├── nse_fetcher.py       # NSE/BSE data
│   │   ├── amfi_fetcher.py      # Mutual fund NAVs
│   │   ├── finnhub_fetcher.py   # News & market data
│   │   └── pdf_generator.py     # Report generation
│   └── main.py
├── start.bat
├── start.sh
└── README.md
```

---

## 🏆 Why BharatAlpha Wins

| Feature | Traditional Apps | BharatAlpha AI |
|---------|-----------------|----------------|
| Stock analysis | Price charts only | AI with entry/target/SL |
| Mutual funds | NAV tracker | Full AI portfolio X-Ray |
| FII/DII data | Raw numbers | AI trend interpretation |
| Chat | None / generic | Portfolio-aware AI |
| Insider trades | Delayed, manual | Real-time + AI analysis |
| Availability | Online only | Works offline (demo mode) |

---

## ⚠️ Disclaimer

All analysis, signals, and recommendations on BharatAlpha AI are for **educational purposes only**. This platform is **not SEBI-registered** and does not provide regulated investment advice. Always consult a SEBI-registered advisor before making investment decisions.

---

**Team:** Solo submission · ET AI Hackathon 2026  
**Powered by:** Claude Sonnet 4 + Google Gemini + NSE Live Data
#   B h a r a t A l p h a - A I  
 