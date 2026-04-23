/* ═══════════════════════════════════════════════════
   PROSPECTOR — Main App Module
   Orchestrates state, API, and components
   ═══════════════════════════════════════════════════ */

import { AppState, initState, getState, setState, subscribe, addRecentSearch, getFilteredLeads, setError, clearError } from './state.js';
import { API, safeFetch, connectSSE, disconnectSSE, apiCreateSearch, apiGetSearch, apiRunStep, apiUpdateLead, apiDeleteLead, apiAnalyzeLeads, apiAnalyzeSingleLead, apiDiagnose, apiSaveAnalysis, apiGetHistory, apiDeleteSearch } from './api.js';
import { esc, html, rawHtml, showToast, showLoading, setProgress, hideLoading, disableActions, enableActions, showSkeletonStats, showSkeletonLeads, showSkeletonHistory, renderErrorCard, renderFiltersBar, setupFilterEvents, renderLeadList } from './components.js';

// ─── Pipeline Constants ───

const STEPS = ['discovery', 'enriched', 'scored', 'market_analyzed', 'analyzed', 'diagnosed'];
const STEP_LABELS = {
  discovery: 'Descoberta', discovering: 'Descoberta', enriched: 'CNPJ', scored: 'Scores',
  market_analyzed: 'Mercado', analyzed: 'Leads', analyzing_leads: 'Análise Leads',
  enriching: 'CNPJ', diagnosed: 'Diagnóstico'
};
const STEP_ICONS = {
  discovery: '🔍', discovering: '🔍', enriched: '📋', scored: '⭐',
  market_analyzed: '📊', analyzed: '🧠', analyzing_leads: '🧠',
  enriching: '📋', diagnosed: '🔬'
};
const STEP_API = {
  discovery: 'rediscover', enriched: 'enrich', scored: 'score',
  market_analyzed: 'analyze-market', analyzed: 'analyze-leads'
};

// ─── Pipeline Helpers ───

function getStepIndex(status) {
  if (status === 'enriching') return 0;
  if (status === 'discovering') return -1;
  if (status === 'analyzing_leads') return 3;
  return STEPS.indexOf(status);
}

function getNextStep(status) {
  if (status === 'discovering') return null;
  if (status === 'discovery' || status === 'enriching') return 'enrich';
  if (status === 'enriched') return 'score';
  if (status === 'scored') return 'analyze-market';
  if (status === 'market_analyzed' || status === 'analyzing_leads') return 'analyze-leads';
  return null;
}

function findLead(leadId) {
  if (!AppState.currentData || !AppState.currentData.leads) return null;
  return AppState.currentData.leads.find(l => l.id === leadId);
}

function findLeadIndex(leadId) {
  if (!AppState.currentData || !AppState.currentData.leads) return -1;
  return AppState.currentData.leads.findIndex(l => l.id === leadId);
}

// ─── Pipeline Bar ───

function renderPipelineBar(status) {
  const bar = document.getElementById('pipelineBar');
  let doneUpTo = getStepIndex(status);
  let htmlStr = '';
  STEPS.forEach((step, i) => {
    if (i > 0) htmlStr += '<span class="step-arrow" aria-hidden="true">→</span>';
    const isDone = i <= doneUpTo;
    const isActive = (status === 'discovering' && i === 0);
    const cls = isDone ? 'done' : (isActive ? 'active' : 'pending');
    const label = STEP_LABELS[step] || step;
    const icon = STEP_ICONS[step] || '';
    htmlStr += `<span class="step-pill ${cls}" role="button" tabindex="0" onclick="Prospector.rerunStep(${i})" onkeydown="if(event.key==='Enter')Prospector.rerunStep(${i})" title="Repetir: ${label}" aria-label="${label}${isDone ? ' (concluído)' : ''}">${icon} ${label}${isDone ? ' 🔄' : ''}</span>`;
  });
  bar.innerHTML = htmlStr;
}

function rerunStep(stepIndex) {
  const searchId = AppState.currentSearchId;
  if (!searchId) return;
  const stepKey = STEPS[stepIndex];
  const apiAction = STEP_API[stepKey];
  if (!apiAction) return;
  if (!confirm(`Repetir etapa "${STEP_LABELS[stepKey]}"? Os dados serão atualizados.`)) return;
  rerunStepApi(searchId, apiAction, stepKey);
}

async function rerunStepApi(searchId, apiAction, stepKey) {
  disableActions();
  showLoading('Atualizando...');
  const msgs = {
    rediscover: 'Atualizando descoberta...', enrich: 'Atualizando enriquecimento...',
    score: 'Atualizando scores...', 'analyze-market': 'Atualizando análise de mercado...',
    'analyze-leads': 'Atualizando análise de leads...'
  };
  setProgress(msgs[apiAction] || 'Atualizando...');
  try {
    const data = await apiRunStep(searchId, apiAction);
    if (data.error) { showToast(data.error, 'error'); return; }
    if (data.status === 'enriching' || data.status === 'discovering') {
      if (data.status === 'enriching') await pollEnrichProgress(searchId);
      else if (data.status === 'discovering') await pollDiscoveryProgress(searchId);
      const updated = await apiGetSearch(searchId);
      setState('currentStatus', updated.status);
      setState('currentData', updated);
      renderResults(updated);
    } else if (data.status === 'analyzing_leads') {
      await pollAnalyzeLeadsProgress(searchId);
    } else {
      setState('currentStatus', data.status);
      setState('currentData', data);
      renderResults(data);
    }
    showToast('Etapa atualizada com sucesso!', 'success');
  } catch (e) {
    showToast(e.message, 'error', 6000, () => rerunStepApi(searchId, apiAction, stepKey));
  }
  finally { hideLoading(); enableActions(); }
}

function renderPipelineStats(data) {
  const el = document.getElementById('pipelineStats');
  const s = data.summary || {};
  const queries = s.queries_total ?? 0;
  if (queries > 0) {
    const raw = s.raw_results ?? '?';
    const filtered = s.filtered_results ?? s.after_filter ?? '?';
    const total = s.total_results ?? 0;
    el.textContent = `🔄 ${queries} buscas → ${raw} bruto → ${filtered} filtrados → ${total} deduplicados`;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

// ─── Actions Bar ───

function renderActions(status, searchId, data) {
  const bar = document.getElementById('actionsBar');
  const s = (data && data.summary) || {};
  const analyzedCount = s.analyzed_count ?? 0;
  const totalToAnalyze = s.total_to_analyze ?? 0;
  let htmlStr = '';

  const steps = [
    { key: 'rediscover', label: '🔍 Redescobrir', cls: 'btn-enrich' },
    { key: 'enrich', label: '📋 Enriquecer CNPJs + Sites', cls: 'btn-enrich' },
    { key: 'score', label: '⭐ Calcular Scores', cls: 'btn-score' },
    { key: 'analyze-market', label: '📊 Análise Mercado (IA)', cls: 'btn-market' },
  ];
  for (const st of steps) {
    htmlStr += `<button class="btn-step ${st.cls}" onclick="Prospector.rerunStepApi('${searchId}','${st.key}','${st.key}')">${st.label}</button>`;
  }

  const remaining = totalToAnalyze - analyzedCount;
  if (status === 'market_analyzed' || status === 'analyzing_leads' || status === 'analyzed') {
    const nextLabel = remaining > 0
      ? `🧠 Analisar próximo (${analyzedCount}/${totalToAnalyze} prontos)`
      : `🧠 Re-analisar leads`;
    htmlStr += `<button class="btn-step btn-leads" onclick="Prospector.analyzeNextLead('${searchId}')">${nextLabel}</button>`;
    if (remaining > 1) {
      htmlStr += `<button class="btn-step btn-leads" onclick="Prospector.analyzeAllLeads('${searchId}')" style="opacity:0.85">🚀 Analisar todos (${remaining} restantes)</button>`;
    }
  } else if (status === 'scored' || status === 'enriched' || status === 'discovery') {
    htmlStr += `<button class="btn-step btn-leads" onclick="Prospector.rerunStepApi('${searchId}','analyze-leads','analyze-leads')">🧠 Analisar Leads (IA)</button>`;
  }

  htmlStr += `<div class="spacer"></div>`;
  htmlStr += `<button class="btn-run-pipeline" onclick="Prospector.runAll('${searchId}')">🚀 Executar Tudo</button>`;
  bar.innerHTML = htmlStr;
}

// ─── Polling with SSE Fallback ───

async function pollDiscoveryProgress(searchId) {
  let lastDone = -1;
  // Try SSE first
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { reject(new Error('SSE timeout')); }, 3000);
      connectSSE(searchId, (data) => {
        clearTimeout(timeout);
        if (data.status !== 'discovering') {
          disconnectSSE();
          setState('currentStatus', data.status);
          setState('currentData', data);
          renderResults(data);
          resolve();
        } else {
          const s = data.summary || {};
          const done = s.queries_done ?? 0;
          const total = s.queries_total || '?';
          const currentQ = s.current_query || '';
          setProgress(`Busca ${done}/${total}... ${currentQ}`);
        }
      }, (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return;
  } catch (e) {
    // SSE failed, use polling
  }

  while (true) {
    try {
      const data = await apiGetSearch(searchId);
      if (data.error) { showToast(data.error, 'error'); return; }
      const s = data.summary || {};
      const done = s.queries_done ?? 0;
      const total = s.queries_total || '?';
      const currentQ = s.current_query || '';
      if (done !== lastDone) {
        setProgress(`Busca ${done}/${total}... ${currentQ}`);
        lastDone = done;
      }
      if (data.status !== 'discovering') {
        setState('currentStatus', data.status);
        setState('currentData', data);
        renderResults(data);
        return;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function pollEnrichProgress(searchId) {
  let lastProgress = '';
  while (true) {
    try {
      const data = await apiGetSearch(searchId);
      if (data.error) break;
      const leads = data.leads || [];
      const enriched = leads.filter(l => l.enrichment_status && l.enrichment_status !== 'pending').length;
      const total = leads.length;
      const progress = `${enriched}/${total}`;
      if (progress !== lastProgress) {
        setProgress(`Enriquecendo dados... ${enriched}/${total} leads processados`);
        lastProgress = progress;
      }
      if (data.status !== 'enriching') {
        setState('currentStatus', data.status);
        setState('currentData', data);
        renderResults(data);
        return;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function pollAnalyzeLeadsProgress(searchId) {
  let lastCount = -1;
  while (true) {
    try {
      const data = await apiGetSearch(searchId);
      if (data.error) break;
      const s = data.summary || {};
      const analyzed = s.analyzed_count ?? 0;
      const total = s.total_to_analyze ?? 0;
      if (analyzed !== lastCount) {
        setProgress(`Analisando leads... ${analyzed}/${total}`);
        lastCount = analyzed;
        setState('currentData', data);
        renderResults(data);
      }
      if (data.status === 'analyzed' || data.status !== 'analyzing_leads') {
        setState('currentStatus', data.status);
        setState('currentData', data);
        renderResults(data);
        return;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 3000));
  }
}

// ─── Step Execution ───

async function runStep(searchId, step) {
  disableActions();
  showLoading('Processando...');
  setProgress('Processando...');
  try {
    const data = await apiRunStep(searchId, step);
    if (data.error) { showToast(data.error, 'error'); }
    else if (data.status === 'enriching') { await pollEnrichProgress(searchId); }
    else { setState('currentStatus', data.status); setState('currentData', data); renderResults(data); }
  } catch (e) { showToast(e.message, 'error', 6000, () => runStep(searchId, step)); }
  finally { hideLoading(); enableActions(); }
}

async function analyzeNextLead(searchId) {
  disableActions();
  showLoading('Analisando lead...');
  try {
    const progress = await apiGetSearch(searchId);
    const s = progress.summary || {};
    const analyzed = s.analyzed_count ?? 0;
    const total = s.total_to_analyze ?? 0;
    setProgress(`Analisando lead ${analyzed + 1}/${total}...`);
    const data = await apiAnalyzeLeads(searchId, false);
    if (data.error) showToast(data.error, 'error');
    else { setState('currentStatus', data.status); setState('currentData', data); renderResults(data); }
  } catch (e) { showToast(e.message, 'error', 6000, () => analyzeNextLead(searchId)); }
  finally { hideLoading(); enableActions(); }
}

async function analyzeAllLeads(searchId) {
  disableActions();
  showLoading('Analisando todas os leads...');
  try {
    const data = await apiAnalyzeLeads(searchId, true);
    if (data.error) { showToast(data.error, 'error'); }
    else if (data.status === 'analyzing_leads') { await pollAnalyzeLeadsProgress(searchId); }
    else { setState('currentStatus', data.status); setState('currentData', data); renderResults(data); }
  } catch (e) { showToast(e.message, 'error', 6000, () => analyzeAllLeads(searchId)); }
  finally { hideLoading(); enableActions(); }
}

// ─── Run All Pipeline ───

async function runAll(searchId) {
  setState('pipelineRunning', true);
  const steps = ['enrich', 'score', 'analyze-market', 'analyze-leads'];
  const msgs = {
    enrich: 'Enriquecendo dados...', score: 'Calculando scores...',
    'analyze-market': 'Gerando análise de mercado (IA)...', 'analyze-leads': 'Analisando leads...'
  };
  for (const step of steps) {
    if (!AppState.pipelineRunning) break;
    let current = await apiGetSearch(searchId);
    setState('currentStatus', current.status);
    const next = getNextStep(AppState.currentStatus);
    if (!next) break;
    const stepMap = { enrich: 'enrich', score: 'score', 'analyze-market': 'analyze-market', 'analyze-leads': 'analyze-leads' };
    if (stepMap[next] !== step) continue;
    disableActions();
    showLoading(msgs[step] || 'Processando...');
    setProgress(msgs[step] || 'Processando...');
    try {
      const data = await apiRunStep(searchId, step);
      if (data.error) { showToast(data.error, 'error'); setState('pipelineRunning', false); break; }
      if (data.status === 'enriching') {
        await pollEnrichProgress(searchId);
        const updated = await apiGetSearch(searchId);
        setState('currentStatus', updated.status);
        setState('currentData', updated);
        renderResults(updated);
      } else if (data.status === 'analyzing_leads') {
        await pollAnalyzeLeadsProgress(searchId);
      } else {
        setState('currentStatus', data.status);
        setState('currentData', data);
        renderResults(data);
      }
    } catch (e) { showToast(e.message, 'error'); setState('pipelineRunning', false); break; }
  }
  hideLoading();
  showToast('Pipeline concluída!', 'success');
  setState('pipelineRunning', false);
}

// ─── Search (Discovery) ───

async function doSearch() {
  const niche = document.getElementById('niche').value.trim();
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value;
  if (!niche || !city) { showToast('Preencha nicho e cidade', 'warning'); return; }
  document.getElementById('searchBtn').disabled = true;
  showLoading('Iniciando busca...');
  setProgress('');
  document.getElementById('results').style.display = 'none';
  try {
    const initData = await apiCreateSearch(niche, city, state);
    if (initData.error) { showToast(initData.error, 'error'); return; }
    setState('currentSearchId', initData.search_id);
    addRecentSearch({ search_id: initData.search_id, niche, city, state, timestamp: new Date().toISOString() });
    await pollDiscoveryProgress(AppState.currentSearchId);
    showToast('Busca concluída!', 'success');
  } catch (e) { showToast(e.message, 'error', 6000, doSearch); }
  finally { hideLoading(); document.getElementById('searchBtn').disabled = false; }
}

// ─── CRUD: Edit Lead ───

function showEditForm(leadId, event) {
  if (event) event.stopPropagation();
  const card = document.getElementById('lead-' + leadId);
  if (!card) return;
  const existing = card.querySelector('.edit-form');
  if (existing) { existing.remove(); return; }
  const l = findLead(leadId);
  if (!l) return;
  const form = document.createElement('div');
  form.className = 'edit-form';
  form.onclick = e => e.stopPropagation();
  form.innerHTML = `
    <label>Título</label><input id="ef_title" value="${esc(l.title || '')}">
    <label>Site URL</label><input id="ef_site" value="${esc(l.site_url || '')}">
    <label>Instagram URL</label><input id="ef_insta" value="${esc(l.instagram_url || '')}">
    <label>Telefone</label><input id="ef_phone" value="${esc(l.maps_phone || l.telefone_receita || '')}">
    <label>Email</label><input id="ef_email" value="${esc(l.email_receita || '')}">
    <label>Score</label><input id="ef_score" type="number" min="0" max="100" value="${l.score || 0}">
    <div class="edit-actions">
      <button class="btn-save-edit" onclick="Prospector.saveEdit('${leadId}', event)">💾 Salvar</button>
      <button class="btn-cancel-edit" onclick="Prospector.cancelEdit('${leadId}', event)">✖ Cancelar</button>
    </div>`;
  card.classList.add('open');
  card.querySelector('.lead-detail').prepend(form);
  form.querySelector('input').focus();
}

async function saveEdit(leadId, event) {
  event.stopPropagation();
  const updates = {
    title: document.getElementById('ef_title').value,
    site_url: document.getElementById('ef_site').value,
    instagram_url: document.getElementById('ef_insta').value,
    maps_phone: document.getElementById('ef_phone').value,
    email_receita: document.getElementById('ef_email').value,
    score: parseInt(document.getElementById('ef_score').value) || 0,
  };
  try {
    const data = await apiUpdateLead(AppState.currentSearchId, leadId, updates);
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Lead atualizado!', 'success');
    await reloadSearch();
  } catch (e) { showToast(e.message, 'error', 6000, () => saveEdit(leadId, event)); }
}

function cancelEdit(leadId, event) {
  event.stopPropagation();
  const card = document.getElementById('lead-' + leadId);
  if (card) { const f = card.querySelector('.edit-form'); if (f) f.remove(); }
}

// ─── CRUD: Delete Lead ───

async function deleteLead(leadId, event) {
  event.stopPropagation();
  if (!confirm('Excluir este lead?')) return;
  try {
    const data = await apiDeleteLead(AppState.currentSearchId, leadId);
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Lead excluído', 'success');
    await reloadSearch();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─── CRUD: Re-analyze Lead ───

async function reanalyzeLead(leadIndex, event) {
  event.stopPropagation();
  if (!confirm('Re-analisar este lead com IA? (~90s)')) return;
  showLoading('Re-analisando lead...');
  setProgress('Isso pode levar até 90 segundos...');
  try {
    const data = await apiAnalyzeSingleLead(AppState.currentSearchId, leadIndex);
    if (data.error) { showToast(data.error, 'error'); return; }
    setState('currentData', data);
    renderResults(data);
    showToast('Lead re-analisado!', 'success');
  } catch (e) { showToast(e.message, 'error'); }
  finally { hideLoading(); }
}

// ─── CRUD: Edit Analysis Text ───

function showAnalysisEditor(leadId, event) {
  if (event) event.stopPropagation();
  const l = findLead(leadId);
  if (!l) return;
  const card = document.getElementById('lead-' + leadId);
  if (!card) return;
  const iaDiv = card.querySelector('.ia-lead');
  if (!iaDiv) return;
  if (iaDiv.querySelector('textarea')) return;
  const text = typeof l.ia_analise === 'object' ? JSON.stringify(l.ia_analise, null, 2) : (l.ia_analise || '');
  iaDiv.innerHTML = `
    <strong>🧠 Análise IA (editável):</strong>
    <textarea id="ta_${leadId}">${esc(text)}</textarea>
    <div class="ia-actions">
      <button class="btn-save" onclick="Prospector.saveAnalysis('${leadId}', event)">💾 Salvar texto</button>
      <button class="btn-reanalyze" onclick="Prospector.reanalyzeLead(${findLeadIndex(leadId)}, event)">🔄 Re-analisar com IA</button>
    </div>`;
}

async function saveAnalysis(leadId, event) {
  event.stopPropagation();
  const ta = document.getElementById('ta_' + leadId);
  if (!ta) return;
  const newText = ta.value;
  try {
    const data = await apiSaveAnalysis(AppState.currentSearchId, leadId, newText);
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Análise salva!', 'success');
    await reloadSearch();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─── CRUD: Delete Search ───

async function deleteSearch(searchId, event) {
  event.stopPropagation();
  if (!confirm('Excluir esta busca e todos os seus dados?')) return;
  try {
    const data = await apiDeleteSearch(searchId);
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Busca excluída', 'success');
    if (AppState.currentSearchId === searchId) {
      setState('currentSearchId', null);
      setState('currentStatus', null);
      setState('currentData', null);
      document.getElementById('results').style.display = 'none';
    }
    loadHistory();
  } catch (e) { showToast(e.message, 'error'); }
}

// ─── Reload ───

async function reloadSearch() {
  if (!AppState.currentSearchId) return;
  try {
    const data = await apiGetSearch(AppState.currentSearchId);
    if (!data.error) { setState('currentStatus', data.status); setState('currentData', data); renderResults(data); }
  } catch (e) { showToast(e.message, 'error', 6000, reloadSearch); }
}

// ─── Render Results ───

function renderResults(data) {
  const s = data.summary || {};
  const status = data.status || 'unknown';
  setState('currentSearchId', s.search_id || data.search_id);
  setState('currentStatus', status);
  setState('currentData', data);
  document.getElementById('results').style.display = 'block';
  renderPipelineBar(status);
  renderPipelineStats(data);
  renderActions(status, s.search_id || data.search_id, data);

  const hasScore = ['scored', 'market_analyzed', 'analyzed', 'analyzing_leads'].includes(status);
  const comSiteEmail = s.com_site_email || 0;
  const comSitePhone = s.com_site_phone || 0;
  const comYoutube = s.com_youtube || 0;
  const comTiktok = s.com_tiktok || 0;

  const totalResults = s.total_results ?? 0;
  const comSite = s.com_site ?? 0;
  const semSite = s.sem_site ?? (totalResults - comSite);
  const pctSemSite = s.pct_sem_site ?? (totalResults ? Math.round((totalResults - comSite) / totalResults * 100) : 0);
  const comInstagram = s.com_instagram ?? 0;
  const comAds = s.com_ads ?? 0;
  const comMaps = s.com_maps ?? 0;
  const comCnpj = s.com_cnpj ?? 0;

  document.getElementById('summaryGrid').innerHTML = `
    <div class="stat-card purple"><div class="num">${totalResults}</div><div class="label">Empresas</div></div>
    <div class="stat-card blue"><div class="num">${comSite}</div><div class="label">Com Site</div></div>
    <div class="stat-card red"><div class="num">${semSite} (${pctSemSite}%)</div><div class="label">Sem Site</div></div>
    <div class="stat-card green"><div class="num">${comInstagram}</div><div class="label">Com Instagram</div></div>
    <div class="stat-card yellow"><div class="num">${comAds}</div><div class="label">Com Ads</div></div>
    <div class="stat-card teal"><div class="num">${comMaps}</div><div class="label">Com Maps</div></div>
    ${comCnpj > 0 ? `<div class="stat-card green"><div class="num">${comCnpj}</div><div class="label">Com CNPJ</div></div>` : ''}
    ${comSiteEmail > 0 ? `<div class="stat-card green"><div class="num">${comSiteEmail}</div><div class="label">Email no Site</div></div>` : ''}
    ${comSitePhone > 0 ? `<div class="stat-card blue"><div class="num">${comSitePhone}</div><div class="label">Tel no Site</div></div>` : ''}
    ${comYoutube > 0 ? `<div class="stat-card red"><div class="num">${comYoutube}</div><div class="label">YouTube</div></div>` : ''}
    ${comTiktok > 0 ? `<div class="stat-card purple"><div class="num">${comTiktok}</div><div class="label">TikTok</div></div>` : ''}
  `;

  // Market IA Analysis
  const iaMarket = s.ia_market_analysis || s.ia_analysis || '';
  if (iaMarket) {
    document.getElementById('iaMarketAnalysis').style.display = 'block';
    const mktEl = document.getElementById('iaMarketText');
    if (typeof iaMarket === 'object') {
      let mktHtml = '';
      if (iaMarket.resumo) mktHtml += `<div class="market-section"><div class="ms-label">Resumo</div><div class="ms-value">${esc(iaMarket.resumo)}</div></div>`;
      if (iaMarket.pontos_fracos && iaMarket.pontos_fracos.length) mktHtml += `<div class="market-section"><div class="ms-label">Pontos Fracos</div><ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8">${iaMarket.pontos_fracos.map(f => `<li>${esc(typeof f === 'string' ? f : f.ponto || JSON.stringify(f))}</li>`).join('')}</ul></div>`;
      if (iaMarket.oportunidades && iaMarket.oportunidades.length) mktHtml += `<div class="market-section"><div class="ms-label">Oportunidades</div><ul class="market-opp-list">${iaMarket.oportunidades.map(o => `<li><span class="opp-title">${esc(o.titulo || o.servico || '')}</span> <span class="opp-desc">${esc(o.descricao || '')}</span> ${o.potencial ? `<span class="opp-pot ${o.potencial === 'alto' ? 'alto' : o.potencial === 'medio' ? 'medio' : 'baixo'}">(${esc(o.potencial)})</span>` : ''}</li>`).join('')}</ul></div>`;
      if (iaMarket.estrategia_entrada) mktHtml += `<div class="market-section"><div class="ms-label">Estratégia de Entrada</div><div class="ms-value">${esc(iaMarket.estrategia_entrada)}</div></div>`;
      if (iaMarket.ticket_medio_estimado) mktHtml += `<div class="market-section"><div class="ms-label">Ticket Médio Estimado</div><div class="ms-value" style="font-weight:700;color:var(--success);font-size:18px">${esc(iaMarket.ticket_medio_estimado)}</div></div>`;
      if (iaMarket.concorrencia) mktHtml += `<div class="market-section"><div class="ms-label">Concorrência</div><div class="ms-value">${esc(iaMarket.concorrencia)}</div></div>`;
      if (!mktHtml) mktHtml = `<pre style="white-space:pre-wrap;font-size:13px">${esc(JSON.stringify(iaMarket, null, 2))}</pre>`;
      mktEl.innerHTML = mktHtml;
    } else {
      mktEl.textContent = iaMarket;
    }
  } else {
    document.getElementById('iaMarketAnalysis').style.display = 'none';
  }

  // Filters + Lead list
  const filtersContainer = document.getElementById('filtersContainer');
  if (filtersContainer) {
    filtersContainer.innerHTML = renderFiltersBar();
    setupFilterEvents();
  }
  renderLeadList();

  loadHistory();
}

// ─── History ───

async function loadHistory() {
  try {
    const data = await apiGetHistory();
    const list = document.getElementById('historyList');
    if (!data.length) { list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Nenhuma busca ainda</div><div class="empty-desc">Comece buscando empresas por nicho e cidade.</div></div>'; return; }
    list.innerHTML = data.map(s => {
      const statusBadge = s.status ? `<span class="status-badge ${s.status}">${STEP_LABELS[s.status] || s.status}</span>` : '';
      return `<div class="history-item" role="listitem" tabindex="0" onclick="Prospector.loadSearch('${s.search_id}')" onkeydown="if(event.key==='Enter')Prospector.loadSearch('${s.search_id}')">
        <div class="hi-info">
          <div class="hi-niche">${esc(s.niche || 'N/A')}</div>
          <div class="hi-location">${esc(s.city || 'N/A')}-${esc(s.state || 'N/A')} <span style="color:var(--text2)">(${s.total_results ?? 0} resultados)</span> ${statusBadge}</div>
        </div>
        <div class="hi-right">
          <div style="color:var(--text3);font-size:12px">${esc(s.timestamp || '')}</div>
          <button class="btn-del-search" onclick="Prospector.deleteSearch('${s.search_id}', event)" title="Excluir busca" aria-label="Excluir busca">🗑️</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) {}
}

function loadSearch(id) {
  apiGetSearch(id).then(data => {
    if (data.error) { showToast('Não encontrado', 'error'); return; }
    setState('currentSearchId', id);
    setState('currentStatus', data.status);
    setState('currentData', data);
    renderResults(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }).catch(e => {
    showToast(e.message, 'error', 6000, () => loadSearch(id));
  });
}

// ─── Diagnosis Modal ───

function openDiagModal(leadId, event) {
  if (event) event.stopPropagation();
  const l = findLead(leadId);
  if (!l) return;
  document.getElementById('diagModal').classList.add('show');
  document.getElementById('diagBody').innerHTML = '<div class="loading-diag"><div class="spinner"></div><p>Carregando diagnóstico...</p></div>';
  renderDiagModal(l);
  document.getElementById('diagModal').focus();
}

function closeDiagModal() {
  document.getElementById('diagModal').classList.remove('show');
}

function renderDiagModal(l) {
  const score = l.score || 0;
  const scoreClass = score >= 60 ? 'high' : score >= 30 ? 'mid' : 'low';
  const diag = l.diagnostico;
  const iaAnalise = l.ia_analise;

  let htmlStr = '';

  // Header
  htmlStr += `<div class="modal-header">
    <h2>${esc(l.title || 'Lead')}</h2>
    <div class="modal-badges">
      <div class="modal-score ${scoreClass}">${score}/100</div>
      ${l.tem_site ? '<span class="badge badge-site">🌐 Site</span>' : '<span class="badge badge-no">🚫 Sem Site</span>'}
      ${l.tem_instagram ? '<span class="badge badge-insta">📸 Instagram</span>' : '<span class="badge badge-no">🚫 Sem IG</span>'}
      ${l.tem_maps ? `<span class="badge badge-maps">📍 Maps ${esc(l.maps_rating || '')}★</span>` : '<span class="badge badge-no">🚫 Sem Maps</span>'}
      ${l.tem_ads ? '<span class="badge badge-ads">💰 Ads</span>' : ''}
      ${l.cnpj ? '<span class="badge badge-site">📋 CNPJ</span>' : ''}
    </div>
  </div>`;

  // Dados Cadastrais
  const cadastroRows = [
    l.cnpj ? `<dt>CNPJ</dt><dd>${esc(l.cnpj)}${l.cnpj_source ? ` <span style="color:var(--accent);font-size:11px">(${esc(l.cnpj_source)})</span>` : ''}</dd>` : '',
    l.razao_social ? `<dt>Razão Social</dt><dd>${esc(l.razao_social)}</dd>` : '',
    l.situacao ? `<dt>Situação</dt><dd>${esc(l.situacao)}</dd>` : '',
    l.capital_social ? `<dt>Capital</dt><dd>R$${Number(l.capital_social).toLocaleString('pt-BR')}</dd>` : '',
    l.porte ? `<dt>Porte</dt><dd>${esc(l.porte)}</dd>` : '',
    l.cnae_descricao ? `<dt>Atividade</dt><dd>${esc(l.cnae_descricao)}</dd>` : '',
    (l.maps_phone || l.telefone_receita) ? `<dt>Telefone</dt><dd>${esc(l.maps_phone || l.telefone_receita)}</dd>` : '',
    (l.site_phones && l.site_phones.length) ? `<dt>Tel no site</dt><dd>${l.site_phones.map(p => esc(p)).join(', ')}</dd>` : '',
    (l.email_receita || (l.site_emails && l.site_emails.length)) ? `<dt>Email</dt><dd>${esc(l.email_receita || (l.site_emails || []).join(', '))}</dd>` : '',
    l.site_url ? `<dt>Site</dt><dd><a href="${esc(l.site_url)}" target="_blank" rel="noopener">${esc(l.site_url)}</a></dd>` : '',
    l.instagram_url ? `<dt>Instagram</dt><dd><a href="${esc(l.instagram_url)}" target="_blank" rel="noopener">${esc(l.instagram_url)}</a></dd>` : '',
    (l.facebook_url || l.site_facebook) ? `<dt>Facebook</dt><dd><a href="${esc(l.facebook_url || l.site_facebook)}" target="_blank" rel="noopener">${esc(l.facebook_url || l.site_facebook)}</a></dd>` : '',
    l.maps_address ? `<dt>Endereço</dt><dd>${esc(l.maps_address)}</dd>` : '',
    l.data_inicio ? `<dt>Início Atividade</dt><dd>${esc(l.data_inicio)}</dd>` : '',
    l.socios ? `<dt>Sócios</dt><dd>${l.socios.map(s => esc(s)).join(', ')}</dd>` : '',
  ].filter(Boolean).join('');

  if (cadastroRows) {
    htmlStr += `<div class="modal-section"><h3>📋 Dados Cadastrais</h3><div class="modal-cadastro">${cadastroRows}</div></div>`;
  }

  // Análise
  if (iaAnalise) {
    htmlStr += '<div class="modal-section"><h3>📋 Análise</h3>';
    if (typeof iaAnalise === 'object') {
      const fields = [
        ['Resumo', iaAnalise.resumo], ['Presença Digital', iaAnalise.presenca_digital],
        ['Posição no Mercado', iaAnalise.posicao_mercado], ['Público Esperado', iaAnalise.publico_esperado],
        ['Observações', iaAnalise.observacoes],
      ];
      for (const [label, val] of fields) {
        if (val) htmlStr += `<div class="analysis-field"><div class="af-label">${label}</div><div class="af-value">${esc(val)}</div></div>`;
      }
    } else {
      htmlStr += `<div class="ia-lead">${esc(String(iaAnalise))}</div>`;
    }
    htmlStr += `<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="Prospector.reanalyzeLead(${findLeadIndex(l.id)}, event)">🔄 Re-analisar</button></div>`;
    htmlStr += '</div>';
  }

  // Diagnóstico
  htmlStr += '<div class="modal-section"><h3>🔬 Diagnóstico</h3>';

  if (diag) {
    if (diag.pontos_fracos && diag.pontos_fracos.length) {
      htmlStr += `<h4 style="color:var(--error);margin:12px 0 6px">🔴 Pontos Fracos</h4>`;
      for (const f of diag.pontos_fracos) {
        if (typeof f === 'object') {
          htmlStr += `<div class="diag-fracos-card"><div class="dfc-ponto">${esc(f.ponto)}</div>`;
          if (f.impacto) htmlStr += `<div class="dfc-detail"><span>⚡ Impacto: ${esc(f.impacto)}</span></div>`;
          if (f.solucao) htmlStr += `<div class="dfc-solucao">💡 ${esc(f.solucao)}</div>`;
          htmlStr += '</div>';
        } else {
          htmlStr += `<ul style="margin:0;padding-left:18px"><li style="padding:4px 0">${esc(f)}</li></ul>`;
        }
      }
    }
    if (diag.pontos_fortes && diag.pontos_fortes.length) {
      htmlStr += `<h4 style="color:var(--success);margin:12px 0 6px">🟢 Pontos Fortes</h4>`;
      for (const f of diag.pontos_fortes) {
        if (typeof f === 'object') {
          htmlStr += `<div class="diag-fortes-card"><div class="dfc-ponto">${esc(f.ponto)}</div>`;
          if (f.como_aproveitar) htmlStr += `<div class="dfc-como">💡 ${esc(f.como_aproveitar)}</div>`;
          htmlStr += '</div>';
        } else {
          htmlStr += `<ul style="margin:0;padding-left:18px"><li style="padding:4px 0">${esc(f)}</li></ul>`;
        }
      }
    }
    const opp = diag.oportunidade_principal;
    if (opp && typeof opp === 'object' && (opp.servico || opp.investimento || opp.retorno_esperado || opp.prazo_resultado)) {
      htmlStr += `<div class="opp-principal-card"><div class="opp-title">🎯 ${esc(opp.servico || 'Oportunidade')}</div><div class="opp-details">`;
      if (opp.investimento) htmlStr += `<div class="opp-item"><div class="oi-label">Investimento</div><div class="oi-value">${esc(opp.investimento)}</div></div>`;
      if (opp.retorno_esperado) htmlStr += `<div class="opp-item"><div class="oi-label">Retorno Esperado</div><div class="oi-value">${esc(opp.retorno_esperado)}</div></div>`;
      if (opp.prazo_resultado) htmlStr += `<div class="opp-item"><div class="oi-label">Prazo</div><div class="oi-value">${esc(opp.prazo_resultado)}</div></div>`;
      htmlStr += '</div></div>';
    } else if (diag.oportunidades && diag.oportunidades.length) {
      htmlStr += `<h4 style="margin:12px 0 6px">🎯 Oportunidades</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">${diag.oportunidades.map(o => `<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px"><div style="font-weight:600;font-size:14px">${esc(o.servico)}</div><div style="font-size:12px;color:var(--text2)"><span>💰 ${esc(o.investimento_estimado)}</span> <span>📈 ${esc(o.retorno_estimado)}</span> <span>⏱️ ${esc(o.prazo)}</span></div></div>`).join('')}</div>`;
    }
    if (diag.urgencia) {
      const urgClass = diag.urgencia === 'alta' ? 'alta' : diag.urgencia === 'media' ? 'media' : 'baixa';
      const urgLabel = diag.urgencia === 'alta' ? '🔴 Alta' : diag.urgencia === 'media' ? '🟡 Média' : '🟢 Baixa';
      htmlStr += `<h4 style="margin:12px 0 6px">⏰ Urgência</h4><span class="urgency-badge ${urgClass}">${urgLabel}</span>`;
      if (diag.razao_urgencia || diag.urgencia_motivo) {
        htmlStr += `<p style="color:var(--text2);font-size:13px;margin-top:4px">${esc(diag.razao_urgencia || diag.urgencia_motivo)}</p>`;
      }
    }
    const waMsg = diag.abordagem_whatsapp || diag.abordagem_sugerida || '';
    if (waMsg) {
      const waPhone = l.maps_phone || l.telefone_receita || '';
      const waLink = waPhone ? `https://wa.me/55${waPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}` : null;
      htmlStr += `<h4 style="margin:12px 0 6px">💬 Abordagem WhatsApp</h4><div class="diag-abordagem">`;
      htmlStr += `<button class="copy-btn" onclick="Prospector.copyWhatsAppMsg('${esc(waPhone)}', this)">📋 Copiar WhatsApp</button>`;
      if (waLink) htmlStr += ` <a href="${waLink}" target="_blank" rel="noopener" class="copy-btn" style="text-decoration:none;left:auto">📲 Abrir no WhatsApp</a>`;
      htmlStr += `${esc(waMsg)}</div>`;
    }
    if (diag.estimativa_receita) {
      htmlStr += `<h4 style="margin:12px 0 6px">💰 Estimativa de Receita</h4><div class="diag-receita">${esc(diag.estimativa_receita)}</div>`;
    }
    htmlStr += `<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="Prospector.generateDiagnosis('${l.id}')" style="background:rgba(99,102,241,0.15);border:1px solid var(--brand-500)">🔄 Re-diagnosticar</button></div>`;
  } else {
    htmlStr += `<button class="diag-generate-btn" id="diagGenBtn" onclick="Prospector.generateDiagnosis('${l.id}')">🔬 Gerar Diagnóstico</button>`;
  }

  htmlStr += '</div>'; // close diagnóstico section

  // Actions
  const phone = l.maps_phone || l.telefone_receita || '';
  const waLink = phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : '#';
  htmlStr += `<div class="modal-actions">
    <button class="btn-action" onclick="Prospector.showEditForm('${l.id}', event); Prospector.closeDiagModal();">✏️ Editar</button>
    ${phone ? `<a href="${waLink}" target="_blank" rel="noopener" class="btn-action">💬 WhatsApp</a>` : ''}
    <button class="btn-action danger" onclick="Prospector.deleteLead('${l.id}', event); Prospector.closeDiagModal();">🗑️ Excluir</button>
  </div>`;

  document.getElementById('diagBody').innerHTML = htmlStr;
}

async function generateDiagnosis(leadId) {
  const btn = document.getElementById('diagGenBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Gerando diagnóstico...'; }
  document.getElementById('diagBody').innerHTML = '<div class="loading-diag"><div class="spinner"></div><p>Gerando diagnóstico com IA... (pode levar ~90s)</p></div>';
  try {
    const data = await apiDiagnose(AppState.currentSearchId, leadId);
    if (data.error) {
      showToast(data.error, 'error');
      const l = findLead(leadId);
      if (l) renderDiagModal(l);
      return;
    }
    await reloadSearch();
    const l = findLead(leadId);
    if (l) renderDiagModal(l);
    showToast('Diagnóstico gerado!', 'success');
  } catch (e) {
    showToast(e.message, 'error');
    const l = findLead(leadId);
    if (l) renderDiagModal(l);
  }
}

function copyWhatsAppMsg(phone, btn) {
  const diagBody = btn.closest('.diag-abordagem');
  if (!diagBody) return;
  const clone = diagBody.cloneNode(true);
  clone.querySelector('.copy-btn')?.remove();
  const msg = clone.textContent.trim();
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  } else {
    navigator.clipboard.writeText(msg).then(() => {
      btn.textContent = '✅ Copiado!';
      setTimeout(() => { btn.textContent = '📋 Copiar WhatsApp'; }, 2000);
    });
  }
}

function toggleLead(el) {
  el.classList.toggle('open');
}

// ─── Init ───

function init() {
  initState();
  loadHistory();

  // Enter key on search fields
  document.getElementById('niche').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  document.getElementById('city').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Modal close handlers
  document.getElementById('diagModal').addEventListener('click', function(e) {
    if (e.target === this) closeDiagModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDiagModal();
  });

  // Show skeleton on initial load
  showSkeletonHistory();
}

// ─── Expose as global namespace for inline event handlers ───
window.Prospector = {
  rerunStep, rerunStepApi, doSearch, showEditForm, saveEdit, cancelEdit,
  deleteLead, reanalyzeLead, showAnalysisEditor, saveAnalysis, deleteSearch,
  loadSearch, openDiagModal, closeDiagModal, generateDiagnosis, copyWhatsAppMsg,
  analyzeNextLead, analyzeAllLeads, runAll, toggleLead, findLeadIndex,
  // Expose state and components for components.js
  AppState, getFilteredLeads
};

init();