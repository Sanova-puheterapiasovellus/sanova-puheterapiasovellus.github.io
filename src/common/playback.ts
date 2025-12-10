import { offsetsData } from "../data/offset-data-model";
import {
    characterSeparation,
    compressorOptions,
    edgeFade,
    startOffset,
    syllableSeparation,
} from "../data/syllable-player-config";

/** Lazily initialized context for syllable playback. */
let audioContext: AudioContext | undefined;

/** Available speech synthesis voices. */
let cachedVoices: SpeechSynthesisVoice[] | undefined;

/** All previously loaded audio snippets as there's a reasonable finite amount of them. */
const snippetCache = new Map<string, Promise<AudioBuffer>>();

/** Load available speech synthesis voices. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (cachedVoices !== undefined) {
        return Promise.resolve(cachedVoices);
    }

    return new Promise((resolve) => {
        cachedVoices = speechSynthesis.getVoices();
        if (cachedVoices.length > 0) {
            resolve(cachedVoices);
            return;
        }

        speechSynthesis.addEventListener("voiceschanged", (_) => {
            cachedVoices = speechSynthesis.getVoices();
            resolve(cachedVoices);
        });
    });
}

/** Return a finnish voice. */
export async function getFinnishVoice(): Promise<SpeechSynthesisVoice | undefined> {
    const preferredVoices = ["Satu"];

    return (await loadVoices())
        .values()
        .filter(({ lang }) => lang.startsWith("fi"))
        .find(({ name }) => preferredVoices.includes(name));
}

/** Play back something with the speech synthesis API. */
export async function synthesizeSpeech(
    text: string,
    voice: SpeechSynthesisVoice,
    cancellation?: AbortSignal,
): Promise<void> {
    return new Promise((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = voice;
        utter.lang = "fi-FI";
        utter.rate = 0.8;
        utter.addEventListener("end", () => resolve());
        cancellation?.addEventListener("abort", () => speechSynthesis.cancel(), { once: true });
        speechSynthesis.speak(utter);
    });
}

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

/** Lazily initialize the global audio context object. */
function getGlobalAudioContext(): AudioContext {
    audioContext ??= new AudioContext();
    return audioContext;
}

/** Cached load of an individual sound clip in it's raw form. */
export function loadSoundClip(
    signal: AbortSignal,
    name: string,
    context: AudioContext = getGlobalAudioContext(),
): Promise<AudioBuffer> {
    return loadCachedValue(snippetCache, name, async () => {
        const response = await fetch(`/sounds/${name}.mp3`, { signal });
        if (!response.ok) {
            throw new Error(`failed to fetch sound clip for ${name}`, {
                cause: response,
            });
        }

        return context.decodeAudioData(await response.arrayBuffer());
    });
}

/** Load required syllable sounds. */
function loadSyllableSounds(
    cancellation: AbortSignal,
    context: AudioContext,
    syllables: string[],
): Promise<{ name: string; buffer: AudioBuffer }[][]> {
    return Promise.all(
        syllables.map((syllable) =>
            Promise.all(
                syllable.split("").map((name) =>
                    loadSoundClip(cancellation, name, context).then((buffer) => ({
                        name,
                        buffer,
                    })),
                ),
            ),
        ),
    );
}

/** Transition the context from a suspended state as needed. */
function ensureReadyForPlayback(context: AudioContext): Promise<void> {
    return context.state === "suspended" ? context.resume() : Promise.resolve();
}

/** Spell out the given syllables with a separation in seconds. */
export async function playSyllableSounds(
    cancellation: AbortSignal,
    syllables: string[],
    context: AudioContext = getGlobalAudioContext(),
): Promise<void> {
    // Load all sounds and wait to become ready up front.
    const [_, segments] = await Promise.all([
        ensureReadyForPlayback(context),
        loadSyllableSounds(cancellation, context, syllables),
    ]);

    // Required state for scheduling playback.
    let time = context.currentTime + startOffset;
    let played = 0;
    const nodes = [] as [AudioBufferSourceNode, GainNode][];
    const { promise, resolve } = Promise.withResolvers<void>();

    // Compress the dynamic range of our somewhat unequal sound clips.
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = compressorOptions.threshold;
    compressor.knee.value = compressorOptions.knee;
    compressor.ratio.value = compressorOptions.ratio;
    compressor.attack.value = compressorOptions.attack;
    compressor.release.value = compressorOptions.release;
    compressor.connect(context.destination);

    // Create audio nodes for playing back the relevant sounds.
    for (const sounds of segments) {
        for (const { name, buffer } of sounds) {
            const player = context.createBufferSource();
            const fade = context.createGain();

            // Use the actual offset that is configured for this sound.
            const startOffset = offsetsData[name]?.start ?? 0;
            const playDuration = (offsetsData[name]?.end ?? buffer.length) - startOffset;

            // Calculate crossfade times for smoothing transitions.
            const fadeIn = Math.min(edgeFade, playDuration * 0.49);
            const fadeOut = Math.max(0, playDuration - fadeIn);

            // Wire up playback with our crossfader.
            fade.gain.value = 0;
            player.buffer = buffer;
            player.connect(fade).connect(compressor);

            // Wire up fade in effect.
            player.start(time, startOffset, playDuration);
            fade.gain.setValueAtTime(0, time);
            fade.gain.linearRampToValueAtTime(1, time + fadeIn);

            // Wire up fade out effect.
            fade.gain.setValueAtTime(1, time + fadeOut);
            fade.gain.linearRampToValueAtTime(0, time + playDuration);

            // Track the playback ending.
            player.addEventListener(
                "ended",
                (_) => {
                    // Resolve promise when all sounds have been played.
                    if (++played === segments.length) {
                        resolve();
                    }
                },
                { signal: cancellation, once: true },
            );

            // Move forwards and keep hold of the audio nodes.
            time += playDuration + characterSeparation;
            nodes.push([player, fade]);
        }

        // Move forwards between syllables.
        time += syllableSeparation;
    }

    // Wire up playback cancellation.
    cancellation.addEventListener(
        "abort",
        (_) => {
            // Cancel all pending playback and effects.
            for (const [player, fade] of nodes) {
                player.stop();
                fade.gain.cancelScheduledValues(context.currentTime);
            }

            // Resolve promise to return.
            resolve();
        },
        { once: true },
    );

    // Wait for either cancellation or all clips finishing.
    await promise;
}
