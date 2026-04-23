"""
Prospector API — Lead Routes (BACK-04)

CRUD operations for individual leads within a search.

NOTE: The search blueprint (search.py) already registers lead CRUD routes
with full backward-compatible contracts. This file is intentionally kept
minimal — any new lead-specific endpoints should be added here with
distinct URL patterns to avoid shadowing search_bp routes.
"""
from flask import Blueprint

from app.models.errors import make_success


lead_bp = Blueprint("lead", __name__, url_prefix="/api")


# ─── Future lead-specific endpoints go here ───
# Do NOT re-register routes that already exist in search_bp:
#   GET/PUT/DELETE /api/search/<id>/lead/<lid>
#   PUT /api/search/<id>/lead/<lid>/analysis
#   POST /api/search/<id>/analyze-leads/<int>
#   POST /api/search/<id>/diagnose/<lid>
#
# Those are all handled in search.py to avoid Flask route shadowing.