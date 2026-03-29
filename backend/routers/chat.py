"""
Market AI Chat — Portfolio-aware multi-step analysis chatbot.
AMFI NAV source: https://portal.amfiindia.com/spages/NAVAll.txt
Live market data: yfinance + NSE APIs + Finnhub + Alpha Vantage
Claude Sonnet 4 for analysis.
"""
import asyncio
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import os
import yfinance as yf
import google.generativeai as genai

from services.claude_analyst import MODEL_SONNET, MODEL_HAIKU, extract_json
from services.gemini_analyst import model as gemini_model
from services.nse_fetcher import fetch_market_indices, fetch_stock_quote, fetch_fii_dii_data
from services.finnhub_fetcher import fetch_market_news


def _fallback_chat_response(request, market_context):
    # Simple deterministic fallback for cases where Gemini/Claude are unavailable.
    fund_info = ''
    if request.user_portfolio:
        fund_info = 'User portfolio: ' + ', '.join(request.user_portfolio) + '. '

    watchlist_info = ''
    if request.user_watchlist:
        watchlist_info = 'Watchlist symbols: ' + ', '.join(request.user_watchlist) + '. '

    user_questions = ' '.join([m.content for m in request.messages if m.role == 'user'])

    resp = [
        'Unable to reach cloud AI engines (Gemini/Claude) at this moment.',
        'Delivering local context-based analysis in the meantime.',
    ]
    if market_context:
        resp.append('Market context snapshot:')
        resp.append(market_context)
    if fund_info:
        resp.append(fund_info)
    if watchlist_info:
        resp.append(watchlist_info)
    if user_questions:
        resp.append('Your question was: ' + user_questions)

    resp.append('Please try again in a few seconds or check API key/credits for Gemini and Anthropic.')
    return '\n'.join(resp)

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class Message(BaseModel):
    role: str       # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    user_portfolio: Optional[List[str]] = []   # fund names from PortfolioXRay
    user_watchlist: Optional[List[str]] = []   # symbols from Watchlist


async def _build_market_context(symbols: list[str]) -> str:
    """Build real-time market context string to inject into Claude."""
    lines = []

    # Live indices
    try:
        indices = await fetch_market_indices()
        if indices:
            lines.append("=== LIVE MARKET DATA ===")
            for idx in indices[:4]:
                sign = "+" if idx["change_pct"] >= 0 else ""
                lines.append(f"  {idx['name']}: ₹{idx['value']:,.2f} ({sign}{idx['change_pct']:.2f}%)")
    except Exception:
        pass

    # Live quotes for mentioned/watchlist symbols
    if symbols:
        lines.append("\n=== STOCK QUOTES (LIVE) ===")
        tasks = [fetch_stock_quote(sym) for sym in symbols[:5]]
        quotes = await asyncio.gather(*tasks)
        for q in quotes:
            if q.get("price"):
                sign = "+" if (q.get("change_pct") or 0) >= 0 else ""
                lines.append(f"  {q['symbol']}: ₹{q['price']:,.2f} ({sign}{q.get('change_pct', 0):.2f}%)")

    # FII/DII recent flows
    try:
        fii_data = await fetch_fii_dii_data()
        if fii_data:
            latest = fii_data[0]
            fii = latest.get("fiiNetValue", 0)
            dii = latest.get("diiNetValue", 0)
            lines.append(f"\n=== LATEST FII/DII ({latest.get('date', 'today')}) ===")
            lines.append(f"  FII Net: ₹{fii:+.1f} Cr | DII Net: ₹{dii:+.1f} Cr")
    except Exception:
        pass

    # Finnhub market news for extra context
    try:
        news = await fetch_market_news(5)
        if news:
            lines.append("\n=== LATEST MARKET NEWS (Finnhub) ===")
            for n in news[:3]:
                lines.append(f"  • {n.get('headline', '')[:120]}")
    except Exception:
        pass

    lines.append(f"\nData timestamp: {datetime.now().strftime('%d %b %Y %H:%M IST')}")
    return "\n".join(lines)


def _extract_symbols_from_messages(messages: list[Message]) -> list[str]:
    """Extract NSE stock symbols from the conversation."""
    known_symbols = {
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BAJFINANCE",
        "WIPRO", "AXISBANK", "SBIN", "MARUTI", "TITAN", "SUNPHARMA",
        "TATAMOTORS", "LT", "ASIANPAINT", "NTPC", "POWERGRID", "DRREDDY",
        "HINDUNILVR", "LTIM", "ONGC", "BPCL", "ITC", "KOTAKBANK",
        "BHARTIARTL", "ADANIPORTS", "TATASTEEL", "JSWSTEEL", "M&M", "HCLTECH",
    }
    found = []
    for msg in messages[-3:]:   # last 3 messages
        for word in msg.content.upper().split():
            clean = word.strip(".,!?()[]:")
            if clean in known_symbols and clean not in found:
                found.append(clean)
    return found


@router.post("/api/chat")
async def market_chat(request: ChatRequest):
    """
    Portfolio-aware Market AI Chat.
    - Injects live market data as system context
    - Personalises answers based on user's portfolio
    - Cites data sources in responses
    - Multi-turn conversation support
    """
    # Identify relevant stock symbols from conversation
    mentioned_symbols = _extract_symbols_from_messages(request.messages)
    all_symbols = list(set(mentioned_symbols + (request.user_watchlist or [])))

    # Build live market context concurrently
    market_context = await _build_market_context(all_symbols)

    # Portfolio personalisation context
    portfolio_context = ""
    if request.user_portfolio:
        portfolio_context = f"""
=== USER'S MUTUAL FUND PORTFOLIO ===
The user holds these mutual funds: {', '.join(request.user_portfolio)}
Personalise your answer to their portfolio where relevant — mention if a stock/sector is a top holding in their funds.
"""

    system_prompt = f"""You are BharatAlpha AI — an expert financial intelligence assistant built for Indian retail investors.
You have access to REAL-TIME market data provided below. Use it to give specific, data-backed answers.

RULES:
1. Always cite your data source (e.g., "Based on live NSE data:", "According to yfinance today:")
2. Give specific numbers, prices, and percentages — not vague generalities
3. For every recommendation, state: Entry zone | Target | Stop Loss | Timeframe
4. Personalise based on the user's portfolio if relevant
5. Use simple language — assume the user is a retail investor, not a professional
6. For SEBI compliance: Always add "This is educational analysis, not SEBI-registered investment advice."
7. Structure longer answers with clear sections using **bold headers**

{market_context}

{portfolio_context}

Today's Date: {datetime.now().strftime('%d %B %Y')}
"""

    # Convert messages to Anthropic format
    anthropic_messages = [
        {"role": m.role, "content": m.content}
        for m in request.messages
        if m.role in ("user", "assistant")
    ]

    # First attempt: Gemini API
    try:
        user_query = '\n'.join([f"{m.role}: {m.content}" for m in request.messages if m.role in ("user", "assistant")])
        gemini_prompt = f"{system_prompt}\n\n{user_query}\n\nPlease answer as BharatAlpha AI with specific actionable insight."
        gemini_response = gemini_model.generate_content(
            gemini_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=1000,
            ),
        )
        answer = gemini_response.text.strip()
        if answer:
            return {
                "response": answer,
                "source": "gemini",
                "symbols_used": mentioned_symbols,
                "market_data_injected": bool(market_context),
                "portfolio_personalised": bool(request.user_portfolio),
                "generated_at": datetime.now().isoformat(),
            }
    except Exception as e:
        print(f"[Chat] Gemini error: {e}")

    # Fallback: Claude
    try:
        response = client.messages.create(
            model=MODEL_SONNET,
            max_tokens=1200,
            system=system_prompt,
            messages=anthropic_messages,
        )
        answer = response.content[0].text
        return {
            "response": answer,
            "source": "claude",
            "symbols_used": mentioned_symbols,
            "market_data_injected": bool(market_context),
            "portfolio_personalised": bool(request.user_portfolio),
            "generated_at": datetime.now().isoformat(),
        }
    except Exception as e:
        print(f"[Chat] Claude error: {e}")
        answer = _fallback_chat_response(request, market_context)
        return {
            "response": answer,
            "source": "fallback",
            "symbols_used": mentioned_symbols,
            "market_data_injected": bool(market_context),
            "portfolio_personalised": bool(request.user_portfolio),
            "generated_at": datetime.now().isoformat(),
            "error": str(e),
        }


@router.get("/api/chat/suggestions")
async def get_chat_suggestions():
    """Return contextual starter prompts based on today's market."""
    return {
        "suggestions": [
            "What are the best large-cap stocks to buy this week based on recent insider activity?",
            "Explain the current FII/DII trend and what it means for my portfolio",
            "Is RELIANCE a buy, hold or sell right now? Give me a specific entry and target.",
            "Which sectors have the strongest momentum today?",
            "I hold Parag Parikh Flexi Cap and Mirae Asset. Should I rebalance?",
            "What is the biggest risk for the Indian market in the next 30 days?",
            "Find me a stock making a 52-week breakout today with volume confirmation",
            "Explain in simple terms what the Golden Cross pattern means and show me a current example",
        ]
    }
