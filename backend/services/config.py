"""
Configuration & Market Hours for BharatAlpha
"""
from datetime import datetime, time
import pytz

# ─── TIMEZONE & MARKET HOURS ───
IST = pytz.timezone("Asia/Kolkata")
UTC = pytz.UTC

# NSE Market hours (IST)
NSE_OPEN_TIME = time(9, 15)  # 9:15 AM
NSE_CLOSE_TIME = time(15, 30)  # 3:30 PM
NSE_WEEKDAYS = [0, 1, 2, 3, 4]  # Mon-Fri

# BSE Market hours (same as NSE)
BSE_OPEN_TIME = time(9, 15)
BSE_CLOSE_TIME = time(15, 30)

# ─── MARKET HOLIDAYS 2025 ─── (Add more as needed)
NSE_HOLIDAYS_2025 = [
    "2025-01-26",  # Republic Day
    "2025-03-08",  # Maha Shivaratri
    "2025-03-25",  # Holi
    "2025-03-29",  # Good Friday
    "2025-04-11",  # Eid-ul-Fitr
    "2025-04-17",  # Ram Navami
    "2025-05-23",  # Buddha Purnima
    "2025-07-17",  # Muharram
    "2025-08-15",  # Independence Day
    "2025-08-27",  # Janmashtami
    "2025-09-16",  # Milad-un-Nabi
    "2025-10-02",  # Gandhi Jayanti
    "2025-10-12",  # Dussehra
    "2025-10-31",  # Diwali
    "2025-11-01",  # Diwali (Day 2)
    "2025-11-15",  # Guru Nanak Jayanti
    "2025-12-25",  # Christmas
]

# ─── DATA QUALITY THRESHOLDS ───
MIN_VOLUME = 100000  # Minimum share volume for quality data
MIN_PRICE = 1  # Minimum stock price
MAX_PRICE_CHANGE = 50  # Max expected % change in a day
CACHE_TTL_SECONDS = 300  # 5 minutes cache for most data
CACHE_TTL_LONG = 3600  # 1 hour cache for stable data (indices, NAVs)

# ─── API KEYS (from environment) ───
import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
ALPHAVANTAGE_API_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "")

# ─── NIFTY 500 STOCKS (curated list) ───
NIFTY500_SYMBOLS = {
    # Large Cap (30)
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR",
    "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT", "AXISBANK",
    "ASIANPAINT", "MARUTI", "WIPRO", "HCLTECH", "BAJFINANCE",
    "TITAN", "NESTLEIND", "ULTRACEMCO", "TECHM", "SUNPHARMA",
    "POWERGRID", "NTPC", "ONGC", "COALINDIA", "DRREDDY",
    "DIVISLAB", "CIPLA", "ADANIPORTS",
    
    # Mid Cap (20)
    "TATAMOTORS", "TATASTEEL", "JSWSTEEL", "HINDALCO", "BAJAJFINSV",
    "BAJAJ-AUTO", "HEROMOTOCO", "EICHERMOT", "M&M", "GRASIM",
    "INDUSINDBK", "BPCL", "IOC", "LTIM", "TATACONSUM",
    "APOLLOHOSP", "ADANIENT", "PIDILITIND", "DABUR", "BRITANNIA",
}

# ─── SECTOR MAPPING ───
SECTOR_MAPPING = {
    # Banking & Finance
    "HDFCBANK": "Banks", "ICICIBANK": "Banks", "SBIN": "Banks", "KOTAKBANK": "Banks", "AXISBANK": "Banks", "INDUSINDBK": "Banks",
    "BAJFINANCE": "Finance", "MUTHOOTFIN": "Finance", "NESTLEIND": "Finance",
    
    # IT & Tech
    "TCS": "IT", "INFY": "IT", "WIPRO": "IT", "TECHM": "IT", "HCLTECH": "IT", "LTIM": "IT",
    
    # Energy
    "RELIANCE": "Energy", "NTPC": "Energy", "ONGC": "Energy", "COALINDIA": "Energy", "POWERGRID": "Energy",
    
    # Pharma
    "SUNPHARMA": "Pharma", "DRREDDY": "Pharma", "CIPLA": "Pharma", "DIVISLAB": "Pharma",
    
    # Auto
    "MARUTI": "Auto", "HEROMOTOCO": "Auto", "EICHERMOT": "Auto", "TATAMOTORS": "Auto", "BAJAJ-AUTO": "Auto", "M&M": "Auto",
    
    # Manufacturing
    "TATASTEEL": "Steel", "JSWSTEEL": "Steel", "HINDALCO": "Metals", "ULTRACEMCO": "Cement", "GRASIM": "Cement",
    
    # FMCG
    "HINDUNILVR": "FMCG", "ITC": "FMCG", "BRITANNIA": "FMCG", "DABUR": "FMCG", "ASIANPAINT": "Paints",
    
    # Telecom
    "BHARTIARTL": "Telecom",
    
    # Consumer
    "TATACONSUM": "Consumer", "NESTLEIND": "Consumer",
    
    # Ports & Logistics
    "ADANIPORTS": "Logistics",
    
    # Airlines
    "APOLLOHOSP": "Hospitals",
    
    # Real Estate / Infrastructure
    "LT": "Infrastructure", "ADANIENT": "Infrastructure",
    
    # Defense / Pharma
    "PIDILITIND": "Chemicals",
    
    # Luxury
    "TITAN": "Luxury",
}

# ─── MARKET STATUS HELPER ───
def is_market_open() -> bool:
    """Check if NSE is currently open (trading hours)."""
    now = datetime.now(IST)
    
    # Check if it's a weekday
    if now.weekday() not in NSE_WEEKDAYS:
        return False
    
    # Check if it's a holiday
    if now.strftime("%Y-%m-%d") in NSE_HOLIDAYS_2025:
        return False
    
    # Check time
    current_time = now.time()
    return NSE_OPEN_TIME <= current_time <= NSE_CLOSE_TIME


def get_ist_now() -> datetime:
    """Get current time in IST."""
    return datetime.now(IST)


def get_market_status() -> dict:
    """Get current market status."""
    now = get_ist_now()
    is_open = is_market_open()
    
    return {
        "is_open": is_open,
        "current_time": now.isoformat(),
        "open_time": NSE_OPEN_TIME.isoformat(),
        "close_time": NSE_CLOSE_TIME.isoformat(),
        "day_of_week": now.strftime("%A"),
        "date": now.strftime("%Y-%m-%d"),
    }


def get_sector(symbol: str) -> str:
    """Get sector for a given symbol."""
    return SECTOR_MAPPING.get(symbol, "Other")


# Retry configuration
RETRY_ATTEMPTS = 3
RETRY_DELAY = 0.5  # seconds
TIMEOUT = 15  # seconds
