//  DEEZER SEARCH 
// Depends on: audio, deezerAudio, initVisualizer, audioCtx,
//             isPlaying, renderQueue, addDeezerTrack 

let searchTimeout = null;

function handleSearch(query) {
    clearTimeout(searchTimeout);
    const q = query.trim();
    if (!q) { renderQueue(); return; }
    searchTimeout = setTimeout(() => searchDeezer(q), 400);
}

// Try multiple CORS proxies in order until one works
async function fetchWithProxyCascade(apiUrl) {
    const proxies = [
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        url => `https://thingproxy.freeboard.io/fetch/${url}`,
    ];

    for (const buildProxy of proxies) {
        try {
            const proxyUrl = buildProxy(apiUrl);
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
            if (!res.ok) continue;

            const text = await res.text();

            // allorigins wraps in { contents: "..." } — unwrap if needed
            try {
                const json = JSON.parse(text);
                if (json.contents !== undefined) return JSON.parse(json.contents);
                return json;
            } catch {
                continue;
            }
        } catch (e) {
            console.warn('Proxy failed, trying next...', e.message);
        }
    }
    throw new Error('All proxies failed — check your connection or try again shortly.');
}

async function searchDeezer(query) {
    const container = document.getElementById('queue-list');
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-purple-400 text-xl mb-3"></i>
        <p class="text-slate-500 text-sm">Searching Deezer...</p>
      </div>`;

    try {
        const apiUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15`;
        const data = await fetchWithProxyCascade(apiUrl);

        if (!data.data || data.data.length === 0) {
            container.innerHTML = `
              <div class="text-center py-8">
                <p class="text-slate-500 text-sm">No results for "${escapeHtml(query)}"</p>
                <button onclick="renderQueue()" class="text-purple-400 text-xs mt-2 hover:text-purple-300">
                  ← Back to queue
                </button>
              </div>`;
            return;
        }

        renderSearchResults(data.data, query);

    } catch (err) {
        container.innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-wifi text-red-400 text-xl mb-3"></i>
            <p class="text-red-400 text-sm font-medium">Search failed</p>
            <p class="text-slate-500 text-xs mt-1">${escapeHtml(err.message)}</p>
            <button onclick="searchDeezer('${escapeStr(query)}')" class="text-xs text-purple-400 underline mt-3 hover:text-purple-300">Retry</button>
            <button onclick="renderQueue()" class="text-xs text-slate-500 underline mt-3 ml-3 hover:text-slate-400">← Queue</button>
          </div>`;
        console.error('Deezer search error:', err);
    }
}

// Fetch a fresh preview URL for a Deezer track by its ID
async function getFreshDeezerUrl(deezerId) {
    try {
        const apiUrl = `https://api.deezer.com/track/${deezerId}`;
        const data = await fetchWithProxyCascade(apiUrl);
        return data.preview || null;
    } catch (e) {
        console.error('Failed to refresh Deezer URL:', e);
        return null;
    }
}

function renderSearchResults(tracks, query) {
    const container = document.getElementById('queue-list');
    if (!container) return;

    // Build track rows safely — store data in a map to avoid inline-attribute escaping bugs
    const trackMap = {};
    tracks.forEach(track => { trackMap[track.id] = track; });

    container.innerHTML = `
      <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span class="text-xs text-slate-500 font-mono">${tracks.length} results</span>
        <button onclick="renderQueue()" class="text-xs text-purple-400 hover:text-purple-300 transition-colors">
          ← Queue
        </button>
      </div>
      ${tracks.map(track => `
      <div class="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors group">

        <img src="${escapeHtml(track.album.cover_medium)}"
          class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          onerror="this.src='https://placehold.co/40x40/1e293b/7c3aed?text=♪'">

        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-300 truncate">${escapeHtml(track.title)}</p>
          <p class="text-xs text-slate-500 truncate">${escapeHtml(track.artist.name)}</p>
        </div>

        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onclick="previewDeezerTrack(null, ${track.id}, '${escapeStr(track.title)}')"
            class="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center
                   text-slate-400 hover:text-white transition-colors" title="Preview 30s">
            <i class="fas fa-play text-xs"></i>
          </button>
          <button onclick="addDeezerTrack(${track.id}, '${escapeStr(track.title)}', '${escapeStr(track.artist.name)}', '${escapeStr(track.preview || '')}', '${escapeStr(track.album.cover_medium)}')"
            class="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center
                   text-white transition-colors" title="Add to queue">
            <i class="fas fa-plus text-xs"></i>
          </button>
        </div>

      </div>`).join('')}`;
}

// Preview 30s — plays through visualizer, does NOT add to queue
async function previewDeezerTrack(previewUrl, deezerId, title) {
    audio.pause();
    audio.src = '';
    initVisualizer();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Always fetch a fresh URL (preview URLs from search results expire quickly)
    const freshUrl = deezerId ? await getFreshDeezerUrl(deezerId) : previewUrl;
    if (!freshUrl) { console.error('Preview URL expired and could not refresh'); return; }

    deezerAudio.src = freshUrl;
    deezerAudio.load();
    deezerAudio.play().catch(e => console.error('Preview failed:', e));
    isPlaying = true;

    const btn = document.getElementById('btn-playpause');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';

    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) nameEl.textContent = `Preview: ${title}`;
}

// Escape for use inside HTML attribute single-quote strings (onclick="...")
function escapeStr(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Escape for use in HTML text content / attribute values
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
