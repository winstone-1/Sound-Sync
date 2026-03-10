
let audioCtx;       // The "brain" of the audio (AudioContext)
let analyser;       // The "ear" that listens to frequencies
let source;         // The connection between the audio tag and the context
let dataArray;      // The numeric array where frequency data is stored
let animationId;    // To keep track of the drawing loop
let gainNode;


// 2. DOM ELEMENTS
const audio = document.getElementById('audio-player');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('audio');

// 3. FILE UPLOAD LISTENER
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Create a local URL for the uploaded file so the <audio> tag can play it
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
    audio.play();

    // Start the visualizer logic
    initVisualizer();
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

    // fftSize: How many samples to take. 256 results in 128 frequency bins (bars).
    analyser.fftSize = 2048; 
    analyser.smoothingTimeConstant = 0.8;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // Match canvas size to its display size
    window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});
    renderFrame();
}

// 5. THE DRAWING LOOP (runs 60 times per second)
function renderFrame() {
    // Request the next frame of animation
    animationId = requestAnimationFrame(renderFrame);

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
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
    }
}

// 6. SIDEBAR MENU TOGGLE LOGIC
const menuButtons = document.querySelectorAll('.menu-btn');
const mobileMenus = document.querySelectorAll('.mobile-menu');

menuButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        mobileMenus[index].classList.toggle('hidden');
    });
});