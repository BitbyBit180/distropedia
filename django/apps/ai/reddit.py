"""Best-effort Reddit search — feeds "battle-tested" community fixes to the AI.
NEVER raises: on any failure (network, timeout, Reddit down) it returns []
so the chat pipeline keeps working without it."""

import re
import threading
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote

import requests

USER_AGENT = "DistroPediaAssistant/1.0 (Linux Distro Hub; AI assistant)"
TOTAL_BUDGET_MS = 8000  # hard cap for the whole search


def _fetch_json(url, timeout_s):
    res = requests.get(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        timeout=timeout_s,
    )
    if not res.ok:
        raise Exception(f"Reddit responded {res.status_code}")
    return res.json()


def _clip(text, max_len):
    return re.sub(r"\s+", " ", str(text or "")).strip()[:max_len]


# Fetch top comments for a single post; returns [] on failure.
def _fetch_top_comments(post_id, timeout_s):
    try:
        data = _fetch_json(
            f"https://www.reddit.com/comments/{post_id}.json?limit=5&sort=top",
            timeout_s,
        )
        listing = data[1] if isinstance(data, list) and len(data) > 1 else None
        children = ((listing or {}).get("data") or {}).get("children") or []
        bodies = []
        for c in children:
            body = ((c or {}).get("data") or {}).get("body") if isinstance(c, dict) else None
            if body:
                bodies.append(body)
        return [_clip(body, 300) for body in bodies[:3]]
    except Exception:
        return []


# GET https://www.reddit.com/search.json?q=<query+linux>&sort=relevance&t=year&limit=8
# Picks up to `limit` text/link posts, enriches up to 3 with top comments.
def search_reddit(query, limit=4):
    def run():
        q = quote(f"{query} linux", safe="")
        data = _fetch_json(
            f"https://www.reddit.com/search.json?q={q}&sort=relevance&t=year&limit=8",
            6.0,
        )

        children = ((data or {}).get("data") or {}).get("children") or []
        posts = []
        for c in children:
            post = c.get("data") if isinstance(c, dict) else None
            if post and not post.get("stickied"):
                posts.append(post)

        picked = posts[:limit]

        # Enrich the first 3 with top comments (in parallel — sequential
        # fetches could burn the whole 8s budget on their own).
        comments_list = [[] for _ in picked]
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = [
                (pool.submit(_fetch_top_comments, post.get("id"), 2.5), i)
                for i, post in enumerate(picked)
                if i < 3
            ]
            for fut, i in futures:
                comments_list[i] = fut.result()

        return [
            {
                "title": _clip(post.get("title"), 200),
                "subreddit": post.get("subreddit") or "",
                "url": "https://www.reddit.com" + (post.get("permalink") or ""),
                "snippet": _clip(post.get("selftext"), 400),
                "topComments": comments_list[i],
            }
            for i, post in enumerate(picked)
        ]

    result = []
    done = threading.Event()

    def worker():
        nonlocal result
        try:
            result = run()
        except Exception:
            result = []  # best-effort source — never break the chat
        done.set()

    # Hard total deadline (mirrors the JS Promise.race): a daemon thread
    # keeps an overrun request from ever blocking or failing the caller.
    threading.Thread(target=worker, daemon=True).start()
    done.wait(TOTAL_BUDGET_MS / 1000.0)
    return result
