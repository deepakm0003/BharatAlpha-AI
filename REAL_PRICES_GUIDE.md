# Real Stock Prices - Quick Fix Guide

## Changes Made ✅

Your BharatAlpha app has been updated to show **real live stock prices** on every page:

### 1. **Signal Cards Now Show Current Stock Price** 💰
- Each insider trade signal now displays:
  - Current stock price (₹)
  - Today's % change
  - High/Low for the day
  - Trading volume

### 2. **Bulk Deals Table Now Shows Stock Prices** 📊
- Each bulk deal row now shows:
  - Current stock price (₹)
  - % change for the day

### 3. **Fresh Data, No Stale Cache** 🔄
- Backend now sends `Cache-Control: no-cache` headers
- Frontend forces fresh requests (overrides browser cache)
- Added timestamp display: "Updated: HH:MM:SS"
- Refresh button forces new API call (no cache hit)

### 4. **Stock Quote Validation** ✓
- All prices validated for realistic ranges
- Invalid data is rejected and replaced with fallback
- Volume data only shown if > 100,000 shares

---

## How to See Real Prices

### Step 1: Restart Backend
```bash
cd backend
# Kill previous python process if running
python main.py
```

Should see output like:
```
[NSE] Insider trades OK (IST): 6 records
[Stock Quote] HCLTECH: ₹2,850.50 (↑0.44%)
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173

### Step 3: Go to Signals Page
Click **"Signals"** tab

You should now see:

```
┌─────────────────────────────────────────────┐
│ HCLTECH           BUY    IN YOUR PORTFOLIO  │
│ Insider Name      · Buy                     │
│ ₹12 Cr transaction value  500,000 shares   │
│                                             │
│ AI Confidence: 87%  ████████░              │
│                                             │
│ ┌─ Current Stock Price (REAL-TIME) ──────┐ │
│ │ ₹2,850.50        ↑ 0.44%               │ │
│ │ Live (NSE)       ₹+12.50               │ │
│ │ H: ₹2,875.00  L: ₹2,840.00  Vol: 5.2M  │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ Highly confident insider buying signals    │
│ underlying strong confidence in growth     │
│ recovery...                                 │
└─────────────────────────────────────────────┘
```

### Step 4: Check Bulk Deals
Scroll down to **"Bulk Deals"** table

Should show:

```
┌─────────────────────────────────────────────┐
│ STOCK │ CURRENT PRICE │ DEAL CLIENT │ TYPE  │
├───────┼───────────────┼─────────────┼───────┤
│ INFY  │ ₹2,965.75     │ Goldman     │ BUY   │
│       │ ↑ 1.23%       │ Sachs       │       │
│       │ ↓ -₹25.50     │             │       │
├───────┼───────────────┼─────────────┼───────┤
│ TCS   │ ₹3,245.00     │ Morgan      │ SELL  │
│       │ ↓ -0.89%      │ Stanley     │       │
│       │ ↓ -₹29.25     │             │       │
└─────────────────────────────────────────────┘
```

---

## What Data is Real?

| Component | Source | Freshness | Real? |
|-----------|--------|-----------|-------|
| Stock Prices | yfinance | Live | ✅ Yes |
| Price Changes | yfinance | Real-time | ✅ Yes |
| High/Low/Volume | yfinance | Today's data | ✅ Yes |
| Insider Trades | NSE API | 30-day history | ✅ Yes |
| Bulk Deals | NSE API | 7-day history | ✅ Yes |
| FII/DII Flows | NSE API | Daily | ✅ Yes |

---

## Testing Prices are Real

### Test 1: Compare with Real NSE
1. Check BharatAlpha price for RELIANCE
2. Go to: https://www.nseindia.com/
3. Search for RELIANCE
4. Prices should match (within 1-2 min delay)

### Test 2: Refresh and Watch Price Change
1. Note current price for HCLTECH (e.g., ₹2,850.50)
2. Wait 2-3 minutes
3. Click the **Refresh** button (🔄)
4. Watch header show: "Updated: HH:MM:SS"
5. Price should update to reflect current market

### Test 3: Check During Market Hours
- **9:15 AM - 3:30 PM IST**: Prices should change frequently
- **After 3:30 PM**: Prices stay static (market closed)

---

## If Prices Still Don't Show

### Issue 1: Browser Cache
**Fix:**
```javascript
// Clear browser cache
- Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Select "Cached images and files"
- Check "All time"
- Clear
```
Then refresh: F5 or Ctrl+R

### Issue 2: Old Frontend Build
**Fix:**
```bash
cd frontend
rm -rf .vite node_modules dist
npm install
npm run dev
```

### Issue 3: Backend Not Running
**Fix:**
```bash
# Check if backend is running
curl http://localhost:8000/api/market/status

# If not running:
cd backend
python main.py
```

### Issue 4: NSE API Blocked (403 error)
**Fix:**
- This is normal! System will fallback to yfinance automatically
- Check backend logs: should say "[yfinance] Quote OK"
- Prices will still show (from yfinance)

---

## Performance Tips

### Speed Up Data Loading
1. **During Market Hours** (9:15 AM - 3:30 PM)
   - Data loads in < 1 second
   - Prices are live

2. **After Market Hours** (3:30 PM - 9:15 AM)
   - Data loads but prices are stale
   - Marked as "Not Live" on quotes

3. **Weekends/Holidays**
   - Market status shows "CLOSED"
   - Previous day's prices shown (no live updates)

### Manual Refresh (No Cache)
Click the 🔄 button in Signal Radar header:
- Shows "Updated: HH:MM:SS" when fresh data arrives
- Forces new API call (bypasses browser cache)
- Takes 2-3 seconds

---

## Real-Time Indicators ✓

Your data is real when you see:

✅ **Timestamps with IST offset** (+05:30)
```json
"timestamp": "2026-03-27T14:30:00+05:30"
```

✅ **Stock prices > ₹100**
```
RELIANCE: ₹2,850.50
INFY: ₹2,965.75
```

✅ **% changes between -20% and +20%**
```
↑ 0.44% (typical)
↓ -1.23% (typical)
```

✅ **Volumes > 100,000** (during market hours)
```
Volume: 5.2M shares
```

✅ **Recent timestamps** (within 5 minutes)
```
Updated: 14:30:45 (shows current time)
```

---

## Example: Real vs Fake Data

### ❌ FAKE DATA
```json
{
  "price": 10.50,
  "volume": 100,
  "timestamp": "2026-03-20T09:00:00",
  "change_pct": 500
}
```
Problems: Price too low, volume too low, old date, unrealistic change

### ✅ REAL DATA
```json
{
  "price": 2850.50,
  "volume": 5200000,
  "timestamp": "2026-03-27T14:30:00+05:30",
  "change_pct": 0.44,
  "high": 2875.00,
  "low": 2840.00
}
```
Correct: Real price, real volume, recent IST timestamp, realistic change

---

## Files Updated

Backend:
- `routers/signals.py` - Now fetches live stock prices for signals
- `routers/market.py` - Added no-cache headers
- `requirements.txt` - No changes (all deps exist)

Frontend:
- `components/SignalCard.jsx` - Displays stock price box
- `components/SignalRadar.jsx` - Shows timestamp, forces fresh fetch
- `components/DealTable` - Shows stock prices in bulk deals

---

## Next: Monitor in Production

1. **Keep terminal open** while using the app
2. **Watch backend logs** for data source (yfinance vs NSE vs Finnhub)
3. **Check timestamp** in UI changes every few seconds
4. **Verify prices** match NSE website

Sample backend log:
```
[18:30:45] GET /api/signals - 200 OK (1023ms)
[NSE] Insider trades OK (IST): 6 records
[Stock Quote] HCLTECH: ₹2,850.50 [yfinance]
[Stock Quote] INFY: ₹2,965.75 [yfinance]
[Stocks] Processed 6 signals with live prices
```

---

## Questions?

**Q: Why do prices sometimes show "₹0"?**
A: NSE API might be blocked (403). System falls back to cache. Refresh button will retry.

**Q: Why doesn't price update after market close?**
A: By design! After 3:30 PM IST, market closes. Prices freeze at close price until 9:15 AM next day.

**Q: Can I see intraday price history?**
A: Currently not. Future update can add 5-minute candles for technical analysis.

**Q: Will I see old signals from last week?**
A: No. Insider trades show only last 30 days. Bulk deals show last 7 days. Oldest signals auto-expire.

---

## Success Checklist ✓

- [ ] Backend running (`python main.py`)
- [ ] Frontend running (`npm run dev`)
- [ ] Can see Signals page
- [ ] Each signal shows current stock price
- [ ] Price has green/red indicator
- [ ] High/Low/Volume shown
- [ ] Bulk deals table shows prices
- [ ] Updated time shown in header
- [ ] Refresh button works (timestamp updates)
- [ ] Prices match NSE website (±1-2 min)

All working? **Great! You now have real stock prices.** 🎉

Stick with the app and monitor for 1-2 market days to verify data quality.
