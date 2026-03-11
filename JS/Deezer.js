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

async function searchDeezer(query) {
    const container = document.getElementById('queue-list');
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-purple-400 text-xl mb-3"></i>
        <p class="text-slate-500 text-sm">Searching Deezer...</p>
      </div>`;

    try {
        const url  = `https://corsproxy.io/?https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15`;
        const res  = await fetch(url);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            container.innerHTML = `
              <div class="text-center py-8">
                <p class="text-slate-500 text-sm">No results for "${query}"</p>
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
            <p class="text-red-400 text-sm">Search failed. Check your connection.</p>
          </div>`;
        console.error('Deezer search error:', err);
    }
}

function renderSearchResults(tracks, query) {
    const container = document.getElementById('queue-list');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span class="text-xs text-slate-500 font-mono">${tracks.length} results</span>
        <button onclick="renderQueue()" class="text-xs text-purple-400 hover:text-purple-300 transition-colors">
          ← Queue
        </button>
      </div>
      ${tracks.map(track => `
      <div class="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors group">

        <img src="${track.album.cover_medium}"
          class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          onerror="this.src='https://placehold.co/40x40/1e293b/7c3aed?text=♪'">

        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-300 truncate">${track.title}</p>
          <p class="text-xs text-slate-500 truncate">${track.artist.name}</p>
        </div>

        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onclick="previewDeezerTrack('${track.preview}', '${escapeStr(track.title)}')"
            class="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center
                   text-slate-400 hover:text-white transition-colors" title="Preview 30s">
            <i class="fas fa-play text-xs"></i>
          </button>
          <button onclick="addDeezerTrack(${track.id}, '${escapeStr(track.title)}', '${escapeStr(track.artist.name)}', '${track.preview}', '${track.album.cover_medium}')"
            class="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center
                   text-white transition-colors" title="Add to queue">
            <i class="fas fa-plus text-xs"></i>
          </button>
        </div>

      </div>`).join('')}`;
}

// Preview 30s — plays through visualizer, does NOT add to queue
function previewDeezerTrack(previewUrl, title) {
    audio.pause();
    audio.src = '';

    // Init full audio graph so visualizer works
    initVisualizer();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    deezerAudio.src = previewUrl;
    deezerAudio.load();
    deezerAudio.play().catch(e => console.error('Preview failed:', e));
    isPlaying = true;

    const btn = document.getElementById('btn-playpause');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';

    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) nameEl.textContent = `Preview: ${title}`;
}

function escapeStr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
