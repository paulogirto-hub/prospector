# AI-32 - Estratégia de RAG e Memória Avançada

> **Prioridade:** ALTO
> **Depende de:** AI-09, AI-10
> **É dependência de:** 12, 30
> **Categoria:** ai

## 1. O que é RAG (Retrieval-Augmented Generation)

O RAG permite que os agentes acessem conhecimentos que não estavam em seu treinamento original (ex: documentos internos da empresa, manuais técnicos, histórico de suporte).

### Pipeline de Dados (Ingestão)

1. **Load:** Carregar arquivos (PDF, TXT, DOCX, URLs).
2. **Transform:** Limpar ruídos (headers, footers, scripts).
3. **Chunk:** Dividir em pedaços menores (ex: 1000 caracteres com 200 de sobreposição).
4. **Embed:** Gerar vetores numéricos usando modelos de Embedding (ex: `text-embedding-3-small` da OpenAI).
5. **Store:** Salvar no **Vector Database** (ex: Supabase Vector / pgvector).

---

## 2. Arquitetura de Busca Semântica

Quando o usuário faz uma pergunta:
1. O sistema gera um vetor para a **pergunta**.
2. Realiza uma **Busca por Similiaridade de Cosseno** no banco de vetores.
3. Recupera os `top_k` (ex: 3 a 5) pedaços mais relevantes.
4. Insere esses pedaços no **System Prompt** como "Contexto".
5. O LLM responde baseando-se no contexto fornecido.

---

## 3. Gestão de Memória de Agente

Para manter a consistência em conversas longas, o sistema utiliza dois níveis de memória:

### Memória de Curto Prazo (Buffer)
- Armazena as últimas X mensagens da conversa atual.
- Gerenciada via Redis para baixa latência.
- Estratégia de **Windowing**: Se o contexto ficar muito grande, o sistema resume as mensagens antigas antes de enviá-las ao modelo.

### Memória de Longo Prazo (Permanent)
- Armazena fatos importantes aprendidos sobre o usuário ao longo de semanas/meses.
- Implementada via busca vetorial:
  - O sistema "extrai fatos" (ex: "O usuário prefere respostas curtas", "O usuário trabalha com Node.js").
  - Salva esses fatos como vetores vinculados ao `user_id`.
  - Recupera fatos relevantes no início de cada nova sessão.

---

## 4. Estratégias de Chunking

| Tipo | Uso Recomendado | Vantagem |
|------|-----------------|----------|
| `Fixed-size` | Documentos simples | Rápido e previsível. |
| `Recursive Character` | Código e Documentos estruturados | Mantém parágrafos e funções íntegros. |
| `Semantic Chunking` | Conhecimento complexo | Divide onde o significado muda, melhorando a precisão. |

---

## 5. Custos e Otimização

O uso de RAG impacta o custo real do sistema:
- **Custo de Embedding:** Cobrado por token no momento da ingestão.
- **Custo de Contexto:** Os pedaços recuperados aumentam o número de tokens de entrada no LLM.

**Estratégia de Cache:**
- Resultados de buscas vetoriais idênticas em curto espaço de tempo devem ser cacheados no Redis.

---

## 6. Checklist de Implementação

- [ ] Escolha do banco vetorial (Recomendado: `pgvector` por simplicidade na stack Postgres).
- [ ] Implementação de worker assíncrono para processamento de arquivos (Queue).
- [ ] Interface de upload de "Conhecimento" para o Agente.
- [ ] Implementação de lógica de "Summarization" para memórias longas.
- [ ] Monitoramento de precisão (Feedback do usuário: 👍/👎).
