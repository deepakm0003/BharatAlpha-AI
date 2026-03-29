import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from services.amfi_fetcher import fetch_fund_nav
from services.openai_analyst import analyze_portfolio_with_openai
from services.nse_fetcher import fetch_market_indices
from services.mf_service import MFService
from services.pdf_generator import generate_portfolio_pdf

router = APIRouter()

class PortfolioRequest(BaseModel):
    funds: List[str]

@router.get("/api/portfolio/search")
async def search_portfolio_funds(q: str):
    """Live search for Indian Mutual Funds."""
    return await MFService.search_funds(q)

@router.post("/api/portfolio/analyze")
async def analyze_portfolio_route(request: PortfolioRequest):
    if not (1 <= len(request.funds) <= 10):
        raise HTTPException(status_code=400, detail="Must provide between 1 and 10 assets")
        
    # Fetch Asset Data + Market Context in parallel
    nav_tasks = [fetch_fund_nav(fund) for fund in request.funds]
    nav_results, market_data = await asyncio.gather(
        asyncio.gather(*nav_tasks),
        fetch_market_indices()
    )
    
    # Enrich Market Context (Nifty 50)
    benchmarks = {m["name"]: m["value"] for m in market_data} if market_data else {}
    
    # Use OpenAI for analysis with benchmark awareness
    analysis = analyze_portfolio_with_openai(request.funds, nav_results, benchmarks)
    
    return {
        "funds_analyzed": nav_results,
        "analysis": analysis,
        "market_benchmarks": market_data,
        "generated_at": datetime.now().isoformat()
    }

@router.post("/api/portfolio/download-pdf")
async def download_portfolio_pdf(request: PortfolioRequest):
    if not (1 <= len(request.funds) <= 10):
        raise HTTPException(status_code=400, detail="Must provide between 1 and 10 assets")
        
    tasks = [fetch_fund_nav(fund) for fund in request.funds]
    nav_results, market_data = await asyncio.gather(
        asyncio.gather(*tasks),
        fetch_market_indices()
    )
    
    benchmarks = {m["name"]: m["value"] for m in market_data} if market_data else {}
    analysis = analyze_portfolio_with_openai(request.funds, nav_results, benchmarks)
    
    analysis_data = {
        "funds_analyzed": nav_results,
        "analysis": analysis,
        "generated_at": datetime.now().isoformat()
    }
    
    pdf_content = generate_portfolio_pdf(analysis_data, nav_results)
    
    def iter_pdf():
        yield pdf_content
    
    return StreamingResponse(
        iter_pdf(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=portfolio_xray_report.pdf"}
    )
