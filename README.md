# MBTLA

Project page for **MBTLA: Multi-Branch Temporal Linear Attention with Adaptive Retention Gate for Lightweight Speech Enhancement** (ICASSP 2027 submission).

**Website:** https://wentone123.github.io/mbtla/

The page contains a model introduction, 20 audio comparisons across eight signals, and Figures 2 and 3 from the manuscript. All model descriptions and aggregate metrics come from the supplied manuscript. Demo excerpts are 8-second, 16 kHz mono WAV files. The original audio files are unchanged.

## Preview locally

Run `python -m http.server 8765` in this directory and visit http://localhost:8765/. No build step, package installation, or external CDN is required.

## GitHub Pages

The site is a static page at the repository root. In **Settings → Pages**, use **Deploy from a branch**, branch **main**, folder **/ (root)**. Existing Pages settings can be retained if already configured this way. `.nojekyll` disables unnecessary Jekyll processing. All asset URLs are relative and work beneath `/mbtla/`.

## Audio and figures

- `assets/app.js` defines the sample IDs, display names, and exact audio paths.
- `demo/audio/` contains the original WAV files, grouped by method.
- `assets/audio-metadata.json` contains duration, sample rate, and waveform peak data computed from those files. Peaks are normalized per signal for display only; playback amplitudes are unchanged.
- `assets/spectrograms/` contains spectrogram comparisons regenerated from the WAV files. They use 512-point STFTs, 256-sample hops, a Hann window, and a shared per-sample magnitude reference across all eight methods, displayed from −80 to 0 dB. No perceptual or quality metrics are recomputed or overlaid.
- `assets/architecture.png`, `assets/temporal-behavior.png`, and `assets/memory-statistics.png` are rendered from the supplied manuscript figures. Full-resolution PNGs open from the figure links.
- Historical files under `demo/pictures/` are preserved; the page uses regenerated figures with consistent method labels.

To update the audio metadata and spectrograms, run `python tools/prepare_audio_assets.py` with NumPy, SciPy, and Matplotlib available. This only reads the audio files and writes derived assets.

The page uses native audio controls, pauses other players when switching methods, optionally carries over the playback position, and resets playback on sample changes.
