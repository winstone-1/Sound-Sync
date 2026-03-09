// DOM ELEMENTS
const menuButtons = document.querySelectorAll('.menu-btn');
    const mobileMenus = document.querySelectorAll('.mobile-menu');
    const input = document.getElementById('audio')
    .addEventListener('change', (e) => {
        const file = e.target.files[0]

        // File Reader-Store mp3 in array buffer
        const reader = new FileReader();

        reader.addEventListener('load', (e) => {
            const arrayBuffer = e.target.result;

            const audioContext = new (window.AudioContext || window.webkitAudioContext) ();
            // Audio Context
            audioContext.decodeAudioData(arrayBuffer, (AudioBuffer) => {
                visualize(AudioBuffer);
            })
        })

        reader.readAsArrayBuffer(file);
    } )
    
    function visualize(AudioBuffer) {
        const canvas = document.getElementById('canvas');

        const canvasContext = canvas.getContext('2d');


        const channelData = AudioBuffer.getChannelData(0);
    }


    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6'; // SoundSync Purple

    const step = Math.ceil(channelData.length / canvas.width);
    const amp = canvas.height / 2;

    for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = channelData[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.lineTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();


    
    menuButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            mobileMenus[index].classList.toggle('hidden');
        });
    });