"""
Prospector API — Persistence Service

Handles JSON file-based storage for search data.
Follows CORE-03 (separation of concerns).
"""
import os
import json
from app.config.settings import DATA_DIR


def _path(search_id: str) -> str:
    """Get file path for a search ID."""
    return os.path.join(DATA_DIR, f"{search_id}.json")


def load_search(search_id: str) -> dict | None:
    """Load search data from disk."""
    fp = _path(search_id)
    if os.path.exists(fp):
        with open(fp, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_search(search_id: str, data: dict) -> None:
    """Save search data to disk."""
    fp = _path(search_id)
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def delete_search_file(search_id: str) -> bool:
    """Delete search data file. Returns True if deleted, False if not found."""
    fp = _path(search_id)
    if os.path.exists(fp):
        os.remove(fp)
        return True
    return False


def list_searches() -> list[dict]:
    """List all searches (summary only)."""
    searches = []
    for fname in sorted(os.listdir(DATA_DIR), reverse=True):
        if fname.endswith(".json"):
            try:
                fp = os.path.join(DATA_DIR, fname)
                with open(fp, "r", encoding="utf-8") as f:
                    d = json.load(f)
                    s = d.get("summary", {})
                    s["status"] = d.get("status", "unknown")
                    s.setdefault("timestamp", d.get("timestamp", "") or "")
                    # Ensure summary has all required fields
                    leads = d.get("leads", [])
                    total = s.get("total_results", len(leads))
                    s.setdefault("total_results", total)
                    s.setdefault("com_site", sum(1 for l in leads if l.get("tem_site")))
                    s.setdefault("sem_site", total - s["com_site"])
                    s.setdefault("pct_sem_site", round((total - s["com_site"]) / total * 100) if total else 0)
                    s.setdefault("com_instagram", sum(1 for l in leads if l.get("tem_instagram")))
                    s.setdefault("sem_instagram", total - s["com_instagram"])
                    s.setdefault("pct_sem_instagram", round((total - s["com_instagram"]) / total * 100) if total else 0)
                    s.setdefault("com_ads", sum(1 for l in leads if l.get("tem_ads")))
                    s.setdefault("com_maps", sum(1 for l in leads if l.get("tem_maps")))
                    s.setdefault("com_cnpj", sum(1 for l in leads if l.get("cnpj")))
                    s.setdefault("com_site_email", sum(1 for l in leads if l.get("site_emails")))
                    s.setdefault("com_site_phone", sum(1 for l in leads if l.get("site_phones")))
                    s.setdefault("com_youtube", sum(1 for l in leads if l.get("site_youtube")))
                    s.setdefault("com_tiktok", sum(1 for l in leads if l.get("site_tiktok")))
                    s.setdefault("analyzed_count", 0)
                    s.setdefault("total_to_analyze", 0)
                    searches.append(s)
            except Exception:
                pass
    return searches


def set_status(data: dict, status: str) -> dict:
    """Set status at both root and summary level."""
    data["status"] = status
    if "summary" in data:
        data["summary"]["status"] = status
    return data