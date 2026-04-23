# SHRD-45 - Engenharia de Contexto e Otimização de Tokens

> **Prioridade:** ALTO (Para Eficiência)
> **Depende de:** Todas as Docs
> **É dependência de:** Todas as interações com IAs.
> **Categoria:** shared

## 1. O Problema do Context Window

Sistemas com 48+ documentos podem exceder o limite de memória das IAs ou tornar o processamento caro. Este módulo ensina a IA a ler o framework de forma "compacta".

### Framework Compression (Sumarização Densa)
- Cada módulo possui um **"Core Identifier"** (um resumo de 3 linhas em JSON/YAML) que transmite a essência do documento sem precisar ler o texto completo.
- Uso de **"Knowledge Graphs"** para mapear dependências entre docs sem repetição de texto.

---

## 2. Hierarchical Prompting (Carregamento Sob Demanda)

A IA não deve ler tudo de uma vez. O fluxo deve ser:
1. **Lvl 1:** Ler `MASTER.md` e `README.md` (Entender o mapa).
2. **Lvl 2:** Ler apenas os módulos necessários para a Task atual (ex: se for Auth, ler 01, 04, 05, 33).
3. **Lvl 3:** Carregar os `Core Identifiers` dos módulos secundários apenas para referência rápida.

---

## 3. Representação Densa de Regras

Regras complexas devem ser expressas de forma que a IA entenda com o mínimo de tokens:
- **Tabelas de Decisão:** Substituem longos parágrafos explicativos.
- **Estrutura YAML:** Mais eficiente que JSON ou Markdown corrido para definições de esquemas.

---

## 4. Gerenciamento de Memória de Conversa

Estratégias para manter o foco em conversas longas:
- **Summarization Gates:** A cada 5 interações, a IA deve resumir o progresso e o estado atual do sistema, "limpando" o histórico de tokens irrelevantes.
- **Context Pinning:** Manter as regras críticas (Cyber, LGPD, Quality Gates) sempre no "topo" da memória.

---

## 5. Checklist de Eficiência

- [ ] Uso de tabelas e listas curtas em vez de parágrafos.
- [ ] Eliminação de adjetivos e palavras irrelevantes na documentação técnica.
- [ ] Mapeamento claro de "Entradas" e "Saídas" em cada módulo.
- [ ] Uso de `identifiers` únicos para cada regra (ex: `R-33.1.1`).
