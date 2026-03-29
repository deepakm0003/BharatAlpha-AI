import httpx
import asyncio

class MFService:
    @staticmethod
    async def search_funds(query: str):
        """Searches for Indian Mutual Funds using the mfapi.in search endpoint."""
        if not query or len(query) < 3:
            return {"results": []}
            
        url = f"https://api.mfapi.in/mf/search?q={query}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                return {"results": response.json()[:10]} # Limit to 10
            except Exception as e:
                 print(f"[MFService] Search Error: {e}")
                 return {"results": []}

    @staticmethod
    async def fetch_nav_by_name(fund_name: str):
        """
        Standardizes NAV fetching for mutual funds.
        In a real app, this would use a mapping or scheme code search first.
        For now, we use a hybrid approach in amfi_fetcher.
        """
        # This is a placeholder for the logic inside amfi_fetcher.py
        pass
