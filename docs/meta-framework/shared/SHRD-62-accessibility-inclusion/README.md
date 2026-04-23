# SHRD-62 - Acessibilidade e Inclusão Digital

> **Prioridade:** ALTO
> **Depende de:** FRONT-30, SHRD-33
> **É dependência de:** (nenhum)
> **Categoria:** shared

## 1. Conformidade WCAG 2.1

### 1.1 Níveis de Conformidade
| Nível | Requisitos | Meta |
|-------|-----------|------|
| A | Básico (texto alternativo, teclado) | Obrigatório |
| AA | Intermediário (contraste, redimensionamento) | Obrigatório |
| AAA | Avançado (Libras, áudio descrição) | Desejável |

### 1.2 Checklist WCAG 2.1 AA
- [ ] Contraste mínimo 4.5:1 para texto normal
- [ ] Contraste mínimo 3:1 para texto grande
- [ ] Foco visível em todos os elementos interativos
- [ ] Navegação completa por teclado (Tab, Enter, Esc)
- [ ] Roles e labels ARIA em componentes customizados
- [ ] Texto redimensionável até 200% sem perda de funcionalidade
- [ ] Sem epilepsia (sem flashes > 3 por segundo)

## 2. Leitores de Tela

### 2.1 Suporte Obrigatório
| Leitor | Navegador | Prioridade |
|--------|----------|-----------|
| NVDA | Firefox/Chrome | Alto |
| JAWS | Chrome/Edge | Alto |
| VoiceOver | Safari | Alto |
| TalkBack | Chrome | Médio |

### 2.2 Padrões de Implementação
```tsx
// Botão acessível
<button
  aria-label="Fechar modal"
  aria-describedby="modal-desc"
  onClick={close}
>
  <CloseIcon aria-hidden="true" />
</button>

// Form acessível
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && <span id="email-error" role="alert">{error}</span>}
```

## 3. Inclusão Cultural e Linguística

### 3.1 Localização (l10n)
| Idioma | Prioridade | Escopo |
|--------|-----------|--------|
| Português (pt-BR) | Padrão | Completo |
| Inglês (en-US) | Alto | UI + docs |
| Espanhol (es) | Médio | UI |
| Francês (fr) | Baixo | UI (futuro) |

### 3.2 Sensibilidade Cultural
- Evitar símbolos com significados divergentes
- Cores: vermelho = perigo (evitar para sucesso em algumas culturas)
- Ícones: testar compreensão cross-cultural
- Imagens: diversidade de gênero, etnia, idade

### 3.3 Formato de Dados
- Datas: ISO 8601 (YYYY-MM-DD) ou localizado
- Moedas: símbolo + código (R$ 49,90 BRL)
- Números: separador decimal conforme locale
- Fuso horário: sempre armazenar em UTC, exibir em local

## 4. Testes de Acessibilidade

### 4.1 Automatizados
| Ferramenta | O que verifica | Frequência |
|------------|-------------|-----------|
| axe-core | Contraste, roles, labels | CI/CD |
| Lighthouse | Score de a11y | A cada deploy |
| ESLint jsx-a11y | Erros comuns em JSX | Pre-commit |

### 4.2 Manuais
- Teste com leitor de tela (NVDA ou VoiceOver)
- Navegação apenas por teclado
- Zoom 200%
- Modo de alto contraste do SO

## 5. Checklist

- [ ] Score Lighthouse a11y >= 90
- [ ] axe-core zero violações críticas
- [ ] Teste com leitor de tela passando
- [ ] Navegação por teclado completa
- [ ] Localização pt-BR e en-US
- [ ] Contraste validado em todas as telas
- [ ] Testes manuais realizados mensalmente

## 6. AI-First Notes

> A IA que gera UI deve sempre incluir aria-labels e verificar contraste. Todo componente novo passa por validação de acessibilidade antes de merge.
