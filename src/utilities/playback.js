/**
 * All previously loaded audio snippets as there's a reasonable finite amount of them.
 *
 * @type {Map<string, AudioBuffer>}
 */
const snippetCache = new Map();

/**
 * Determine the common sample rate, channel count and total length of audio snippets,
 * asserting that they're compatible with each other.
 *
 * @param {Iterable<AudioBuffer>} values
 * @returns {{ length: number, samples: number, channels: number }}
 */
function analyzeAudioBuffers(values) {
    let length = 0;
    let samples;
    let channels;

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

/**
 * Combine multiple audio buffers into one with optional empty space expressed in seconds.
 *
 * @param {AudioContext} context
 * @param {AudioBuffer[]} values
 * @param {number} separation
 * @returns {AudioBuffer}
 */
function combineAudioBuffers(context, values, separation = 0) {
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

/**
 * Load a sound clip with caching.
 *
 * @param {AbortSignal} signal
 * @param {AudioContext} context
 * @param {string} name
 * @returns {Promise<AudioBuffer>}
 */
async function loadSoundClip(signal, context, name) {
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

/**
 * Build up a cached syllable sound out of individual character sounds.
 *
 * @param {AbortSignal} cancellation
 * @param {AudioContext} context
 * @param {string} value
 * @returns {Promise<AudioBuffer>}
 */
async function formSyllableSound(cancellation, context, value) {
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

/**
 * Spell out the given syllables with a separation in seconds.
 *
 * @param {AbortSignal} cancellation
 * @param {AudioContext} context
 * @param {string[]} syllables
 * @param {number} separation
 * @returns {Promise<void>}
 */
export async function playSyllableSounds(cancellation, context, syllables, separation) {
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
