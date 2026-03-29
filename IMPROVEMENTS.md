# BharatAlpha v3.1 - Real Data & IST Timezone Updates

## What's New ✨

### 1. **Real Dates & IST Timezone Support**
- ✅ All timestamps now use **Asia/Kolkata (IST)** timezone
- ✅ Market dates fetched as IST (not UTC)
- ✅ NSE insider trades from IST dates (30-day window IST)
- ✅ Bulk deals from IST dates (7-day window IST)
- ✅ FII/DII data shows IST timestamps

### 2. **Real-Time Market Data After Opening**
- ✅ Market status endpoint (`/api/market/status`) shows:
  - Is NSE currently OPEN/CLOSED
  - Current time in IST
  - Market open/close times
  - Day of week & date
  
- ✅ Quote endpoint includes `is_live_data` flag
- ✅ Indices show IST timestamps

### 3. **Better Data Structure**
- ✅ All API responses include `timezone: "Asia/Kolkata (IST)"`
- ✅ All API responses include `last_updated` with ISO 8601 IST timestamp
- ✅ `fetched_at` timestamps on insider trades, bulk deals, FII/DII
- ✅ Data validation layer (`DataValidator`) for quality checks
- ✅ Proper error messages for invalid data

### 4. **Configuration & Resilience**
- ✅ Central config in `services/config.py`:
  - Market hours (9:15 AM - 3:30 PM IST)
  - NSE holidays calendar
  - Retry logic configuration
  - Cache TTL settings
  - Sector mapping

- ✅ Better cache management with IST time checks
- ✅ Fallback data sources with proper logging

---

## File Structure Changes

```
backend/
├── services/
│   ├── config.py ⭐ NEW - Timezone, market hours, holidays, configuration
│   ├── data_validator.py ⭐ NEW - Data quality checks
│   ├── nse_fetcher.py 🔄 UPDATED - IST dates, better timestamps
│   └── ...
└── routers/
    ├── market.py 🔄 UPDATED - Market status, IST timestamps
    └── ...
```

---

## Quick Start Guide

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create `.env` file in `backend/` directory:
```
ANTHROPIC_API_KEY=sk-ant-... (your Claude API key)
FINNHUB_API_KEY=... (optional, for fallback)
ALPHAVANTAGE_API_KEY=... (optional, for fallback)
```

### 3. Run the Backend
```bash
# From backend/ directory
python main.py
```

Backend runs on: **http://localhost:8000**

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## API Endpoints (with IST timestamps)

### Market Status & Data
- `GET /api/market/status` → Market open/close, current IST time, day
- `GET /api/market/indices` → NIFTY, SENSEX, sector indices (with IST timestamp)
- `GET /api/market/quote?symbol=RELIANCE` → Live stock quote (with IST timestamp, is_live_data flag)
- `GET /api/market/fii` → FII/DII flows (with IST timestamp)
- `GET /api/market/news` → Market news (with IST timestamp)
- `GET /api/market/movers` → Top gainers/losers (with IST timestamp)

### Key Features
- `GET /api/signals` → Insider trades with IST dates
- `GET /api/signals/agent-run?symbol=RELIANCE` → AI analysis pipeline
- `GET /api/patterns` → Technical patterns with IST timestamp
- `GET /api/radar` → Opportunity radar with IST timestamp
- `GET /api/watchlist/quotes` → Watchlist quotes with IST timestamp

---

## Data Quality Features

### New: `data_validator.py` Module
Validates and sanitizes all market data:
- ✅ Symbol validation (NSE format)
- ✅ Price validation (reasonable ranges)
- ✅ Volume validation
- ✅ Percentage change validation
- ✅ Date validation (not future)
- ✅ Data freshness checks (quote age)
- ✅ Completeness metrics

### Example Usage
```python
from services.data_validator import QuoteValidator

quote = {"symbol": "RELIANCE", "price": 2850.50, "volume": 5000000}
is_valid, cleaned, error = QuoteValidator.validate_quote(quote)

if is_valid:
    print(f"Valid quote: {cleaned}")
else:
    print(f"Error: {error}")
```

---

## New Configuration System

### `config.py` Highlights

```python
# Timezone
IST = pytz.timezone("Asia/Kolkata")
get_ist_now()  # Get current time in IST

# Market Hours
NSE_OPEN_TIME = time(9, 15)  # 9:15 AM
NSE_CLOSE_TIME = time(15, 30)  # 3:30 PM

# Market Status Check
is_market_open()  # Returns bool
get_market_status()  # Returns detailed status dict

# NSE Holidays
NSE_HOLIDAYS_2025 = [...]  # Add holidays as needed

# Sector Mapping
get_sector("RELIANCE")  # Returns "Energy"
```

---

## Example Responses (with IST)

### `/api/market/status`
```json
{
  "is_open": true,
  "current_time": "2026-03-27T14:30:45.123456+05:30",
  "open_time": "09:15:00",
  "close_time": "15:30:00",
  "day_of_week": "Friday",
  "date": "2026-03-27"
}
```

### `/api/market/quote?symbol=RELIANCE`
```json
{
  "quote": {
    "symbol": "RELIANCE",
    "price": 2850.50,
    "change": 12.50,
    "change_pct": 0.44,
    "timestamp": "2026-03-27T14:30:00+05:30"
  },
  "is_live_data": true,
  "fetched_at": "2026-03-27T14:30:01.123456+05:30",
  "market_status": {...},
  "timezone": "Asia/Kolkata (IST)"
}
```

### `/api/signals`
```json
{
  "data": [
    {
      "symbol": "INFY",
      "acquirerName": "Goldman Sachs",
      "transactionType": "Buy",
      "dateOfAllotment": "2026-03-27",
      "fetched_at": "2026-03-27T14:30:00+05:30"
    }
  ],
  "last_updated": "2026-03-27T14:30:01.123456+05:30",
  "timezone": "Asia/Kolkata (IST)"
}
```

---

## Fallback Chain (Resilience)

### Stock Quotes
1. **yfinance** (primary) → Real yfinance data
2. **Finnhub** (fallback 1) → If yfinance fails
3. **Alpha Vantage** (fallback 2) → If both fail
4. **Cached data** → If all external sources fail

### Insider Trades
1. **NSE API** → Real insider trades
2. **Finnhub** → Alternative source
3. **Market news signals** → Generated from news
4. **Cache** → Previous cache if available

### FII/DII Data
1. **NSE API** → Real FII/DII flows
2. **NIFTY movement proxy** → Generated from index movements
3. **Cache** → Previous cache if available

---

## Performance & Caching

- **Cache TTL**: 5 minutes (configurable in `config.py`)
- **Market data cache**: 5 minutes (quotes, indices, FII/DII)
- **Stable data cache**: 1 hour (sector mapping, lookup tables)
- **IST-aware expiry**: Cache age calculated using IST time

---

## What to Look For

### Real Data Indicators ✅
- [ ] `/api/market/status` shows current IST time
- [ ] `/api/market/quote?symbol=RELIANCE` shows recent IST timestamp
- [ ] Insider trades show today's IST date
- [ ] FII/DII shows today's IST date
- [ ] Market status shows "Friday" (or actual day)

### Live Market Indicators ✅
- [ ] Indices show non-zero change percentages
- [ ] Stock quotes show realistic prices (₹100+)
- [ ] Volume data is non-zero on trading days
- [ ] Market status shows "open" during 9:15 AM - 3:30 PM IST

---

## Common Issues & Fixes

### Issue: Dates are still in UTC
**Fix**: Restart backend. Verify `services/config.py` is imported in `nse_fetcher.py`.

### Issue: Market data is stale
**Fix**: 
- Check cache TTL in `config.py` (set to 5 minutes)
- Ensure market is open (9:15 AM - 3:30 PM IST)
- Check logs for API failures (NSE often returns 403)

### Issue: NSE API returns 403
**This is normal!** Fallback chain handles this:
- yfinance is primary (more reliable)
- Finnhub is fallback
- Market news signals are generated
- Cache is used during outages

---

## Next Steps (Roadmap)

- [ ] Add Redis for distributed cache (if scaling needed)
- [ ] Add webhook support for real-time alerts
- [ ] Add trade journal with entry/exit tracking
- [ ] Add portfolio persistence (database)
- [ ] Add historical backtesting engine
- [ ] Add multi-user authentication

---

## Debugging

### Enable Verbose Logging
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Data Freshness
```python
# In terminal
curl http://localhost:8000/api/market/status
curl http://localhost:8000/api/market/quote?symbol=RELIANCE
```

### Validate Data Quality
```python
from services.data_validator import DataHealthChecker
health = DataHealthChecker.check_data_completeness(quotes)
print(health)  # Shows completeness %
```

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Timezone | System default (UTC) | 🌍 IST (Asia/Kolkata) |
| Dates | UTC dates | 📅 IST dates |
| Market Hours | Not tracked | ✅ 9:15 AM - 3:30 PM IST |
| Data Validation | None | ✅ Full validation layer |
| Configuration | Scattered | ✅ Centralized config.py |
| Timestamps | Inconsistent | 🕐 ISO 8601 with IST offset |
| Fallback Logic | Basic | ✅ Robust 3-level fallback |
| Caching | Simple | ✅ IST-aware with TTL |
| Error Messages | Generic | ✅ Detailed + logging |

---

## Support

For issues or questions:
1. Check logs in terminal (backend output)
2. Verify `.env` file has API keys
3. Ensure NSE is open (9:15 AM - 3:30 PM IST)
4. Check `/api/market/status` for market state
5. Test with `curl http://localhost:8000/api/market/indices`
