"""
Universal Search API — searches across:
  - NSE stocks (yfinance live quotes)
  - Mutual fund schemes (AMFI live NAV cache)
  - Market indices
"""
import asyncio
import yfinance as yf
from datetime import datetime
from fastapi import APIRouter, Query

from services.amfi_fetcher import _nav_cache, _cache_stale, _build_live_cache
from services.nse_fetcher import KNOWN_NIFTY500_SYMBOLS

router = APIRouter()

# Sector index mapping for search
SECTOR_INDICES = {
    "NIFTY 50": "^NSEI", "SENSEX": "^BSESN", "BANK NIFTY": "^NSEBANK",
    "NIFTY IT": "^CNXIT", "NIFTY PHARMA": "^CNXPHARMA", "NIFTY AUTO": "^CNXAUTO",
    "NIFTY FMCG": "^CNXFMCG", "NIFTY METAL": "^CNXMETAL", "NIFTY ENERGY": "^CNXENERGY",
    "NIFTY REALTY": "^CNXREALTY",
}


def _search_stocks(query: str, limit: int = 5) -> list:
    """Search NIFTY 500 symbols matching the query, fetch live quote."""
    q = query.upper().strip()
    matches = [s for s in KNOWN_NIFTY500_SYMBOLS if q in s]
    # Sort: exact match first, then by length (shorter = more relevant)
    matches.sort(key=lambda s: (0 if s == q else 1, len(s)))
    results = []
    for sym in matches[:limit]:
        try:
            ticker = yf.Ticker(f"{sym}.NS")
            hist = ticker.history(period="2d")
            if hist is not None and len(hist) >= 1:
                cur = float(hist["Close"].iloc[-1])
                prev = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else cur
                chg = cur - prev
                pct = (chg / prev) * 100 if prev else 0
                results.append({
                    "type": "stock",
                    "symbol": sym,
                    "name": sym,
                    "price": round(cur, 2),
                    "change": round(chg, 2),
                    "change_pct": round(pct, 2),
                    "exchange": "NSE",
                })
        except Exception:
            results.append({
                "type": "stock",
                "symbol": sym,
                "name": sym,
                "price": None,
                "change": None,
                "change_pct": None,
                "exchange": "NSE",
            })
    return results


async def _search_mutual_funds(query: str, limit: int = 8) -> list:
    """Search AMFI live cache for matching mutual fund scheme names."""
    global _nav_cache
    if _cache_stale():
        await _build_live_cache()

    if not _nav_cache:
        return []

    q = query.lower().strip()
    results = []
    for key, data in _nav_cache.items():
        if q in key:
            results.append({
                "type": "mutual_fund",
                "name": data["name"],
                "nav": data["nav"],
                "date": data["date"],
                "category": data.get("category", "Equity"),
                "source": "AMFI Live",
            })
            if len(results) >= limit:
                break
    # Sort: Direct Growth plans first, then by name length
    results.sort(key=lambda r: (0 if "direct" in r["name"].lower() and "growth" in r["name"].lower() else 1, len(r["name"])))
    return results[:limit]


def _search_indices(query: str) -> list:
    """Search market indices matching the query."""
    q = query.upper().strip()
    results = []
    for name, sym in SECTOR_INDICES.items():
        if q in name or q in sym:
            results.append({
                "type": "index",
                "name": name,
                "symbol": sym,
            })
    return results


@router.get("/api/search")
async def universal_search(q: str = Query(..., min_length=1, max_length=100)):
    """
    Universal search across stocks, mutual funds, and indices.
    Returns categorised results from live data sources.
    """
    loop = asyncio.get_event_loop()

    # Run stock search in thread pool (yfinance is sync) + MF search concurrently
    stock_task = loop.run_in_executor(None, _search_stocks, q)
    mf_task = _search_mutual_funds(q)
    index_results = _search_indices(q)

    stocks, funds = await asyncio.gather(stock_task, mf_task, return_exceptions=True)
    stocks = stocks if not isinstance(stocks, Exception) else []
    funds = funds if not isinstance(funds, Exception) else []

    return {
        "query": q,
        "stocks": stocks,
        "mutual_funds": funds,
        "indices": index_results,
        "total": len(stocks) + len(funds) + len(index_results),
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/api/search/quote/{symbol}")
async def get_live_quote(symbol: str):
    """Get detailed live quote for a single stock symbol."""
    loop = asyncio.get_event_loop()

    def _fetch():
        try:
            ticker = yf.Ticker(f"{symbol.upper()}.NS")
            hist = ticker.history(period="5d")
            info = ticker.fast_info
            if hist is not None and len(hist) >= 1:
                cur = float(hist["Close"].iloc[-1])
                prev = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else cur
                high = float(hist["High"].iloc[-1])
                low = float(hist["Low"].iloc[-1])
                vol = int(hist["Volume"].iloc[-1])
                chg = cur - prev
                pct = (chg / prev) * 100 if prev else 0
                return {
                    "symbol": symbol.upper(),
                    "price": round(cur, 2),
                    "change": round(chg, 2),
                    "change_pct": round(pct, 2),
                    "high": round(high, 2),
                    "low": round(low, 2),
                    "volume": vol,
                    "market_cap": getattr(info, "market_cap", None),
                    "open": round(float(hist["Open"].iloc[-1]), 2),
                    "prev_close": round(prev, 2),
                    "exchange": "NSE",
                    "source": "yfinance (live)",
                }
        except Exception:
            pass
        return {"symbol": symbol.upper(), "price": None, "error": "Quote unavailable"}

    result = await loop.run_in_executor(None, _fetch)
    return result
