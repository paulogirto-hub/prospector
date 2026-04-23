"""
Prospector API — Web Scraping Service

Handles website fetching, email/phone/social/CNPJ extraction.
Follows BACK-05 (input sanitization) and AI-10 (safe data handling).
"""
import re
import requests as http_requests
from bs4 import BeautifulSoup
from app.config.settings import SITE_FETCH_TIMEOUT
from app.services.external_api import serper_search


# ─── Email blacklists ───

EMAIL_BLACKLIST_DOMAINS = [
    "sentry.io", "sentry.wixpress.com", "wixpress.com",
    "sentry-next.wixpress.com", "stats.wp.com", "pixel.wp.com",
    "analytics.google.com", "googletagmanager.com",
    "facebook.com", "mc.android.com", "mc.ios.com",
    "mailerlite.com", "mailchimp.com", "cdn.mxpnl.com",
    "hubspot.com", "zendesk.com", "intercom.io",
    "hotjar.com", "clam.brave.com",
    "example.com", "email.com", "domain.com", "yourdomain.com",
    "sitedojeito.com", "locaweb.com.br", "kinghost.net",
]

EMAIL_BLACKLIST_PREFIXES = [
    "noreply", "no-reply", "noreply_", "newsletter",
    "postmaster", "webmaster",
]


def _is_valid_email(email: str, site_domain: str = "") -> bool:
    """Check if an email is a real business contact email."""
    email_lower = email.lower().strip()
    local_part = email_lower.split("@")[0]
    domain_part = email_lower.split("@")[-1] if "@" in email_lower else ""

    if len(local_part) > 32:
        return False
    for bd in EMAIL_BLACKLIST_DOMAINS:
        if domain_part == bd or domain_part.endswith("." + bd):
            return False
    for prefix in EMAIL_BLACKLIST_PREFIXES:
        if local_part.startswith(prefix):
            return False
    if local_part == "admin":
        if site_domain and domain_part != site_domain and domain_part != "www." + site_domain:
            return False
    return True


def extract_cnpj(text: str) -> str | None:
    """Extract CNPJ from text."""
    matches = re.findall(r"\d{2}\.?\d{3}\.?\d{3}[/\\]?\d{4}-?\d{2}", text)
    if matches:
        return matches[0].replace(".", "").replace("/", "").replace("-", "")
    matches = re.findall(r"\b\d{14}\b", text)
    return matches[0] if matches else None


def get_domain(url: str) -> str:
    """Extract domain from URL."""
    if not url:
        return ""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        if domain.startswith("www."):
            domain = domain[4:]
        return domain.lower().strip()
    except Exception:
        return ""


def fetch_site_data(url: str, timeout: int = SITE_FETCH_TIMEOUT) -> dict:
    """Fetch a website and extract emails, phones, social links, CNPJ from HTML."""
    result = {
        "emails": [],
        "phones": [],
        "instagram": "",
        "facebook": "",
        "youtube": "",
        "tiktok": "",
        "cnpj": "",
    }
    if not url or not url.startswith("http"):
        return result

    try:
        resp = http_requests.get(
            url,
            timeout=timeout,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            },
            allow_redirects=True,
            verify=False,
        )
        if resp.status_code != 200:
            return result
        html = resp.text
    except Exception as e:
        print(f"  fetch_site_data error ({url}): {e}")
        return result

    # Extract emails
    mailto_emails = re.findall(r'href=["\']mailto:([^"\'\s]+)', html, re.IGNORECASE)
    regex_emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", html)
    all_emails = list(set(mailto_emails + regex_emails))
    site_domain = get_domain(url)
    result["emails"] = [e for e in all_emails if _is_valid_email(e, site_domain)][:5]

    # Extract phones
    phone_patterns = [
        r"\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}",
        r"\d{2}\s*\d{4,5}\s*-\s*\d{4}",
        r'href=["\']tel:([^"\'\s]+)',
    ]
    all_phones = []
    for pat in phone_patterns:
        all_phones.extend(re.findall(pat, html))
    seen_phones = set()
    for p in all_phones:
        cleaned = re.sub(r"[^0-9]", "", p)
        if 10 <= len(cleaned) <= 13 and cleaned not in seen_phones:
            seen_phones.add(cleaned)
            result["phones"].append(p.strip())
    result["phones"] = result["phones"][:3]

    # Extract social links
    soup = BeautifulSoup(html, "html.parser")
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"].lower()
        full_href = a_tag["href"]

        if "instagram.com" in href and not result["instagram"]:
            m = re.search(r"instagram\.com/([a-zA-Z0-9_.]+)", full_href)
            if m and m.group(1) not in ("p", "reel", "explore", "stories"):
                result["instagram"] = f"https://instagram.com/{m.group(1)}"

        if "facebook.com" in href and not result["facebook"]:
            m = re.search(r"facebook\.com/([a-zA-Z0-9_.]+)", full_href)
            if m and m.group(1) not in ("sharer", "sharer.php", "share", "plugins", "login"):
                result["facebook"] = f"https://facebook.com/{m.group(1)}"

        if "youtube.com" in href and not result["youtube"]:
            m = re.search(r"youtube\.com/(c(?:hannel)?/[^?\"\'\s]+)", full_href)
            if m:
                result["youtube"] = f"https://youtube.com/{m.group(1)}"
            else:
                m = re.search(r"youtube\.com/@([a-zA-Z0-9_.]+)", full_href)
                if m:
                    result["youtube"] = f"https://youtube.com/@{m.group(1)}"

        if "tiktok.com" in href and not result["tiktok"]:
            m = re.search(r"tiktok\.com/@([a-zA-Z0-9_.]+)", full_href)
            if m:
                result["tiktok"] = f"https://tiktok.com/@{m.group(1)}"

    # Extract CNPJ from HTML
    cnpj = extract_cnpj(html)
    if cnpj and len(cnpj) >= 14:
        result["cnpj"] = cnpj

    return result


def try_cnpj_from_phone(phone_number: str) -> str | None:
    """Try to find CNPJ via Serper search using phone number."""
    if not phone_number:
        return None
    query = f'"{phone_number}" CNPJ'
    try:
        data = serper_search(query)
        organic = data.get("organic", [])
        for r in organic[:3]:
            combined = f"{r.get('title', '')} {r.get('snippet', '')}"
            cnpj = extract_cnpj(combined)
            if cnpj and len(cnpj) >= 14:
                return cnpj
    except Exception as e:
        print(f"  try_cnpj_from_phone error: {e}")
    return None