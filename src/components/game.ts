import { expectElement } from "../common/dom";
import type { CategorySelectedEvent, WordSelectedEvent } from "../common/events";
import { getImagePath, wordsData } from "../data/word-data-model.ts";
import { GameSession } from "./GameSession";
import type { WordGuess } from "./WordGuess";
import { initializeWordSelector } from "./words.ts";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const letterHintButton = expectElement("word-guess-letter-hint", HTMLButtonElement);
const textHintButton = expectElement("word-guess-text-hint", HTMLButtonElement);
const syllableHintButton = expectElement("word-guess-syllable-hint", HTMLButtonElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);
const letterSlots = expectElement("word-guess-slots", HTMLDivElement);
const hiddenInput = document.getElementById("hidden-input") as HTMLInputElement;

// Keep track of the game progress, initially null
let gameSession: GameSession | null = null;

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    guessDialog.close();
}

/** Trigger the mobile keyboard */
function focusHiddenInput() {
    hiddenInput.focus();
}

/** Handle the game starting with the selected category. */
function handleGameStart(event: CategorySelectedEvent): void {
    const currentCategory: string = event.detail.name;
    gameSession = new GameSession(currentCategory);
    //initializeWordSelector(currentCategory, gameSession); // Uncomment to make the word view visible

    // ### SKIP THE WORD VIEW WHEN CATEGORY IS SELECTED ###
    const category = wordsData.categories.find((c) => c.name === currentCategory);
    if (!category) return;

    gameSession.setCategory(currentCategory);
    gameSession.setWords(category.words.map((w) => w.name));

    gameSession.setGameModeRandom(); // Show words in random order
    const word = gameSession.getNextWord();
    // Fake the word selection event
    dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { name: word, index: 0 },
        }),
    );
    // ### ############################################ ###
}

function setImage(word: string, category: string) {
    const categoryData = wordsData.categories.find((c) => c.name === category);
    const wordData = categoryData!.words.find((w) => w.name === word);

    wordImage.alt = wordData!.name;
    wordImage.src = getImagePath(wordData!.image);
}

/** Handle the word selection, i.e. show the guessing modal for the user */
function handleWordSelected(event: WordSelectedEvent) {
    if (!gameSession) return;

    const word = gameSession.getCurrentWord();
    const category = gameSession.getCategory();

    guessDialog.showModal();
    setupWordInput();

    setImage(word, category);
}

/** Renders the empty slots after answering or when initializing the first word */
function setupWordInput() {
    const wordGuess = getGameSession().getCurrentWordGuess();
    wordGuess.render(letterSlots);
    hiddenInput.value = "";
    hiddenInput.focus();
    letterSlots.addEventListener("click", () => hiddenInput.focus());
}

/** Handle the typing events when using both physical keyboard and phone's keyboard */
function handleInputEvent() {
    if (!gameSession) return;

    const wordGuess = gameSession.getCurrentWordGuess();
    const currentWord = gameSession.getCurrentWord();
    const locked = wordGuess.getLockedLettersArray();

    let typed = hiddenInput.value.toUpperCase();

    // Restrict the length of the input word to the length of the word being guessed
    if (typed.length > currentWord.length) {
        typed = typed.slice(0, currentWord.length);
        hiddenInput.value = typed;
    }

    const oldGuess = wordGuess.getGuess();

    if (typed.length < oldGuess.length) {
        // Protect locked (hint) letters
        const oldLetters = oldGuess.split("");
        const newLetters: string[] = [];

        for (let i = 0; i < oldLetters.length; i++) {
            if (locked[i]) {
                newLetters.push(oldLetters[i]!);
            } else {
                if (newLetters.length < typed.length) {
                    newLetters.push(typed[newLetters.length]!);
                }
            }
        }

        wordGuess.setGuessFromString(newLetters.join(""));
        hiddenInput.value = newLetters.join("");

        // Set the mobile cursor to the end of the text after backspace
        setTimeout(() => {
            hiddenInput.setSelectionRange(hiddenInput.value.length, hiddenInput.value.length);
        }, 0);
    } else {
        wordGuess.setGuessFromString(typed);
    }

    wordGuess.render(letterSlots);
}

/** Function that guarantees to return a valid game session object or throw an error */
function getGameSession(): GameSession {
    if (gameSession === null) {
        throw new Error("Game session is not initialized yet!");
    }
    return gameSession;
}

function handleUseVocalHint(): void {
    getGameSession().useVocalHint();
}

/** Handle the letter hint logic when the letter hint is requested */
function handleUseLetterHint(): void {
    if (!gameSession) return;
    const wordGuess = gameSession.getCurrentWordGuess();
    const done = wordGuess.useLetterHint();

    hiddenInput.value = wordGuess.getGuess();
    wordGuess.render(letterSlots);

    if (done) {
        // word completed with hints, move to next word
        handleAnswer(wordGuess);
    }
}

/** Check if the user's answer is correct */
function isCorrectAnswer(correctAnswer: string, answer: string): boolean {
    if (correctAnswer === answer) {
        return true;
    }
    return false;
}

/** Handle the user's guess when the answer btn is pressed */
function handleAnswer(wordGuess: WordGuess): void {
    const answer = wordGuess.getGuess().toLowerCase();
    const correctAnswer: string = wordImage.alt;
    const isCorrect: boolean = isCorrectAnswer(correctAnswer, answer);
    if (isCorrect) {
        const gameSession: GameSession = getGameSession();
        const nextWord: string = gameSession.getNextWord();
        const category = gameSession.getCategory();
        setImage(nextWord, category);
    } else {
        // show incorrect feedback if you like
        wordGuess.removeAllLetters();
    }
    setupWordInput();
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer() {
    window.addEventListener("category-selected", handleGameStart);
    window.addEventListener("word-selected", handleWordSelected);
    closeButton.addEventListener("click", handleDialogClose);

    answerButton.addEventListener("click", () => {
        if (!gameSession) return;
        const wordGuess = gameSession.getCurrentWordGuess();
        handleAnswer(wordGuess);
    });

    letterHintButton.addEventListener("click", handleUseLetterHint);

    hiddenInput.addEventListener("input", handleInputEvent);
}
