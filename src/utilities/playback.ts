/** All previously loaded audio snippets as there's a reasonable finite amount of them. */
const snippetCache = new Map<string, AudioBuffer>();

/**
 * Determine the common sample rate, channel count and total length of audio snippets,
 * asserting that they're compatible with each other.
 */
function analyzeAudioBuffers(values: Iterable<AudioBuffer>): {
    length: number;
    samples: number;
    channels: number;
} {
    let length = 0;
    let samples: number | undefined;
    let channels: number | undefined;

    for (const buffer of values) {
        if (
            (samples !== undefined && samples !== buffer.sampleRate) ||
            (channels !== undefined && channels !== buffer.numberOfChannels)
        ) {
            throw new Error("format of audio segments must match for combining");
        }

        length += buffer.length;
        samples = buffer.sampleRate;
        channels = buffer.numberOfChannels;
    }

    if (samples === undefined || channels === undefined) {
        throw new Error("more than one audio segment required for combining");
    }

    return { channels, length, samples };
}

/** Combine multiple audio buffers into one with optional empty space expressed in seconds. */
function combineAudioBuffers(
    context: AudioContext,
    values: AudioBuffer[],
    separation: number = 0,
): AudioBuffer {
    const { length, samples, channels } = analyzeAudioBuffers(values);

    const capacity = length + (values.length - 1) * (separation * samples);
    const output = context.createBuffer(channels, capacity, samples);

    let offset = 0;
    for (const buffer of values) {
        for (let index = 0; index < channels; index++) {
            output.copyToChannel(buffer.getChannelData(index), index, offset);
        }

        offset += buffer.length + separation * samples;
    }

    return output;
}

/** Load a sound clip with caching. */
async function loadSoundClip(
    signal: AbortSignal,
    context: AudioContext,
    name: string,
): Promise<AudioBuffer> {
    const existing = snippetCache.get(name);
    if (existing !== undefined) {
        return existing;
    }

    const response = await fetch(`assets/${name}.opus`, { signal });
    if (!response.ok) {
        throw new Error(`failed to fetch sound clip for ${name}`, {
            cause: response,
        });
    }

    const data = await response.arrayBuffer();
    const audio = await context.decodeAudioData(data);

    snippetCache.set(name, audio);
    return audio;
}

/** Build up a cached syllable sound out of individual character sounds. */
async function formSyllableSound(
    cancellation: AbortSignal,
    context: AudioContext,
    value: string,
): Promise<AudioBuffer> {
    const existing = snippetCache.get(value);
    if (existing !== undefined) {
        return existing;
    }

    const output = combineAudioBuffers(
        context,
        await Promise.all(
            value.split("").map((character) => loadSoundClip(cancellation, context, character)),
        ),
    );

    snippetCache.set(value, output);
    return output;
}

/** Spell out the given syllables with a separation in seconds. */
export async function playSyllableSounds(
    cancellation: AbortSignal,
    context: AudioContext,
    syllables: string[],
    separation: number,
): Promise<void> {
    const segments = await Promise.all(
        syllables.map((name) => formSyllableSound(cancellation, context, name)),
    );

    const source = context.createBufferSource();
    source.buffer = combineAudioBuffers(context, segments, separation);
    source.connect(context.destination);

    return new Promise((resolve) => {
        source.addEventListener("ended", (_) => resolve());
        source.start();

        cancellation.addEventListener("abort", (_) => source.stop());
    });
}
