# BharatAlpha v3.1 - Verification Checklist

Complete this checklist to ensure the app is correctly using real dates, real data, and IST timezone.

## Pre-Setup ✅

- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] Anthropic API key ready (get from https://console.anthropic.com)
- [ ] Clone/download BharatAlpha project

---

## Backend Setup ✅

- [ ] Navigate to `backend/` folder
- [ ] Create `.env` file with:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] Create virtual environment:
  ```bash
  python -m venv venv
  source venv/bin/activate  # Linux/macOS
  venv\Scripts\activate.bat  # Windows
  ```
- [ ] Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- [ ] Start backend:
  ```bash
  python main.py
  ```
- [ ] Backend starts successfully (no errors)
- [ ] App runs on `http://localhost:8000`

---

## Real Data Verification ✅

### 1. Market Status (IST Time)
```bash
curl http://localhost:8000/api/market/status
```

**Check:**
- [ ] `is_open` field shows current market status
- [ ] `current_time` shows time in IST format (e.g., `+05:30`)
- [ ] `date` shows actual date (e.g., `2026-03-27`)
- [ ] `day_of_week` shows correct day (e.g., `Friday`)
- [ ] `open_time` is `09:15:00`
- [ ] `close_time` is `15:30:00`

**Expected Output:**
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

---

### 2. Live Market Indices (IST Timestamps)
```bash
curl http://localhost:8000/api/market/indices
```

**Check:**
- [ ] Response includes NIFTY 50, SENSEX, BANK NIFTY, etc.
- [ ] Each index has `timestamp` with IST offset (`+05:30`)
- [ ] All timestamps are recent (within last 5 minutes)
- [ ] Market indices show non-zero values
- [ ] Change percentages are realistic

**Expected Output Structure:**
```json
{
  "indices": [
    {
      "name": "NIFTY 50",
      "value": 23450.25,
      "change": 125.50,
      "change_pct": 0.54,
      "timestamp": "2026-03-27T14:30:00+05:30"
    }
  ],
  "market_status": {...},
  "last_updated": "2026-03-27T14:30:01.123456+05:30",
  "timezone": "Asia/Kolkata (IST)"
}
```

---

### 3. Live Stock Quote (IST Timestamp + is_live_data)
```bash
curl http://localhost:8000/api/market/quote?symbol=RELIANCE
```

**Check:**
- [ ] `symbol` is `RELIANCE`
- [ ] `price` is between ₹1,500 - ₹3,000 (realistic)
- [ ] `timestamp` shows IST with `+05:30`
- [ ] `fetched_at` is recent (within last 5 minutes)
- [ ] `is_live_data` is `true` (during market hours)
- [ ] `market_status` shows current market state
- [ ] `timezone` is `Asia/Kolkata (IST)`

**Expected Output:**
```json
{
  "quote": {
    "symbol": "RELIANCE",
    "price": 2850.50,
    "change": 12.50,
    "change_pct": 0.44,
    "timestamp": "2026-03-27T14:30:00+05:30",
    ...
  },
  "is_live_data": true,
  "fetched_at": "2026-03-27T14:30:01.123456+05:30",
  "market_status": {...},
  "timezone": "Asia/Kolkata (IST)"
}
```

---

### 4. Insider Trades (IST Dates)
```bash
curl http://localhost:8000/api/signals
```

**Check:**
- [ ] Returns insider trade data
- [ ] `dateOfAllotment` shows recent IST dates
- [ ] `fetched_at` shows IST timestamp with `+05:30`
- [ ] Dates are within last 30 days (from today IST)
- [ ] Symbols are valid (RELIANCE, TCS, INFY, etc.)

**Expected:** Insider trades with IST dates, not UTC

---

### 5. FII/DII Data (IST Timestamps)
```bash
curl http://localhost:8000/api/market/fii
```

**Check:**
- [ ] Returns FII/DII flow data
- [ ] `timestamp` fields show IST offset
- [ ] `date` shows actual dates (IST)
- [ ] Last 15 days of data should be visible
- [ ] FII/DII values are realistic (in Crores)

**Expected:** Recent IST dates for FII/DII flows

---

## Frontend Setup ✅

### 1. Install Dependencies
```bash
cd frontend
npm install
```

- [ ] No errors during npm install
- [ ] `node_modules` folder created

### 2. Start Frontend
```bash
npm run dev
```

- [ ] Frontend starts on `http://localhost:5173`
- [ ] Vite shows "Local: http://localhost:5173"

### 3. Frontend Pages Load
Open `http://localhost:5173` in browser

- [ ] Home page loads (no blank page)
- [ ] Navigation bar visible
- [ ] Live ticker shows indices
- [ ] Market status displays (Open/Closed)

---

## UI Features Verification ✅

### Home Page
- [ ] Live indices cards show current values
- [ ] Timestamps show IST time (should have `+05:30`)
- [ ] Market status shows "Open" or "Closed" (based on current IST time)
- [ ] No "Loading..." spinners after 3 seconds

### Market Indices
- [ ] NIFTY 50, SENSEX, Bank Nifty visible
- [ ] All show recent prices
- [ ] % change shows up/down colors
- [ ] Timestamps are recent (last 5 min)

### Signals (Insider Trades)
- [ ] Shows insider trade data
- [ ] Dates are from last 30 days (IST)
- [ ] Stock symbols are valid
- [ ] "Run Agent" button works

### Smart Money (FII/DII)
- [ ] Shows FII/DII flow chart
- [ ] Dates are recent (IST)
- [ ] FII and DII flows show (positive = buy, negative = sell)
- [ ] Data loads within 2 seconds

### Chart Patterns
- [ ] Shows technical patterns
- [ ] Patterns detected for recent dates
- [ ] Symbols are valid NIFTY stocks

### Opportunity Radar
- [ ] Shows scored opportunities
- [ ] Scores are between 1-10
- [ ] Dates are recent (IST)
- [ ] Can filter by type

### Watchlist / Portfolio
- [ ] Can add stocks/funds
- [ ] Shows live quotes
- [ ] Timestamps are recent

---

## Data Quality Checks ✅

### Realistic Price Data
- [ ] RELIANCE: ₹2,500 - ₹3,500
- [ ] TCS: ₹3,500 - ₹4,500
- [ ] INFY: ₹2,000 - ₹3,000
- [ ] All prices > ₹1 and < ₹100,000

### Realistic Timestamps
- [ ] All timestamps include IST offset (`+05:30`)
- [ ] No UTC times (should not see `+00:00`)
- [ ] Timestamps within last 5 minutes during market hours
- [ ] Dates are actual IST dates (not future dates)

### Volume Data
- [ ] Stock volumes > 100,000 shares during trading hours
- [ ] Volume is non-zero (except post-market)

### Change Percentages
- [ ] Between -20% to +20% on normal days
- [ ] Can exceed ±5% during volatile days
- [ ] Not NaN or infinity

---

## Troubleshooting ✅

### If Market Data is Stale
- [ ] Check backend logs for "NSE" errors
- [ ] Confirm market is open (9:15 AM - 3:30 PM IST)
- [ ] Restart backend: `Ctrl+C` then `python main.py`
- [ ] Try refreshing browser (F5)

### If Dates are Still UTC
- [ ] Verify `services/config.py` exists
- [ ] Check `services/nse_fetcher.py` imports `get_ist_now`
- [ ] Restart backend

### If Backend Won't Start
- [ ] Check `.env` file exists with ANTHROPIC_API_KEY
- [ ] Verify Python 3.8+: `python --version`
- [ ] Clear `/backend/__pycache__/`
- [ ] Reinstall: `pip install -r requirements.txt`

### If Frontend Shows Blank Page
- [ ] Check browser console (F12 → Console tab)
- [ ] Ensure backend is running on port 8000
- [ ] Try: `http://localhost:5173` instead of `localhost:5173`

---

## Performance Metrics ✅

Record baseline performance:

- [ ] Home page loads in < 2 seconds
- [ ] Indices page loads in < 1 second
- [ ] Quote for single stock in < 500ms
- [ ] Insider trades in < 1 second
- [ ] FII/DII chart renders in < 2 seconds

---

## Final Verification ✅

Run all endpoints one final time:

```bash
# In new terminal window, from project root

# Check backend is running
curl http://localhost:8000/

# Check market status
curl http://localhost:8000/api/market/status

# Check indices
curl http://localhost:8000/api/market/indices

# Check stock quote
curl http://localhost:8000/api/market/quote?symbol=RELIANCE

# Check signals
curl http://localhost:8000/api/signals | head -50

# Check FII/DII
curl http://localhost:8000/api/market/fii | head -50
```

**All responses should:**
- ✅ Have status code 200 (success)
- ✅ Include `timezone: "Asia/Kolkata (IST)"`
- ✅ Include timestamps with `+05:30` offset
- ✅ Return data (not empty arrays)
- ✅ Show realistic values

---

## Success Criteria ✅

Your app is working correctly if:

1. ✅ **Real Dates**: All dates are IST dates (from India), not UTC
2. ✅ **Real Times**: All timestamps include `+05:30` IST offset
3. ✅ **Real Data**: Market indices, stock prices, volumes are realistic
4. ✅ **Real Market Hours**: Market status shows "Open" 9:15 AM - 3:30 PM IST
5. ✅ **Good Structure**: All API responses include timezone and timestamps
6. ✅ **No Errors**: Backend and frontend start without errors
7. ✅ **Fast Loading**: UI pages load within 2 seconds

---

## Next Actions

- [ ] Save this checklist for future reference
- [ ] Document any issues found
- [ ] Test with real Watchlist entries
- [ ] Monitor backend logs during market hours
- [ ] set up alerts when NSE API fails

---

## Support

If issues persist:
1. Check `IMPROVEMENTS.md` for detailed changes
2. Review backend logs (console output)
3. Check browser console (F12) for frontend errors
4. Verify `.env` file has ANTHROPIC_API_KEY
5. Ensure NSE is open (9:15 AM - 3:30 PM IST weekdays)
