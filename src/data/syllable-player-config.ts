// The basics of how sounds are combined with each other.
export const characterSeparation = 0;
export const syllableSeparation = 0.25;
export const startOffset = 0;
export const edgeFade = 0.1;

// Options for reverb applied to smooth playback.
export const reverbWetGain = 0.15;
export const reverbDuration = 0.12;
export const reverbDecay = 3;

// Target linear root mean square loudness. (-20 dBFS)
export const targetLoudness = 10 ** (-20 / 20);

// Options for compressor to smooth playback.
export const compressorOptions = {
    threshold: -22,
    knee: 24,
    ratio: 3,
    attack: 0.01,
    release: 0.2,
} satisfies DynamicsCompressorOptions;
