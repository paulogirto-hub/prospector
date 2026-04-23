/* ═══════════════════════════════════════════════════
   PROSPECTOR — Centralized State Management
   ═══════════════════════════════════════════════════ */

const AppState = {
  currentSearchId: null,
  currentStatus: null,
  currentData: null,
  pipelineRunning: false,
  isLoading: false,
  loadingText: 'Carregando...',
  progressText: '',
  // Filters
  filters: {
    tem_site: null,      // true, false, null (null = all)
    tem_instagram: null,
    tem_maps: null,
    tem_ads: null,
    tem_cnpj: null,
    searchText: '',
    sortBy: 'score_desc', // score_desc, score_asc, name_asc, rating_desc
  },
  // SSE
  sseConnection: null,
  // Recent searches cache (localStorage)
  recentSearches: [],
  // Error state per operation
  errors: {},
};

// Simple reactive proxy — calls onChange when any top-level key is set
function createReactiveState(initial, onChange) {
  const handler = {
    set(target, prop, value) {
      target[prop] = value;
      onChange(prop, value);
      return true;
    },
    get(target, prop) {
      return target[prop];
    }
  };
  return new Proxy(initial, handler);
}

const _listeners = [];

// Subscribe to state changes: callback(prop, newValue, oldValue)
function subscribe(callback) {
  _listeners.push(callback);
}

let _stateProxy = null;

function initState() {
  // Load recent searches from localStorage
  try {
    const cached = localStorage.getItem('prospector_recent_searches');
    if (cached) AppState.recentSearches = JSON.parse(cached);
  } catch (e) {}

  _stateProxy = createReactiveState(AppState, (prop, value) => {
    const oldValue = AppState[prop];
    AppState[prop] = value;
    _listeners.forEach(fn => fn(prop, value, oldValue));
  });

  return _stateProxy;
}

function getState() {
  return _stateProxy || AppState;
}

function setState(key, value) {
  if (_stateProxy) {
    _stateProxy[key] = value;
  } else {
    AppState[key] = value;
  }
}

// Save recent search to localStorage
function addRecentSearch(search) {
  const searches = AppState.recentSearches;
  const idx = searches.findIndex(s => s.search_id === search.search_id);
  if (idx >= 0) searches.splice(idx, 1);
  searches.unshift(search);
  if (searches.length > 20) searches.length = 20;
  try { localStorage.setItem('prospector_recent_searches', JSON.stringify(searches)); } catch (e) {}
}

// Get filtered leads based on current filters
function getFilteredLeads() {
  const data = AppState.currentData;
  if (!data || !data.leads) return [];
  let leads = [...data.leads];
  const f = AppState.filters;

  // Filter by boolean fields
  if (f.tem_site !== null) leads = leads.filter(l => l.tem_site === f.tem_site);
  if (f.tem_instagram !== null) leads = leads.filter(l => l.tem_instagram === f.tem_instagram);
  if (f.tem_maps !== null) leads = leads.filter(l => l.tem_maps === f.tem_maps);
  if (f.tem_ads !== null) leads = leads.filter(l => l.tem_ads === f.tem_ads);
  if (f.tem_cnpj !== null) leads = leads.filter(l => !!l.cnpj === f.tem_cnpj);

  // Filter by search text
  if (f.searchText) {
    const q = f.searchText.toLowerCase();
    leads = leads.filter(l => (l.title || '').toLowerCase().includes(q));
  }

  // Sort
  switch (f.sortBy) {
    case 'score_desc': leads.sort((a, b) => (b.score || 0) - (a.score || 0)); break;
    case 'score_asc': leads.sort((a, b) => (a.score || 0) - (b.score || 0)); break;
    case 'name_asc': leads.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    case 'rating_desc': leads.sort((a, b) => (b.maps_rating || 0) - (a.maps_rating || 0)); break;
    default: break;
  }

  return leads;
}

// Track error for retry
function setError(operation, message, retryFn) {
  AppState.errors[operation] = { message, retryFn, timestamp: Date.now() };
}

function clearError(operation) {
  delete AppState.errors[operation];
}

export { AppState, initState, getState, setState, subscribe, addRecentSearch, getFilteredLeads, setError, clearError };