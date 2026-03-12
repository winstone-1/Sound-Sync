//  SPOTIFY WEB PLAYBACK SDK — PKCE Auth Flow
//  Depends on: isPlaying, renderQueue, addDeezerTrack, queue, currentIndex

const SPOTIFY_CLIENT_ID    = 'e444f2bef5804134ba0203a60b4775b3';
const SPOTIFY_REDIRECT_URI = 'https://winstone-1.github.io/Sound-Sync/';
const SPOTIFY_SCOPES       = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
].join(' ');

let spotifyPlayer   = null;
let spotifyDeviceId = null;
let spotifyToken    = null;
let searchTimeout   = null;

// ─── PKCE HELPERS ────────────────────────────────────────────────────────────

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(x => chars[x % chars.length]).join('');
}

async function generateCodeChallenge(codeVerifier) {
    const data   = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function spotifyLogin() {
    const codeVerifier  = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
        client_id:             SPOTIFY_CLIENT_ID,
        response_type:         'code',
        redirect_uri:          SPOTIFY_REDIRECT_URI,
        scope:                 SPOTIFY_SCOPES,
        code_challenge_method: 'S256',
        code_challenge:        codeChallenge,
    });

    window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
}

async function exchangeCodeForToken(code) {
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) { console.error('No code verifier found'); return null; }

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id:     SPOTIFY_CLIENT_ID,
            grant_type:    'authorization_code',
            code,
            redirect_uri:  SPOTIFY_REDIRECT_URI,
            code_verifier: codeVerifier,
        }),
    });

    if (!res.ok) { console.error('Token exchange failed:', await res.text()); return null; }

    const data = await res.json();
    sessionStorage.removeItem('spotify_code_verifier');

    localStorage.setItem('spotify_token',         data.access_token);
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
    localStorage.setItem('spotify_token_expiry',  Date.now() + data.expires_in * 1000);

    return data.access_token;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) return null;

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id:     SPOTIFY_CLIENT_ID,
            grant_type:    'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!res.ok) { console.error('Token refresh failed'); return null; }

    const data = await res.json();
    localStorage.setItem('spotify_token',        data.access_token);
    localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000);
    if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);

    return data.access_token;
}

function loadStoredSpotifyToken() {
    const token  = localStorage.getItem('spotify_token');
    const expiry = parseInt(localStorage.getItem('spotify_token_expiry') || '0');
    if (token && Date.now() < expiry - 60000) {
        spotifyToken = token;
        return token;
    }
    return null;
}

function spotifyLogout() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    spotifyToken    = null;
    spotifyDeviceId = null;
    if (spotifyPlayer) { spotifyPlayer.disconnect(); spotifyPlayer = null; }
    updateSpotifyUI(false);
}

// ─── SDK INIT ────────────────────────────────────────────────────────────────

window.onSpotifyWebPlaybackSDKReady = function () {
    const token = loadStoredSpotifyToken();
    if (!token) { updateSpotifyUI(false); return; }
    initSpotifyPlayer(token);
};

function initSpotifyPlayer(token) {
    spotifyPlayer = new Spotify.Player({
        name: 'SoundSync',
        getOAuthToken: async cb => {
            // Auto-refresh if token is close to expiry
            let t = loadStoredSpotifyToken();
            if (!t) t = await refreshAccessToken();
            if (t) { spotifyToken = t; cb(t); }
        },
        volume: 0.8
    });

    spotifyPlayer.addListener('ready', ({ device_id }) => {
        spotifyDeviceId = device_id;
        console.log('Spotify ready, device:', device_id);
        updateSpotifyUI(true);
    });

    spotifyPlayer.addListener('not_ready', () => {
        spotifyDeviceId = null;
        updateSpotifyUI(false);
    });

    spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        const track = state.track_window?.current_track;
        if (!track) return;
        isPlaying = !state.paused;
        const btn = document.getElementById('btn-playpause');
        if (btn) btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        const nameEl = document.getElementById('now-playing-name');
        if (nameEl) nameEl.textContent = track.name;
    });

    spotifyPlayer.addListener('authentication_error', async () => {
        console.warn('Spotify auth error, attempting refresh...');
        const newToken = await refreshAccessToken();
        if (newToken) { spotifyToken = newToken; spotifyPlayer.connect(); }
        else spotifyLogout();
    });

    spotifyPlayer.connect();
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function updateSpotifyUI(connected) {
    const loginBtn  = document.getElementById('spotify-login-btn');
    const logoutBtn = document.getElementById('spotify-logout-btn');
    const badge     = document.getElementById('spotify-badge');
    if (loginBtn)  loginBtn.classList.toggle('hidden', connected);
    if (logoutBtn) logoutBtn.classList.toggle('hidden', !connected);
    if (badge)     badge.classList.toggle('hidden', !connected);
}

// ─── SEARCH ──────────────────────────────────────────────────────────────────

function handleSearch(query) {
    clearTimeout(searchTimeout);
    const q = query.trim();
    if (!q) { renderQueue(); return; }
    searchTimeout = setTimeout(() => searchTracks(q), 300);
}

async function searchTracks(query) {
    const container = document.getElementById('queue-list');
    if (!container) return;

    if (!spotifyToken) {
        container.innerHTML = `
          <div class="text-center py-8">
            <i class="fab fa-spotify text-green-400 text-3xl mb-3"></i>
            <p class="text-slate-400 text-sm mb-3">Connect Spotify to search</p>
            <button onclick="spotifyLogin()"
              class="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-full transition-colors">
              Connect Spotify
            </button>
          </div>`;
        return;
    }

    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-purple-400 text-xl mb-3"></i>
        <p class="text-slate-500 text-sm">Searching Spotify...</p>
      </div>`;

    try {
        const res = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`,
            { headers: { Authorization: `Bearer ${spotifyToken}` } }
        );

        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) { spotifyToken = newToken; searchTracks(query); }
            else { spotifyLogout(); searchTracks(query); }
            return;
        }
        if (!res.ok) throw new Error(`Spotify error: ${res.status}`);

        const data   = await res.json();
        const tracks = data.tracks?.items || [];

        if (tracks.length === 0) {
            container.innerHTML = `
              <div class="text-center py-8">
                <p class="text-slate-500 text-sm">No results for "${escapeHtml(query)}"</p>
                <button onclick="renderQueue()" class="text-purple-400 text-xs mt-2 hover:text-purple-300">← Back to queue</button>
              </div>`;
            return;
        }

        renderSearchResults(tracks);

    } catch (err) {
        container.innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-wifi text-red-400 text-xl mb-3"></i>
            <p class="text-red-400 text-sm font-medium">Search failed</p>
            <p class="text-slate-500 text-xs mt-1">${escapeHtml(err.message)}</p>
            <button onclick="searchTracks('${escapeStr(query)}')" class="text-xs text-purple-400 underline mt-3">Retry</button>
            <button onclick="renderQueue()" class="text-xs text-slate-500 underline mt-3 ml-3">← Queue</button>
          </div>`;
        console.error('Search error:', err);
    }
}

function renderSearchResults(tracks) {
    const container = document.getElementById('queue-list');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span class="text-xs text-slate-500 font-mono">${tracks.length} results</span>
        <button onclick="renderQueue()" class="text-xs text-purple-400 hover:text-purple-300 transition-colors">← Queue</button>
      </div>
      ${tracks.map(track => {
          const art     = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '';
          const minutes = Math.floor(track.duration_ms / 60000);
          const seconds = String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0');
          return `
      <div class="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors group">
        <img src="${escapeHtml(art)}"
          class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          onerror="this.src='https://placehold.co/40x40/1e293b/7c3aed?text=♪'">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-300 truncate">${escapeHtml(track.name)}</p>
          <p class="text-xs text-slate-500 truncate">${escapeHtml(track.artists.map(a => a.name).join(', '))}</p>
        </div>
        <span class="text-xs text-slate-600 flex-shrink-0 mr-1">${minutes}:${seconds}</span>
        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onclick="addDeezerTrack('${escapeStr(track.uri)}', '${escapeStr(track.name)}', '${escapeStr(track.artists.map(a=>a.name).join(', '))}', '${escapeStr(track.uri)}', '${escapeStr(art)}')"
            class="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors" title="Add to queue">
            <i class="fas fa-plus text-xs"></i>
          </button>
        </div>
      </div>`;
      }).join('')}`;
}

// ─── PLAYBACK ────────────────────────────────────────────────────────────────

async function playSpotifyTrack(spotifyUri) {
    if (!spotifyToken || !spotifyDeviceId) {
        console.error('Spotify not ready — token or device missing');
        return;
    }
    const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${spotifyToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [spotifyUri] })
    });
    if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) { spotifyToken = newToken; playSpotifyTrack(spotifyUri); }
    }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function escapeStr(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
(async function () {
    // Handle redirect back from Spotify with ?code=...
    const urlParams = new URLSearchParams(window.location.search);
    const code      = urlParams.get('code');

    if (code) {
        // Clean URL immediately
        history.replaceState(null, '', window.location.pathname);
        const token = await exchangeCodeForToken(code);
        if (token) {
            spotifyToken = token;
            // SDK may already be ready — init player now
            if (window.Spotify) initSpotifyPlayer(token);
        }
    } else {
        loadStoredSpotifyToken();
    }

    updateSpotifyUI(!!spotifyToken);
})();