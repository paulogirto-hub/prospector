/* ═══════════════════════════════════════════════════
   PROSPECTOR — API Module
   ═══════════════════════════════════════════════════ */

const API = window.location.origin;

// ─── Safe Fetch with Error Handling ───

async function safeFetch(url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { const j = await r.json(); msg = (j.error && j.error.message) || j.error || msg; } catch(_){}
      throw new Error(msg);
    }
    const text = await r.text();
    if (!text) throw new Error('Resposta vazia do servidor');
    try {
      const parsed = JSON.parse(text);
      // Handle API v2 error envelope {success: false, error: {...}}
      if (parsed && parsed.success === false && parsed.error) {
        const errMsg = (parsed.error && parsed.error.message) || parsed.error || 'Erro desconhecido';
        throw new Error(errMsg);
      }
      // Unwrap {success, data} envelope from API v2
      if (parsed && parsed.success === true && 'data' in parsed) {
        return parsed.data;
      }
      return parsed;
    } catch(e) {
      if (e.message && !e.message.includes('Servidor')) throw e;
      throw new Error('Servidor retornou resposta inválida. Tente novamente.');
    }
  } catch (e) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('Erro de conexão com o servidor. Verifique se está online.');
    }
    throw e;
  }
}

// ─── SSE (Server-Sent Events) with Polling Fallback ───

function connectSSE(searchId, onUpdate, onError) {
  // Close existing connection
  disconnectSSE();

  let evtSource = null;
  let fallbackInterval = null;

  function startSSE() {
    try {
      evtSource = new EventSource(`${API}/api/search/${searchId}/stream`);

      evtSource.addEventListener('update', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onUpdate) onUpdate(data);
        } catch (err) {
          console.warn('SSE parse error:', err);
        }
      });

      evtSource.addEventListener('complete', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onUpdate) onUpdate(data);
        } catch (err) {}
        disconnectSSE();
      });

      evtSource.onerror = () => {
        // SSE failed, fall back to polling
        console.warn('SSE connection error, falling back to polling');
        evtSource.close();
        evtSource = null;
        startPollingFallback();
      };
    } catch (e) {
      // EventSource not available, use polling
      startPollingFallback();
    }
  }

  function startPollingFallback() {
    fallbackInterval = setInterval(async () => {
      try {
        const data = await safeFetch(API + '/api/search/' + searchId);
        if (onUpdate) onUpdate(data);
        // Stop polling if status is final
        if (data.status && !['discovering', 'enriching', 'analyzing_leads'].includes(data.status)) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      } catch (e) {
        if (onError) onError(e);
      }
    }, 3000);
  }

  startSSE();

  // Return disconnect function
  AppState.sseConnection = {
    close() {
      if (evtSource) { evtSource.close(); evtSource = null; }
      if (fallbackInterval) { clearInterval(fallbackInterval); fallbackInterval = null; }
    }
  };

  return AppState.sseConnection;
}

function disconnectSSE() {
  if (AppState.sseConnection) {
    AppState.sseConnection.close();
    AppState.sseConnection = null;
  }
}

// ─── API Functions ───

async function apiCreateSearch(niche, city, state) {
  return safeFetch(API + '/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ niche, city, state })
  });
}

async function apiGetSearch(searchId) {
  return safeFetch(API + '/api/search/' + searchId);
}

async function apiRunStep(searchId, step) {
  return safeFetch(API + `/api/search/${searchId}/${step}`, { method: 'POST' });
}

async function apiUpdateLead(searchId, leadId, updates) {
  return safeFetch(API + `/api/search/${searchId}/lead/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
}

async function apiDeleteLead(searchId, leadId) {
  return safeFetch(API + `/api/search/${searchId}/lead/${leadId}`, { method: 'DELETE' });
}

async function apiAnalyzeLeads(searchId, all = false) {
  const url = all ? `${API}/api/search/${searchId}/analyze-leads?all=true` : `${API}/api/search/${searchId}/analyze-leads`;
  return safeFetch(url, { method: 'POST' });
}

async function apiAnalyzeSingleLead(searchId, leadIndex) {
  return safeFetch(API + `/api/search/${searchId}/analyze-leads/${leadIndex}`, { method: 'POST' });
}

async function apiDiagnose(searchId, leadId) {
  return safeFetch(API + `/api/search/${searchId}/diagnose/${leadId}`, { method: 'POST' });
}

async function apiSaveAnalysis(searchId, leadId, text) {
  return safeFetch(API + `/api/search/${searchId}/lead/${leadId}/analysis`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ia_analise: text })
  });
}

async function apiGetHistory() {
  return safeFetch(API + '/api/history');
}

async function apiDeleteSearch(searchId) {
  return safeFetch(API + `/api/search/${searchId}`, { method: 'DELETE' });
}

export {
  API, safeFetch, connectSSE, disconnectSSE,
  apiCreateSearch, apiGetSearch, apiRunStep,
  apiUpdateLead, apiDeleteLead, apiAnalyzeLeads,
  apiAnalyzeSingleLead, apiDiagnose, apiSaveAnalysis,
  apiGetHistory, apiDeleteSearch
};