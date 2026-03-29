import asyncio
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.nse_fetcher import fetch_stock_quote
from services.claude_analyst import analyze_watchlist

router = APIRouter()


class WatchlistRequest(BaseModel):
    symbols: List[str]


@router.post("/api/watchlist/quotes")
async def get_watchlist_quotes(request: WatchlistRequest):
    if not (1 <= len(request.symbols) <= 10):
        return {"error": "Provide 1-10 symbols"}
    symbols = [s.upper() for s in request.symbols]
    tasks = [fetch_stock_quote(sym) for sym in symbols]
    quotes = await asyncio.gather(*tasks)
    valid_quotes = [q for q in quotes if q.get("price")]
    analysis = analyze_watchlist(valid_quotes)
    return {
        "quotes": quotes,
        "analysis": analysis,
        "last_updated": datetime.now().isoformat(),
    }
