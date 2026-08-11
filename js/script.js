/**
 * Chhath Puja — Devotional Player Engine
 * Architecture adapted directly from Truck Wala (hornokplease.xyz):
 *   - 1×1px hidden YouTube iframe initialized with videoId (NOT playlist mode)
 *   - Smooth extrapolated progress bar using performance.now() and scaleX transform
 *   - Pointer capture drag scrubbing for touch & desktop
 *   - Fisher-Yates shuffle track ordering
 *   - Rotating devotional couplets
 *   - YouTube Data API integration for dynamic tracks
 */

const $ = (id) => document.getElementById(id);

const el = {
  player: $('player'),
  title: $('title'),
  artist: $('artist'),
  seek: $('seek'),
  seekFill: $('seekFill'),
  seekKnob: $('seekKnob'),
  tCur: $('tCur'),
  tDur: $('tDur'),
  play: $('play'),
  prev: $('prev'),
  next: $('next'),
  listBtn: $('listBtn'),
  listClose: $('playlistClose'),
  listPanel: $('playlistPanel'),
  listItems: $('playlistItems'),
  listeners: $('listeners'),
  presence: document.querySelector('.presence'),
  bumperText: $('bumperText'),
  bumperNext: $('bumperNext'),
};

const YT_API_KEY = "AIzaSyDd3hSBceunTPgtuxa8X90LtWwgBWldolo";
const PLAYLIST_ID = "PLEIQibB6Laz8";

/* ===========================================
   Firebase Realtime Database Config
   (Fill this to enable 100% accurate live presence)
   =========================================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDd3hSBceunTPgtuxa8X90LtWwgBWldolo",
  authDomain: "chhath-puja-2a60a.firebaseapp.com",
  databaseURL: "https://chhath-puja-2a60a-default-rtdb.firebaseio.com",
  projectId: "chhath-puja-2a60a",
  storageBucket: "chhath-puja-2a60a.appspot.com",
  messagingSenderId: "189671216776",
  appId: "1:189671216776:web:3e88ae46d264baa9eb713d"
};

const INITIAL_TRACKS = [
  { id: 'WYkrgIZFcZw', title: 'Pahile Pahil Chhathi Maiya', artist: 'Sharda Sinha' },
  { id: '-oga0dNKD0k', title: 'Ugg Ho Suraj Dev', artist: 'Anuradha Paudwal' },
  { id: 'dPgpDk3x2nc', title: 'Darshan Din Hai Ganga Mayiya', artist: 'Kalpana Patowary' },
  { id: '9sc-qdxLFwU', title: 'Chhath Puja Special Bhajan', artist: 'SRA Music World' },
];

const state = {
  tracks: INITIAL_TRACKS,
  order: [0, 1, 2, 3],
  pos: 0,
  shuffle: true,
  ready: false,
  playing: false,
  started: false,
  scrubbing: false,
};

let yt = null;

/* ── Helpers ─────────────────────────────────────────────────── */

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildOrder() {
  const seq = Array.from({ length: state.tracks.length }, (_, i) => i);
  return state.shuffle ? shuffle(seq) : seq;
}

const currentTrack = () => state.tracks[state.order[state.pos]] || state.tracks[0];

/* ── Rendering ───────────────────────────────────────────────── */

let swapTimer = null;

function renderTrack() {
  const t = currentTrack();
  if (!t) return;

  if (el.title.dataset.rendered) {
    el.player?.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => el.player?.classList.remove('is-swapping'), 40);
  }
  el.title.dataset.rendered = '1';

  if (el.title) el.title.textContent = t.title;
  if (el.artist) el.artist.textContent = t.artist || 'छठी मैया के गीत';

  if (state.started) document.title = `${t.title} — छठ पूजा`;

  if (el.listItems) {
    [...el.listItems.children].forEach((li, i) =>
      li.classList.toggle('is-active', i === state.pos)
    );
    const active = el.listItems.children[state.pos];
    if (active && el.listPanel?.classList.contains('is-open')) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

function renderList() {
  if (!el.listItems) return;
  el.listItems.innerHTML = '';
  state.order.forEach((trackIdx, i) => {
    const t = state.tracks[trackIdx];
    const li = document.createElement('li');

    const title = document.createElement('span');
    title.className = 'track-title';
    title.textContent = t.title;

    li.append(title);
    if (t.artist) {
      const artist = document.createElement('span');
      artist.className = 'track-artist';
      artist.textContent = ` · ${t.artist}`;
      li.append(artist);
    }

    li.addEventListener('click', () => go(i));
    el.listItems.append(li);
  });
}

function renderPlaying(on) {
  state.playing = on;
  if (el.play) {
    el.play.classList.toggle('is-playing', on);
    el.play.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }
}

/* ── Playback ────────────────────────────────────────────────── */

function go(newPos) {
  const n = state.order.length;
  if (n === 0) return;
  state.pos = ((newPos % n) + n) % n;
  renderTrack();
  switchDay(state.pos % DAYS_DATA.length);
  if (!yt) return;
  state.started = true;
  const track = currentTrack();
  if (track && track.id) {
    yt.loadVideoById(track.id);
  }
}

function toggle() {
  if (!yt || !state.ready) return;
  if (state.playing) {
    yt.pauseVideo();
  } else {
    state.started = true;
    yt.playVideo();
  }
}

/* ── Progress Extrapolator ───────────────────────────────────── */

const poll = { at: 0, time: 0, duration: 0 };
let lastSecond = -1;
let lastDuration = -1;

function samplePlayer() {
  if (!yt || typeof yt.getCurrentTime !== 'function') return;
  poll.time = yt.getCurrentTime() || 0;
  poll.duration = yt.getDuration() || 0;
  poll.at = performance.now();
}

function paintProgress() {
  requestAnimationFrame(paintProgress);
  if (!yt || state.scrubbing || !poll.duration || !el.seekFill || !el.seekKnob) return;

  const drift = state.playing ? (performance.now() - poll.at) / 1000 : 0;
  const cur = Math.min(poll.duration, poll.time + drift);
  const frac = Math.min(1, Math.max(0, cur / poll.duration));

  el.seekFill.style.width = (frac * 100) + '%';
  el.seekKnob.style.left = (frac * 100) + '%';

  const second = Math.floor(cur);
  if (second !== lastSecond) {
    lastSecond = second;
    if (el.tCur) el.tCur.textContent = fmt(cur);
    if (el.seek) el.seek.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
  }
  if (poll.duration !== lastDuration) {
    lastDuration = poll.duration;
    if (el.tDur) el.tDur.textContent = fmt(poll.duration);
  }
}

/* ── Seeking (Pointer Events) ────────────────────────────────── */

function fractionFromEvent(e) {
  if (!el.seek) return 0;
  const r = el.seek.getBoundingClientRect();
  return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
}

function previewSeek(frac) {
  if (el.seekFill) el.seekFill.style.width = (frac * 100) + '%';
  if (el.seekKnob) el.seekKnob.style.left = (frac * 100) + '%';
  if (yt && typeof yt.getDuration === 'function') {
    if (el.tCur) el.tCur.textContent = fmt((yt.getDuration() || 0) * frac);
  }
}

if (el.seek) {
  el.seek.addEventListener('pointerdown', (e) => {
    if (!yt) return;
    state.scrubbing = true;
    el.seek.setPointerCapture(e.pointerId);
    previewSeek(fractionFromEvent(e));
  });

  el.seek.addEventListener('pointermove', (e) => {
    if (state.scrubbing) previewSeek(fractionFromEvent(e));
  });

  el.seek.addEventListener('pointerup', (e) => {
    if (!state.scrubbing) return;
    state.scrubbing = false;
    el.seek.releasePointerCapture(e.pointerId);
    const dur = yt?.getDuration?.() || 0;
    if (dur) yt.seekTo(dur * fractionFromEvent(e), true);
    samplePlayer();
  });
}

/* ── Controls ────────────────────────────────────────────────── */

if (el.play) el.play.addEventListener('click', toggle);
if (el.prev) {
  el.prev.addEventListener('click', () => {
    if (yt && (yt.getCurrentTime() || 0) > 3) yt.seekTo(0, true);
    else go(state.pos - 1);
  });
}
if (el.next) el.next.addEventListener('click', () => go(state.pos + 1));

const togglePlaylistPanel = (show) => {
  if (!el.listPanel) return;
  const open = show !== undefined ? show : !el.listPanel.classList.contains('is-open');
  el.listPanel.classList.toggle('is-open', open);
  if (el.listBtn) {
    el.listBtn.classList.toggle('is-on', open);
    el.listBtn.setAttribute('aria-expanded', String(open));
  }
  if (open) renderList();
};

if (el.listBtn) el.listBtn.addEventListener('click', () => togglePlaylistPanel());
if (el.listClose) el.listClose.addEventListener('click', () => togglePlaylistPanel(false));

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, [contenteditable]')) return;
  if (e.key === ' ' || e.key === 'k') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'n' || e.key === 'ArrowRight') {
    if (e.target !== el.seek) go(state.pos + 1);
  } else if (e.key === 'p' || e.key === 'ArrowLeft') {
    if (e.target !== el.seek) go(state.pos - 1);
  }
});

/* ── Devotional Couplets ──────────────────────────────────────── */

const BUMPER_LINES = [
  'कांच ही बांस के बहंगिया, बहंगी लचकत जाय',
  'केलवा जे फरेला घवद से, ओह पर सुगा मँडराय',
  'उगो हे सूरज देव भइले अरग के बेर',
  'पटना के घाट पर नइया लागल, सेवक करें पुकार',
  'छठी माई के आरती उतारो, भक्तन की लागी पुकार',
  'हम करीं छठ बरतिया से सुनो हे छठी मैया',
  'ऊँचे ऊँचे पर्वत पर गइली छठी मैया',
  'सूर्य देव के अरग देवे जइबो हे बाबा',
  'नदिया के तीर पर खड़ा बा सेवक तोहार',
  'चार पहर के बरतिया भइले भोरवा हे बाबा',
];

let bumperPos = 0;
let bumperTimer = null;

function nextBumper() {
  bumperPos = (bumperPos + 1) % BUMPER_LINES.length;
  if (el.bumperText) {
    el.bumperText.style.opacity = '0';
    setTimeout(() => {
      el.bumperText.textContent = BUMPER_LINES[bumperPos];
      el.bumperText.style.opacity = '0.7';
    }, 250);
  }
  clearInterval(bumperTimer);
  bumperTimer = setInterval(nextBumper, 10000);
}

if (el.bumperText) el.bumperText.textContent = BUMPER_LINES[0];
bumperTimer = setInterval(nextBumper, 10000);
if (el.bumperNext) el.bumperNext.addEventListener('click', nextBumper);

/* ── Live Presence / Listener Drift ──────────────────────────── */

function updatePresenceUI(count) {
  if (!el.listeners || !el.presence) return;
  el.listeners.textContent = String(count);
  el.presence.classList.add('is-live');
  el.listeners.classList.remove('is-updating');
  void el.listeners.offsetWidth;
  el.listeners.classList.add('is-updating');
}

function trackPresence() {
  if (!el.listeners || !el.presence) return;

  let isRealtimeConnected = false;

  // 1. Firebase Realtime Database (Live Multi-User Sync)
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length && FIREBASE_CONFIG.databaseURL) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      if (firebase.apps.length) {
        const db = firebase.database();
        const connectedRef = db.ref('.info/connected');
        const presenceRef = db.ref('presence');

        connectedRef.on('value', (snap) => {
          if (snap.val() === true) {
            isRealtimeConnected = true;
            const con = presenceRef.push();
            con.onDisconnect().remove();
            con.set(true);
          }
        });

        presenceRef.on('value', (snap) => {
          const liveCount = snap.numChildren();
          if (liveCount > 0) {
            updatePresenceUI(liveCount);
          }
        });
      }
    } catch (e) {}
  }

  // 2. BroadcastChannel multi-tab sync
  if ('BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('chhath_ghat_presence');
      bc.postMessage({ type: 'join' });
    } catch (e) {}
  }

  // 3. Realistic Devotee Ghat Drift (Truck-Wala engine pattern)
  const MIN = 520;
  const MAX = 890;
  let count = 641;
  updatePresenceUI(count);

  const step = () => {
    if (isRealtimeConnected) return;
    const midpoint = (MIN + MAX) / 2;
    const up = Math.random() < (count < midpoint ? 0.58 : 0.42);
    count = Math.max(MIN, Math.min(MAX, count + (up ? 1 : -1) * (1 + Math.floor(Math.random() * 4))));
    updatePresenceUI(count);
    setTimeout(step, 2500 + Math.random() * 3500);
  };
  setTimeout(step, 2000);
}

/* ── Firefly Particles ───────────────────────────────────────── */

function spawnParticles() {
  const container = $('particles');
  if (!container) return;

  const COUNT = 35;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    const size = 2 + Math.random() * 3;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    const hue = 35 + Math.random() * 15;
    const light = 60 + Math.random() * 15;
    p.style.background = `hsl(${hue}, 90%, ${light}%)`;
    p.style.boxShadow = `0 0 ${size * 3}px hsl(${hue}, 90%, ${light}%)`;

    const driftDur = 6 + Math.random() * 10;
    const glowDur = 4 + Math.random() * 6;
    const delay = Math.random() * 10;

    p.style.animationDuration = `${driftDur}s, ${glowDur}s`;
    p.style.animationDelay = `${delay}s, ${delay + Math.random() * 3}s`;
    container.appendChild(p);
  }
}

/* ── YouTube Data API fetch ──────────────────────────────────── */

async function fetchDynamicTracks() {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length) {
      state.tracks = data.items.map((item) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        artist: (item.snippet.videoOwnerChannelTitle || '').replace(' - Topic', ''),
      }));
      state.order = buildOrder();
      renderList();
      renderTrack();
    }
  } catch (e) {
    console.warn('YouTube Data API fetch fallback:', e);
  }
}

/* ── YouTube IFrame API boot ─────────────────────────────────── */

window.onYouTubeIframeAPIReady = () => {
  const track = currentTrack();
  yt = new YT.Player('yt-player', {
    height: '1',
    width: '1',
    videoId: track ? track.id : 'WYkrgIZFcZw',
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: () => {
        state.ready = true;
        if (el.play) el.play.disabled = false;
      },
      onStateChange: (e) => {
        const S = YT.PlayerState;
        if (e.data === S.PLAYING) {
          renderPlaying(true);
        } else if (e.data === S.PAUSED || e.data === S.BUFFERING) {
          renderPlaying(e.data === S.BUFFERING && state.playing);
        } else if (e.data === S.ENDED) {
          go(state.pos + 1);
        }
      },
      onError: () => {
        if (state.started) go(state.pos + 1);
      },
    },
  });

  setInterval(samplePlayer, 250);
  requestAnimationFrame(paintProgress);
};

/* ── Days Data & Ritual Facts ────────────────────────────────── */

const DAYS_DATA = [
  {
    day: 1,
    titleHindi: "महापर्व",
    tag: "DAY 1 · NAHAY KHAY (PURITY & PREPARATION)",
    desc: "The spiritual journey begins with holy ritual bathing and traditional saattvik food preparation.",
    image: "bgimg/Day01.jpg"
  },
  {
    day: 2,
    titleHindi: "खरना",
    tag: "DAY 2 · KHARNA (THE EVENING RITUAL)",
    desc: "Offering jaggery kheer on a traditional clay stove in warm, intimate reflection before starting the 36-hour waterless fast.",
    image: "bgimg/Day02.jpg"
  },
  {
    day: 3,
    titleHindi: "संध्या अर्घ्य",
    tag: "DAY 3 · SANDHYA ARGHYA (EVENING OFFERING)",
    desc: "Offering a decorated bamboo soop laden with fresh thekua and fruits to the setting sun at the riverbank.",
    image: "bgimg/Day03.jpg"
  },
  {
    day: 4,
    titleHindi: "उषा अर्घ्य",
    tag: "DAY 4 · USHA ARGHYA (MORNING OFFERING)",
    desc: "Standing waist-deep in water, offering milk to the rising sun as a triumphant culmination of the festival.",
    image: "bgimg/Day04.jpg"
  }
];

let activeDayIndex = 0;
let bgActiveLayer = 1;

function switchDay(index) {
  if (index < 0 || index >= DAYS_DATA.length) return;
  activeDayIndex = index;
  const data = DAYS_DATA[index];

  // 1. Update Day Pills
  document.querySelectorAll('.day-pill').forEach((pill, i) => {
    pill.classList.toggle('is-active', i === index);
  });

  // 2. Crossfade Background Layers
  const layer1 = $('bgLayer1');
  const layer2 = $('bgLayer2');

  if (layer1 && layer2) {
    if (bgActiveLayer === 1) {
      layer2.style.backgroundImage = `url('${data.image}')`;
      layer2.classList.add('is-active');
      layer1.classList.remove('is-active');
      bgActiveLayer = 2;
    } else {
      layer1.style.backgroundImage = `url('${data.image}')`;
      layer1.classList.add('is-active');
      layer2.classList.remove('is-active');
      bgActiveLayer = 1;
    }
  }

  // 3. Update Text & Fact Card
  const titleEl = $('dayTitleHindi');
  const tagEl = $('dayTag');
  const descEl = $('dayDesc');

  if (titleEl) titleEl.textContent = data.titleHindi;
  if (tagEl) tagEl.textContent = data.tag;
  if (descEl) descEl.textContent = data.desc;
}

function initDaySelector() {
  document.querySelectorAll('.day-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const dayIdx = parseInt(pill.dataset.day, 10);
      switchDay(dayIdx);
    });
  });
}

/* ── Eye Button Toggle (Hide / Show Overlay) ─────────────────── */

function initEyeToggle() {
  const eyeBtn = $('eyeBtn');
  if (!eyeBtn) return;

  eyeBtn.addEventListener('click', () => {
    const hidden = document.body.classList.toggle('is-hidden-overlay');
    eyeBtn.classList.toggle('is-hidden', hidden);
    eyeBtn.setAttribute('aria-expanded', String(!hidden));
  });
}

/* ── Temple Bell Audio Synthesis ────────────────────────────── */

let audioCtx = null;

function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Unlock Web Audio on first user gesture
['pointerdown', 'keydown'].forEach((evt) => {
  document.addEventListener(evt, () => ensureAudio(), { once: true, capture: true });
});

function ringTempleBell() {
  const ctx = ensureAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 3.2; // 3.2s long brass decay

  // Master bell volume node
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, now);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Tremolo LFO (4.5Hz shimmer ring)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(4.5, now);
  lfoGain.gain.setValueAtTime(0.1, now);
  lfo.connect(lfoGain);

  // Mandir Ghanti harmonics (Fundamental + Overtones)
  const partials = [
    { freq: 960,  gain: 0.55, decay: 3.2 }, // Fundamental pitch (A5/B5)
    { freq: 1920, gain: 0.35, decay: 2.4 }, // Octave harmonic
    { freq: 2650, gain: 0.25, decay: 1.8 }, // Minor 6th overtone
    { freq: 5180, gain: 0.15, decay: 1.0 }, // High metallic ring
  ];

  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);

    g.gain.setValueAtTime(p.gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

    lfoGain.connect(g.gain);
    osc.connect(g);
    g.connect(masterGain);

    osc.start(now);
    osc.stop(now + p.decay + 0.1);
  });

  lfo.start(now);
  lfo.stop(now + duration);

  masterGain.connect(ctx.destination);

  // Animate Bell Icon
  const bellBtn = $('bellBtn');
  if (bellBtn) {
    bellBtn.classList.remove('is-ringing');
    void bellBtn.offsetWidth;
    bellBtn.classList.add('is-ringing');
    setTimeout(() => bellBtn.classList.remove('is-ringing'), 800);
  }
}

function initTempleBell() {
  const bellBtn = $('bellBtn');
  if (bellBtn) {
    bellBtn.addEventListener('click', ringTempleBell);
  }

  // Keyboard shortcuts 'b' or 'g' (Ghanti)
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (e.key === 'b' || e.key === 'g' || e.key === 'B' || e.key === 'G') {
      ringTempleBell();
    }
  });
}

/* ── Scroll Reveal Observer ─────────────────────────────────── */

function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ── Init ────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  spawnParticles();
  trackPresence();
  initDaySelector();
  initEyeToggle();
  initTempleBell();
  initScrollReveal();
  state.order = buildOrder();
  renderList();
  renderTrack();
  fetchDynamicTracks();
});
