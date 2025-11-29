import { expectElement } from "../common/dom.ts";
import { playSyllableSounds } from "../common/playback.ts";
import { syllableSeparationSeconds } from "../data/syllable-player-config.ts";
import { gameSession } from "./game.ts";

const playButton = expectElement("word-guess-syllable-hint", HTMLButtonElement);

let playbackCancellation: AbortController | undefined;

/** Play back the syllable sounds when requested. */
export async function handlePlayback(syllables: string[]): Promise<void> {
    // This should get caught earlier, so might as well ignore it.
    if (!gameSession || syllables === undefined || syllables.length === 0) {
        return;
    }
    const syllablesToPlayCount = Math.min(
        gameSession.getVocalHintsUsedForCurrentWord(),
        syllables.length,
    );

    const syllablesToPlay = syllables.slice(0, syllablesToPlayCount);

    try {
        // Set up cancellation possibility and ensure the button can't be pressed early.
        playbackCancellation = new AbortController();
        playButton.disabled = true;

        // Wait for the syllable sounds to be loaded and played to the end.
        await playSyllableSounds(
            playbackCancellation.signal,
            syllablesToPlay,
            syllableSeparationSeconds,
        );
    } finally {
        // Clear out cancellation and enable button regardless of outcome.
        playbackCancellation = undefined;
        playButton.disabled = false;
    }
}
