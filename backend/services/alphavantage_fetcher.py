"""
Alpha Vantage Data Fetcher — stock quotes, news sentiment, market movers.
API: https://www.alphavantage.co/documentation/
Rate limit: 25 requests/day, 5 requests/minute (free tier)
Supports Indian stocks via BSE symbols (e.g., RELIANCE.BSE)
"""
import httpx
import os
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
BASE_URL = "https://www.alphavantage.co/query"

# Simple in-memory cache to respect rate limits
_quote_cache: dict = {}
_news_cache: list = []
_news_cache_time: Optional[datetime] = None
_movers_cache: dict = {}
_movers_cache_time: Optional[datetime] = None


async def fetch_quote(symbol: str) -> dict:
    """
    Fetch real-time quote via Alpha Vantage GLOBAL_QUOTE.
    For Indian stocks, tries BSE suffix automatically.
    """
    # Check cache first (1-minute TTL)
    cache_key = symbol.upper()
    if cache_key in _quote_cache:
        cached = _quote_cache[cache_key]
        if (datetime.now() - cached["_cached_at"]).seconds < 60:
            return cached

    # Try BSE format for Indian stocks, then raw
    formats = [f"{symbol}.BSE", symbol]
    for sym_fmt in formats:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(BASE_URL, params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": sym_fmt,
                    "apikey": ALPHA_VANTAGE_API_KEY,
                })
                if resp.status_code == 200:
                    data = resp.json().get("Global Quote", {})
                    if data and data.get("05. price"):
                        price = float(data["05. price"])
                        prev = float(data.get("08. previous close", price))
                        chg = float(data.get("09. change", 0))
                        pct = float(data.get("10. change percent", "0").replace("%", ""))
                        result = {
                            "symbol": symbol,
                            "price": round(price, 2),
                            "change": round(chg, 2),
                            "change_pct": round(pct, 2),
                            "high": round(float(data.get("03. high", price)), 2),
                            "low": round(float(data.get("04. low", price)), 2),
                            "volume": int(float(data.get("06. volume", 0))),
                            "prev_close": round(prev, 2),
                            "open": round(float(data.get("02. open", price)), 2),
                            "source": f"Alpha Vantage ({sym_fmt})",
                            "_cached_at": datetime.now(),
                        }
                        _quote_cache[cache_key] = result
                        return result
        except Exception:
            continue
    return {}


async def fetch_news_sentiment(tickers: str = "", topics: str = "financial_markets") -> list:
    """
    Fetch news with sentiment analysis from Alpha Vantage.
    tickers: comma-separated (e.g. "RELIANCE.BSE,TCS.BSE")
    topics: financial_markets, economy_fiscal, technology, etc.
    """
    global _news_cache, _news_cache_time

    # Cache for 15 minutes
    if _news_cache and _news_cache_time and (datetime.now() - _news_cache_time).seconds < 900:
        return _news_cache

    try:
        params = {
            "function": "NEWS_SENTIMENT",
            "apikey": ALPHA_VANTAGE_API_KEY,
            "sort": "LATEST",
            "limit": 30,
        }
        if tickers:
            params["tickers"] = tickers
        if topics:
            params["topics"] = topics

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(BASE_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                feed = data.get("feed", [])
                results = []
                for item in feed[:30]:
                    sentiment_score = float(item.get("overall_sentiment_score", 0))
                    sentiment_label = item.get("overall_sentiment_label", "Neutral")
                    results.append({
                        "title": item.get("title", ""),
                        "summary": item.get("summary", "")[:300],
                        "source": item.get("source", ""),
                        "url": item.get("url", ""),
                        "published": item.get("time_published", ""),
                        "sentiment_score": round(sentiment_score, 3),
                        "sentiment_label": sentiment_label,
                        "topics": [t.get("topic", "") for t in item.get("topics", [])],
                        "tickers": [
                            {
                                "symbol": t.get("ticker", ""),
                                "sentiment": t.get("ticker_sentiment_label", ""),
                                "score": float(t.get("ticker_sentiment_score", 0)),
                            }
                            for t in item.get("ticker_sentiment", [])[:5]
                        ],
                    })
                if results:
                    _news_cache = results
                    _news_cache_time = datetime.now()
                return results
    except Exception as e:
        print(f"[AlphaVantage] News sentiment fetch failed: {e}")
    return _news_cache if _news_cache else []


async def fetch_top_gainers_losers() -> dict:
    """
    Fetch top gainers, losers, and most actively traded.
    Note: This is primarily US market data.
    """
    global _movers_cache, _movers_cache_time

    # Cache for 30 minutes
    if _movers_cache and _movers_cache_time and (datetime.now() - _movers_cache_time).seconds < 1800:
        return _movers_cache

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(BASE_URL, params={
                "function": "TOP_GAINERS_LOSERS",
                "apikey": ALPHA_VANTAGE_API_KEY,
            })
            if resp.status_code == 200:
                data = resp.json()
                result = {
                    "top_gainers": [
                        {
                            "symbol": g.get("ticker", ""),
                            "price": float(g.get("price", 0)),
                            "change_pct": float(g.get("change_percentage", "0").replace("%", "")),
                            "volume": int(float(g.get("volume", 0))),
                        }
                        for g in data.get("top_gainers", [])[:10]
                    ],
                    "top_losers": [
                        {
                            "symbol": l.get("ticker", ""),
                            "price": float(l.get("price", 0)),
                            "change_pct": float(l.get("change_percentage", "0").replace("%", "")),
                            "volume": int(float(l.get("volume", 0))),
                        }
                        for l in data.get("top_losers", [])[:10]
                    ],
                    "most_active": [
                        {
                            "symbol": a.get("ticker", ""),
                            "price": float(a.get("price", 0)),
                            "change_pct": float(a.get("change_percentage", "0").replace("%", "")),
                            "volume": int(float(a.get("volume", 0))),
                        }
                        for a in data.get("most_actively_traded", [])[:10]
                    ],
                    "source": "Alpha Vantage",
                    "last_updated": data.get("last_updated", datetime.now().isoformat()),
                }
                _movers_cache = result
                _movers_cache_time = datetime.now()
                return result
    except Exception as e:
        print(f"[AlphaVantage] Top movers fetch failed: {e}")
    return _movers_cache if _movers_cache else {"top_gainers": [], "top_losers": [], "most_active": []}


async def fetch_daily_prices(symbol: str, outputsize: str = "compact") -> list:
    """
    Fetch daily OHLCV data from Alpha Vantage.
    outputsize: 'compact' (last 100) or 'full' (up to 20 years)
    """
    for sym_fmt in [f"{symbol}.BSE", symbol]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(BASE_URL, params={
                    "function": "TIME_SERIES_DAILY",
                    "symbol": sym_fmt,
                    "outputsize": outputsize,
                    "apikey": ALPHA_VANTAGE_API_KEY,
                })
                if resp.status_code == 200:
                    data = resp.json()
                    ts = data.get("Time Series (Daily)", {})
                    if ts:
                        prices = []
                        for dt, vals in sorted(ts.items()):
                            prices.append({
                                "date": dt,
                                "open": float(vals["1. open"]),
                                "high": float(vals["2. high"]),
                                "low": float(vals["3. low"]),
                                "close": float(vals["4. close"]),
                                "volume": int(float(vals["5. volume"])),
                            })
                        return prices
        except Exception:
            continue
    return []


async def fetch_rsi(symbol: str, interval: str = "daily", period: int = 14) -> dict:
    """Fetch RSI technical indicator from Alpha Vantage."""
    for sym_fmt in [f"{symbol}.BSE", symbol]:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(BASE_URL, params={
                    "function": "RSI",
                    "symbol": sym_fmt,
                    "interval": interval,
                    "time_period": period,
                    "series_type": "close",
                    "apikey": ALPHA_VANTAGE_API_KEY,
                })
                if resp.status_code == 200:
                    data = resp.json()
                    rsi_data = data.get("Technical Analysis: RSI", {})
                    if rsi_data:
                        latest_date = sorted(rsi_data.keys())[-1]
                        return {
                            "symbol": symbol,
                            "rsi": float(rsi_data[latest_date]["RSI"]),
                            "date": latest_date,
                            "source": "Alpha Vantage",
                        }
        except Exception:
            continue
    return {}


async def fetch_macd(symbol: str, interval: str = "daily") -> dict:
    """Fetch MACD technical indicator from Alpha Vantage."""
    for sym_fmt in [f"{symbol}.BSE", symbol]:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(BASE_URL, params={
                    "function": "MACD",
                    "symbol": sym_fmt,
                    "interval": interval,
                    "series_type": "close",
                    "apikey": ALPHA_VANTAGE_API_KEY,
                })
                if resp.status_code == 200:
                    data = resp.json()
                    macd_data = data.get("Technical Analysis: MACD", {})
                    if macd_data:
                        latest_date = sorted(macd_data.keys())[-1]
                        vals = macd_data[latest_date]
                        return {
                            "symbol": symbol,
                            "macd": float(vals.get("MACD", 0)),
                            "signal": float(vals.get("MACD_Signal", 0)),
                            "histogram": float(vals.get("MACD_Hist", 0)),
                            "date": latest_date,
                            "source": "Alpha Vantage",
                        }
        except Exception:
            continue
    return {}
