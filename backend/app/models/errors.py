"""
Prospector API — Error Handling (BACK-04, BACK-05, BACK-25)

Standardized error responses following the Meta-Framework.
"""
from flask import jsonify
import traceback


class AppError(Exception):
    """Structured application error with code, message, and HTTP status."""
    def __init__(self, code: str, message: str, status: int = 400, details: list = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.details = details or []

    def to_dict(self):
        return {
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            },
        }


# ─── Pre-defined error classes (BACK-25 catalog pattern) ───

class ValidationError(AppError):
    def __init__(self, message="Validation error", details=None):
        super().__init__("VALIDATION_ERROR", message, 400, details or [])


class NotFoundError(AppError):
    def __init__(self, resource="Resource", resource_id=None):
        msg = f"{resource} not found"
        if resource_id:
            msg = f"{resource} '{resource_id}' not found"
        super().__init__("NOT_FOUND", msg, 404)


class RateLimitError(AppError):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            "RATE_LIMIT_EXCEEDED",
            "Too many requests. Please try again later.",
            429,
            [{"retry_after": retry_after}],
        )


class ProviderUnavailableError(AppError):
    def __init__(self, provider: str = "AI"):
        super().__init__(
            "PROVIDER_UNAVAILABLE",
            f"{provider} provider temporarily unavailable",
            503,
        )


class InternalError(AppError):
    def __init__(self, message="Internal server error"):
        super().__init__("INTERNAL_ERROR", message, 500)


def handle_error(error):
    """Flask error handler — returns standardized JSON."""
    if isinstance(error, AppError):
        return jsonify(error.to_dict()), error.status

    # Unexpected errors — log but don't leak details
    traceback.print_exc()
    return jsonify({
        "success": False,
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "details": [],
        },
    }), 500


def make_success(data, meta=None):
    """Standard success response (BACK-04)."""
    response = {"success": True, "data": data}
    if meta:
        response["meta"] = meta
    return jsonify(response)