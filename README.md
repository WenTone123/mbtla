# MBTLA supplementary material

Supplementary page for **Multi-Branch Temporal Linear Attention with Adaptive Retention Gate for Lightweight Speech Enhancement**.

The page has three switchable sections:

- **Results:** the manuscript's DNS3 performance comparison, with standard and larger configurations. Best values are emphasized within each group, including ties.
- **Audio Examples:** 20 samples across eight signals, compact waveform seek controls, and always-visible spectrograms. Only one signal plays at a time. Playback position can carry across methods; leaving the audio section pauses playback.
- **Analysis:** four figures showing temporal behavior, dataset statistics, branch-specific memory, and TRA/context RMS. The last figure uses a shared absolute RMS scale without per-branch numeric overlays.

The page displays no author names, affiliations, contact details, or repository links. Hosting account and repository history remain outside the page content.

## Local preview

Run `python -m http.server 8765 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:8765/`. No build, package installation, or external CDN is required.

## Assets

- `assets/app.js` defines exact audio paths, sample IDs, tab navigation, playback, and accessible waveform seek controls.
- `demo/audio/` contains the original 8-second, 16 kHz mono WAV excerpts. Playback amplitudes are unchanged.
- `assets/audio-metadata.json` holds durations, sample rates, and per-signal normalized waveform peaks for display only.
- `assets/spectrograms/` contains comparisons computed from those WAV files, using a 512-point STFT, 256-sample hop, Hann window, and a shared per-sample reference across eight signals (−80 to 0 dB).
- `assets/temporal-behavior.png`, `assets/memory-statistics.png`, `assets/branch-memory.png`, and `assets/tra-la-activity.png` are the four displayed analysis figures.

Regenerate audio metadata and compact spectrograms with `python tools/prepare_audio_assets.py` using NumPy, SciPy, and Matplotlib. This reads audio and writes derived display assets only.

GitHub Pages serves the root of `main`; `.nojekyll` keeps the page static. Asset URLs are relative. URL fragments `#results`, `#audio`, and `#analysis` open the corresponding section, and browser back/forward navigation is supported. Arrow keys, Home, and End switch focused tabs.
