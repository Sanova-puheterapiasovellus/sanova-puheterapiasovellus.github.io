import { type AudioSegment, offsetsData } from "../data/offset-data-model";

/** All previously loaded audio snippets as there's a reasonable finite amount of them. */
const snippetCache = new Map<string, Promise<AudioBuffer>>();

/** The internal logic of doing an asynchronous cached load. */
async function loadCachedValue<T>(
    storage: Map<string, Promise<T>>,
    key: string,
    source: () => Promise<T>,
): Promise<T> {
    const existing = storage.get(key);
    if (existing !== undefined) {
        return existing;
    }

    const promise = source();
    storage.set(key, promise);

    return promise;
}

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

    const middle = Math.floor(separation * samples);
    const capacity = length + (values.length - 1) * middle;
    const output = context.createBuffer(channels, capacity, samples);

    let offset = 0;
    for (const buffer of values) {
        for (let index = 0; index < channels; index++) {
            output.copyToChannel(buffer.getChannelData(index), index, offset);
        }

        offset += buffer.length + middle;
    }

    return output;
}

/**
 * Essentially an {@link Array#splice} but for audio buffers.
 *
 * Bit of an silly approach since it's an unnecessary temporary copy,
 * but that saves me from changing too much of the surrounding logic.
 */
function audioBufferSubset(
    context: AudioContext,
    original: AudioBuffer,
    offsets: AudioSegment,
): AudioBuffer {
    const startSample = Math.floor(original.sampleRate * offsets.start);
    const endSample = Math.floor(original.sampleRate * offsets.end);

    const output = context.createBuffer(
        original.numberOfChannels,
        endSample - startSample,
        original.sampleRate,
    );

    for (let index = 0; index < original.numberOfChannels; index++) {
        output
            .getChannelData(index)
            .set(original.getChannelData(index).subarray(startSample, endSample));
    }

    return output;
}

/** Cached load of an individual sound clip in it's raw form. */
export function loadSoundClip(
    signal: AbortSignal,
    context: AudioContext,
    name: string,
): Promise<AudioBuffer> {
    return loadCachedValue(snippetCache, name, async () => {
        const response = await fetch(`sounds/${name}.mp3`, { signal });
        if (!response.ok) {
            throw new Error(`failed to fetch sound clip for ${name}`, {
                cause: response,
            });
        }

        return context.decodeAudioData(await response.arrayBuffer());
    });
}

/** Build up a cached syllable sound out of configured segments of individual character sounds. */
async function formSyllableSound(
    cancellation: AbortSignal,
    context: AudioContext,
    value: string,
): Promise<AudioBuffer> {
    return loadCachedValue(snippetCache, value, async () =>
        combineAudioBuffers(
            context,
            await Promise.all(
                value.split("").map(async (character) => {
                    const buffer = await loadSoundClip(cancellation, context, character);
                    const meta = offsetsData[character];
                    if (meta === undefined) {
                        return buffer;
                    }

                    return audioBufferSubset(context, buffer, meta);
                }),
            ),
        ),
    );
}

/** Play back audio buffer and wait for it to finish. */
async function waitFullPlayback(
    cancellation: AbortSignal,
    context: AudioContext,
    buffer: AudioBuffer,
): Promise<void> {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    return new Promise((resolve) => {
        source.addEventListener("ended", (_) => resolve());
        source.start();

        cancellation.addEventListener("abort", (_) => source.stop());
    });
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

    await waitFullPlayback(
        cancellation,
        context,
        combineAudioBuffers(context, segments, separation),
    );
}
