import { BaseComponent, expectElement } from "../utilities/dom.ts";
import { playSyllableSounds } from "../utilities/playback.ts";

/** Utility for playing syllables as a demonstration. */
export class SyllablePlayer extends BaseComponent {
    static #inputDebounceMilliseconds = 100;
    static #syllableSeparationSeconds = 1;
    static #componentTemplate = expectElement(
        "#syllable-player",
        HTMLTemplateElement,
        document.body,
    );

    #autoSubmitDebounce: number | undefined;
    #determinedSyllables: string[] | undefined;
    #playbackContext: AudioContext | undefined;
    #playbackCancellation: AbortController | undefined;

    #rootForm = expectElement("form", HTMLFormElement, this.shadowRoot);
    #wordInput = expectElement("input", HTMLInputElement, this.#rootForm);
    #hyphenatedWord = expectElement("output", HTMLOutputElement, this.#rootForm);
    #playButton = expectElement("button", HTMLButtonElement, this.#rootForm);

    constructor() {
        super(SyllablePlayer.#componentTemplate);
    }

    /** Function that the browser engine calls when this component is mounted. */
    connectedCallback(): void {
        this.connectEvent("change", this.#wordInput, this.#handleInputChange);
        this.connectEvent("submit", this.#rootForm, this.#handleSubmission);
        this.connectEvent("click", this.#playButton, this.#handlePlayback);
    }

    /** Utilize a debounced automatic submit for input changes. */
    #handleInputChange(_: Event): void {
        // Submit the form after some inactivity, resetting the timeout on input.
        clearTimeout(this.#autoSubmitDebounce);
        this.#autoSubmitDebounce = setTimeout(
            () => this.#rootForm.requestSubmit(),
            SyllablePlayer.#inputDebounceMilliseconds,
        );
    }

    /** Actually split the syllables on submission. */
    #handleSubmission(event: Event): void {
        event.preventDefault();

        // There might be a previous playback request that hasn't finished.
        if (this.#playbackCancellation !== undefined) {
            this.#playbackCancellation.abort("user didn't wait for previous playback to finish");
        }

        // Update state accordingly to the given input.
        this.#determinedSyllables = this.#wordInput.value.split(" ");
        if (this.#determinedSyllables.length > 1) {
            this.#hyphenatedWord.value = this.#determinedSyllables.join("-");
            this.#playButton.disabled = false;
        } else {
            this.#determinedSyllables = undefined;
            this.#playButton.disabled = true;
        }
    }

    /** Play back the syllable sounds when requested. */
    async #handlePlayback(_: Event): Promise<void> {
        // This should get caught earlier, so might as well ignore it.
        if (this.#determinedSyllables === undefined || this.#determinedSyllables.length === 0) {
            return;
        }

        // Audio contexts can only be initialized while handling user input.
        if (this.#playbackContext === undefined) {
            this.#playbackContext = new AudioContext();
        }

        try {
            // Set up cancellation possibility and ensure the button can't be pressed early.
            this.#playbackCancellation = new AbortController();
            this.#playButton.disabled = true;

            // Wait for the syllable sounds to be loaded and played to the end.
            await playSyllableSounds(
                this.#playbackCancellation.signal,
                this.#playbackContext,
                this.#determinedSyllables,
                SyllablePlayer.#syllableSeparationSeconds,
            );
        } finally {
            // Clear out cancellation and enable button regardless of outcome.
            this.#playbackCancellation = undefined;
            this.#playButton.disabled = false;
        }
    }
}
