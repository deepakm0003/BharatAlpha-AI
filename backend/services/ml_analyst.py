import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_ml_analysis(symbol: str) -> dict:
    """
    Performs a technical and fundamental analysis of a stock using yfinance data.
    Returns a structured dictionary with scores and insights.
    """
    if not symbol:
        return {"error": "No symbol provided"}

    # Add .NS if not present (NSE default)
    if not "." in symbol:
        symbol = f"{symbol}.NS"

    try:
        ticker = yf.Ticker(symbol)
        
        # 1. Fundamental Data
        info = ticker.info
        fundamentals = {
            "name": info.get("longName", symbol),
            "price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "market_cap": info.get("marketCap"),
            "dividend_yield": info.get("dividendYield"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
        }

        # 2. Historical Data for Technicals (1 Year)
        hist = ticker.history(period="1y")
        if hist.empty:
            return {"error": f"No historical data found for {symbol}"}

        # SMA 50 and 200
        hist['SMA50'] = hist['Close'].rolling(window=50).mean()
        hist['SMA200'] = hist['Close'].rolling(window=200).mean()
        
        # RSI (14 days)
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        hist['RSI'] = 100 - (100 / (1 + rs))

        latest = hist.iloc[-1]
        prev = hist.iloc[-2]

        # 3. Heuristic ML Model (Scoring)
        scores = []
        
        # Trend Score
        trend = "Neutral"
        if latest['SMA50'] > latest['SMA200']:
            trend = "Bullish (Golden Cross)"
            scores.append(2)
        elif latest['SMA50'] < latest['SMA200']:
            trend = "Bearish (Death Cross)"
            scores.append(-2)
            
        # RSI Score
        rsi_status = "Neutral"
        if latest['RSI'] > 70:
            rsi_status = "Overbought"
            scores.append(-1)
        elif latest['RSI'] < 30:
            rsi_status = "Oversold"
            scores.append(1)
            
        # Momentum Score
        momentum = "Steady"
        price_change = ((latest['Close'] - hist.iloc[-20]['Close']) / hist.iloc[-20]['Close']) * 100
        if price_change > 5:
            momentum = "High Upward"
            scores.append(1)
        elif price_change < -5:
            momentum = "High Downward"
            scores.append(-1)

        # Volatility (Std Dev of returns)
        returns = hist['Close'].pct_change().dropna()
        volatility = returns.std() * np.sqrt(252) * 100 # Annualized

        # Aggregate Result
        total_score = sum(scores)
        consensus = "HOLD"
        if total_score >= 2: consensus = "BUY"
        elif total_score <= -2: consensus = "SELL"
        
        return {
            "symbol": symbol,
            "fundamentals": fundamentals,
            "technicals": {
                "rsi": round(latest['RSI'], 2),
                "sma50": round(latest['SMA50'], 2),
                "sma200": round(latest['SMA200'], 2),
                "trend": trend,
                "rsi_status": rsi_status,
                "momentum": momentum,
                "volatility_annual": round(volatility, 2)
            },
            "ml_consensus": consensus,
            "confidence": min(abs(total_score) * 25, 100),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    except Exception as e:
        print(f"[ML Analyst] Error analyzing {symbol}: {e}")
        return {"error": str(e)}

def format_ml_report(data: dict) -> str:
    """Converts the ML analysis dict into a beautiful Markdown report."""
    if "error" in data:
        return f"### âš ï¸ Analysis Error\nUnable to analyze symbol. Error: {data['error']}"

    f = data['fundamentals']
    t = data['technicals']
    
    report = f"""### âœ¨ BharatAlpha Smart Analysis: {f['name']} ({data['symbol']})

#### 1. ML-Driven Consensus
> [!IMPORTANT]
> **Consensus: {data['ml_consensus']}** ({data['confidence']}% Model Confidence)
> **Primary Trend:** {t['trend']} | **Momentum:** {t['momentum']}

#### 2. Technical Snapshot
| Metric | Value | Status |
| :--- | :--- | :--- |
| **Current Price** | â¹{f['price']:,} | -- |
| **RSI (14d)** | {t['rsi']} | {t['rsi_status']} |
| **SMA 50** | â¹{t['sma50']:,} | {"Price Above" if f['price'] > t['sma50'] else "Price Below"} |
| **SMA 200** | â¹{t['sma200']:,} | {"Price Above" if f['price'] > t['sma200'] else "Price Below"} |
| **Volatility** | {t['volatility_annual']}% | {"High" if t['volatility_annual'] > 30 else "Moderate"} |

#### 3. Fundamental Value
- **P/E Ratio:** {f['pe_ratio'] or 'N/A'} (Industry avg: ~25)
- **P/B Ratio:** {f['pb_ratio'] or 'N/A'}
- **Div. Yield:** {(f['dividend_yield']*100) if f['dividend_yield'] else 0:.2f}%
- **52W Range:** â¹{f['52w_low']:,} - â¹{f['52w_high']:,}

*Note: This analysis is generated by our local heuristic ML model based on YFinance data. It does not constitute formal investment advice.*
"""
    return report
