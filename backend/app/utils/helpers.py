"""
Prospector API — Utility Functions

Shared helper functions.
"""
import re


def make_response(success: bool, data=None, error=None, meta=None):
    """Build a standardized API response (BACK-04)."""
    resp = {"success": success}
    if success:
        resp["data"] = data
    else:
        resp["error"] = error
    if meta:
        resp["meta"] = meta
    return resp


def truncate(text: str, max_len: int = 200) -> str:
    """Truncate text with ellipsis."""
    if not text:
        return ""
    return text[:max_len] + "..." if len(text) > max_len else text