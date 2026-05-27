const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const API_BASE      = 'api';

const searchForm        = document.getElementById('searchForm');
const searchInput       = document.getElementById('searchInput');
const searchBtn         = document.getElementById('searchBtn');
const resultsContainer  = document.getElementById('resultsContainer');
const loadingIndicator  = document.getElementById('loadingIndicator');
const errorMessage      = document.getElementById('errorMessage');
const historyList       = document.getElementById('historyList');
const historyAlert      = document.getElementById('historyAlert');
const clearHistoryBtn   = document.getElementById('clearHistoryBtn');

let isSearching = false;
let currentTerm = '';
let currentPage = 1;
let totalHits   = 0;
const PAGE_SIZE = 10;
const MAX_PAGES = 20;

document.addEventListener('DOMContentLoaded', () => {
    searchForm.addEventListener('submit', handleSearch);
    clearHistoryBtn.addEventListener('click', handleClearHistory);
    loadHistory();
});

async function handleSearch(event) {
    event.preventDefault();
    const term = searchInput.value.trim();
    if (!term || isSearching) return;

    currentTerm = term;
    currentPage = 1;
    await performSearch({ saveHistory: true });
}

async function performSearch({ saveHistory = false } = {}) {
    isSearching = true;
    setSearchLoading(true);
    hideError();

    try {
        const offset = (currentPage - 1) * PAGE_SIZE;
        const { results, total } = await searchWikipedia(currentTerm, offset);
        totalHits = total;
        renderResults(results, currentTerm);
        renderPagination();
        if (saveHistory) {
            await saveSearch(currentTerm, total);
            await loadHistory();
        }
    } catch (err) {
        showError(err.message);
    } finally {
        isSearching = false;
        setSearchLoading(false);
    }
}

async function handleClearHistory() {
    if (!confirm('¿Seguro que deseas borrar todo el historial?')) return;

    try {
        const res  = await fetch(`${API_BASE}/clear_history.php`, { method: 'POST' });
        const data = await res.json();

        if (!res.ok || data.error) throw new Error(data.error || 'Error al limpiar el historial');

        renderHistory([]);
        showHistoryAlert('Historial eliminado correctamente.');
    } catch (err) {
        showHistoryAlert(`Error: ${err.message}`, true);
    }
}

async function searchWikipedia(term, offset = 0) {
    const params = new URLSearchParams({
        action:   'query',
        list:     'search',
        srsearch: term,
        format:   'json',
        origin:   '*',
        srlimit:  String(PAGE_SIZE),
        sroffset: String(offset),
        srprop:   'snippet|size|wordcount|timestamp',
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`);
    if (!response.ok) {
        throw new Error(`Error al conectar con Wikipedia (HTTP ${response.status})`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`Wikipedia: ${data.error.info}`);
    }

    if (!data.query?.search) {
        throw new Error('Respuesta inesperada de la API de Wikipedia.');
    }

    return {
        results: data.query.search,
        total:   data.query.searchinfo?.totalhits ?? 0,
    };
}

async function saveSearch(term, resultsCount) {
    try {
        const res = await fetch(`${API_BASE}/save_search.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ search_term: term, results_count: resultsCount }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Error desconocido');
    } catch (err) {
        showHistoryAlert('No se pudo guardar la búsqueda en el historial.', true);
    }
}

async function loadHistory() {
    try {
        const res  = await fetch(`${API_BASE}/get_history.php`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error);
        renderHistory(data.history);
    } catch (err) {
        historyList.innerHTML = '<li class="history-empty">No se pudo cargar el historial</li>';
    }
}

function renderResults(results, term) {
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No se encontraron resultados para <strong>"${escapeHtml(term)}"</strong>.</p>
            </div>`;
        return;
    }

    const displayTotal = totalHits.toLocaleString('es-ES');
    const header = `
        <div class="results-header">
            <span>${displayTotal} resultado${totalHits !== 1 ? 's' : ''} para
                <strong>"${escapeHtml(term)}"</strong>
            </span>
        </div>`;

    const items = results.map(result => `
        <li class="result-item">
            <h3 class="result-title">
                <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(result.title).replaceAll('%20', '_')}"
                   target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(result.title)}
                </a>
            </h3>
            <p class="result-snippet">${sanitizeSnippet(result.snippet || '')}&hellip;</p>
            <div class="result-meta">
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${formatDate(result.timestamp)}
                </span>
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    ${(result.wordcount ?? 0).toLocaleString()} palabras
                </span>
            </div>
        </li>`).join('');

    resultsContainer.innerHTML = `<div class="results-card">${header}<ul class="results-list">${items}</ul></div>`;
}

function renderHistory(history) {
    if (!history || history.length === 0) {
        historyList.innerHTML = '<li class="history-empty">No hay búsquedas recientes</li>';
        return;
    }

    historyList.innerHTML = history.map(entry => `
        <li class="history-item" data-term="${escapeHtml(entry.search_term)}" role="button" tabindex="0"
            title="Buscar de nuevo: ${escapeHtml(entry.search_term)}">
            <span class="history-item__icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </span>
            <span class="history-item__body">
                <span class="history-item__term">${escapeHtml(entry.search_term)}</span>
                <span class="history-item__meta">${formatRelativeTime(entry.searched_at)}</span>
            </span>
            <span class="history-item__count" aria-label="${entry.results_count} resultados">
                ${Number(entry.results_count).toLocaleString('es-ES')}
            </span>
        </li>`).join('');

    historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click',   () => repeatSearch(item.dataset.term));
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                repeatSearch(item.dataset.term);
            }
        });
    });
}

function renderPagination() {
    const totalPages = Math.min(Math.ceil(totalHits / PAGE_SIZE), MAX_PAGES);

    const card = resultsContainer.querySelector('.results-card');
    const existing = document.getElementById('paginationContainer');
    if (existing) existing.remove();
    if (!card || totalPages <= 1) return;

    const nav = document.createElement('nav');
    nav.id = 'paginationContainer';
    nav.className = 'pagination';
    nav.setAttribute('aria-label', 'Paginación de resultados');

    nav.innerHTML = `
        <button class="pagination__btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Anterior
        </button>
        <span class="pagination__info">Página <strong>${currentPage}</strong> de ${totalPages}</span>
        <button class="pagination__btn" id="nextBtn" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Página siguiente">
            Siguiente
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>`;

    card.appendChild(nav);

    nav.querySelector('#prevBtn').addEventListener('click', () => {
        if (currentPage > 1 && !isSearching) {
            currentPage--;
            performSearch();
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    nav.querySelector('#nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages && !isSearching) {
            currentPage++;
            performSearch();
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function repeatSearch(term) {
    searchInput.value = term;
    searchInput.focus();
    currentPage = 1;
    searchForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function setSearchLoading(loading) {
    loadingIndicator.classList.toggle('hidden', !loading);
    if (loading) resultsContainer.innerHTML = '';
    searchBtn.disabled = loading;
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
}

function showHistoryAlert(msg, isError = false) {
    historyAlert.textContent = msg;
    historyAlert.className = `alert ${isError ? 'alert--error' : 'alert--info'}`;
    historyAlert.classList.remove('hidden');
    setTimeout(() => historyAlert.classList.add('hidden'), 3500);
}

function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, ch => map[ch]);
}

// Preserva solo los spans de búsqueda resaltada; descarta el resto de etiquetas HTML
function sanitizeSnippet(snippet) {
    const div = document.createElement('div');
    div.innerHTML = snippet;

    let result = '';
    div.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            result += escapeHtml(node.textContent);
        } else if (node.nodeName === 'SPAN' && node.className === 'searchmatch') {
            result += `<span style="font-weight:700;background:#fef08a;border-radius:2px;padding:0 1px">${escapeHtml(node.textContent)}</span>`;
        } else {
            result += escapeHtml(node.textContent);
        }
    });
    return result;
}

function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-ES', {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
    });
}

function formatRelativeTime(datetimeStr) {
    if (!datetimeStr) return '';
    // MySQL devuelve la fecha sin zona horaria; 'Z' fuerza la lectura como UTC
    const date = new Date(datetimeStr.replace(' ', 'T') + 'Z');
    const diff = Math.floor((new Date() - date) / 1000);

    if (diff < 60)    return 'Hace un momento';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
