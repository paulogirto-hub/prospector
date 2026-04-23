"""
Prospector API — Input Validation Middleware (CORE-01, BACK-05)

Sanitize and validate all inputs to prevent injection attacks.
"""
import re
from flask import request


def sanitize_string(value: str, max_length: int = 500) -> str:
    """Sanitize a string input — strip whitespace, remove HTML tags, limit length."""
    if not isinstance(value, str):
        return str(value)
    value = value.strip()
    # Remove HTML tags
    value = re.sub(r"<[^>]*>", "", value)
    # Remove null bytes
    value = value.replace("\x00", "")
    # Limit length
    if len(value) > max_length:
        value = value[:max_length]
    return value


def sanitize_dict(data: dict, max_depth: int = 5, _depth: int = 0) -> dict:
    """Recursively sanitize all string values in a dict."""
    if _depth > max_depth:
        return data
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_string(value)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value, max_depth, _depth + 1)
        elif isinstance(value, list):
            result[key] = [
                sanitize_string(v) if isinstance(v, str) else v
                for v in value
            ]
        else:
            result[key] = value
    return result