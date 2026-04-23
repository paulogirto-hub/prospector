"""
Prospector API — Health Check Route (BACK-04)

GET /api/health — returns system status and model info.
"""
from flask import Blueprint
from app.config.settings import OLLAMA_MODEL, APP_NAME, APP_VERSION
from app.services.external_api import _get_cb
from app.models.errors import make_success

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint — returns system status."""
    # Check circuit breaker state for primary model
    cb = _get_cb(OLLAMA_MODEL)
    cb_state = cb.state

    pipeline_steps = [
        "discovery", "enriching", "enriched",
        "scoring", "scored",
        "market_analyzed", "analyzing_leads", "analyzed",
    ]

    return make_success(data={
        "status": "ok",
        "model": OLLAMA_MODEL,
        "circuit_breaker": cb_state,
        "version": APP_VERSION,
        "pipeline": pipeline_steps,
    })