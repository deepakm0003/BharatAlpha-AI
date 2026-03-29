from datetime import datetime
from fastapi import APIRouter
from services.nse_fetcher import fetch_fii_dii_data
from services.claude_analyst import analyze_fii_dii_pattern
from services.finnhub_fetcher import fetch_market_news
from services.alphavantage_fetcher import fetch_news_sentiment

router = APIRouter()

@router.get("/api/smartmoney")
async def get_smartmoney():
    flows = await fetch_fii_dii_data()
    analysis = analyze_fii_dii_pattern(flows)

    # Enrich with market news for additional context
    news = []
    try:
        news = await fetch_market_news(5)
    except Exception:
        pass

    return {
        "flows": flows,
        "analysis": analysis,
        "market_news": news[:5],
        "last_updated": datetime.now().isoformat(),
        "data_sources": ["NSE", "yfinance", "Finnhub"],
    }
