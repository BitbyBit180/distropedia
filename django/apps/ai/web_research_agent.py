"""WEB RESEARCH sub-agent — recalls known fixes for the user's Linux problem
from model knowledge (official docs, wikis, StackExchange patterns).
Best-effort: NEVER raises — on any failure it returns empty findings so the
chat pipeline keeps working without it. (Groq has no search-grounding
tool, so live web sources come from the Reddit digest instead.)"""

from apps.ai.groq_client import chat_completion, to_messages

SYSTEM_INSTRUCTION = "You are the WEB RESEARCH sub-agent of DistroPedia Assistant. Your job is ONLY to recall known solutions for the user's Linux problem (official docs, wikis, StackExchange patterns). Do not greet or converse. Return concise structured findings: (a) the most likely cause(s), (b) 2-4 viable fixes as short markdown bullets each with commands in fenced code blocks. Be dense and factual."


def run_web_research(question, history=()):
    try:
        result = chat_completion(
            system=SYSTEM_INSTRUCTION,
            messages=[*to_messages(history), {"role": "user", "content": question}],
            temperature=0.3,
            max_tokens=1024,
            timeout_ms=20000,  # self-capped so the chat never hangs on research
        )
        return {"findings": result["text"], "sources": [], "usage": result["usage"]}
    except Exception:
        # Research is best-effort — must never break the chat.
        return {"findings": "", "sources": [], "usage": None}
