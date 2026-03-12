// Reads from: localStorage.soundsync_nowplaying
// Written by: script.js every time playTrack() runs
// Auto-refreshes every 3 seconds to stay in sync
function loadStage() {
    const raw = localStorage.getItem('soundsync_nowplaying');

    const titleEl  = document.getElementById('stage-title');
    const artistEl = document.getElementById('stage-artist');
    const coverEl  = document.getElementById('stage-cover');
    const statusEl = document.getElementById('stage-status');

    if (!raw) {
        if (titleEl)  titleEl.textContent  = 'Nothing playing';
        if (artistEl) artistEl.textContent = 'Open the Pulse page to start';
        if (statusEl) statusEl.textContent = 'Idle';
        if (statusEl) statusEl.className   = 'text-slate-500 font-mono tracking-widest text-sm uppercase';
        return;
    }

    const track = JSON.parse(raw);

    if (titleEl)  titleEl.textContent  = track.title  || 'Unknown Track';
    if (artistEl) artistEl.textContent = track.artist || 'Unknown Artist';
    if (statusEl) {
        statusEl.textContent = 'Stage Mode: Active';
        statusEl.className   = 'text-purple-400 font-mono tracking-widest text-sm uppercase';
    }

    if (coverEl && track.cover) {
        coverEl.src = track.cover;
        coverEl.classList.remove('hidden');
    } else if (coverEl) {
        coverEl.classList.add('hidden');
    }
}

// Redirect if not logged in
if (!localStorage.getItem('soundsync_user')) {
    window.location.href = 'Join.html';
} else {
    loadStage();
    // Poll every 3s so stage stays live without a page refresh
    setInterval(loadStage, 3000);
}