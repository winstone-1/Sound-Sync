
let audioCtx;       // The "brain" of the audio (AudioContext)
let analyser;       // The "ear" that listens to frequencies
let source;         // The connection between the audio tag and the context
let dataArray;      // The numeric array where frequency data is stored
let animationId;    // To keep track of the drawing loop
let gainNode;
let isPlaying = false;
let queue = [];     // full ls of tracks
let currentIndex = -1;  // -1 - none
let nextId = 1; // auto-increment id for each track


// 2. DOM ELEMENTS
const audio = document.getElementById('audio-player');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('audio');

// Auto-advance when track ends
audio.addEventListener('ended', () => {
    isPlaying = false;
    if (currentIndex < queue.length - 1) {
        playNext();
    } else {
        // End of queue — reset button
        const btn = document.getElementById('btn-playpause');
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

// 3. FILE UPLOAD LISTENER
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const track = addToQueue(file);   // add to queue first

    // If nothing is playing, start this track immediately
    if (currentIndex === -1) {
        playTrack(queue.length - 1);  // play last added track
    }
});

// QUEUE — play a specific track by its index in the array
function playTrack(index) {
    if (index < 0 || index >= queue.length) return;

    const track = queue[index];
    currentIndex = index;

    // Update audio source
    audio.src = track.url;
    audio.load();

    // Boot engine if first time
    initVisualizer();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    audio.play();
    isPlaying = true;

    // Update now-playing label
    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) nameEl.textContent = track.title;

    // Update play/pause button
    const btn = document.getElementById('btn-playpause');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';

    // Highlight active track in the queue UI
    renderQueue();
}

// QUEUE — skip to next track
function playNext() {
    if (currentIndex < queue.length - 1) {
        playTrack(currentIndex + 1);
    }
}

// QUEUE — go back to previous track
function playPrev() {
    if (currentIndex > 0) {
        playTrack(currentIndex - 1);
    }
}

// QUEUE — add a track to the array from File
function addToQueue(file) {
    const track = {
        id: nextId++,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        artist: 'Local File',
        votes: 0,
        url: URL.createObjectURL(file),
        file: file
    };

    queue.push(track);
    renderQueue();   // update the UI list
    return track;
}

// QUEUE — add a Deezer track (from search results)
function addDeezerTrack(id, title, artist, previewUrl, cover) {
    const track = {
        id:     nextId++,
        title,
        artist,
        votes:  0,
        url:    previewUrl,
        cover,
        file:   null
    };
    queue.push(track);
    saveQueueToStorage();
    renderQueue();

    // Flash feedback in now-playing label
    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) {
        const prev = nameEl.textContent;
        nameEl.textContent = `Added: ${title}`;
        setTimeout(() => {
            nameEl.textContent = currentIndex >= 0 ? (queue[currentIndex]?.title || prev) : prev;
        }, 1500);
    }
}

// STORAGE — save queue to localStorage (Deezer tracks  survive refresh only)
function saveQueueToStorage() {
    const saveable = queue.map(t => ({
        id:     t.id,
        title:  t.title,
        artist: t.artist,
        votes:  t.votes,
        url:    t.url,
        cover:  t.cover || null,
        file:   null
    }));
    localStorage.setItem('soundsync_queue', JSON.stringify(saveable));
}

// STORAGE — restore queue on page load
function loadQueueFromStorage() {
    try {
        const raw = localStorage.getItem('soundsync_queue');
        if (!raw) return;
        const saved = JSON.parse(raw);
        // Blob URLs die on refresh — only restore Deezer stream URLs
        const restorable = saved.filter(t => t.url && !t.url.startsWith('blob:'));
        if (!restorable.length) return;
        queue  = restorable;
        nextId = Math.max(...queue.map(t => t.id)) + 1;
        renderQueue();
    } catch (e) {
        console.error('Queue restore failed:', e);
    }
}

// QUEUE — draw the queue list into #queue-list
function renderQueue() {
    const container = document.getElementById('queue-list');
    if (!container) return;

    // Update count badge
    const countEl = document.getElementById('queue-count');
    if (countEl) countEl.textContent = `${queue.length} track${queue.length !== 1 ? 's' : ''}`;

    if (queue.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8">
            <p class="text-slate-600 text-sm font-mono">Queue is empty</p>
            <p class="text-slate-700 text-xs mt-1">Open a file to add tracks</p>
          </div>`;
        return;
    }

    container.innerHTML = queue.map((track, index) => {
        const isActive = index === currentIndex;
        return `
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer
             ${isActive ? 'bg-purple-600/20 border border-purple-500/30' : 'hover:bg-slate-800/60'}"
             onclick="playTrack(${index})">

          <div class="w-6 text-center flex-shrink-0">
            ${isActive
              ? '<i class="fas fa-volume-up text-purple-400 text-xs animate-pulse"></i>'
              : `<span class="text-slate-600 text-xs font-mono">${index + 1}</span>`
            }
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}">
              ${track.title}
            </p>
            <p class="text-xs text-slate-500 truncate">${track.artist}</p>
          </div>

          <button onclick="event.stopPropagation(); voteForTrack(${track.id})"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold
                   ${isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}
                   hover:bg-purple-500/30 hover:text-purple-300 transition-colors">
            <i class="fas fa-thumbs-up text-xs"></i>
            <span>${track.votes}</span>
          </button>
        </div>`;
    }).join('');
}

// 4. INITIALIZE THE AUDIO ENGINE
function initVisualizer() {
    // We only create the AudioContext once 
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        gainNode = audioCtx.createGain();

        // Connect: Audio Tag -> Analyser -> Speakers
        source = audioCtx.createMediaElementSource(audio);
        source.connect(gainNode);
        gainNode.connect(analyser) 
        analyser.connect(audioCtx.destination);
        
    }

    
    analyser.fftSize = 2048; 
    analyser.smoothingTimeConstant = 0.8;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // Size canvas immediately after load
     canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    
   
    renderFrame();
}

function setVolume(val) {
    gainNode.gain.setTargetAtTime(parseFloat(val), audioCtx.currentTime, 0.01);
}

function togglePlayPause() {
    if (!audio.src) return;   // no file loads yet

    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        cancelAnimationFrame(animationId);   // stops draw loop
    } else {
        audio.play();
        isPlaying = true;
        renderFrame();                        // restart the draw loop
    }

    const btn = document.getElementById('btn-playpause');
    if (btn) {
        btn.innerHTML = isPlaying
            ? '<i class="fas fa-pause"></i>'
            : '<i class="fas fa-play"></i>';
    }
}
// 5. THE DRAWING LOOP (runs 60 times per second)
function renderFrame() {
    // Request the next frame of animation
    animationId = requestAnimationFrame(renderFrame);

     if (!analyser || !dataArray) 
        return;

    // Fill dataArray with the current "volumes" of different frequencies
    analyser.getByteFrequencyData(dataArray);

    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;

    // Loop through the data and draw a bar for each frequency
    for (let i = 0; i < dataArray.length; i++) {
        // Calculate height based on frequency value (0 to 255)
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Dynamic Color: Purple hue changes based on intensity
        const red = dataArray[i] + (25 * (i / dataArray.length));
        const green = 50;
        const blue = 255;

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;



        // We subtract barHeight from canvas.height to draw from the bottom up
        ctx.fillRect(x, canvas.height - barHeight,
             barWidth - 1,
             barHeight);

        x += barWidth;
    }
}

loadQueueFromStorage();
// Resize on window resize
 window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});