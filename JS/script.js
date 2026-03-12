//  STATE 
let audioCtx;
let analyser;
let source;
let deezerSource;
let dataArray;
let animationId;
let gainNode;
let isPlaying    = false;
let queue        = [];
let currentIndex = -1;
let nextId       = 1;

//  DOM 
const audio       = document.getElementById('audio-player');
const deezerAudio = document.getElementById('deezer-player');
const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const fileInput   = document.getElementById('audio');

//  AUTO-ADVANCE 
audio.addEventListener('ended', () => {
    isPlaying = false;
    currentIndex < queue.length - 1 ? playNext() : resetPlayButton();
});
deezerAudio.addEventListener('ended', () => {
    isPlaying = false;
    currentIndex < queue.length - 1 ? playNext() : resetPlayButton();
});
function resetPlayButton() {
    const btn = document.getElementById('btn-playpause');
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
}

//  FILE INPUT 
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    addToQueue(file);
    if (currentIndex === -1) playTrack(queue.length - 1);
});

//  PLAY TRACK 
async function playTrack(index) {
    if (index < 0 || index >= queue.length) return;
    const track  = queue[index];
    currentIndex = index;

    // Both players share one audio graph — always init
    initVisualizer();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (track.url.startsWith('blob:')) {
        deezerAudio.pause(); deezerAudio.src = '';
        audio.src = track.url;
        audio.load();
        audio.play().catch(console.error);
   } else {
        audio.pause(); audio.src = '';

        // Always fetch a fresh URL — Deezer CDN links expire in ~2 minutes
        const freshUrl = track.deezerId
            ? await getFreshDeezerUrl(track.deezerId)
            : track.url;

        if (!freshUrl) {
            console.error('Could not get fresh Deezer URL');
            return;
        }

        // Update stored URL so next play is also fresh if called quickly
        track.url = freshUrl;

        deezerAudio.src = freshUrl;
        deezerAudio.load();
        deezerAudio.play().catch(e => console.error('Deezer play failed:', e));
    }
    isPlaying = true;

    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) nameEl.textContent = track.title;

    const btn = document.getElementById('btn-playpause');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';

    // Stats — session play count
    const plays = parseInt(sessionStorage.getItem('soundsync_plays') || '0');
    sessionStorage.setItem('soundsync_plays', plays + 1);

    // Stage — broadcast now playing
    localStorage.setItem('soundsync_nowplaying', JSON.stringify({
        title: track.title, artist: track.artist, cover: track.cover || null
    }));

    renderQueue();
}

function playNext() { if (currentIndex < queue.length - 1) playTrack(currentIndex + 1); }
function playPrev() { if (currentIndex > 0) playTrack(currentIndex - 1); }

//  ADD LOCAL FILE 
function addToQueue(file) {
    const track = {
        id: nextId++,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        artist: 'Local File', votes: 0,
        url: URL.createObjectURL(file), cover: null, file
    };
    queue.push(track);
    renderQueue();
    return track;
}

//  ADD DEEZER TRACK 
function addDeezerTrack(id, title, artist, previewUrl, cover) {
    queue.push({ id: nextId++, title, artist, votes: 0, url: previewUrl, deezerId: id, cover, file: null });
    renderQueue();
    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) {
        const prev = nameEl.textContent;
        nameEl.textContent = `✓ Added: ${title}`;
        setTimeout(() => { nameEl.textContent = queue[currentIndex]?.title || prev; }, 1500);
    }
}

//  VOTE 
function voteForTrack(id) {
    const track = queue.find(t => t.id === id);
    if (!track) return;
    track.votes++;
    const current = queue[currentIndex];
    queue.sort((a, b) => b.votes - a.votes);
    currentIndex = queue.indexOf(current);
    renderQueue();
}

//  RENDER QUEUE 
function renderQueue() {
    const container = document.getElementById('queue-list');
    if (!container) return;
    const countEl = document.getElementById('queue-count');
    if (countEl) countEl.textContent = `${queue.length} track${queue.length !== 1 ? 's' : ''}`;

    if (queue.length === 0) {
        container.innerHTML = `<div class="text-center py-8">
            <p class="text-slate-600 text-sm font-mono">Queue is empty</p>
            <p class="text-slate-700 text-xs mt-1">Search or open a file</p></div>`;
        return;
    }

    container.innerHTML = queue.map((track, index) => {
        const isActive = index === currentIndex;
        return `
        <div class="flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer
             ${isActive ? 'bg-purple-600/20 border-l-2 border-purple-500' : 'hover:bg-slate-800/60'}"
             onclick="playTrack(${index})">
          ${track.cover
            ? `<img src="${track.cover}" class="w-9 h-9 rounded-lg object-cover flex-shrink-0">`
            : `<div class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                 <i class="fas fa-music text-slate-600 text-xs"></i></div>`}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}">${track.title}</p>
            <p class="text-xs text-slate-500 truncate">${track.artist}</p>
          </div>
          ${isActive
            ? '<i class="fas fa-volume-up text-purple-400 text-xs animate-pulse flex-shrink-0"></i>'
            : `<button onclick="event.stopPropagation(); voteForTrack(${track.id})"
                class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-slate-800
                       text-slate-400 hover:bg-purple-500/30 hover:text-purple-300 transition-colors flex-shrink-0">
                <i class="fas fa-thumbs-up text-xs"></i><span>${track.votes}</span></button>`}
        </div>`;
    }).join('');
}

//  AUDIO ENGINE 
function initVisualizer() {
    if (!audioCtx) {
        audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
        analyser     = audioCtx.createAnalyser();
        gainNode     = audioCtx.createGain();
        source       = audioCtx.createMediaElementSource(audio);
        deezerSource = audioCtx.createMediaElementSource(deezerAudio);
        source.connect(gainNode);
        deezerSource.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    renderFrame();
}

function setVolume(val) {
    if (!gainNode || !audioCtx) return;
    gainNode.gain.setTargetAtTime(parseFloat(val), audioCtx.currentTime, 0.01);
}

function togglePlayPause() {
    const track    = queue[currentIndex];
    const isDeezer = track && !track.url.startsWith('blob:');
    const player   = isDeezer ? deezerAudio : audio;
    if (!player.src) return;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (isPlaying) {
        player.pause(); isPlaying = false;
        if (animationId) cancelAnimationFrame(animationId);
    } else {
        player.play().catch(console.error); isPlaying = true;
        renderFrame();
    }
    const btn = document.getElementById('btn-playpause');
    if (btn) btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

//  DRAW LOOP 
function renderFrame() {
    animationId = requestAnimationFrame(renderFrame);
    if (!analyser || !dataArray) return;
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const red = dataArray[i] + (25 * (i / dataArray.length));
        ctx.fillStyle = `rgb(${red}, 50, 255)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
    }
}


//  PROFILE 
function loadProfile() {
    const raw = localStorage.getItem('soundsync_user');
    if (!raw) { window.location.href = 'Join.html'; return; }
    const user = JSON.parse(raw);
    const nameEl   = document.getElementById('profile-name');
    const avatarEl = document.getElementById('profile-avatar');
    if (nameEl) nameEl.textContent = user.name || 'User';
    if (avatarEl) {
        const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'U')}&background=7c3aed&color=fff&size=36`;
        avatarEl.src = user.photo || fallback;
        avatarEl.onerror = () => { avatarEl.src = fallback; };
    }
}

function signOut() {
    if (!confirm('Sign out of SoundSync?')) return;
    localStorage.removeItem('soundsync_user');
    window.location.href = 'Join.html';
}

//  INIT 
loadProfile();
window.addEventListener('resize', () => {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});
