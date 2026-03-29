import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.signals import router as signals_router
from routers.smartmoney import router as smartmoney_router
from routers.portfolio import router as portfolio_router
from routers.market import router as market_router
from routers.watchlist import router as watchlist_router
from routers.patterns import router as patterns_router
from routers.chat import router as chat_router
from routers.radar import router as radar_router
from routers.search import router as search_router

app = FastAPI(title="BharatAlpha AI", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals_router)
app.include_router(smartmoney_router)
app.include_router(portfolio_router)
app.include_router(market_router)
app.include_router(watchlist_router)
app.include_router(patterns_router)
app.include_router(chat_router)
app.include_router(radar_router)
app.include_router(search_router)

@app.get("/")
async def root():
    return {"status": "BharatAlpha AI v3 running", "version": "3.0.0", "features": ["live-data", "ai-chat", "radar", "patterns", "portfolio"]}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
