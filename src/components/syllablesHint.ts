import { expectElement } from "../common/dom.ts";
import { playSyllableSounds } from "../common/playback.ts";
import { splitToSyllables } from "../utils/syllable-split.ts";

const syllableSeparationSeconds = 0.5;

const playButton = expectElement("word-guess-syllable-hint", HTMLButtonElement);

let determinedSyllables: string[] | undefined;
let playbackContext: AudioContext | undefined;
let playbackCancellation: AbortController | undefined;

/** Set the played syllable hint word. */
export function setSyllableHintWord(word: string): void {
    determinedSyllables = splitToSyllables(word).toArray();
}

/** Play back the syllable sounds when requested. */
async function handlePlayback(_: Event): Promise<void> {
    // This should get caught earlier, so might as well ignore it.
    if (determinedSyllables === undefined || determinedSyllables.length === 0) {
        return;
    }

    // Audio contexts can only be initialized while handling user input.
    playbackContext ??= new AudioContext();

    try {
        // Set up cancellation possibility and ensure the button can't be pressed early.
        playbackCancellation = new AbortController();
        playButton.disabled = true;

        // Wait for the syllable sounds to be loaded and played to the end.
        await playSyllableSounds(
            playbackCancellation.signal,
            playbackContext,
            determinedSyllables,
            syllableSeparationSeconds,
        );
    } finally {
        // Clear out cancellation and enable button regardless of outcome.
        playbackCancellation = undefined;
        playButton.disabled = false;
    }
}

/** Connect syllable hint player events. */
export function initializeSyllableHintPlayer() {
    playButton.addEventListener("click", handlePlayback);
}
