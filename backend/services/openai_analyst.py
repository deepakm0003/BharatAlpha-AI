import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Configure OpenAI Client
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

def analyze_with_openai(system_prompt: str, user_query: str) -> str:
    """Sends a prompt to OpenAI GPT-4o-mini/4o for financial analysis."""
    if not client:
        return "[BharatAlpha] AI analysis is currently unavailable as the OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file."
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[OpenAI] Error: {e}")
        return f"[BharatAlpha] Error during AI analysis: {str(e)}"

def analyze_portfolio_with_openai(funds: list, nav_data: list, market_context: dict = None) -> dict:
    """ChatGPT-powered Portfolio X-Ray analysis with benchmark awareness."""
    if not client:
        return {
            "overall_health": "FAIR",
            "summary": "AI Analysis is currently unavailable because the OpenAI API key is missing. Please configure OPENAI_API_KEY in your backend .env file to enable professional institutional insights.",
            "top_recommendation": "Configure OpenAI API Key for deep analysis.",
            "estimated_xirr_range": "N/A",
            "overlap_analysis": "Configuration required.",
            "expense_drag": "N/A",
            "funds_to_consider_replacing": [],
            "suggested_alternatives": ["Add OpenAI API Key to see recommendations"]
        }

    system_prompt = (
        "You are a elite institutional investment strategist at BharatAlpha. "
        "Analyze the provided Indian portfolio. Match it against market benchmarks. "
        "Return a VALID JSON OBJECT ONLY. Be aggressive, data-driven, and institutional in tone."
    )

    import json as json_lib
    user_prompt = f"""
    Analyze this portfolio:
    Assets: {", ".join(funds)}
    Live Data: {json_lib.dumps(nav_data, indent=2)}
    Market Benchmark: {json_lib.dumps(market_context or {{}}, indent=2)}

    Required JSON Structure:
    {{
      "overall_health": "GOOD | FAIR | NEEDS_ATTENTION",
      "estimated_xirr_range": "e.g. 14.2% (Personalized based on asset mix)",
      "overlap_analysis": "Specific concentration risk details.",
      "expense_drag": "Specific cost drag (e.g. 1.25%) based on the funds.",
      "top_recommendation": "A single specific high-impact action.",
      "funds_to_consider_replacing": ["Names"],
      "suggested_alternatives": ["Name with WHY"],
      "summary": "3-4 sentences of deep financial insight. Reference specific funds and current market context."
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.2
        )
        return json_lib.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"[OpenAI Portfolio] Error: {e}")
        return {
            "overall_health": "FAIR",
            "summary": "AI Analysis temporarily unavailable. Live prices are shown below.",
            "top_recommendation": "Review your portfolio allocation manually."
        }
