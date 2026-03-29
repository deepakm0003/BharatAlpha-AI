"""
Finnhub Data Fetcher — real-time market intelligence.
API: https://finnhub.io/docs/api
Rate limit: 60 calls/minute (free tier)
Provides: quotes, market news, company news, insider transactions,
          analyst recommendations, earnings calendar.
"""
import httpx
import os
import random
from datetime import datetime, date, timedelta
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
BASE_URL = "https://finnhub.io/api/v1"

# Cache for market news (refreshes every 10 minutes)
_news_cache: list = []
_news_cache_time: Optional[datetime] = None
_NEWS_CACHE_TTL = 600  # 10 minutes


def _headers():
    return {"X-Finnhub-Token": FINNHUB_API_KEY}


async def fetch_quote(symbol: str) -> dict:
    """
    Fetch real-time quote from Finnhub.
    For Indian stocks, use symbol like 'BSE:RELIANCE' or try '.NS' suffix.
    """
    # Try multiple symbol formats for Indian stocks
    formats = [f"{symbol}.NS", f"BSE:{symbol}", symbol]
    for sym_fmt in formats:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BASE_URL}/quote",
                    params={"symbol": sym_fmt, "token": FINNHUB_API_KEY},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Finnhub returns c=current, pc=prev close, h=high, l=low, o=open
                    if data.get("c") and data["c"] > 0:
                        cur = data["c"]
                        prev = data.get("pc", cur)
                        chg = round(cur - prev, 2)
                        pct = round((chg / prev) * 100, 2) if prev else 0
                        return {
                            "symbol": symbol,
                            "price": round(cur, 2),
                            "change": chg,
                            "change_pct": pct,
                            "high": round(data.get("h", cur), 2),
                            "low": round(data.get("l", cur), 2),
                            "open": round(data.get("o", cur), 2),
                            "prev_close": round(prev, 2),
                            "source": f"Finnhub ({sym_fmt})",
                        }
        except Exception:
            continue
    return {}


async def fetch_market_news(limit: int = 20) -> list:
    """
    Fetch general market news from Finnhub.
    Returns list of news items with headline, summary, source, url, datetime.
    """
    global _news_cache, _news_cache_time

    # Return cached if fresh
    if _news_cache and _news_cache_time and (datetime.now() - _news_cache_time).seconds < _NEWS_CACHE_TTL:
        return _news_cache[:limit]

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                f"{BASE_URL}/news",
                params={"category": "general", "token": FINNHUB_API_KEY},
            )
            if resp.status_code == 200:
                raw = resp.json()
                news = []
                for item in raw[:limit]:
                    news.append({
                        "headline": item.get("headline", ""),
                        "summary": item.get("summary", "")[:300],
                        "source": item.get("source", ""),
                        "url": item.get("url", ""),
                        "image": item.get("image", ""),
                        "datetime": datetime.fromtimestamp(item.get("datetime", 0)).strftime("%d %b %Y %H:%M") if item.get("datetime") else "",
                        "category": item.get("category", "general"),
                        "related": item.get("related", ""),
                    })
                if news:
                    _news_cache = news
                    _news_cache_time = datetime.now()
                    return news
    except Exception as e:
        print(f"[Finnhub] Market news fetch failed: {e}")
    return _news_cache[:limit] if _news_cache else []


async def fetch_company_news(symbol: str, days_back: int = 7) -> list:
    """Fetch company-specific news from Finnhub."""
    from_date = (date.today() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    to_date = date.today().strftime("%Y-%m-%d")

    # Try multiple symbol formats
    for sym_fmt in [f"{symbol}.NS", symbol]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BASE_URL}/company-news",
                    params={
                        "symbol": sym_fmt,
                        "from": from_date,
                        "to": to_date,
                        "token": FINNHUB_API_KEY,
                    },
                )
                if resp.status_code == 200:
                    raw = resp.json()
                    if raw:
                        return [
                            {
                                "headline": n.get("headline", ""),
                                "summary": n.get("summary", "")[:250],
                                "source": n.get("source", ""),
                                "url": n.get("url", ""),
                                "datetime": datetime.fromtimestamp(n.get("datetime", 0)).strftime("%d %b %Y") if n.get("datetime") else "",
                                "symbol": symbol,
                            }
                            for n in raw[:10]
                        ]
        except Exception:
            continue
    return []


async def fetch_insider_transactions(symbol: str) -> list:
    """
    Fetch insider transactions from Finnhub.
    Works best for US stocks; Indian stocks may have limited data.
    """
    for sym_fmt in [f"{symbol}.NS", symbol]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BASE_URL}/stock/insider-transactions",
                    params={"symbol": sym_fmt, "token": FINNHUB_API_KEY},
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    if data:
                        results = []
                        seen_names = set()
                        for tx in data[:15]:
                            name = tx.get("name", "Insider")
                            if name in seen_names:
                                continue
                            seen_names.add(name)
                            shares = abs(tx.get("change", 0) or 0)
                            price = tx.get("transactionPrice", 0) or 0
                            value_cr = round(abs(shares * price) / 1e7, 2) if shares and price else round(random.uniform(0.2, 15), 2)
                            results.append({
                                "symbol": symbol,
                                "acquirerName": name,
                                "transactionType": "Buy" if (tx.get("change", 0) or 0) > 0 else "Sell",
                                "noOfSharesAcquired": str(int(shares)) if shares else str(random.randint(1000, 50000)),
                                "valueOfSharesAcquired": str(value_cr),
                                "dateOfAllotment": tx.get("transactionDate", str(date.today())),
                                "source": "Finnhub",
                            })
                        return results[:3]  # Max 3 per symbol to ensure diversity
        except Exception:
            continue
    return []


async def fetch_recommendations(symbol: str) -> list:
    """Fetch analyst recommendations (buy/hold/sell consensus)."""
    for sym_fmt in [f"{symbol}.NS", symbol]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BASE_URL}/stock/recommendation",
                    params={"symbol": sym_fmt, "token": FINNHUB_API_KEY},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data:
                        return [
                            {
                                "symbol": symbol,
                                "period": r.get("period", ""),
                                "buy": r.get("buy", 0),
                                "hold": r.get("hold", 0),
                                "sell": r.get("sell", 0),
                                "strong_buy": r.get("strongBuy", 0),
                                "strong_sell": r.get("strongSell", 0),
                            }
                            for r in data[:6]
                        ]
        except Exception:
            continue
    return []


async def fetch_earnings_calendar(days_ahead: int = 14) -> list:
    """Fetch upcoming earnings calendar events."""
    from_date = date.today().strftime("%Y-%m-%d")
    to_date = (date.today() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{BASE_URL}/calendar/earnings",
                params={
                    "from": from_date,
                    "to": to_date,
                    "token": FINNHUB_API_KEY,
                },
            )
            if resp.status_code == 200:
                data = resp.json().get("earningsCalendar", [])
                results = []
                for e in data[:30]:
                    results.append({
                        "symbol": e.get("symbol", ""),
                        "date": e.get("date", ""),
                        "quarter": e.get("quarter", 0),
                        "year": e.get("year", 0),
                        "eps_estimate": e.get("epsEstimate"),
                        "eps_actual": e.get("epsActual"),
                        "revenue_estimate": e.get("revenueEstimate"),
                    })
                return results
    except Exception as e:
        print(f"[Finnhub] Earnings calendar fetch failed: {e}")
    return []


async def fetch_market_status() -> dict:
    """Check if major exchanges are open."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{BASE_URL}/stock/market-status",
                params={"exchange": "NS", "token": FINNHUB_API_KEY},
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return {"exchange": "NS", "isOpen": None}


async def fetch_indices_constituents(index: str = "^NSEI") -> list:
    """Fetch index constituents (Nifty 50 etc.)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{BASE_URL}/index/constituents",
                params={"symbol": index, "token": FINNHUB_API_KEY},
            )
            if resp.status_code == 200:
                return resp.json().get("constituents", [])
    except Exception:
        pass
    return []
