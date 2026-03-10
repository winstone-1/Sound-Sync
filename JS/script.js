
let audioCtx;       // The "brain" of the audio (AudioContext)
let analyser;       // The "ear" that listens to frequencies
let source;         // The connection between the audio tag and the context
let dataArray;      // The numeric array where frequency data is stored
let animationId;    // To keep track of the drawing loop
let gainNode;
let isPlaying = false;


// 2. DOM ELEMENTS
const audio = document.getElementById('audio-player');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('audio');

// 3. FILE UPLOAD LISTENER
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

     // Update now-playing label
    const nameEl = document.getElementById('now-playing-name');
    if (nameEl) nameEl.textContent = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // Create a local URL for the uploaded file so the <audio> tag can play it
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
    

    // Start the visualizer logic(Audio Engine)
    initVisualizer();

        // Resume context (browser blocks audio until user gesture)
     if (audioCtx.state === 'suspended') audioCtx.resume();  

    audio.play();
    isPlaying = true;    
});

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


function toggleSidebar() {
  const sidebar = document.querySelector('aside');
  const main    = document.querySelector('.ml-64');
  const overlay = document.getElementById('sidebar-overlay');

  sidebar.classList.toggle('-translate-x-full');
  main.classList.toggle('ml-0');
  main.classList.toggle('ml-64');
   overlay.classList.toggle('hidden');
}
// 6. SIDEBAR MENU TOGGLE LOGIC
const menuButtons = document.querySelectorAll('.menu-btn');
const mobileMenus = document.querySelectorAll('.mobile-menu');

menuButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        mobileMenus[index].classList.toggle('hidden');
    });
});

// SEARCH BAR
function handleSearch(query) {
  const q = query.toLowerCase().trim();
  console.log('Search query:', q);
}
// Resize on window resize
 window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});