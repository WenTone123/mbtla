'use strict';

// Paths reflect the existing repository exactly, including filename case.
const methods = [
  { key: 'clean', label: 'Clean', kind: 'Reference speech', path: id => `demo/audio/clean/${id}_clean.wav` },
  { key: 'noisy', label: 'Noisy', kind: 'Input mixture', path: id => `demo/audio/noisy/${id}_noisy.wav` },
  { key: 'MBTLA', label: 'MBTLA', kind: 'Enhanced speech', proposed: true, path: id => `demo/audio/MBTLA/${id}.wav` },
  { key: 'ULUNAS', label: 'UL-UNAS', kind: 'Baseline', path: id => `demo/audio/ULUNAS/${id}_ULUNAS.wav` },
  { key: 'GTCRN', label: 'GTCRN', kind: 'Baseline', path: id => `demo/audio/GTCRN/${id}_GTCRN.wav` },
  { key: 'LiSenNet', label: 'LiSenNet', kind: 'Baseline', path: id => `demo/audio/LiSenNet/${id}_LiSenNet.wav` },
  { key: 'AdaptCRN', label: 'AdaptCRN', kind: 'Baseline', path: id => `demo/audio/AdaptCRN/${id}_AdaptCRN.wav` },
  { key: 'FastEnhancer', label: 'FastEnhancer-Base', kind: 'Baseline', path: id => `demo/audio/FastEnhancer/${id}.wav` }
];
const sampleIds = ['0013','0014','0020','0023','0025','0042','0043','0052','0053','0057','0059','0064','0065','0067','0069','0083','0088','0091','0093','0097'];
const select = document.querySelector('#sample-select');
const players = document.querySelector('#players');
const status = document.querySelector('#playback-status');
const sync = document.querySelector('#sync-position');
let activeAudio = null;
let metadata = null;
let position = 0;

for (const [i, id] of sampleIds.entries()) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = `${String(i + 1).padStart(2, '0')} — Sample ${id}`;
  select.append(option);
}

function waveform(peaks, label, proposed) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('waveform');
  svg.setAttribute('viewBox', '0 0 240 40');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  if (!peaks) return svg;
  const path = document.createElementNS(ns, 'path');
  const scale = 240 / peaks.length;
  path.setAttribute('d', peaks.map((peak, i) => {
    const x = ((i + .5) * scale).toFixed(2);
    const height = Math.max(.4, peak * 18);
    return `M${x} ${(20 - height).toFixed(2)}V${(20 + height).toFixed(2)}`;
  }).join(''));
  path.setAttribute('stroke', proposed ? '#5c9276' : '#8da9b5');
  path.setAttribute('stroke-width', '1.4');
  svg.append(path);
  return svg;
}

function showSample(index) {
  if (activeAudio) activeAudio.pause();
  activeAudio = null;
  position = index;
  const id = sampleIds[index];
  select.value = id;
  document.querySelector('#sample-title').textContent = `Sample ${id}`;
  document.querySelector('#sample-position').textContent = `${String(index + 1).padStart(2, '0')} / ${sampleIds.length}`;
  document.querySelector('#previous-sample').disabled = index === 0;
  document.querySelector('#next-sample').disabled = index === sampleIds.length - 1;
  const meta = metadata?.[id];
  document.querySelector('#sample-meta').textContent = meta ? `${(meta.sampleRate / 1000).toFixed(0)} kHz · Mono · ${meta.duration.toFixed(0)} seconds` : '16 kHz · Mono · 8 seconds';
  players.replaceChildren();
  status.textContent = 'Play any signal to start. Only one signal plays at a time.';
  methods.forEach(method => {
    const card = document.createElement('article');
    card.className = `audio-card${method.proposed ? ' proposed' : ''}`;
    const header = document.createElement('div');
    header.className = 'audio-card-header';
    const title = document.createElement('h4');
    title.textContent = method.label;
    header.append(title);
    if (method.proposed) {
      const tag = document.createElement('span');
      tag.className = 'tag'; tag.textContent = 'PROPOSED'; header.append(tag);
    }
    const kind = document.createElement('p');
    kind.className = 'signal-kind'; kind.textContent = method.kind;
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = method.path(id);
    audio.setAttribute('aria-label', `${method.label}, sample ${id}`);
    audio.addEventListener('play', () => {
      if (activeAudio !== audio) {
        const previous = activeAudio;
        const time = previous && sync.checked && !previous.ended ? previous.currentTime : null;
        players.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); });
        if (time !== null) {
          const seek = () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(time, Math.max(0, audio.duration - .05)); };
          if (audio.readyState >= 1) seek();
          else audio.addEventListener('loadedmetadata', seek, { once: true });
        }
        activeAudio = audio;
      }
      players.querySelectorAll('.audio-card').forEach(other => other.classList.remove('is-playing'));
      card.classList.add('is-playing');
      status.textContent = `Playing ${method.label} · Sample ${id}`;
    });
    audio.addEventListener('pause', () => {
      card.classList.remove('is-playing');
      if (activeAudio === audio) status.textContent = `Paused ${method.label} · Sample ${id}`;
    });
    audio.addEventListener('ended', () => {
      card.classList.remove('is-playing');
      if (activeAudio === audio) status.textContent = `Finished ${method.label} · Sample ${id}`;
    });
    audio.addEventListener('error', () => {
      if (!card.querySelector('.audio-error')) {
        const message = document.createElement('p');
        message.className = 'audio-error';
        message.textContent = 'Audio could not be loaded. Please reload and try again.';
        card.append(message);
      }
      status.textContent = `${method.label} could not be loaded for sample ${id}.`;
    });
    card.append(header, kind, waveform(meta?.peaks[method.key], method.label, method.proposed), audio);
    players.append(card);
  });
  const image = document.querySelector('#spectrogram');
  image.src = `assets/spectrograms/${id}.png`;
  image.alt = `Spectrogram comparison of all eight signals for sample ${id}`;
  document.querySelector('#spectrogram-link').href = image.getAttribute('src');
}

select.addEventListener('change', () => showSample(sampleIds.indexOf(select.value)));
document.querySelector('#previous-sample').addEventListener('click', () => { if (position > 0) showSample(position - 1); });
document.querySelector('#next-sample').addEventListener('click', () => { if (position < sampleIds.length - 1) showSample(position + 1); });
document.querySelector('#reset-audio').addEventListener('click', () => {
  players.querySelectorAll('audio').forEach(audio => { audio.pause(); if (audio.readyState >= 1) audio.currentTime = 0; });
  activeAudio = null;
  status.textContent = 'Playback reset. All signals start at 0:00.';
});
showSample(0);
fetch('assets/audio-metadata.json').then(response => {
  if (!response.ok) throw new Error('Audio metadata unavailable');
  return response.json();
}).then(data => {
  metadata = data;
  // Metadata is optional; never interrupt playback if the listener has started.
  const meta = metadata[sampleIds[position]];
  if (meta) players.querySelectorAll('.waveform').forEach((svg, i) => svg.replaceWith(waveform(meta.peaks[methods[i].key], methods[i].label, methods[i].proposed)));
}).catch(() => { /* Native players remain usable without decorative waveforms. */ });
window.addEventListener('pagehide', () => { if (activeAudio) activeAudio.pause(); });
