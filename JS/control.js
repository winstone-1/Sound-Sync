function loadControls() {
    const saved = JSON.parse(localStorage.getItem('soundsync_controls') || '{}');

    const volEl   = document.getElementById('ctrl-volume');
    const speedEl = document.getElementById('ctrl-speed');

    if (volEl)   volEl.value   = saved.volume ?? 0.8;
    if (speedEl) speedEl.value = saved.speed  ?? 1.0;

    updateLabels();
}

function updateLabels() {
    const vol   = parseFloat(document.getElementById('ctrl-volume')?.value  || 0.8);
    const speed = parseFloat(document.getElementById('ctrl-speed')?.value   || 1.0);

    const volLabel   = document.getElementById('ctrl-vol-label');
    const speedLabel = document.getElementById('ctrl-speed-label');

    if (volLabel)   volLabel.textContent   = `${Math.round(vol * 100)}%`;
    if (speedLabel) speedLabel.textContent = `${speed}x`;
}

function saveControls() {
    const volume = parseFloat(document.getElementById('ctrl-volume').value);
    const speed  = parseFloat(document.getElementById('ctrl-speed').value);
    localStorage.setItem('soundsync_controls', JSON.stringify({ volume, speed }));
    updateLabels();

    // Flash save confirmation
    const btn = document.getElementById('ctrl-save-btn');
    if (btn) {
        btn.textContent = '✓ Saved';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
            btn.textContent = 'Apply Settings';
            btn.classList.remove('bg-green-600');c
        }, 1500);
    }
}

function resetControls() {
    localStorage.removeItem('soundsync_controls');
    document.getElementById('ctrl-volume').value = 0.8;
    document.getElementById('ctrl-speed').value  = 1.0;
    updateLabels();
}

// Redirect if not logged in
if (!localStorage.getItem('soundsync_user')) {
    window.location.href = 'Join.html';
} else {
    loadControls();
}
