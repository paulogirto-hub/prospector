/* ═══════════════════════════════════════════════════
   PROSPECTOR — UI Components Module
   Rendering, DOM helpers, skeleton screens, toasts
   ═══════════════════════════════════════════════════ */

// ─── XSS-Safe HTML Template ───
// Usage: html`<div>${unsafeVar}</div>` — auto-escapes interpolated values
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function html(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += esc(values[i]);
    }
  }
  return result;
}

// Raw HTML — use ONLY for trusted/pre-escaped content
function rawHtml(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }
  return result;
}

// ─── Toast Notifications ───

function showToast(message, type = 'info', duration = 4000, retryFn = null) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  let actionHtml = '';
  if (retryFn) {
    actionHtml = `<button class="toast-retry-btn" data-retry="true">Tentar novamente</button>`;
  }
  toast.innerHTML = `<div class="toast-with-action"><span>${icons[type] || ''}</span><span>${esc(message)}</span>${actionHtml}</div>`;
  if (retryFn) {
    toast.querySelector('[data-retry]').addEventListener('click', () => {
      toast.remove();
      retryFn();
    });
  }
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Loading ───

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Carregando...';
  document.getElementById('loading').classList.add('show');
}
function setProgress(text) {
  document.getElementById('progressText').textContent = text || '';
}
function hideLoading() {
  document.getElementById('loading').classList.remove('show');
  document.getElementById('progressText').textContent = '';
}
function disableActions() {
  document.querySelectorAll('.actions-bar .btn-step, .actions-bar .btn-run-pipeline, .pipeline-bar .step-pill')
    .forEach(b => b.style.pointerEvents = 'none');
}
function enableActions() {
  document.querySelectorAll('.actions-bar .btn-step, .actions-bar .btn-run-pipeline, .pipeline-bar .step-pill')
    .forEach(b => b.style.pointerEvents = '');
}

// ─── Skeleton Screens ───

function renderSkeletonStats(count = 6) {
  return Array.from({length: count}, () => `<div class="skeleton skeleton-stat"></div>`).join('');
}

function renderSkeletonLeads(count = 5) {
  return Array.from({length: count}, () => `<div class="skeleton skeleton-card"></div>`).join('');
}

function renderSkeletonHistory(count = 4) {
  return Array.from({length: count}, () => `<div class="skeleton skeleton-history"></div>`).join('');
}

function showSkeletonStats() {
  const el = document.getElementById('summaryGrid');
  if (el) el.innerHTML = renderSkeletonStats();
}

function showSkeletonLeads() {
  const el = document.getElementById('leadList');
  if (el) el.innerHTML = renderSkeletonLeads();
}

function showSkeletonHistory() {
  const el = document.getElementById('historyList');
  if (el) el.innerHTML = renderSkeletonHistory();
}

// ─── Error Card with Retry ───

function renderErrorCard(message, retryFn, container) {
  if (typeof container === 'string') container = document.getElementById(container);
  if (!container) return;
  container.innerHTML = `<div class="error-card">
    <div class="error-icon">⚠️</div>
    <div class="error-msg">${esc(message)}</div>
    <button class="btn-retry" id="retryBtn">🔄 Tentar novamente</button>
  </div>`;
  container.querySelector('#retryBtn').addEventListener('click', retryFn);
}

// ─── Filters Bar ───

function renderFiltersBar() {
  const { AppState, getFilteredLeads } = window.Prospector || {};
  if (!AppState) return;

  const f = AppState.filters;
  const leads = (AppState.currentData && AppState.currentData.leads) || [];
  const filtered = getFilteredLeads ? getFilteredLeads() : leads;

  const chipActive = (val, filterVal) => {
    if (filterVal === null) return '';
    return filterVal === val ? 'active' : '';
  };

  const filterHtml = `
    <div class="filters-bar" id="filtersBar">
      <div class="filter-group">
        <span class="filter-label">🌐 Site</span>
        <button class="filter-chip ${chipActive(true, f.tem_site)}" data-filter="tem_site" data-value="true">Com site</button>
        <button class="filter-chip ${chipActive(false, f.tem_site)}" data-filter="tem_site" data-value="false">Sem site</button>
        <button class="filter-chip ${f.tem_site === null ? 'active' : ''}" data-filter="tem_site" data-value="all">Todos</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">📸 Instagram</span>
        <button class="filter-chip ${chipActive(true, f.tem_instagram)}" data-filter="tem_instagram" data-value="true">Com IG</button>
        <button class="filter-chip ${chipActive(false, f.tem_instagram)}" data-filter="tem_instagram" data-value="false">Sem IG</button>
        <button class="filter-chip ${f.tem_instagram === null ? 'active' : ''}" data-filter="tem_instagram" data-value="all">Todos</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">📍 Maps</span>
        <button class="filter-chip ${chipActive(true, f.tem_maps)}" data-filter="tem_maps" data-value="true">Com Maps</button>
        <button class="filter-chip ${chipActive(false, f.tem_maps)}" data-filter="tem_maps" data-value="false">Sem Maps</button>
        <button class="filter-chip ${f.tem_maps === null ? 'active' : ''}" data-filter="tem_maps" data-value="all">Todos</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">💰 Ads</span>
        <button class="filter-chip ${chipActive(true, f.tem_ads)}" data-filter="tem_ads" data-value="true">Com Ads</button>
        <button class="filter-chip ${f.tem_ads === null ? 'active' : ''}" data-filter="tem_ads" data-value="all">Todos</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">📋 CNPJ</span>
        <button class="filter-chip ${chipActive(true, f.tem_cnpj)}" data-filter="tem_cnpj" data-value="true">Com CNPJ</button>
        <button class="filter-chip ${f.tem_cnpj === null ? 'active' : ''}" data-filter="tem_cnpj" data-value="all">Todos</button>
      </div>
      <input type="text" class="filter-search" id="filterSearch" placeholder="🔍 Buscar por nome..." value="${esc(f.searchText)}">
      <select class="filter-select" id="filterSort">
        <option value="score_desc" ${f.sortBy === 'score_desc' ? 'selected' : ''}>Score ↓</option>
        <option value="score_asc" ${f.sortBy === 'score_asc' ? 'selected' : ''}>Score ↑</option>
        <option value="name_asc" ${f.sortBy === 'name_asc' ? 'selected' : ''}>Nome A-Z</option>
        <option value="rating_desc" ${f.sortBy === 'rating_desc' ? 'selected' : ''}>Rating ↓</option>
      </select>
      <span class="filter-count">${filtered.length} de ${leads.length} leads</span>
    </div>
  `;

  return filterHtml;
}

function setupFilterEvents() {
  const bar = document.getElementById('filtersBar');
  if (!bar) return;

  // Filter chips
  bar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filterKey = chip.dataset.filter;
      const rawVal = chip.dataset.value;
      let val;
      if (rawVal === 'all') val = null;
      else if (rawVal === 'true') val = true;
      else val = false;

      AppState.filters[filterKey] = val;
      renderLeadList();
    });
  });

  // Search
  const search = document.getElementById('filterSearch');
  if (search) {
    let debounce;
    search.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        AppState.filters.searchText = search.value;
        renderLeadList();
      }, 200);
    });
  }

  // Sort
  const sort = document.getElementById('filterSort');
  if (sort) {
    sort.addEventListener('change', () => {
      AppState.filters.sortBy = sort.value;
      renderLeadList();
    });
  }
}

function renderLeadList() {
  const { AppState, getFilteredLeads } = window.Prospector || {};
  if (!AppState || !AppState.currentData) return;

  const data = AppState.currentData;
  const s = data.summary || {};
  const status = data.status || 'unknown';
  const hasScore = ['scored', 'market_analyzed', 'analyzed', 'analyzing_leads'].includes(status);
  const leads = getFilteredLeads();

  const list = document.getElementById('leadList');
  if (!list) return;

  if (leads.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Nenhum lead encontrado</div><div class="empty-desc">Tente uma busca diferente ou ajuste os filtros.</div></div>`;
    return;
  }

  list.innerHTML = leads.map((l, origIdx) => {
    const realIdx = (data.leads || []).indexOf(l);
    const score = l.score;
    const showScore = hasScore && score !== undefined;
    const scoreClass = score >= 60 ? 'high' : score >= 30 ? 'mid' : 'low';
    const scoreHtml = showScore ? `<div class="lead-score ${scoreClass}">${score}/100</div>` : '';
    const leadId = l.id || `${s.search_id}_${realIdx}`;

    const diagBadge = l.diagnostico ? '<span class="badge badge-diag">🔬 Diagnóstico</span>' : '';
    const analiseBadge = l.ia_analise ? '<span class="badge badge-analise">📋 Análise</span>' : '';
    const badges = [
      l.tem_site ? '<span class="badge badge-site">🌐 Site</span>' : '<span class="badge badge-no">🚫 Sem Site</span>',
      l.tem_instagram ? '<span class="badge badge-insta">📸 Instagram</span>' : '<span class="badge badge-no">🚫 Sem IG</span>',
      l.tem_maps ? `<span class="badge badge-maps">📍 Maps ${l.maps_rating || ''}★</span>` : '<span class="badge badge-no">🚫 Sem Maps</span>',
      l.tem_ads ? '<span class="badge badge-ads">💰 Ads</span>' : '',
      l.cnpj ? '<span class="badge badge-site">📋 CNPJ</span>' : '',
      l.site_emails && l.site_emails.length ? '<span class="badge badge-email">✉️ Email no site</span>' : '',
      l.site_phones && l.site_phones.length ? '<span class="badge badge-phone">📞 Tel no site</span>' : '',
      l.site_youtube ? '<span class="badge badge-youtube">▶️ YouTube</span>' : '',
      l.site_tiktok ? '<span class="badge badge-tiktok">🎵 TikTok</span>' : '',
      l.enrichment_status ? `<span class="badge badge-enrich">🔍 ${l.enrichment_status === 'done' ? 'Enriquecido' : l.enrichment_status === 'partial' ? 'Parcial' : l.enrichment_status}</span>` : '',
      l.cnpj_source ? `<span class="badge badge-cnpj-src">📋 CNPJ: ${l.cnpj_source}</span>` : '',
      diagBadge, analiseBadge,
    ].filter(Boolean).join('');

    const detailRows = [
      l.cnpj ? `<dt>CNPJ</dt><dd>${esc(l.cnpj)}${l.cnpj_source ? ` <span style="color:var(--accent);font-size:11px">(${esc(l.cnpj_source)})</span>` : ''}</dd>` : '',
      l.razao_social ? `<dt>Razão Social</dt><dd>${esc(l.razao_social)}</dd>` : '',
      l.situacao ? `<dt>Situação</dt><dd>${esc(l.situacao)}</dd>` : '',
      l.capital_social ? `<dt>Capital</dt><dd>R$${Number(l.capital_social).toLocaleString('pt-BR')}</dd>` : '',
      l.porte ? `<dt>Porte</dt><dd>${esc(l.porte)}</dd>` : '',
      l.cnae_descricao ? `<dt>Atividade</dt><dd>${esc(l.cnae_descricao)}</dd>` : '',
      l.data_inicio ? `<dt>Início</dt><dd>${esc(l.data_inicio)}</dd>` : '',
      l.opcao_pelo_mei !== undefined ? `<dt>MEI</dt><dd>${l.opcao_pelo_mei ? 'Sim' : 'Não'}</dd>` : '',
      l.site_url ? `<dt>Site</dt><dd><a href="${esc(l.site_url)}" target="_blank" rel="noopener">${esc(l.site_url)}</a></dd>` : '',
      l.instagram_url ? `<dt>Instagram</dt><dd><a href="${esc(l.instagram_url)}" target="_blank" rel="noopener">${esc(l.instagram_url)}</a></dd>` : '',
      l.site_instagram ? `<dt>IG no site</dt><dd><a href="${esc(l.site_instagram)}" target="_blank" rel="noopener">${esc(l.site_instagram)}</a></dd>` : '',
      l.site_facebook ? `<dt>FB no site</dt><dd><a href="${esc(l.site_facebook)}" target="_blank" rel="noopener">${esc(l.site_facebook)}</a></dd>` : '',
      l.site_youtube ? `<dt>YouTube</dt><dd><a href="${esc(l.site_youtube)}" target="_blank" rel="noopener">${esc(l.site_youtube)}</a></dd>` : '',
      l.site_tiktok ? `<dt>TikTok</dt><dd><a href="${esc(l.site_tiktok)}" target="_blank" rel="noopener">${esc(l.site_tiktok)}</a></dd>` : '',
      l.site_emails && l.site_emails.length ? `<dt>Emails no site</dt><dd>${l.site_emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(', ')}</dd>` : '',
      l.site_phones && l.site_phones.length ? `<dt>Tels no site</dt><dd>${esc(l.site_phones.join(', '))}</dd>` : '',
      l.maps_rating ? `<dt>Maps</dt><dd>${esc(l.maps_rating)}★ (${esc(l.maps_reviews)} reviews)</dd>` : '',
      (l.maps_phone || l.telefone_receita) ? `<dt>Telefone</dt><dd>${esc(l.maps_phone || l.telefone_receita)}</dd>` : '',
      l.email_receita ? `<dt>Email</dt><dd>${esc(l.email_receita)}</dd>` : '',
      l.socios ? `<dt>Sócios</dt><dd>${l.socios.map(s => esc(s)).join(', ')}</dd>` : '',
      l.enrichment_status ? `<dt>Enriquecimento</dt><dd>${l.enrichment_status === 'done' ? '✅ Completo' : l.enrichment_status === 'partial' ? '🟡 Parcial' : '⏳ Pendente'}</dd>` : '',
    ].filter(Boolean).join('');

    const iaHtml = l.ia_analise ? renderLeadAnalysis(l, realIdx, leadId) : '';

    return `<div class="lead-card" id="lead-${leadId}" role="listitem" onclick="Prospector.toggleLead(this)" tabindex="0" onkeydown="if(event.key==='Enter')this.classList.toggle('open')">
      <div class="lead-top">
        <div class="lead-name" style="cursor:pointer" onclick="Prospector.openDiagModal('${leadId}', event)">${realIdx+1}. ${esc(l.title)}</div>
        <div class="lead-actions">
          <button onclick="Prospector.showEditForm('${leadId}', event)" title="Editar lead" aria-label="Editar lead">✏️</button>
          <button onclick="Prospector.deleteLead('${leadId}', event)" title="Excluir lead" aria-label="Excluir lead" style="color:var(--error)">🗑️</button>
        </div>
        ${scoreHtml}
      </div>
      <div class="lead-badges">${badges}</div>
      <div class="lead-snippet">${esc(l.snippet || '')}</div>
      ${detailRows || iaHtml ? `<div class="lead-detail">
        <div class="detail-grid">${detailRows}</div>
        ${iaHtml}
      </div>` : ''}
    </div>`;
  }).join('');

  // Re-render filters bar to update count
  const filtersContainer = document.getElementById('filtersContainer');
  if (filtersContainer) {
    filtersContainer.innerHTML = renderFiltersBar();
    setupFilterEvents();
  }
}

function renderLeadAnalysis(l, i, leadId) {
  const a = l.ia_analise;
  if (typeof a === 'object') {
    let ah = `<div class="ia-lead" onclick="event.stopPropagation()"><strong>📋 Análise:</strong>`;
    if (a.resumo) ah += `<div class="analysis-field"><div class="af-label">Resumo</div><div class="af-value">${esc(a.resumo)}</div></div>`;
    if (a.presenca_digital) ah += `<div class="analysis-field"><div class="af-label">Presença Digital</div><div class="af-value">${esc(a.presenca_digital)}</div></div>`;
    if (a.posicao_mercado) ah += `<div class="analysis-field"><div class="af-label">Posição no Mercado</div><div class="af-value">${esc(a.posicao_mercado)}</div></div>`;
    if (a.publico_esperado) ah += `<div class="analysis-field"><div class="af-label">Público Esperado</div><div class="af-value">${esc(a.publico_esperado)}</div></div>`;
    if (a.observacoes) ah += `<div class="analysis-field"><div class="af-label">Observações</div><div class="af-value">${esc(a.observacoes)}</div></div>`;
    ah += `<div class="ia-actions" style="margin-top:8px"><button class="btn-reanalyze" onclick="Prospector.reanalyzeLead(${i}, event)">🔄 Re-analisar</button></div></div>`;
    return ah;
  } else {
    return `<div class="ia-lead" onclick="event.stopPropagation()"><strong>📋 Análise:</strong><br><br>${esc(a)}<div class="ia-actions" style="margin-top:8px"><button class="btn-save" onclick="Prospector.showAnalysisEditor('${leadId}', event)">✏️ Editar texto</button> <button class="btn-reanalyze" onclick="Prospector.reanalyzeLead(${i}, event)">🔄 Re-analisar</button></div></div>`;
  }
}

export { esc, html, rawHtml, showToast, showLoading, setProgress, hideLoading, disableActions, enableActions, renderSkeletonStats, renderSkeletonLeads, renderSkeletonHistory, showSkeletonStats, showSkeletonLeads, showSkeletonHistory, renderErrorCard, renderFiltersBar, setupFilterEvents, renderLeadList, renderLeadAnalysis };