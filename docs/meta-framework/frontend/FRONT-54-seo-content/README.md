# FRONT-54 - SEO e Content Strategy

> **Prioridade:** MEDIO
> **Depende de:** FRONT-30, FRONT-53
> **É dependência de:** (nenhum)
> **Categoria:** frontend

## 1. SEO Técnico

### 1.1 Requisitos Técnicos
| Item | Implementação | Prioridade |
|------|-------------|-----------|
| SSR/SSG | Next.js App Router com generateStaticParams | Crítico |
| Meta tags dinâmicas | title, description, og:* por página | Crítico |
| Sitemap.xml | Auto-gerado com todas as páginas públicas | Alto |
| robots.txt | Allow/disallow por ambiente | Alto |
| Canonical URLs | Evitar conteúdo duplicado | Alto |
| Structured data | JSON-LD (Organization, Product, FAQ) | Alto |
| Core Web Vitals | LCP < 2.5s, CLS < 0.1, FID < 100ms | Crítico |
| HTTPS + HSTS | TLS 1.3 | Crítico |
| Mobile-first | Indexação mobile-first | Crítico |

### 1.2 Performance
```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
TTFB (Time to First Byte): < 600ms
```

## 2. Content Strategy

### 2.1 Pilares de Conteúdo
| Pilar | Frequência | Formato | Responsável |
|-------|-----------|---------|-------------|
| Blog | 2x/semana | Artigo 1.500-2.500 palavras | AI + revisão |
| Docs/Guia | Contínuo | Tutorial técnico | Engenharia |
| Casos de uso | 1x/mês | Case study com resultado | Marketing |
| Newsletter | 1x/semana | Curadoria + insight | AI + revisão |
| Vídeo/tutorial | 2x/mês | Loom/YouTube 5-10min | Produto |

### 2.2 Keyword Strategy
| Intenção | Keyword Exemplo | Página | Dificuldade |
|----------|----------------|--------|------------|
| Informacional | "como usar IA no negócio" | Blog | Média |
| Comercial | "melhor plataforma de IA" | Landing | Alta |
| Transacional | "assinar plataforma IA" | Pricing | Baixa |
| Navegacional | "[nosso produto] login" | Login | - |

### 2.3 Content Calendar (Template)
```
Semana 1: Blog - Topico A (keyword X)
Semana 2: Blog - Topico B (keyword Y) + Case Study
Semana 3: Blog - Topico C (keyword Z) + Newsletter
Semana 4: Blog - Topico D (keyword W) + Video
```

## 3. Structured Data

### 3.1 Implementações Obrigatórias
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "...",
  "url": "...",
  "logo": "...",
  "sameAs": ["linkedin", "github", "twitter"]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Pergunta 1",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Resposta 1"
      }
    }
  ]
}
```

## 4. Link Building

### 4.1 Estratégias
- Guest posts em blogs do nicho
- Diretórios de software (G2, Capterra, Product Hunt)
- Parcerias de conteúdo
- Mentions em pesquisas e relatórios

### 4.2 KPIs
| Métrica | Alvo |
|---------|------|
| Domain Authority (Moz) | > 40 (1 ano) |
| Backlinks qualificados | +20/mês |
| Organic traffic | +15%/mês |
| Keywords top 10 | +10/mês |

## 5. Checklist

- [ ] SSR/SSG configurado e validado
- [ ] Sitemap e robots.txt funcionando
- [ ] Meta tags dinâmicas em todas as páginas
- [ ] Core Web Vitals no verde (PageSpeed > 90)
- [ ] Structured data validado (Google Rich Results)
- [ ] Content calendar com 4 semanas de buffer
- [ ] Google Search Console e Analytics conectados

## 6. AI-First Notes

> A IA que gera blog posts deve respeitar a keyword strategy e incluir meta description, slug otimizado e structured data suggestions.
