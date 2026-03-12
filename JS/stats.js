// Reads From :
//   localStorage.soundsync_user     → name, email, photo
//   localStorage.soundsync_queue    → track count, votes
//   sessionStorage.soundsync_plays  → tracks played this session

function loadStats() {
    const user  = JSON.parse(localStorage.getItem('soundsync_user')  || '{}');
    const queue = JSON.parse(localStorage.getItem('soundsync_queue') || '[]');
    const plays = parseInt(sessionStorage.getItem('soundsync_plays') || '0');

    // Profile
    const nameEl   = document.getElementById('stat-name');
    const emailEl  = document.getElementById('stat-email');
    const avatarEl = document.getElementById('stat-avatar');
    if (nameEl)  nameEl.textContent  = user.name  || '—';
    if (emailEl) emailEl.textContent = user.email || '—';
    if (avatarEl && user.photo) {
        avatarEl.src = user.photo;
        avatarEl.onerror = () => {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'U')}&background=7c3aed&color=fff&size=80`;
        };
    }

    // Numbers
    const tracksEl = document.getElementById('stat-tracks');
    const playsEl  = document.getElementById('stat-plays');
    const votesEl  = document.getElementById('stat-votes');
    if (tracksEl) tracksEl.textContent = queue.length;
    if (playsEl)  playsEl.textContent  = plays;
    if (votesEl)  votesEl.textContent  = queue.reduce((sum, t) => sum + (t.votes || 0), 0);

    // Top 5 tracks by votes
    const topList = document.getElementById('stat-top-tracks');
    if (topList) {
        const top = [...queue].sort((a, b) => b.votes - a.votes).slice(0, 5);
        if (top.length === 0 || top[0].votes === 0) {
            topList.innerHTML = `<p class="text-slate-600 text-sm py-4 text-center">No tracks voted yet</p>`;
        } else {
            topList.innerHTML = top.map((t, i) => `
              <div class="flex items-center gap-3 py-3 border-b border-slate-800 last:border-0">
                <span class="text-slate-600 font-mono text-xs w-4">${i + 1}</span>
                ${t.cover
                  ? `<img src="${t.cover}" class="w-8 h-8 rounded-lg object-cover">`
                  : `<div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                       <i class="fas fa-music text-slate-600 text-xs"></i></div>`}
                <div class="flex-1 min-w-0">
                  <p class="text-slate-300 text-sm font-semibold truncate">${t.title}</p>
                  <p class="text-slate-500 text-xs truncate">${t.artist}</p>
                </div>
                <span class="text-purple-400 text-sm font-mono flex-shrink-0">${t.votes} ▲</span>
              </div>`).join('');
        }
    }
}

// Redirect if not logged in
if (!localStorage.getItem('soundsync_user')) {
    window.location.href = 'Join.html';
} else {
    loadStats();
}