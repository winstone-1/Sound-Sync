# Sound-Sync
SoundSync is a browser-based audio player and visualizer built for local music playback. It lets you load audio files from your device, watch them come alive through a real-time frequency visualizer, manage a playback queue, and vote on tracks — all within a clean, dark-themed multi-page web interface.


## 🚀 Features
- **Real-Time Audio Visualizer** — Powered by the Web Audio API, the canvas renders a live frequency bar chart that pulses and shifts color with the music using an FFT analyser.
- **Local File Playback** — Upload any audio file from your device. The player starts immediately on first load and auto-advances when a track ends.
- **Playback Queue** — Add multiple tracks to an "Up Next" list. Tracks display their title, artist label, and current position, with the active track highlighted and animated.
- **Track Voting** — Each queued track has a thumbs-up vote button that increments its vote count inline.
- **Playback Controls** — Play/pause toggle, skip forward, skip backward, and a smooth volume slider with gain control via `GainNode`.
- **Collapsible Sidebar** — A fixed navigation sidebar with an overlay toggle, linking across all pages (Pulse, Join, Stage, Stats, Control).
- **Search Bar** — A search input on the main player page wired to a `handleSearch()` handler.
- **Stats Page** — A user performance dashboard showing listening stats (Total Syncs, Listening Time) with a progress bar.
- **Admin/Control Page** — A system audio controls panel with a sensitivity slider and an Auto-Sync Visualizer toggle UI.
- **Login Page** — A sign-in form with username and password fields, styled with a branded card layout.
- **Responsive Canvas** — The visualizer canvas resizes dynamically on window resize to stay full-width.
- **Consistent Footer** — Every page shares a multi-column footer with platform links and social icons (Discord, Twitter, Instagram).

---


## 🛠️ Technologies Used
- **HTML5** — Semantic page structure across five pages (`index`, `Join`, `stats`, `control`, and linked pages)
- **CSS3 / Tailwind CSS** (via CDN) — All styling and layout, including dark mode utilities, gradients, transitions, and responsive grid
- **Vanilla JavaScript** — All interactivity: audio engine, queue logic, visualizer loop, sidebar toggle, and DOM manipulation
- **Web Audio API** — `AudioContext`, `AnalyserNode`, `GainNode`, and `MediaElementSourceNode` for real-time audio processing
- **HTML5 Canvas API** — `requestAnimationFrame` draw loop rendering the frequency bar visualizer
- **Font Awesome 6** (via CDN) — Icon set used throughout the UI (play, pause, volume, queue, navigation icons)
- **Google Fonts** — `Space Mono` and `Syne` typefaces for the interface typography

## Design System
 - **Background**  `slate-950` (near-black base), `slate-900` (cards/panels) 
-  **Primary Accent** | Purple → Blue gradient (`purple-600` to `blue-600`) 
- **Secondary Accent**  Orange (`orange-500`) on the Control/Admin page |
- **Text** | `white` for headings, `slate-300` for body, `slate-500` for muted/labels


## Installation and Setup
### 1. Clone the Repository:

```bash
git clone git@github.com:winstone-1/Sound-Sync.git
```
### 2. Navigate into Folder
```bash 
cd Sound-Sync
```


### 3.Screenshots

## Support and Contact Information
- **email:** winstonemuna404@gmail.com
- **Phone number:** 0795278996

## Live Link
[see my website]([text](https://winstone-1.github.io//))
## Known Bugs
There are no bugs
## License
### MIT License