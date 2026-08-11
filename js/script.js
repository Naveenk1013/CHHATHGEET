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

function trackPresence() {
  if (!el.listeners || !el.presence) return;

  // 1. Firebase RTDB
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    try {
      const db = firebase.database();
      const connectedRef = db.ref('.info/connected');
      const presenceRef = db.ref('presence');
      connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
          const con = presenceRef.push();
          con.onDisconnect().remove();
          con.set(true);
        }
      });
      presenceRef.on('value', (snap) => {
        el.listeners.textContent = snap.numChildren();
        el.presence.classList.add('is-live');
      });
      return;
    } catch (e) {}
  }

  // 2. Realistic Audience Drift (Truck Wala pattern)
  const MIN = 108;
  const MAX = 780;
  let count = 641;
  el.listeners.textContent = String(count);
  el.presence.classList.add('is-live');

  const step = () => {
    const midpoint = (MIN + MAX) / 2;
    const up = Math.random() < (count < midpoint ? 0.58 : 0.42);
    count = Math.max(MIN, Math.min(MAX, count + (up ? 1 : -1) * (1 + Math.floor(Math.random() * 4))));
    el.listeners.textContent = String(count);
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

/* ── Init ────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  spawnParticles();
  trackPresence();
  state.order = buildOrder();
  renderList();
  renderTrack();
  fetchDynamicTracks();
});
