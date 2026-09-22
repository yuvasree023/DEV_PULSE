import os
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx
try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings

logger = logging.getLogger("app.services.gemini")

SYSTEM_PROMPT = """You are an objective engineering analytics explanation assistant for DevPulse.
Your task is to explain and summarize the provided developer productivity metrics and ML clustering results.

STRICT GROUNDING RULES:
1. ONLY use the numbers, metrics, and facts supplied in the input JSON.
2. NEVER invent, hallucinate, extrapolate, or calculate missing numbers.
3. NEVER claim causality (e.g. do not say "AI caused a 20% speedup"). Use observational framing such as "Observed comparison", "AI-assisted vs non-AI PRs", or "Observed association — not causal evidence".
4. If asked about something not present in the data, state clearly: "Insufficient data in the current dataset to determine this."
5. Output your analysis in a structured, professional markdown format containing:
   - Summary of Observed Metrics (bullet points quoting exact numbers)
   - Segment & Workflow Patterns (from the ML clustering output)
   - Observations & Considerations (non-prescriptive, objective observations)
"""


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.model_name = "gemini-2.0-flash"

    async def generate_explanation(self, context_data: Dict[str, Any], prompt_focus: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a strictly grounded explanation of the computed metrics and ML insights.
        """
        # Ensure we have clean JSON
        context_json_str = json.dumps(context_data, indent=2, default=str)
        
        user_query = f"Provide an objective explanation of the following developer telemetry and ML clustering results. Focus on {prompt_focus or 'holistic overview'}.\n\nDATA:\n{context_json_str}"

        self.api_key = settings.require_gemini_api_key()

        # If API key is not configured outside production, generate a deterministic grounded template.
        if not self.api_key or self.api_key.startswith("your_") or len(self.api_key) < 10:
            logger.warning("GEMINI_API_KEY not configured or placeholder. Generating deterministic grounded explanation.")
            return self._generate_deterministic_explanation(context_data, prompt_focus)

        try:
            # Call Google Generative AI API
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
            
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{SYSTEM_PROMPT}\n\n{user_query}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,  # Low temperature for strict factual adherence
                    "maxOutputTokens": 1024,
                }
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(endpoint, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            explanation_text = parts[0].get("text", "")
                            return {
                                "source": "gemini-2.0-flash",
                                "generated_at": datetime.now(timezone.utc).isoformat(),
                                "explanation": explanation_text,
                                "grounding_status": "Strictly grounded on input telemetry"
                            }
                
                logger.error(f"Gemini API returned status {response.status_code}: {response.text}")
                return self._generate_deterministic_explanation(context_data, prompt_focus)

        except Exception as exc:
            logger.error(f"Error calling Gemini API: {exc}")
            return self._generate_deterministic_explanation(context_data, prompt_focus)

    def _generate_deterministic_explanation(self, context_data: Dict[str, Any], prompt_focus: Optional[str]) -> Dict[str, Any]:
        """Fallback rule-based explanation strictly citing available dataset numbers."""
        overview = context_data.get("overview", {})
        ai_impact = context_data.get("ai_impact", {}).get("summary", {})
        ml_res = context_data.get("ml_insights", {})
        tools = context_data.get("ai_tools", {}).get("tools", [])

        total_prs = overview.get("total_prs", 0)
        merged_prs = overview.get("merged_prs", 0)
        merge_rate = overview.get("merge_rate", 0.0)
        ai_prs = overview.get("ai_assisted_prs", 0)
        ai_pct = overview.get("ai_assisted_pct", 0.0)
        avg_cycle = overview.get("avg_cycle_time_hours", 0.0)
        avg_review = overview.get("avg_review_time_hours", 0.0)

        tool_summary_lines = []
        for t in tools[:4]:
            tool_summary_lines.append(f"- **{t.get('agent')}**: {t.get('pr_count')} PRs ({t.get('pr_percentage')}%), {t.get('merge_rate')}% merge rate, {t.get('avg_cycle_time_hours')}h avg cycle time")

        tools_block = "\n".join(tool_summary_lines) if tool_summary_lines else "- No specific tool breakdown available."

        clusters = ml_res.get("clusters", [])
        cluster_lines = []
        for c in clusters:
            c_name = c.get("name", "Cluster")
            c_devs = c.get("developer_count", 0)
            c_pct = c.get("percentage_of_total", 0.0)
            c_cents = c.get("centroids", {})
            cluster_lines.append(f"- **{c_name}**: {c_devs} developers ({c_pct}%). Centroids: {c_cents.get('avg_pr_count')} PRs/dev, {c_cents.get('avg_merge_rate_pct')}% merge rate, {c_cents.get('avg_cycle_time_hours')}h cycle time.")

        clusters_block = "\n".join(cluster_lines) if cluster_lines else "- Insufficient developer profiles for clustering."

        text = f"""### Summary of Observed Metrics
*Observed association — not causal evidence.*

- **Dataset Volume**: Analyzed {total_prs:,} total pull requests across {overview.get('total_repos', 0):,} repositories and {overview.get('total_developers', 0):,} developers.
- **Merge Performance**: {merged_prs:,} merged pull requests ({merge_rate}% merge rate).
- **AI-Assisted PRs**: {ai_prs:,} PRs ({ai_pct}% of total dataset) contain AI agent metadata.
- **Turnaround Timing**: Average cycle time is {avg_cycle} hours (median: {overview.get('median_cycle_time_hours', 0.0)}h); average first-review turnaround is {avg_review} hours.

### AI Agent Telemetry Breakdown
{tools_block}

### Unsupervised ML Workflow Segmentation (K-Means)
{clusters_block}

### Contextual Observations
1. **Tool Distribution**: The dataset reflects specific AI agent usage across varying repository codebases without prescriptive ranking.
2. **Review Dynamics**: First-review timing and merged acceptance vary according to team review workflows and repository branch policies.
3. **Observational Note**: Variations between agent cycle times and merge rates reflect observed repository context and complexity differences, rather than isolated tool efficacy.
"""
        return {
            "source": "deterministic_grounded_engine",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "explanation": text,
            "grounding_status": "Strictly grounded on input telemetry"
        }


gemini_service = GeminiService()
