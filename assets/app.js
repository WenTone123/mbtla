'use strict';

const methods = [
  { key: 'clean', label: 'Clean', path: id => `demo/audio/clean/${id}_clean.wav` },
  { key: 'noisy', label: 'Noisy', path: id => `demo/audio/noisy/${id}_noisy.wav` },
  { key: 'MBTLA', label: 'MBTLA', proposed: true, path: id => `demo/audio/MBTLA/${id}.wav` },
  { key: 'ULUNAS', label: 'UL-UNAS', path: id => `demo/audio/ULUNAS/${id}_ULUNAS.wav` },
  { key: 'GTCRN', label: 'GTCRN', path: id => `demo/audio/GTCRN/${id}_GTCRN.wav` },
  { key: 'LiSenNet', label: 'LiSenNet', path: id => `demo/audio/LiSenNet/${id}_LiSenNet.wav` },
  { key: 'AdaptCRN', label: 'AdaptCRN', path: id => `demo/audio/AdaptCRN/${id}_AdaptCRN.wav` },
  { key: 'FastEnhancer', label: 'FastEnhancer-Base', path: id => `demo/audio/FastEnhancer/${id}.wav` }
];
const sampleIds = ['0013','0014','0020','0023','0025','0042','0043','0052','0053','0057','0059','0064','0065','0067','0069','0083','0088','0091','0093','0097'];
const select = document.querySelector('#sample-select');
const players = document.querySelector('#players');
const status = document.querySelector('#playback-status');
const sync = document.querySelector('#sync-position');
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
let activeAudio = null;
let metadata = null;
let position = 0;
let playRequest = 0;

function pauseAll() {
  ++playRequest;
  players.querySelectorAll('audio').forEach(audio => audio.pause());
}

function activatePanel(id, { updateHistory = false, scroll = false } = {}) {
  if (!panels.some(panel => panel.id === id)) id = 'results';
  // A sticky element's offsetTop follows the scroll position; use the header's
  // normal-flow bottom so switching from a deep figure returns to the new panel.
  const navTop = document.querySelector('.hero').getBoundingClientRect().bottom + window.scrollY;
  const wasScrolled = window.scrollY > navTop;
  if (id !== 'audio') pauseAll();
  panels.forEach(panel => { panel.hidden = panel.id !== id; });
  tabs.forEach(tab => {
    const selected = tab.getAttribute('aria-controls') === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  if (updateHistory && window.location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  if (scroll && wasScrolled) window.scrollTo({ top: navTop, behavior: 'instant' });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activatePanel(tab.getAttribute('aria-controls'), { updateHistory: true, scroll: true }));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    activatePanel(tabs[next].getAttribute('aria-controls'), { updateHistory: true, scroll: true });
  });
});

function panelFromLocation() {
  const hash = window.location.hash.slice(1);
  const aliases = { introduction: 'results', visualization: 'analysis', 'branch-memory': 'analysis', 'channel-and-context': 'analysis' };
  // Returning to the header should preserve the currently selected panel.
  if (hash === 'top' || hash === 'main') return;
  activatePanel(aliases[hash] || hash || 'results');
}
window.addEventListener('popstate', panelFromLocation);
window.addEventListener('hashchange', panelFromLocation);

for (const [i, id] of sampleIds.entries()) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = `${String(i + 1).padStart(2, '0')} — Sample ${id}`;
  select.append(option);
}

function formatTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function waveform(peaks) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('waveform');
  svg.setAttribute('viewBox', '0 0 240 24');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  const samples = peaks || Array(100).fill(.04);
  const scale = 240 / samples.length;
  path.setAttribute('d', samples.map((peak, i) => {
    const x = ((i + .5) * scale).toFixed(2);
    const height = Math.max(.4, peak * 10);
    return `M${x} ${(12 - height).toFixed(2)}V${(12 + height).toFixed(2)}`;
  }).join(''));
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  svg.append(path);
  return svg;
}

function setPlayIcon(button, playing) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', playing ? 'M3 2h4v12H3zM9 2h4v12H9z' : 'M4 2l10 6L4 14z');
  svg.append(path);
  button.replaceChildren(svg);
}

function showSample(index) {
  pauseAll();
  // Release old network requests before replacing the sample's controls.
  players.querySelectorAll('audio').forEach(audio => { audio.removeAttribute('src'); audio.load(); });
  activeAudio = null;
  position = index;
  const id = sampleIds[index];
  const meta = metadata?.[id];
  select.value = id;
  document.querySelector('#sample-title').textContent = `Sample ${id}`;
  document.querySelector('#sample-position').textContent = `${String(index + 1).padStart(2, '0')} / ${sampleIds.length}`;
  document.querySelector('#previous-sample').disabled = index === 0;
  document.querySelector('#next-sample').disabled = index === sampleIds.length - 1;
  document.querySelector('#sample-meta').textContent = meta ? `${(meta.sampleRate / 1000).toFixed(0)} kHz · Mono · ${meta.duration.toFixed(0)} seconds` : '16 kHz · Mono · 8 seconds';
  players.replaceChildren();
  status.textContent = 'Play any signal to compare. Only one signal plays at a time.';

  methods.forEach(method => {
    const card = document.createElement('article');
    card.className = `audio-card${method.proposed ? ' proposed' : ''}`;
    const title = document.createElement('h4');
    title.textContent = method.label;
    const line = document.createElement('div');
    line.className = 'player-line';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'play-button';
    button.setAttribute('aria-label', `Play ${method.label}`);
    setPlayIcon(button, false);
    const seekControl = document.createElement('div');
    seekControl.className = 'seek-control';
    const progress = document.createElement('span');
    progress.className = 'seek-progress';
    progress.append(waveform(meta?.peaks[method.key]));
    const seek = document.createElement('input');
    seek.type = 'range'; seek.min = '0'; seek.max = String(meta?.duration || 8); seek.step = '.01'; seek.value = '0';
    seek.setAttribute('aria-label', `Seek ${method.label}`);
    seek.setAttribute('aria-valuetext', '0:00 of 0:08');
    seekControl.append(waveform(meta?.peaks[method.key]), progress, seek);
    const time = document.createElement('span');
    time.className = 'play-time'; time.textContent = '0:00'; time.setAttribute('aria-hidden', 'true');
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = method.path(id);
    let pendingSeek = null;

    function updateProgress() {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Number(seek.max);
      const current = pendingSeek ?? audio.currentTime;
      seek.max = String(duration);
      seek.value = String(current);
      seek.setAttribute('aria-valuetext', `${formatTime(current)} of ${formatTime(duration)}`);
      seekControl.style.setProperty('--progress', `${Math.min(100, current / duration * 100)}%`);
      time.textContent = formatTime(current);
      time.title = `${formatTime(current)} / ${formatTime(duration)}`;
    }

    function seekTo(value) {
      if (audio.readyState >= 1) {
        audio.currentTime = Math.min(value, Math.max(0, audio.duration - .01));
        pendingSeek = null;
      } else {
        pendingSeek = value;
      }
      updateProgress();
    }

    button.addEventListener('click', () => {
      if (!audio.paused) { ++playRequest; audio.pause(); return; }
      const request = ++playRequest;
      const previous = activeAudio;
      const carryTime = previous && previous !== audio && sync.checked && !previous.ended ? previous.currentTime : null;
      players.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); });
      activeAudio = audio;
      if (carryTime !== null) seekTo(carryTime);
      if (audio.ended) seekTo(0);
      audio.play().then(() => {
        if (request !== playRequest) audio.pause();
      }).catch(error => {
        if (request === playRequest && error.name !== 'AbortError') {
          status.textContent = `Could not play ${method.label}. Please try again.`;
        }
      });
    });
    seek.addEventListener('input', () => {
      if (activeAudio !== audio) { pauseAll(); activeAudio = audio; }
      seekTo(Number(seek.value));
    });
    audio.addEventListener('loadedmetadata', () => {
      if (pendingSeek !== null) seekTo(pendingSeek);
      updateProgress();
    });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('durationchange', updateProgress);
    audio.addEventListener('play', () => {
      setPlayIcon(button, true);
      button.setAttribute('aria-label', `Pause ${method.label}`);
      card.classList.add('is-playing');
      status.textContent = `Playing ${method.label} · Sample ${id}`;
    });
    audio.addEventListener('pause', () => {
      setPlayIcon(button, false);
      button.setAttribute('aria-label', `Play ${method.label}`);
      card.classList.remove('is-playing');
      if (activeAudio === audio) status.textContent = `Paused ${method.label} · Sample ${id}`;
    });
    audio.addEventListener('ended', () => {
      if (activeAudio === audio) status.textContent = `Finished ${method.label} · Sample ${id}`;
      updateProgress();
    });
    audio.addEventListener('error', () => {
      if (!audio.hasAttribute('src')) return;
      if (!card.querySelector('.audio-error')) {
        const message = document.createElement('p');
        message.className = 'audio-error'; message.textContent = 'Audio unavailable. Try another sample.';
        card.append(message);
      }
      status.textContent = `${method.label} could not be loaded for sample ${id}.`;
    });
    // Reset clears queued seeks as well as the visible playback position.
    audio.addEventListener('resetplayback', () => { pendingSeek = null; if (audio.readyState >= 1) audio.currentTime = 0; updateProgress(); });
    line.append(button, seekControl, time);
    card.append(title, line, audio);
    players.append(card);
  });
  const image = document.querySelector('#spectrogram');
  image.src = `assets/spectrograms/${id}.png`;
  image.alt = `Spectrogram comparison of all eight signals for sample ${id}`;
  document.querySelector('#spectrogram-link').href = image.getAttribute('src');
  document.querySelector('#spectrogram-image-link').href = image.getAttribute('src');
}

select.addEventListener('change', () => showSample(sampleIds.indexOf(select.value)));
document.querySelector('#previous-sample').addEventListener('click', () => { if (position > 0) showSample(position - 1); });
document.querySelector('#next-sample').addEventListener('click', () => { if (position < sampleIds.length - 1) showSample(position + 1); });
document.querySelector('#reset-audio').addEventListener('click', () => {
  pauseAll();
  players.querySelectorAll('audio').forEach(audio => audio.dispatchEvent(new Event('resetplayback')));
  activeAudio = null;
  status.textContent = 'Playback reset. All signals start at 0:00.';
});
showSample(0);
panelFromLocation();
fetch('assets/audio-metadata.json').then(response => {
  if (!response.ok) throw new Error('Audio metadata unavailable');
  return response.json();
}).then(data => {
  metadata = data;
  const meta = metadata[sampleIds[position]];
  if (meta) players.querySelectorAll('.audio-card').forEach((card, i) => {
    card.querySelectorAll('.waveform').forEach(svg => svg.replaceWith(waveform(meta.peaks[methods[i].key])));
  });
}).catch(() => { /* A flat seek bar remains usable without waveform metadata. */ });
window.addEventListener('pagehide', pauseAll);
