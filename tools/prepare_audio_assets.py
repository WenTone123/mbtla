"""Generate waveform metadata and comparable spectrograms from the original WAVs."""
import json
import wave
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import stft

ROOT = Path(__file__).resolve().parents[1]
METHODS = [
    ('clean', 'Clean', 'clean/{id}_clean.wav'),
    ('noisy', 'Noisy', 'noisy/{id}_noisy.wav'),
    ('MBTLA', 'MBTLA', 'MBTLA/{id}.wav'),
    ('ULUNAS', 'UL-UNAS', 'ULUNAS/{id}_ULUNAS.wav'),
    ('GTCRN', 'GTCRN', 'GTCRN/{id}_GTCRN.wav'),
    ('LiSenNet', 'LiSenNet', 'LiSenNet/{id}_LiSenNet.wav'),
    ('AdaptCRN', 'AdaptCRN', 'AdaptCRN/{id}_AdaptCRN.wav'),
    ('FastEnhancer', 'FastEnhancer-Base', 'FastEnhancer/{id}.wav'),
]

def main():
    output = ROOT / 'assets' / 'spectrograms'
    output.mkdir(parents=True, exist_ok=True)
    metadata = {}
    for source in sorted((ROOT / 'demo/audio/MBTLA').glob('*.wav')):
        sample_id = source.stem
        signals = []
        peaks = {}
        for key, label, pattern in METHODS:
            filename = ROOT / 'demo/audio' / pattern.format(id=sample_id)
            with wave.open(str(filename), 'rb') as reader:
                assert reader.getnchannels() == 1, filename
                assert reader.getsampwidth() == 2, filename
                rate = reader.getframerate()
                data = np.frombuffer(reader.readframes(reader.getnframes()), dtype='<i2').astype(float) / 32768
            assert rate == 16000, filename
            length = len(data)
            if signals:
                assert length == signals[0][3], filename
            bins = np.array_split(np.abs(data), 100)
            raw = np.array([chunk.max() for chunk in bins])
            peaks[key] = np.round(raw / max(raw.max(), 1e-12), 3).tolist()
            frequency, times, spectrum = stft(data, fs=rate, window='hann', nperseg=512, noverlap=256, boundary=None, padded=False)
            signals.append((label, frequency, times, length, np.abs(spectrum)))
        metadata[sample_id] = {'sampleRate': rate, 'duration': length / rate, 'peaks': peaks}
        reference = max(signal[4].max() for signal in signals)
        fig, axes = plt.subplots(2, 4, figsize=(16, 5.8), layout='constrained')
        for i, (ax, (label, freq, times, _, magnitude)) in enumerate(zip(axes.flat, signals)):
            db = 20 * np.log10(np.maximum(magnitude, 1e-12) / max(reference, 1e-12))
            im = ax.pcolormesh(times, freq / 1000, db, shading='auto', cmap='magma', vmin=-80, vmax=0, rasterized=True)
            ax.set(title=label, xlabel='Time (s)' if i >= 4 else '',
                   ylabel='Frequency (kHz)' if i % 4 == 0 else '',
                   ylim=(0, 8), xlim=(0, length / rate))
            ax.title.set_fontsize(12)
            ax.title.set_fontweight('bold')
            ax.tick_params(labelsize=8, labelbottom=i >= 4, labelleft=i % 4 == 0)
        bar = fig.colorbar(im, ax=axes, shrink=.85, pad=.02)
        bar.set_label('Magnitude (dB, shared reference)', fontsize=10)
        fig.savefig(output / f'{sample_id}.png', dpi=150, facecolor='white')
        plt.close(fig)
    (ROOT / 'assets/audio-metadata.json').write_text(json.dumps(metadata, separators=(',', ':')), encoding='utf-8')
    print(f'Validated {len(metadata) * len(METHODS)} WAV files; generated {len(metadata)} spectrograms and metadata.')

if __name__ == '__main__':
    main()
