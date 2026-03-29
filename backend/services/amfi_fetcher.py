"""
AMFI India NAV fetcher.
PRIMARY: Live fetch from https://portal.amfiindia.com/spages/NAVAll.txt (free, no API key)
FALLBACK: In-memory cache if AMFI is unreachable at demo time.
"""
import httpx
import asyncio
import re
from datetime import datetime, timedelta
from typing import Optional
import yfinance as yf

# ── In-memory NAV cache (populated by live fetch, expires after 1 hour) ──
_nav_cache: dict = {}       # scheme_name_lower → full dict
_cache_built_at: Optional[datetime] = None
_CACHE_TTL_MINUTES = 60

# No static fallback — all MF data fetched live from AMFI India
# Fallback to yfinance for stock names / non-AMFI mutual fund inputs



async def _build_live_cache() -> bool:
    """
    Fetch NAVAll.txt from AMFI India and populate _nav_cache.
    Format: SchemeCode;ISINDivPayoutISINGrowth;ISINDivReinvestment;SchemeName;NAV;Date
    Returns True if successful.
    """
    global _nav_cache, _cache_built_at
    url = "https://portal.amfiindia.com/spages/NAVAll.txt"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
            text = response.text
            nav_cache: dict = {}
            for line in text.splitlines():
                parts = line.strip().split(";")
                if len(parts) < 6:
                    continue
                try:
                    scheme_code, isin1, isin2, scheme_name, nav_str, nav_date = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
                    nav_val = float(nav_str)
                    if nav_val <= 0:
                        continue
                    key = scheme_name.lower().strip()
                    nav_cache[key] = {
                        "name": scheme_name.strip(),
                        "nav": round(nav_val, 4),
                        "date": nav_date.strip(),
                        "category": _infer_category(scheme_name),
                        "expense_ratio": None,   # not in NAVAll.txt
                        "aum_cr": None,
                        "return_1y": None,
                        "matched": True,
                        "source": "AMFI Live",
                    }
                except Exception:
                    continue
            if len(nav_cache) > 1000:   # AMFI has 10k+ schemes — sanity check
                _nav_cache = nav_cache
                _cache_built_at = datetime.now()
                print(f"[AMFI] Live cache built: {len(_nav_cache)} schemes")
                return True
    except Exception as e:
        print(f"[AMFI] Live fetch failed: {e}")
    return False


def _infer_category(name: str) -> str:
    n = name.lower()
    if "small cap" in n:        return "Small Cap"
    if "mid cap" in n or "midcap" in n: return "Mid Cap"
    if "large & mid" in n:      return "Large & Mid Cap"
    if "large cap" in n or "bluechip" in n or "blue chip" in n: return "Large Cap"
    if "flexi cap" in n or "flexi-cap" in n: return "Flexi Cap"
    if "index" in n or "nifty" in n or "sensex" in n: return "Index"
    if "elss" in n or "tax saver" in n: return "ELSS"
    if "liquid" in n:           return "Liquid"
    if "debt" in n or "bond" in n or "gilt" in n: return "Debt"
    if "hybrid" in n:           return "Hybrid"
    if "international" in n or "nasdaq" in n or "global" in n: return "International"
    return "Equity"


def _cache_stale() -> bool:
    if not _cache_built_at:
        return True
    return (datetime.now() - _cache_built_at) > timedelta(minutes=_CACHE_TTL_MINUTES)


def _fuzzy_match(fund_name: str, cache: dict) -> Optional[dict]:
    """Multi-tier fuzzy matching: exact → substring → word overlap."""
    fund_lower = fund_name.lower().strip()

    # Tier 1: fund_name is a substring of a key or vice versa
    for key, data in cache.items():
        if fund_lower in key or key in fund_lower:
            return {**data, "matched": True}

    # Tier 2: significant word overlap
    fund_words = [w for w in fund_lower.split() if len(w) > 3]
    best_data, best_score = None, 0
    for key, data in cache.items():
        score = sum(1 for w in fund_words if w in key)
        if score > best_score:
            best_score = score
            best_data = data
    if best_data and best_score >= 2:
        return {**best_data, "matched": True}
    if best_data and best_score >= 1 and len(fund_words) <= 2:
        return {**best_data, "matched": True}

    return None


def _guess_stock_ticker(fund_name: str) -> Optional[str]:
    n = fund_name.strip().lower()
    mapping = {
        "wipro": "WIPRO.NS",
        "tcs": "TCS.NS",
        "reliance": "RELIANCE.NS",
        "infy": "INFY.NS",
        "hdfcbank": "HDFCBANK.NS",
        "sbicap": "SBI.NS",
        "axisbank": "AXISBANK.NS",
        "bajaj finance": "BAJFINANCE.NS",
        "hdfc": "HDFC.NS",
        "titan": "TITAN.NS",
        "icicibank": "ICICIBANK.NS",
    }

    # Exact key or lower name match
    for key, symbol in mapping.items():
        if key in n:
            return symbol

    # If fund name contains NSE ticker already
    if n.endswith(".ns") or n.endswith(".bse"):
        return fund_name.upper()

    return None


async def fetch_fund_nav(fund_name: str) -> dict:
    """
    Lookup NAV for a mutual fund name.
    1. Ensures live AMFI cache is populated (TTL=60min).
    2. Fuzzy-matches against ~10,000+ live schemes.
    3. If not found, fallback to yfinance for stock symbols.
    """
    global _nav_cache

    # Refresh live cache if stale
    if _cache_stale():
        await _build_live_cache()

    # Try live cache first
    if _nav_cache:
        match = _fuzzy_match(fund_name, _nav_cache)
        if match:
            return match

    # Next fallback: yfinance equity quote via symbol heuristics
    try:
        from services.nse_fetcher import fetch_stock_quote
        currency_symbol = _guess_stock_ticker(fund_name)
        if not currency_symbol:
            # Keep as raw ticker if provided
            cart = re.sub(r'\.ns$|\.bse$', '', fund_name.strip().upper())
            currency_symbol = cart

        if currency_symbol:
            symbol_for_quote = currency_symbol.replace('.NS', '').replace('.BSE', '')
            quote = await fetch_stock_quote(symbol_for_quote)
            price = quote.get("price") or quote.get("value") or quote.get("nav")
            if price and price > 0:
                return {
                    "name": fund_name,
                    "nav": round(price, 2),
                    "date": quote.get("timestamp", datetime.now().strftime("%Y-%m-%d")),
                    "category": "Equity",
                    "expense_ratio": None,
                    "aum_cr": None,
                    "return_1y": None,
                    "matched": True,
                    "source": f"yfinance quote ({symbol_for_quote})",
                    "change": quote.get("change"),
                    "change_pct": quote.get("change_pct"),
                    "high": quote.get("high"),
                    "low": quote.get("low"),
                }
    except Exception as e:
        print(f"[portfolio yfinance fallback] fetch_stock_quote error for {fund_name}: {e}")

    # If no data found, keep unchanged unknown fallback
    return {
        "name": fund_name,
        "nav": None,
        "date": None,
        "category": "Unknown",
        "expense_ratio": None,
        "aum_cr": None,
        "return_1y": None,
        "matched": False,
        "source": "Not Found",
    }
