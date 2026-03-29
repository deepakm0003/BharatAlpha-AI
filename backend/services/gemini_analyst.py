import json
import re
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("[Gemini] WARNING: No GOOGLE_API_KEY found in .env. Gemini functionality will be disabled.")
    model = None

def extract_json(text: str) -> dict:
    """Strips markdown fences and extracts first valid JSON object."""
    text = re.sub(r'```(?:json)?\s*', '', text).strip()
    text = re.sub(r'```\s*$', '', text).strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"No JSON found in response: {text[:200]}")


def analyze_portfolio(funds: list, nav_data: list) -> dict:
    system_prompt = (
        "You are a senior equity analyst at a top Indian institutional fund. "
        "Always respond in valid JSON only. No markdown, no explanation outside JSON."
    )

    user_prompt = f"""
Analyze this Indian mutual fund portfolio:
Funds held: {", ".join(funds)}
NAV data: {json.dumps(nav_data, indent=2)}

Respond ONLY with this JSON:
{{
  "overall_health": "GOOD or FAIR or NEEDS_ATTENTION",
  "estimated_xirr_range": "<e.g. 13-16% based on category performance benchmarks>",
  "overlap_analysis": "<which funds overlap in top holdings and by how much>",
  "expense_drag": "<annual cost drag estimate with specific number>",
  "top_recommendation": "<single most important specific rebalancing action>",
  "funds_to_consider_replacing": ["fund_name"],
  "suggested_alternatives": ["specific fund name with reason"],
  "summary": "<3 sentence portfolio health summary with specific actionable insight>"
}}
"""

    print(f"[Gemini] Calling analyze_portfolio for {len(funds)} funds")
    try:
        if not model:
            raise ValueError("Gemini model is not initialized (missing API key)")
            
        response = model.generate_content(
            f"{system_prompt}\n\n{user_prompt}",
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=800,
            )
        )
        response_text = response.text
        print(f"[Gemini] Raw response: {response_text[:200]}")
        return extract_json(response_text)
    except Exception as e:
        print(f"[Gemini] Error in analyze_portfolio: {e}")

        # Use the actual NAV and category details to produce data-driven fallback analysis.
        cat_counts = {}
        nav_values = [v.get('nav') for v in nav_data if isinstance(v.get('nav'), (int, float))]
        valid_nav_count = len(nav_values)
        avg_nav = round(sum(nav_values) / valid_nav_count, 2) if valid_nav_count else None

        for fund in nav_data:
            cat = fund.get('category', 'Unknown') or 'Unknown'
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        largest_cat = max(cat_counts.items(), key=lambda x: x[1])[0] if cat_counts else 'Unknown'
        is_index_included = any("index" in (f.get('category', '').lower() or f.get('name', '').lower()) for f in nav_data)
        is_international = any("international" in (f.get('category', '').lower() or f.get('name', '').lower()) or "nasdaq" in (f.get('name', '').lower()) for f in nav_data)
        is_small_mid = any(c.lower() in ("small cap", "mid cap", "midcap") for c in cat_counts)

        # health
        if is_index_included and is_international:
            health = "GOOD"
        elif is_small_mid and len(nav_data) >= 2:
            health = "FAIR"
        else:
            health = "NEEDS_ATTENTION"

        # xirr
        if health == "GOOD":
            xirr_range = "12-16%"
        elif health == "FAIR":
            xirr_range = "11-15%"
        else:
            xirr_range = "9-13%"

        # expense + overlap
        overlap = f"{cat_counts.get(largest_cat, 0)} fund(s) in {largest_cat} class, indicating concentration and possible overlap."
        if is_index_included:
            expense = "Low expense drag (0.3-0.6%) due to index component."
        else:
            expense = "Moderate expense drag (1.0-1.8%) from active management."

        top_rec = "Ensure at least 20-30% allocation to low-cost index funds for risk mitigation." if health != "GOOD" else "Keep current diversification mix, but keep review cadence quarterly."

        to_replace = [f.get('name') for f in nav_data if not f.get('matched') or not f.get('nav')]

        # Provide dynamic recommendations depending on asset coverage
        suggested = []
        if is_index_included:
            suggested.append("SBI Nifty 50 ETF — extremely low TER for permanent corpus")
        else:
            suggested.append("UTI Nifty 50 Index Fund — 0.18% TER to lower overall costs")

        if is_international:
            suggested.append("Motilal Oswal Nasdaq 100 Fund — strengthen global growth exposure")
        if is_small_mid:
            suggested.append("HDFC Mid-Cap Opportunities — diversify midcap exposure with quality holdings")

        # Intelligent per-fund callout for users
        dynamic_fund_summary = []
        for f in nav_data:
            status = "healthy" if f.get('matched') and f.get('nav') else "needs review"
            nav_text = f"₹{f.get('nav')}" if isinstance(f.get('nav'), (int, float)) else "N/A"
            dynamic_fund_summary.append(f"{f.get('name')} ({nav_text}, {f.get('category', 'Unknown')}) - {status}")

        funds_to_consider = to_replace

        summary = (
            f"Portfolio currently has {len(nav_data)} funds (" + ", ".join(dynamic_fund_summary[:3]) + ("..." if len(dynamic_fund_summary) > 3 else "") + "). "
            f"Average NAV is {f'₹{avg_nav}' if avg_nav else 'N/A'}, with highest concentration in {largest_cat}. "
            f"Near-term action: {top_rec}. "
            f"Expense profile: {expense}."
        )

        return {
            "overall_health": health,
            "estimated_xirr_range": xirr_range,
            "overlap_analysis": overlap,
            "expense_drag": expense,
            "top_recommendation": top_rec,
            "funds_to_consider_replacing": funds_to_consider,
            "suggested_alternatives": suggested,
            "summary": summary
        }