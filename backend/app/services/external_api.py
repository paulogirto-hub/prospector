"""
Prospector API — External APIs Service

Handles all calls to Serper, BrasilAPI, and AI provider.
Follows AI-09 (Provider Gateway with circuit breaker, retry, fallback).
"""
import re
import time
import requests as http_requests
from app.config.settings import (
    SERPER_KEY, OLLAMA_KEY, OLLAMA_BASE, OLLAMA_MODEL, OLLAMA_FALLBACKS,
    BRASIL_API, AI_SYSTEM_PROMPT, AI_TIMEOUT, AI_MAX_TOKENS,
    SERPER_TIMEOUT, BRASIL_API_TIMEOUT,
    CB_FAILURE_THRESHOLD, CB_RECOVERY_TIMEOUT,
)


# ─── Circuit Breaker (AI-09) ───

class CircuitBreaker:
    """Simple circuit breaker for AI provider calls."""
    def __init__(self, failure_threshold=CB_FAILURE_THRESHOLD,
                 recovery_timeout=CB_RECOVERY_TIMEOUT):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failures = 0
        self._state = "closed"  # closed, open, half-open
        self._last_failure_time = 0

    @property
    def state(self):
        if self._state == "open":
            if time.time() - self._last_failure_time > self.recovery_timeout:
                self._state = "half-open"
        return self._state

    def record_success(self):
        self._failures = 0
        self._state = "closed"

    def record_failure(self):
        self._failures += 1
        self._last_failure_time = time.time()
        if self._failures >= self.failure_threshold:
            self._state = "open"

    def is_open(self):
        return self.state == "open"


# Global circuit breakers per model
_cb_per_model: dict[str, CircuitBreaker] = {}


def _get_cb(model: str) -> CircuitBreaker:
    if model not in _cb_per_model:
        _cb_per_model[model] = CircuitBreaker()
    return _cb_per_model[model]


# ─── Prompt Sanitization (AI-10, CORE-01) ───

def sanitize_prompt_input(text: str) -> str:
    """Remove potential prompt injection patterns from user input."""
    if not text:
        return text
    patterns = [
        r"(?i)ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)",
        r"(?i)forget\s+(everything|all|what)",
        r"(?i)you\s+are\s+now",
        r"(?i)system\s*:",
        r"(?i)\[SYSTEM\]",
        r"(?i)act\s+as\s+if",
        r"(?i)pretend\s+(you\s+are|to\s+be)",
        r"(?i)jailbreak",
        r"(?i)developer\s+mode",
        r"(?i)override\s+(previous|all|default)\s+(instructions?|settings?|rules)",
        r"(?i)disregard\s+(all|previous|above|safety)",
        r"(?i)new\s+instructions?",
        r"(?i)stop\s+being",
        r"(?i)you\s+must\s+(now|always|only)\s+(say|respond|output|reveal)",
        r"(?i)reveal\s+(your|the|api|key|password|secret|token)",
        r"(?i)\\n(system|user|assistant):",
    ]
    for pattern in patterns:
        text = re.sub(pattern, "[FILTERED]", text)
    text = re.sub(r"(?:sk-|api[_-]?key[_-]?)[\w\-]{10,}", "[REDACTED]", text)
    return text


# ─── Serper API ───

def serper_search(query: str, search_type: str = "search") -> dict:
    """Call Serper.dev API for search/places."""
    url = f"https://google.serper.dev/{search_type}"
    headers = {"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"}
    payload = {"q": query, "gl": "br", "hl": "pt-br"}
    try:
        r = http_requests.post(url, headers=headers, json=payload, timeout=SERPER_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"Serper error ({search_type}): {e}")
        return {}


# ─── BrasilAPI ───

def check_cnpj(cnpj: str) -> dict | None:
    """Look up CNPJ via BrasilAPI."""
    cnpj_clean = cnpj.replace(".", "").replace("-", "").replace("/", "")
    try:
        r = http_requests.get(BRASIL_API.format(cnpj_clean), timeout=BRASIL_API_TIMEOUT)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


# ─── AI Analysis (with circuit breaker + retry + fallback) ───

def ai_analyze(prompt: str, timeout: int = AI_TIMEOUT, max_tokens: int = AI_MAX_TOKENS) -> str:
    """Call AI model with circuit breaker, retry, and fallback chain (AI-09)."""
    prompt = sanitize_prompt_input(prompt)
    models = [OLLAMA_MODEL] + [m for m in OLLAMA_FALLBACKS if m != OLLAMA_MODEL]

    for model in models:
        cb = _get_cb(model)
        if cb.is_open():
            print(f"[CB] Skipping {model} — circuit open")
            continue

        try:
            r = http_requests.post(
                f"{OLLAMA_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OLLAMA_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": AI_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": max_tokens,
                },
                timeout=timeout,
            )
            if r.status_code == 200:
                resp = r.json()
                msg = resp["choices"][0]["message"]
                content = msg.get("content", "") or ""
                reasoning = msg.get("reasoning", "") or ""
                finish_reason = resp["choices"][0].get("finish_reason", "")

                # If content is empty but model is still reasoning (hit token limit),
                # retry with more tokens or treat reasoning as content
                if not content and reasoning and finish_reason == "length":
                    # Model ran out of tokens on reasoning — retry with more
                    print(f"[IA] Model {model} hit token limit on reasoning, retrying with more tokens")
                    try:
                        r2 = http_requests.post(
                            f"{OLLAMA_BASE}/chat/completions",
                            headers={
                                "Authorization": f"Bearer {OLLAMA_KEY}",
                                "Content-Type": "application/json",
                            },
                            json={
                                "model": model,
                                "messages": [
                                    {"role": "system", "content": AI_SYSTEM_PROMPT},
                                    {"role": "user", "content": prompt},
                                ],
                                "temperature": 0.7,
                                "max_tokens": max_tokens * 2,
                            },
                            timeout=timeout + 30,
                        )
                        if r2.status_code == 200:
                            resp2 = r2.json()
                            content = resp2["choices"][0]["message"].get("content", "") or ""
                            finish_reason = resp2["choices"][0].get("finish_reason", "")
                    except Exception as e2:
                        print(f"[IA] Retry failed: {e2}")

                # If content is still empty after retry, construct from reasoning
                if not content and reasoning:
                    content = reasoning

                if content and len(content) > 20:
                    print(f"[IA] Model {model} OK ({len(content)} chars)")
                    cb.record_success()
                    return content

            print(f"Ollama {model} error: {r.status_code} {r.text[:100]}")
            cb.record_failure()
        except Exception as e:
            print(f"Ollama {model} error: {e}")
            cb.record_failure()

    return "IA temporariamente indisponível. Dados cadastrais e score foram calculados normalmente."


def parse_json_from_ia(raw_text: str) -> dict | list | None:
    """Parse JSON from IA response, handling markdown code blocks and truncated JSON."""
    if isinstance(raw_text, dict):
        return raw_text
    raw = raw_text.strip()

    # Direct JSON
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        pass

    # Markdown code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass

    # Regex JSON object
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            # Try to fix truncated JSON by closing open brackets/braces
            fixed = _fix_truncated_json(json_str)
            if fixed:
                try:
                    return json.loads(fixed)
                except (json.JSONDecodeError, ValueError):
                    pass

    # Regex JSON array
    match = re.search(r"\[[\s\S]*\]", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass

    # Last resort: find the FIRST { in the text and try from there
    first_brace = raw.find('{')
    if first_brace >= 0:
        candidate = raw[first_brace:]
        # Try direct
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            pass
        # Try fixing truncated
        fixed = _fix_truncated_json(candidate)
        if fixed:
            try:
                return json.loads(fixed)
            except (json.JSONDecodeError, ValueError):
                pass

    return None


def _fix_truncated_json(s: str) -> str | None:
    """Attempt to fix truncated JSON by closing open strings, brackets, and braces."""
    if not s:
        return None
    s = s.rstrip().rstrip(',')
    # If it ends with a complete value, just close open structures
    open_braces = s.count('{') - s.count('}')
    open_brackets = s.count('[') - s.count(']')
    # Check for unclosed string
    in_string = False
    escape_next = False
    for ch in s:
        if escape_next:
            escape_next = False
            continue
        if ch == '\\':
            if in_string:
                escape_next = True
            continue
        if ch == '"' and not escape_next:
            in_string = not in_string
    if in_string:
        s += '"'
    # Close open arrays and objects
    s += ']' * max(0, open_brackets)
    s += '}' * max(0, open_braces)
    return s


# Need json import
import json