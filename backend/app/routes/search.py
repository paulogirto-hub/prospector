"""
Prospector API — Search Routes (BACK-04)

All endpoints related to search creation, retrieval, and deletion.
Maintains backward-compatible response contracts with the original app.py.
"""
import re
import threading

from flask import Blueprint, request

from app.config.settings import DEFAULT_MAX_RESULTS
from app.models.errors import make_success, NotFoundError, ValidationError, AppError
from app.middleware.rate_limit import rate_limit
from app.services.persistence import (
    load_search, save_search, delete_search_file, list_searches, set_status,
)
from app.services.pipeline import (
    run_discovery, run_enrich, run_score, run_analyze_market, run_analyze_leads,
    _get_total_to_analyze,
)
from app.services.external_api import ai_analyze, parse_json_from_ia


search_bp = Blueprint("search", __name__, url_prefix="/api")


# ─── Summary field defaults (backwards compat) ───

SUMMARY_DEFAULTS = {
    "total_results": 0,
    "com_site": 0,
    "sem_site": 0,
    "pct_sem_site": 0,
    "com_instagram": 0,
    "sem_instagram": 0,
    "pct_sem_instagram": 0,
    "com_ads": 0,
    "com_maps": 0,
    "com_cnpj": 0,
    "com_site_email": 0,
    "com_site_phone": 0,
    "com_youtube": 0,
    "com_tiktok": 0,
    "analyzed_count": 0,
    "total_to_analyze": 0,
}

# Fields to flatten from summary to top level for backward compat
FLAT_FIELDS = [
    "niche", "city", "state", "query", "query_variations",
    "total_results", "after_filter", "raw_results",
    "com_site", "sem_site", "pct_sem_site",
    "com_instagram", "sem_instagram", "pct_sem_instagram",
    "com_ads", "com_maps", "sem_maps", "com_cnpj",
    "com_site_email", "com_site_phone", "com_tiktok", "com_youtube",
    "queries_done", "queries_total",
    "ia_market_analysis", "analyzed_count", "total_to_analyze",
    "search_id", "timestamp",
]


def _ensure_summary_defaults(data: dict) -> None:
    """Fill in missing summary fields with sensible defaults."""
    s = data.get("summary")
    if not s:
        return
    # If total_results is missing, compute from leads count
    if "total_results" not in s:
        s["total_results"] = len(data.get("leads", []))
    total = s["total_results"]
    leads = data.get("leads", [])
    # Compute from leads if missing
    if "com_site" not in s:
        s["com_site"] = sum(1 for l in leads if l.get("tem_site"))
    if "com_instagram" not in s:
        s["com_instagram"] = sum(1 for l in leads if l.get("tem_instagram"))
    if "com_maps" not in s:
        s["com_maps"] = sum(1 for l in leads if l.get("tem_maps"))
    if "com_ads" not in s:
        s["com_ads"] = sum(1 for l in leads if l.get("tem_ads"))
    if "com_cnpj" not in s:
        s["com_cnpj"] = sum(1 for l in leads if l.get("cnpj"))
    if "sem_site" not in s:
        s["sem_site"] = total - s["com_site"]
    if "pct_sem_site" not in s:
        s["pct_sem_site"] = round((total - s["com_site"]) / total * 100) if total else 0
    if "sem_instagram" not in s:
        s["sem_instagram"] = total - s["com_instagram"]
    if "pct_sem_instagram" not in s:
        s["pct_sem_instagram"] = round((total - s["com_instagram"]) / total * 100) if total else 0
    # Enrichment-derived fields (default to 0 if not computed yet)
    if "com_site_email" not in s:
        s["com_site_email"] = sum(1 for l in leads if l.get("site_emails"))
    if "com_site_phone" not in s:
        s["com_site_phone"] = sum(1 for l in leads if l.get("site_phones"))
    if "com_youtube" not in s:
        s["com_youtube"] = sum(1 for l in leads if l.get("site_youtube"))
    if "com_tiktok" not in s:
        s["com_tiktok"] = sum(1 for l in leads if l.get("site_tiktok"))
    # Analysis fields
    if "analyzed_count" not in s:
        s["analyzed_count"] = 0
    if "total_to_analyze" not in s:
        s["total_to_analyze"] = 0

def _flatten_summary(data: dict) -> None:
    """Flatten summary fields to top level for backward compatibility.
    
    The original app.py returned search data with niche, city, total_results
    etc. at the top level. The JSON files store them inside summary.
    The frontend expects flat fields like data.niche, data.city.
    """
    summary = data.get("summary", {})
    for field in FLAT_FIELDS:
        if field in summary and field not in data:
            data[field] = summary[field]



# ═══════════════════════════════════════════════════
# STEP 1: Discovery
# ═══════════════════════════════════════════════════

@search_bp.route("/search", methods=["POST"])
@rate_limit(limit=10, window=60)
def create_search():
    """Create a new search — starts discovery pipeline in background."""
    try:
        body = request.get_json(force=True, silent=True) or {}
    except Exception:
        raise ValidationError("Invalid JSON body")

    niche = body.get("niche", "").strip()
    city = body.get("city", "").strip()
    state = body.get("state", "PR").strip()
    max_results = body.get("max_results", DEFAULT_MAX_RESULTS)

    if not niche or not city:
        raise ValidationError("Fields 'niche' and 'city' are required")

    try:
        max_results = int(max_results)
        if max_results < 1 or max_results > 200:
            raise ValueError()
    except (ValueError, TypeError):
        raise ValidationError("max_results must be between 1 and 200")

    # Sanitize
    niche = re.sub(r"<[^>]*>", "", niche)[:200]
    city = re.sub(r"<[^>]*>", "", city)[:200]
    state = re.sub(r"<[^>]*>", "", state).upper()[:2]

    import uuid
    import time
    search_id = str(uuid.uuid4())[:8]

    # Save initial state so frontend can poll
    save_search(search_id, {
        "status": "discovering",
        "summary": {
            "search_id": search_id,
            "niche": niche,
            "city": city,
            "state": state,
            "query": f"{niche} {city} {state}",
            "queries_total": 0,
            "queries_done": 0,
            "current_query": "Iniciando...",
            "total_results": 0,
            "com_site": 0,
            "sem_site": 0,
            "pct_sem_site": 0,
            "com_instagram": 0,
            "com_ads": 0,
            "com_maps": 0,
            "com_cnpj": 0,
        },
        "leads": [],
    })

    # Run discovery in background thread
    def _run():
        try:
            run_discovery(niche, city, state, max_results, search_id=search_id)
        except Exception as e:
            print(f"[DISCOVERY ERROR] {e}")
            try:
                data = load_search(search_id)
                if data:
                    set_status(data, "error")
                    data["error"] = str(e)
                    save_search(search_id, data)
            except Exception:
                pass

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return make_success(data={"search_id": search_id, "status": "discovering"}), 202


# ═══════════════════════════════════════════════════
# GET / POST endpoints
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>", methods=["GET"])
def get_search(search_id):
    """Get current search state and results.
    
    Flattens summary fields to top level for backward compatibility
    with the original app.py API contract (frontend expects flat fields).
    """
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    # Migrate legacy field on read
    if data.get("summary", {}).get("ia_analysis") and not data["summary"].get("ia_market_analysis"):
        data["summary"]["ia_market_analysis"] = data["summary"].pop("ia_analysis")

    # Ensure summary has all required fields (backwards compat for old/incomplete data)
    _ensure_summary_defaults(data)

    # Flatten summary fields to top level for backward compat
    _flatten_summary(data)

    return make_success(data=data)


@search_bp.route("/search/<search_id>", methods=["DELETE"])
def delete_search(search_id):
    """Delete a search and its data file."""
    if not delete_search_file(search_id):
        raise NotFoundError("Search", search_id)
    return make_success(data={"deleted": search_id})


@search_bp.route("/history", methods=["GET"])
def get_history():
    """List all searches (summary only)."""
    searches = list_searches()
    return make_success(data=searches)


# ═══════════════════════════════════════════════════
# STEP 1b: Rediscover
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/rediscover", methods=["POST"])
def rediscover_search(search_id):
    """Re-run discovery: new Serper searches, merge with existing leads preserving enriched data."""
    from app.services.pipeline import _merge_lead
    from app.services.scraper import get_domain
    from app.services.pipeline import fuzzy_similarity

    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    s = data.get("summary", {})
    niche = s.get("niche", "")
    city = s.get("city", "")
    state = s.get("state", "PR")

    if not niche or not city:
        raise ValidationError("Missing niche or city in search data")

    # Save existing leads for merging
    existing_leads = data.get("leads", [])

    def _run():
        try:
            new_data = run_discovery(niche, city, state, search_id=search_id)
            if new_data:
                new_leads = new_data.get("leads", [])
                for new_lead in new_leads:
                    for existing in existing_leads:
                        new_domain = get_domain(new_lead.get("link", ""))
                        old_domain = get_domain(existing.get("link", ""))
                        is_match = False
                        if new_domain and old_domain and new_domain == old_domain:
                            is_match = True
                        elif fuzzy_similarity(new_lead.get("title", ""), existing.get("title", "")) >= 0.7:
                            is_match = True
                        if is_match:
                            _merge_lead(new_lead, existing)
                            for key in (
                                "cnpj", "razao_social", "situacao", "capital_social", "data_inicio",
                                "opcao_pelo_mei", "opcao_pelo_simples", "cnae_descricao", "natureza_juridica",
                                "porte", "email_receita", "telefone_receita", "socios", "diagnostico",
                                "diagnosis_status", "ia_analise", "score",
                            ):
                                if existing.get(key) and not new_lead.get(key):
                                    new_lead[key] = existing[key]
                            break
                new_data["leads"] = new_leads
                save_search(search_id, new_data)
        except Exception as e:
            print(f"[REDISCOVERY ERROR] {e}")
            try:
                data_err = load_search(search_id)
                if data_err:
                    set_status(data_err, "error")
                    data_err["error"] = str(e)
                    save_search(search_id, data_err)
            except Exception:
                pass

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return make_success(data={"search_id": search_id, "status": "discovering"}), 202


# ═══════════════════════════════════════════════════
# STEP 2: Enrich
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/enrich", methods=["POST"])
@rate_limit(limit=5, window=60)
def enrich_search(search_id):
    """Enrich search results (CNPJ lookup + website scraping)."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    # Allow re-enrichment
    if data["status"] in ("enriched", "scored", "market_analyzed", "analyzed", "analyzing_leads"):
        for lead in data.get("leads", []):
            lead["enrichment_status"] = "pending"

    # If already enriching, return progress
    if data["status"] == "enriching":
        enriched = sum(1 for l in data.get("leads", []) if l.get("enrichment_status", "pending") != "pending")
        total = len(data.get("leads", []))
        return make_success(data={
            "search_id": search_id, "status": "enriching",
            "progress": f"{enriched}/{total}",
        })

    def _run():
        try:
            run_enrich(search_id)
        except Exception as e:
            print(f"[ENRICH ERROR] {e}")
            try:
                data_err = load_search(search_id)
                if data_err:
                    set_status(data_err, "error")
                    data_err["error"] = str(e)
                    save_search(search_id, data_err)
            except Exception:
                pass

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return make_success(data={
        "search_id": search_id, "status": "enriching",
        "progress": "0/" + str(len(data.get("leads", []))),
    }), 202


# ═══════════════════════════════════════════════════
# STEP 3: Score
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/score", methods=["POST"])
def score_search(search_id):
    """Score all leads in a search."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    result = run_score(search_id)
    if not result:
        raise NotFoundError("Search", search_id)

    _ensure_summary_defaults(result)
    _flatten_summary(result)
    return make_success(data=result)


# ═══════════════════════════════════════════════════
# STEP 4: Market Analysis (IA)
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/analyze-market", methods=["POST"])
@rate_limit(limit=5, window=60)
def analyze_market(search_id):
    """Run market analysis with AI."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    def _run():
        try:
            run_analyze_market(search_id)
        except Exception as e:
            print(f"[ANALYZE MARKET ERROR] {e}")
            try:
                data_err = load_search(search_id)
                if data_err:
                    set_status(data_err, "error")
                    data_err["error"] = str(e)
                    save_search(search_id, data_err)
            except Exception:
                pass

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return make_success(data={"search_id": search_id, "status": "analyzing_market"}), 202


# ═══════════════════════════════════════════════════
# STEP 5: Lead Analysis (IA, incremental)
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/analyze-leads", methods=["POST"])
@rate_limit(limit=5, window=60)
def analyze_leads(search_id):
    """Run lead analysis with AI (incremental). ?count=N or ?all=true."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    # Determine count
    count = 1
    if request.args.get("all") == "true":
        total_to_analyze = _get_total_to_analyze(data["leads"])
        analyzed = sum(1 for l in data["leads"][:total_to_analyze] if l.get("ia_analise"))
        count = total_to_analyze - analyzed
    elif request.args.get("count"):
        try:
            count = int(request.args["count"])
        except ValueError:
            count = 1
    elif request.is_json:
        body = request.get_json(force=True, silent=True) or {}
        count = body.get("count", 1)

    count = max(1, min(count, 50))

    if count > 1:
        def _run():
            try:
                run_analyze_leads(search_id, count=count)
            except Exception as e:
                print(f"[ANALYZE LEADS ERROR] {e}")

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        s = data.get("summary", {})
        _ensure_summary_defaults(data)
        return make_success(data={
            "search_id": search_id,
            "status": "analyzing_leads",
            "analyzed_count": s.get("analyzed_count", 0),
            "total_to_analyze": s.get("total_to_analyze", _get_total_to_analyze(data["leads"])),
        }), 202
    else:
        result = run_analyze_leads(search_id, count=1)
        if not result:
            raise NotFoundError("Search", search_id)
        _ensure_summary_defaults(result)
        _flatten_summary(result)
        return make_success(data=result)


# ═══════════════════════════════════════════════════
# Legacy: analyze (market + leads)
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/analyze", methods=["POST"])
@rate_limit(limit=5, window=60)
def analyze_search(search_id):
    """Legacy endpoint — runs market analysis then lead analysis."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    def _run():
        try:
            run_analyze_market(search_id)
            run_analyze_leads(search_id, count=999)
        except Exception as e:
            print(f"[ANALYZE ERROR] {e}")

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return make_success(data={"search_id": search_id, "status": "analyzing"}), 202


# ═══════════════════════════════════════════════════
# Lead CRUD
# ═══════════════════════════════════════════════════

ALLOWED_LEAD_FIELDS = [
    "title", "snippet", "site_url", "instagram_url", "facebook_url",
    "maps_phone", "maps_rating", "maps_reviews", "maps_website",
    "site_emails", "site_phones", "site_instagram", "site_facebook",
    "site_youtube", "site_tiktok", "cnpj", "cnpj_source",
    "razao_social", "situacao", "capital_social", "porte",
    "cnae_descricao", "data_inicio", "opcao_pelo_mei", "score",
    "tem_site", "tem_instagram", "tem_facebook", "tem_maps", "tem_ads",
    "email_receita", "telefone_receita", "notes",
]


@search_bp.route("/search/<search_id>/lead/<lead_id>", methods=["GET"])
def get_lead(search_id, lead_id):
    """Get full data for a specific lead including diagnosis and IA analysis."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    lead = None
    for l in data.get("leads", []):
        if l.get("id") == lead_id:
            lead = l
            break

    if not lead:
        raise NotFoundError("Lead", lead_id)

    result = dict(lead)
    result["search_summary"] = {
        "niche": data["summary"].get("niche", ""),
        "city": data["summary"].get("city", ""),
        "state": data["summary"].get("state", ""),
        "total_results": data["summary"].get("total_results", 0),
        "pct_sem_site": data["summary"].get("pct_sem_site", 0),
        "pct_sem_instagram": data["summary"].get("pct_sem_instagram", 0),
        "com_site": data["summary"].get("com_site", 0),
        "com_instagram": data["summary"].get("com_instagram", 0),
    }
    return make_success(data=result)


@search_bp.route("/search/<search_id>/lead/<lead_id>", methods=["PUT"])
def update_lead(search_id, lead_id):
    """Update a lead's fields (partial update)."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    lead = None
    for l in data.get("leads", []):
        if l.get("id") == lead_id:
            lead = l
            break

    if not lead:
        raise NotFoundError("Lead", lead_id)

    updates = request.get_json(force=True, silent=True) or {}
    for key, value in updates.items():
        if key in ALLOWED_LEAD_FIELDS:
            lead[key] = value

    # Recalculate derived fields
    if "site_url" in updates:
        lead["tem_site"] = bool(lead.get("site_url"))
    if "instagram_url" in updates:
        lead["tem_instagram"] = bool(lead.get("instagram_url"))

    save_search(search_id, data)
    return make_success(data=lead)


@search_bp.route("/search/<search_id>/lead/<lead_id>", methods=["DELETE"])
def delete_lead(search_id, lead_id):
    """Remove a lead from the search."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    leads = data.get("leads", [])
    original_len = len(leads)
    data["leads"] = [l for l in leads if l.get("id") != lead_id]

    if len(data["leads"]) == original_len:
        raise NotFoundError("Lead", lead_id)

    # Update summary counts
    data["summary"]["total_results"] = len(data["leads"])
    data["summary"]["com_site"] = sum(1 for l in data["leads"] if l.get("tem_site"))
    data["summary"]["sem_site"] = sum(1 for l in data["leads"] if not l.get("tem_site"))
    data["summary"]["com_instagram"] = sum(1 for l in data["leads"] if l.get("tem_instagram"))
    data["summary"]["com_maps"] = sum(1 for l in data["leads"] if l.get("tem_maps"))
    data["summary"]["com_ads"] = sum(1 for l in data["leads"] if l.get("tem_ads"))
    data["summary"]["com_cnpj"] = sum(1 for l in data["leads"] if l.get("cnpj"))
    data["summary"]["com_site_email"] = sum(1 for l in data["leads"] if l.get("site_emails"))
    data["summary"]["com_site_phone"] = sum(1 for l in data["leads"] if l.get("site_phones"))
    data["summary"]["com_youtube"] = sum(1 for l in data["leads"] if l.get("site_youtube"))
    data["summary"]["com_tiktok"] = sum(1 for l in data["leads"] if l.get("site_tiktok"))
    data["summary"]["pct_sem_site"] = round(
        data["summary"]["sem_site"] / max(1, len(data["leads"])) * 100
    )
    data["summary"]["pct_sem_instagram"] = round(
        (len(data["leads"]) - data["summary"]["com_instagram"]) / max(1, len(data["leads"])) * 100
    )
    if "analyzed_count" in data["summary"]:
        total_to_analyze = _get_total_to_analyze(data["leads"])
        data["summary"]["total_to_analyze"] = total_to_analyze
        data["summary"]["analyzed_count"] = sum(
            1 for l in data["leads"][:total_to_analyze] if l.get("ia_analise")
        )

    save_search(search_id, data)
    return make_success(data={"deleted": lead_id})


# ═══════════════════════════════════════════════════
# Lead Analysis edit
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/lead/<lead_id>/analysis", methods=["PUT"])
def edit_analysis(search_id, lead_id):
    """Edit a lead's IA analysis text manually."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    lead = None
    for l in data.get("leads", []):
        if l.get("id") == lead_id:
            lead = l
            break

    if not lead:
        raise NotFoundError("Lead", lead_id)

    body = request.get_json(force=True, silent=True) or {}
    new_text = body.get("ia_analise", "")
    if not new_text:
        raise ValidationError("ia_analise is required")

    lead["ia_analise"] = new_text
    save_search(search_id, data)
    return make_success(data=lead)


# ═══════════════════════════════════════════════════
# Re-analyze a specific lead by index
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/analyze-leads/<int:lead_index>", methods=["POST"])
def reanalyze_lead(search_id, lead_index):
    """Re-analyze a specific lead by index (0-based). Overwrites ia_analise."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    leads = data.get("leads", [])
    if lead_index < 0 or lead_index >= len(leads):
        raise ValidationError(f"Lead index {lead_index} out of range (0-{len(leads)-1})")

    lead = leads[lead_index]
    s = data["summary"]
    total = s.get("total_results", len(leads))
    com_site = s.get("com_site", 0)
    com_insta = s.get("com_instagram", 0)

    lead_site_url = lead.get("site_url") or lead.get("maps_website") or "Não possui"
    lead_instagram = lead.get("instagram_url") or lead.get("site_instagram") or "Não possui"
    lead_facebook = lead.get("facebook_url") or lead.get("site_facebook") or "Não possui"
    lead_maps = (
        f"{lead.get('maps_rating', '-')} estrelas ({lead.get('maps_reviews', '-')} avaliações)"
        if lead.get("tem_maps") else "Não possui"
    )
    lead_phone = (
        lead.get("maps_phone") or
        (", ".join(lead.get("site_phones", [])) if lead.get("site_phones") else None) or
        "Não encontrado"
    )
    lead_cnpj = lead.get("cnpj") or "Não encontrado"

    lead_prompt = f"""Descreva esta empresa de forma CLARA e INFORMATIVA — visão geral, não proposta de vendas.

EMPRESA: {lead.get('title')}
- Site: {lead_site_url}
- Instagram: {lead_instagram}
- Facebook: {lead_facebook}
- Google Maps: {lead_maps}
- Telefone: {lead_phone}
- CNPJ: {lead_cnpj}
- Score presença digital: {lead.get('score', 0)}/100

CONTEXTO DO MERCADO: {s.get('niche', '')} em {s.get('city', '')}/{s.get('state', '')}, {total} empresas, {s.get('pct_sem_site', 0) if s.get('pct_sem_site') else round((total - com_site) / total * 100) if total else 0}% sem site, {s.get('pct_sem_instagram', 0) if s.get('pct_sem_instagram') else round((total - com_insta) / total * 100) if total else 0}% sem Instagram

RESPONDA EM FORMATO JSON:
{{
  "resumo": "2-3 frases descrevendo quem é a empresa e sua situação digital",
  "presenca_digital": "Descrição da presença online (site, redes sociais, Google)",
  "posicao_mercado": "Como se compara aos concorrentes locais",
  "publico_esperado": "Perfil estimado de clientes dessa empresa",
  "observacoes": "Algo relevante notável sobre a empresa"
}}

Responda APENAS com o JSON, sem markdown, sem ```json, sem texto antes ou depois."""

    try:
        ia_lead = ai_analyze(lead_prompt, timeout=90, max_tokens=2000)
        parsed = parse_json_from_ia(ia_lead)
        if parsed and isinstance(parsed, dict):
            lead["ia_analise"] = parsed
        else:
            lead["ia_analise"] = ia_lead
    except Exception as e:
        print(f"  [{search_id}] IA error for lead {lead.get('title')}: {e}")
        lead["ia_analise"] = "⏳ IA indisponível. Tente novamente."

    save_search(search_id, data)
    _ensure_summary_defaults(data)
    _flatten_summary(data)

    return make_success(data=data)

# STEP 6: Diagnosis (IA per lead)
# ═══════════════════════════════════════════════════

@search_bp.route("/search/<search_id>/diagnose/<lead_id>", methods=["POST"])
def diagnose_lead(search_id, lead_id):
    """Generate a full diagnostic for a specific lead using IA."""
    data = load_search(search_id)
    if not data:
        raise NotFoundError("Search", search_id)

    lead = None
    for l in data.get("leads", []):
        if l.get("id") == lead_id:
            lead = l
            break

    if not lead:
        raise NotFoundError("Lead", lead_id)

    s = data["summary"]
    total = s.get("total_results", len(data.get("leads", [])))
    com_site = s.get("com_site", 0)
    com_insta = s.get("com_instagram", 0)

    title = lead.get("title", "")
    site_url = lead.get("site_url") or lead.get("maps_website") or "não possui"
    instagram_url = lead.get("instagram_url") or lead.get("site_instagram") or "não possui"
    facebook_url = lead.get("facebook_url") or lead.get("site_facebook") or "não possui"

    if lead.get("maps_rating"):
        maps_info = f"{lead['maps_rating']} estrelas ({lead.get('maps_reviews', 0)} avaliações)"
    else:
        maps_info = "não possui"

    phone = (
        lead.get("maps_phone") or
        (", ".join(lead.get("site_phones", [])) if lead.get("site_phones") else None) or
        "não encontrado"
    )
    email = (
        (", ".join(lead.get("site_emails", [])) if lead.get("site_emails") else None) or
        lead.get("email_receita") or
        "não encontrado"
    )
    cnpj = lead.get("cnpj") or "não encontrado"
    score = lead.get("score", 0)
    niche = s.get("niche", "")
    city = s.get("city", "")

    pct_sem_site = s.get("pct_sem_site", round((total - com_site) / total * 100) if total else 0)
    pct_sem_instagram = s.get("pct_sem_instagram", round((total - com_insta) / total * 100) if total else 0)

    diagnosis_prompt = f"""Você é um consultor de negócios digital especialista em PROSPECÇÃO B2B. Gere um RELATÓRIO EXECUTIVO DE VENDAS — foco no QUE VENDER e COMO ABRORDAR esta empresa.

EMPRESA: {title}
- Site: {site_url}
- Instagram: {instagram_url}
- Facebook: {facebook_url}
- Google Maps: {maps_info}
- Telefone: {phone}
- Email: {email}
- CNPJ: {cnpj}
- Score presença digital: {score}/100

MERCADO: {niche} em {city}, {total} empresas, {pct_sem_site}% sem site, {pct_sem_instagram}% sem Instagram, 100% sem Google Ads.

RESPONDA EM FORMATO JSON:
{{
  "pontos_fracos": [
    {{"ponto": "descrição do problema", "impacto": "como afeta o negócio", "solucao": "o que vender"}}
  ],
  "pontos_fortes": [
    {{"ponto": "descrição", "como_aproveitar": "como usar a favor"}}
  ],
  "oportunidade_principal": {{
    "servico": "nome do serviço",
    "investimento": "R$ XXX",
    "retorno_esperado": "R$ X.XXX/mês",
    "prazo_resultado": "X semanas"
  }},
  "abordagem_whatsapp": "Mensagem curta e direta pra enviar no WhatsApp (máximo 3 linhas)",
  "urgencia": "alta|media|baixa",
  "razao_urgencia": "Por que é urgente ou não",
  "estimativa_receita": "R$ X.XXX/mês"
}}

Responda APENAS com o JSON, sem markdown, sem ```json, sem texto antes ou depois."""

    try:
                ia_result = ai_analyze(diagnosis_prompt, timeout=180, max_tokens=3000)
    except Exception as e:
        print(f"[{search_id}] Diagnosis IA error for {lead_id}: {e}")
        raise AppError("PROVIDER_UNAVAILABLE", "Diagnóstico temporariamente indisponível", 503)

    diagnosis = parse_json_from_ia(ia_result)

    if not diagnosis or not isinstance(diagnosis, dict):
        print(f"[{search_id}] Diagnosis parse failed for {lead_id}. Raw: {ia_result[:200]}")
        raise AppError("PROVIDER_UNAVAILABLE", "Diagnóstico temporariamente indisponível", 503)

    # Validate required fields
    diagnosis.setdefault("pontos_fracos", [])
    diagnosis.setdefault("pontos_fortes", [])
    diagnosis.setdefault("oportunidade_principal", {})
    diagnosis.setdefault("abordagem_whatsapp", "")
    diagnosis.setdefault("urgencia", "media")
    diagnosis.setdefault("razao_urgencia", "")
    diagnosis.setdefault("estimativa_receita", "")
    # Backward compat
    diagnosis.setdefault("comparacao_concorrencia", "")
    diagnosis.setdefault("oportunidades", [])
    diagnosis.setdefault("urgencia_motivo", diagnosis.get("razao_urgencia", ""))
    diagnosis.setdefault("abordagem_sugerida", diagnosis.get("abordagem_whatsapp", ""))

    # Save diagnosis on lead
    lead["diagnostico"] = diagnosis
    lead["diagnosis_status"] = "done"
    save_search(search_id, data)

    print(f"[{search_id}] Diagnosis done for lead {lead_id} ({title})")
    return make_success(data={"diagnostico": diagnosis, "lead_id": lead_id, "search_id": search_id})