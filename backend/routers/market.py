from fastapi import APIRouter, Query, HTTPException, Response
from services.config import get_ist_now, get_market_status, is_market_open, IST
from services.nse_fetcher import fetch_market_indices, fetch_stock_quote, fetch_fii_dii_data
from services.finnhub_fetcher import fetch_market_news as finnhub_news
from services.alphavantage_fetcher import fetch_news_sentiment, fetch_top_gainers_losers
from services.data_validator import QuoteValidator, DataHealthChecker

router = APIRouter()


def set_no_cache_headers(response: Response):
    """Set headers to prevent browser caching of real-time data."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"


@router.get("/api/market/status")
async def get_market_status_endpoint(response: Response):
    """Get current market status (open/closed, times, date in IST)."""
    set_no_cache_headers(response)
    return get_market_status()


@router.get("/api/market/indices")
async def get_market_indices(response: Response):
    set_no_cache_headers(response)
    indices = await fetch_market_indices()
    market_status = get_market_status()
    
    return {
        "indices": indices,
        "market_status": market_status,
        "last_updated": get_ist_now().isoformat(),
        "timezone": "Asia/Kolkata (IST)",
        "data_quality": DataHealthChecker.check_data_completeness(indices)
    }


@router.get("/api/market/quote")
async def get_stock_quote(symbol: str = Query(..., description="NSE stock symbol e.g. RELIANCE"), response: Response = None):
    """Get live stock quote with IST timestamp and data validation."""
    if response:
        set_no_cache_headers(response)
    
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")
    
    quote = await fetch_stock_quote(symbol.upper())
    
    # Validate and clean the quote
    is_valid, cleaned, error = QuoteValidator.validate_quote(quote)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid quote data: {error}")
    
    # Add market context
    current_market_time = get_ist_now()
    is_live = is_market_open()
    
    return {
        "quote": cleaned,
        "is_live_data": is_live,
        "fetched_at": current_market_time.isoformat(),
        "market_status": get_market_status(),
        "timezone": "Asia/Kolkata (IST)",
    }


@router.get("/api/market/fii")
async def get_fii_dii(response: Response):
    """Latest FII/DII net buy/sell data with IST timestamp."""
    set_no_cache_headers(response)
    data = await fetch_fii_dii_data()
    return {
        "data": data,
        "last_updated": get_ist_now().isoformat(),
        "market_status": get_market_status(),
        "timezone": "Asia/Kolkata (IST)",
    }


@router.get("/api/market/news")
async def get_market_news(limit: int = Query(15, ge=1, le=50), response: Response = None):
    """Market news from Finnhub with IST timestamp."""
    if response:
        set_no_cache_headers(response)
    news = await finnhub_news(limit)
    return {
        "news": news,
        "count": len(news) if news else 0,
        "last_updated": get_ist_now().isoformat(),
        "source": "Finnhub",
        "timezone": "Asia/Kolkata (IST)",
    }


@router.get("/api/market/sentiment")
async def get_news_sentiment(response: Response):
    """News sentiment analysis from Alpha Vantage with IST timestamp."""
    set_no_cache_headers(response)
    sentiment = await fetch_news_sentiment()
    return {
        "sentiment": sentiment,
        "last_updated": get_ist_now().isoformat(),
        "source": "Alpha Vantage",
        "timezone": "Asia/Kolkata (IST)",
    }


@router.get("/api/market/movers")
async def get_top_movers(response: Response):
    """Top gainers, losers, and most active stocks with IST timestamp."""
    set_no_cache_headers(response)
    movers = await fetch_top_gainers_losers()
    return {
        **movers,
        "last_updated": get_ist_now().isoformat(),
        "market_status": get_market_status(),
        "timezone": "Asia/Kolkata (IST)",
    }
