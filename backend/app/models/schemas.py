"""
Prospector API — Pydantic Models (Schemas)

Follows CORE-02 (data modeling) and BACK-04 (API contracts).
Validates all input before processing.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


# ─── Search Schemas ───

class SearchCreate(BaseModel):
    """POST /api/search — create a new search."""
    niche: str = Field(..., min_length=2, max_length=200, description="Nicho de mercado")
    city: str = Field(..., min_length=2, max_length=200, description="Cidade")
    state: str = Field(default="PR", min_length=2, max_length=2, description="Estado (sigla)")
    max_results: int = Field(default=50, ge=1, le=200, description="Máximo de resultados")

    @field_validator("niche", "city")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Campo não pode ser vazio")
        # Remove potential XSS/script injection
        v = re.sub(r"<[^>]*>", "", v)
        return v

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: str) -> str:
        v = v.strip().upper()
        valid_states = {
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
            "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
            "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
        }
        if v not in valid_states:
            raise ValueError(f"Estado inválido: {v}")
        return v


class SearchResponse(BaseModel):
    """Response for search creation."""
    search_id: str
    status: str


class ErrorResponse(BaseModel):
    """Standard error response (BACK-04)."""
    success: bool = False
    error: dict  # {"code": "...", "message": "...", "details": [...]}


# ─── Lead Schemas ───

class LeadUpdate(BaseModel):
    """PUT /api/search/<id>/lead/<id> — partial update."""
    title: Optional[str] = None
    snippet: Optional[str] = None
    site_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    maps_phone: Optional[str] = None
    maps_rating: Optional[float] = None
    maps_reviews: Optional[int] = None
    maps_website: Optional[str] = None
    site_emails: Optional[list[str]] = None
    site_phones: Optional[list[str]] = None
    site_instagram: Optional[str] = None
    site_facebook: Optional[str] = None
    site_youtube: Optional[str] = None
    site_tiktok: Optional[str] = None
    cnpj: Optional[str] = None
    cnpj_source: Optional[str] = None
    razao_social: Optional[str] = None
    situacao: Optional[str] = None
    capital_social: Optional[float] = None
    porte: Optional[str] = None
    cnae_descricao: Optional[str] = None
    score: Optional[int] = None
    tem_site: Optional[bool] = None
    tem_instagram: Optional[bool] = None
    tem_facebook: Optional[bool] = None
    tem_maps: Optional[bool] = None
    tem_ads: Optional[bool] = None
    email_receita: Optional[str] = None
    telefone_receita: Optional[str] = None


class AnalysisUpdate(BaseModel):
    """PUT /api/search/<id>/lead/<id>/analysis — edit IA analysis."""
    ia_analise: str = Field(..., min_length=1, description="Texto da análise IA")


# ─── Health Schema ───

class HealthResponse(BaseModel):
    """GET /api/health"""
    status: str
    model: str
    pipeline: str