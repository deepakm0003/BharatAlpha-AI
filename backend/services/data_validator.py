"""
Data Validation & Quality Checks for BharatAlpha
"""
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from services.config import (
    IST, MIN_VOLUME, MIN_PRICE, MAX_PRICE_CHANGE,
    NIFTY500_SYMBOLS, SECTOR_MAPPING
)


class DataValidator:
    """Validate and sanitize market data."""
    
    @staticmethod
    def is_valid_symbol(symbol: str) -> bool:
        """Check if symbol is valid NSE format (uppercase, alphanumeric, max 10 chars)."""
        if not symbol:
            return False
        # Allow symbols like "RELIANCE", "TATA-AUTO", "BHEL&A"
        return bool(re.match(r"^[A-Z0-9\-\&]{1,10}$", symbol.strip()))
    
    @staticmethod
    def is_valid_price(price: float) -> bool:
        """Check if price is within expected range."""
        try:
            p = float(price)
            return MIN_PRICE <= p <= 1000000  # 1 rupee to 10 lakh
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def is_valid_volume(volume: int) -> bool:
        """Check if volume is reasonable."""
        try:
            v = int(volume)
            return v >= 0  # Allow zero volume (e.g., post-market)
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def is_valid_percentage_change(change: float) -> bool:
        """Check if % change is within expected bounds."""
        try:
            c = float(change)
            return -100 <= c <= 500  # Allow circuit breakers
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def is_valid_date(date_str: str, fmt: str = "%Y-%m-%d") -> bool:
        """Validate date format and ensure it's not future."""
        try:
            parsed = datetime.strptime(date_str, fmt)
            # Allow dates up to 1 day in future (for time zone issues)
            now = datetime.now(IST).date()
            future_cutoff = datetime.now(IST).replace(hour=23, minute=59, second=59).date()
            return parsed.date() <= future_cutoff
        except ValueError:
            return False
    
    @staticmethod
    def sanitize_price(value: Any) -> float:
        """Convert any value to float safely."""
        try:
            if isinstance(value, str):
                value = value.strip().replace(",", "").replace(" ", "")
            return float(value) if value else 0.0
        except (ValueError, TypeError, AttributeError):
            return 0.0
    
    @staticmethod
    def sanitize_volume(value: Any) -> int:
        """Convert any value to int safely."""
        try:
            if isinstance(value, str):
                value = value.strip().replace(",", "").replace(" ", "")
            return int(float(value)) if value else 0
        except (ValueError, TypeError, AttributeError):
            return 0
    
    @staticmethod
    def sanitize_symbol(symbol: Any) -> str:
        """Ensure symbol is uppercase and trimmed."""
        if isinstance(symbol, str):
            return symbol.strip().upper()
        return str(symbol).strip().upper() if symbol else ""
    
    @staticmethod
    def is_known_symbol(symbol: str) -> bool:
        """Check if symbol is in NIFTY 500."""
        return DataValidator.sanitize_symbol(symbol) in NIFTY500_SYMBOLS


class QuoteValidator:
    """Validate stock quote data."""
    
    @staticmethod
    def validate_quote(data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Validate and clean a stock quote object.
        Returns: (is_valid, cleaned_data, error_message)
        """
        if not data:
            return False, None, "Quote data is empty"
        
        errors = []
        cleaned = {}
        
        # Validate required fields
        symbol = data.get("symbol")
        if not symbol or not DataValidator.is_valid_symbol(symbol):
            errors.append(f"Invalid symbol: {symbol}")
            return False, None, "Invalid symbol"
        
        cleaned["symbol"] = DataValidator.sanitize_symbol(symbol)
        
        # Current price
        price = data.get("price") or data.get("current_price") or data.get("close")
        if not DataValidator.is_valid_price(price):
            errors.append(f"Invalid price: {price}")
            return False, None, f"Invalid price: {price}"
        cleaned["price"] = DataValidator.sanitize_price(price)
        
        # Open, High, Low
        cleaned["open"] = DataValidator.sanitize_price(data.get("open", 0))
        cleaned["high"] = DataValidator.sanitize_price(data.get("high", 0))
        cleaned["low"] = DataValidator.sanitize_price(data.get("low", 0))
        
        # Volume
        volume = data.get("volume", 0)
        if not DataValidator.is_valid_volume(volume):
            errors.append(f"Invalid volume: {volume}")
            volume = 0
        cleaned["volume"] = DataValidator.sanitize_volume(volume)
        
        # % Change
        change_pct = data.get("change_pct") or data.get("change_percent") or data.get("percent_change", 0)
        if not DataValidator.is_valid_percentage_change(change_pct):
            errors.append(f"Invalid % change: {change_pct}")
            change_pct = 0
        cleaned["change_pct"] = float(change_pct) or 0.0
        
        # Change in points
        change_points = data.get("change") or data.get("change_points", 0)
        cleaned["change_points"] = DataValidator.sanitize_price(change_points)
        
        # Timestamp (prefer ISO format)
        timestamp = data.get("timestamp") or data.get("updated_at") or datetime.now(IST).isoformat()
        cleaned["timestamp"] = timestamp
        
        # Previous close (for calculations)
        cleaned["previous_close"] = DataValidator.sanitize_price(data.get("previous_close", 0))
        
        # Optional fields
        cleaned["pe_ratio"] = DataValidator.sanitize_price(data.get("pe_ratio", 0))
        cleaned["market_cap"] = data.get("market_cap", "")
        cleaned["sector"] = data.get("sector", "Unknown")
        
        if errors:
            print(f"[Validation] Quote warnings for {symbol}: {', '.join(errors)}")
        
        return True, cleaned, None
    
    @staticmethod
    def validate_quotes(quotes: List[Dict]) -> Tuple[List[Dict], List[str]]:
        """
        Validate multiple quotes.
        Returns: (valid_quotes, error_symbols)
        """
        valid = []
        errors = []
        
        for q in quotes:
            is_valid, cleaned, error = QuoteValidator.validate_quote(q)
            if is_valid and cleaned:
                valid.append(cleaned)
            else:
                symbol = q.get("symbol", "unknown")
                errors.append(f"{symbol}: {error}")
        
        return valid, errors


class IndiceValidator:
    """Validate market indices data."""
    
    @staticmethod
    def validate_index(data: Dict[str, Any]) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Validate index data."""
        if not data:
            return False, None, "Index data is empty"
        
        name = data.get("name") or data.get("index_name")
        if not name:
            return False, None, "Missing index name"
        
        cleaned = {
            "name": str(name).strip(),
            "value": DataValidator.sanitize_price(data.get("value") or data.get("current")),
            "change": DataValidator.sanitize_price(data.get("change") or data.get("points_change")),
            "change_pct": float(data.get("change_pct") or data.get("change_percent") or 0),
            "timestamp": data.get("timestamp") or datetime.now(IST).isoformat(),
        }
        
        # Minimal validation
        if cleaned["value"] <= 0:
            return False, None, f"Invalid index value: {cleaned['value']}"
        
        return True, cleaned, None


class DataHealthChecker:
    """Overall data pipeline health check."""
    
    @staticmethod
    def check_quote_freshness(quote: Dict, max_age_minutes: int = 5) -> bool:
        """Check if quote is recent enough."""
        try:
            timestamp = quote.get("timestamp")
            if not timestamp:
                return False
            
            from datetime import datetime
            quote_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            age = (datetime.now(IST) - quote_time).total_seconds() / 60
            
            return age <= max_age_minutes
        except Exception:
            return False
    
    @staticmethod
    def check_data_completeness(quotes: List[Dict]) -> Dict[str, Any]:
        """Check data completeness metrics."""
        if not quotes:
            return {
                "total": 0,
                "valid": 0,
                "with_volume": 0,
                "with_price_change": 0,
                "completeness_pct": 0,
            }
        
        with_volume = sum(1 for q in quotes if q.get("volume", 0) > 0)
        with_change = sum(1 for q in quotes if q.get("change_pct") != 0)
        
        return {
            "total": len(quotes),
            "valid": len(quotes),
            "with_volume": with_volume,
            "with_price_change": with_change,
            "completeness_pct": round((with_volume + with_change) / (len(quotes) * 2 * 100), 2) if quotes else 0,
        }


# ──── EXAMPLES ────
if __name__ == "__main__":
    # Example quote
    sample = {
        "symbol": "RELIANCE",
        "price": 2850.50,
        "change_pct": 1.5,
        "volume": 5000000,
        "timestamp": datetime.now(IST).isoformat(),
    }
    
    is_valid, cleaned, error = QuoteValidator.validate_quote(sample)
    print(f"Valid: {is_valid}, Error: {error}, Data: {cleaned}")
