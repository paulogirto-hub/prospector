"""
Prospector API — Rate Limiting Middleware (CORE-01, BACK-05)

Simple in-memory rate limiter using a sliding window approach.
"""
import time
from threading import Lock
from flask import request, jsonify
from app.models.errors import RateLimitError


class RateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self):
        self._windows: dict[str, list[float]] = {}
        self._lock = Lock()

    def check(self, key: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit. Returns True if allowed."""
        now = time.time()
        with self._lock:
            if key not in self._windows:
                self._windows[key] = []

            # Remove expired entries
            self._windows[key] = [t for t in self._windows[key] if now - t < window]

            if len(self._windows[key]) >= limit:
                return False

            self._windows[key].append(now)
            return True

    def get_retry_after(self, key: str, window: int) -> int:
        """Get seconds until the oldest request in window expires."""
        now = time.time()
        with self._lock:
            if key not in self._windows or not self._windows[key]:
                return 0
            oldest = min(self._windows[key])
            return max(0, int(window - (now - oldest)))


# Global limiter instance
limiter = RateLimiter()


def rate_limit(limit: int, window: int, key_func=None):
    """Flask route decorator for rate limiting.

    Args:
        limit: Max requests per window
        window: Window in seconds
        key_func: Function to derive key from request (default: IP)
    """
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def wrapped(*args, **kwargs):
            if key_func:
                key = key_func()
            else:
                key = f"rl:{request.remote_addr or 'unknown'}:{f.__name__}"

            if not limiter.check(key, limit, window):
                retry_after = limiter.get_retry_after(key, window)
                err = RateLimitError(retry_after=retry_after)
                return jsonify(err.to_dict()), err.status

            return f(*args, **kwargs)
        return wrapped
    return decorator