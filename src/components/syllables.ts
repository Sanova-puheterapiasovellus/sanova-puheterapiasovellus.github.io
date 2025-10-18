import { expectElement } from "../common/dom.ts";
import { playSyllableSounds } from "../common/playback.ts";

const inputDebounceMilliseconds = 100;
const syllableSeparationSeconds = 0.5;

const toolDialog = expectElement("syllable-player-dialog", HTMLDialogElement);
const openButton = expectElement("syllable-player-open", HTMLButtonElement);
const closeButton = expectElement("syllable-player-close", HTMLButtonElement);

const rootForm = expectElement("syllable-player-form", HTMLFormElement);
const syllableInput = expectElement("syllable-player-input", HTMLInputElement);
const hyphenatedWord = expectElement("syllable-player-output", HTMLOutputElement);
const playButton = expectElement("syllable-player-play", HTMLButtonElement);

let autoSubmitDebounce: number | undefined;
let determinedSyllables: string[] | undefined;
let playbackContext: AudioContext | undefined;
let playbackCancellation: AbortController | undefined;

/** Open the dialog as requested. */
function handleDialogOpen(_: Event): void {
    toolDialog.showModal();
}

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    toolDialog.close();
}

/** Utilize a debounced automatic submit for input changes. */
function handleInputChange(_: Event): void {
    // Submit the form after some inactivity, resetting the timeout on input.
    window.clearTimeout(autoSubmitDebounce);
    autoSubmitDebounce = window.setTimeout(
        () => rootForm.requestSubmit(),
        inputDebounceMilliseconds,
    );
}

/** Actually split the syllables on submission. */
function handleSubmission(event: Event): void {
    event.preventDefault();

    // There might be a previous playback request that hasn't finished.
    if (playbackCancellation !== undefined) {
        playbackCancellation.abort("user didn't wait for previous playback to finish");
    }

    // Update state accordingly to the given input.
    determinedSyllables = syllableInput.value.split(" ");
    if (determinedSyllables.length > 1) {
        hyphenatedWord.value = determinedSyllables.join("-");
        playButton.disabled = false;
    } else {
        determinedSyllables = undefined;
        playButton.disabled = true;
    }
}

/** Play back the syllable sounds when requested. */
async function handlePlayback(_: Event): Promise<void> {
    // This should get caught earlier, so might as well ignore it.
    if (determinedSyllables === undefined || determinedSyllables.length === 0) {
        return;
    }

    // Audio contexts can only be initialized while handling user input.
    if (playbackContext === undefined) {
        playbackContext = new AudioContext();
    }

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

/** Connect up events for syllable player. */
export function initializeSyllablePlayer() {
    openButton.addEventListener("click", handleDialogOpen);
    closeButton.addEventListener("click", handleDialogClose);
    syllableInput.addEventListener("change", handleInputChange);
    rootForm.addEventListener("submit", handleSubmission);
    playButton.addEventListener("click", handlePlayback);
}
