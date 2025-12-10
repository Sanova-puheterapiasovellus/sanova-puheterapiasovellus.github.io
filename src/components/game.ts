import { expectElement } from "../common/dom";
import type {
    CategorySelectedEvent,
    GameOverEvent,
    GameResults,
    WordSelectedEvent,
    WordsSelectedEvent,
} from "../common/events";
import { dispatchCustomEvent } from "../common/events.ts";
import { type Category, getImagePath, type Word, wordsData } from "../data/word-data-model.ts";
import { GameSession } from "./GameSession";
import "./styles/game.css";
import { getFinnishVoice } from "../common/playback.ts";
import { lockPageScroll, unlockPageScroll } from "../common/preventScroll.ts";
import { GAME_INSTRUCTIONS } from "../data/information-texts.ts";
import { splitToSyllables } from "../utils/syllable-split.ts";
import { showInstructionsModal } from "./gameInstructions.ts";
import { showCreditsModal } from "./imageCredits.ts";
import { playWord } from "./syllablePlayer.ts";
import { handlePlayback } from "./syllablesHint.ts";
import type { WordGuess } from "./WordGuess";
import { showWordGuessResults } from "./wordGuessResults.ts";
import { WordGuessStatus } from "./wordStatus.ts";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const guessCard = expectElement("word-guess-card", HTMLDivElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const answerButtonIcon = answerButton.querySelector("img") as HTMLImageElement;
const letterHintButton = expectElement("word-guess-letter-hint", HTMLButtonElement);
const textHintButton = expectElement("word-guess-text-hint", HTMLButtonElement);
const syllableHintButton = expectElement("word-guess-syllable-hint", HTMLButtonElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);
const letterSlots = expectElement("word-guess-slots", HTMLDivElement);
const hiddenInput = document.getElementById("hidden-input") as HTMLInputElement;
const textHint = expectElement("text-hint", HTMLDivElement);
const guessProgressCounter = expectElement("word-guess-progress-counter", HTMLDivElement);
const imageCreditsButton = expectElement("word-guess-image-credits-button", HTMLElement);
const skipButton = expectElement("skip-word", HTMLButtonElement);
const instructionsOpenButton = expectElement(
    "word-guess-game-instructions-button",
    HTMLButtonElement,
);

const answerButtonDefaultIcon = "/assets/icons/reply_24dp.svg";

// Keep track of the game progress, initially null
export let gameSession: GameSession | null = null;

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    // Close the guessing dialog
    guessDialog.close();
}

/** Reset game dialog information when closed. */
function handleGameClose(): void {
    // Set the gameSession null to avoid a situation where the user
    // would select a different category, but the words from previously
    // closed category would appear.
    gameSession = null;
    unlockPageScroll();
}

/** Focus on the input, user can write to the input after calling this */
function focusHiddenInput(): void {
    if (!isMobile()) {
        // Only focus if not using mobile device
        hiddenInput.focus();
    }
}

/** Handle the game starting with the selected category. */
function handleGameStart(event: CategorySelectedEvent): void {
    const currentCategory: Category = event.detail.category;
    let selections: Array<{ word: Word; index: number }> = [];
    let categoryForSession: Category | null = null;

    if (currentCategory.name === "random") {
        const allWords = wordsData.categories.flatMap((c) =>
            c.words.map((w, idx) => ({ word: w, index: idx })),
        );
        selections = pickRandom(allWords, 10);
    } else {
        selections = currentCategory.words.map((w, idx) => ({ word: w, index: idx }));
        categoryForSession = currentCategory;
    }

    gameSession = new GameSession(categoryForSession);
    // Set the words to the game session object through the WordsSelected event
    dispatchCustomEvent("words-selected", {
        selections,
        category: currentCategory.name === "random" ? null : currentCategory,
        isReplay: false,
    });

    gameSession.setGameModeRandom(); // Show words in random order
    const word = gameSession.getNextWord();
    resetTextHint();
    answerButtonIcon.src = answerButtonDefaultIcon;

    dispatchCustomEvent("word-selected", { word, index: 0 });
}
/** Helper function to pick random words */
function pickRandom<T>(array: T[], count: number): T[] {
    return [...array].sort(() => Math.random() - 0.5).slice(0, count);
}
function handleGameOver(event: GameOverEvent) {
    const showResults: boolean = event.detail.showResults;
    guessDialog.close();
    if (showResults) {
        if (gameSession) {
            showWordGuessResults(gameSession);
        }
    } else {
        unlockPageScroll();
    }
    gameSession = null;
}

/** Show the image that should be guessed */
function setImage(): void {
    if (!gameSession) return;

    const word = gameSession.getCurrentWord();
    const newSrc = getImagePath(word.image);

    // Hide current image immediately
    wordImage.style.opacity = "0";

    const img = new Image();
    img.src = newSrc;

    img.onload = () => {
        wordImage.src = newSrc;
        wordImage.alt = word.name;

        // Fade in smoothly
        requestAnimationFrame(() => {
            wordImage.style.opacity = "1";
        });
    };
}

function updateGameProgressCounter(): void {
    if (gameSession) {
        guessProgressCounter.textContent = `${gameSession.getGuessedWordCount() + 1}/${gameSession.getTotalWordCount()}`;
    }
}

/** Handle the word selection, i.e. show the guessing modal for the user */
function handleWordSelected(event: WordSelectedEvent): void {
    if (!gameSession) {
        // If gameSession does not exist, then only one word was selected
        gameSession = new GameSession(null);
        const { word } = event.detail;
        gameSession.setWords([word]);
        gameSession.setCurrentWordIndex(0);
    }

    if (event.detail.word === null) {
        // No word was set, set it here
        gameSession.setCurrentWordIndex(0);
    }

    guessDialog.showModal();
    guessCard.scrollTop = 0; //reset scroll position of game to top when game opens
    lockPageScroll();
    resetTextHint();
    updateGameProgressCounter();
    setupWordInput();
    answerButtonIcon.src = answerButtonDefaultIcon;

    setImage();
}

function handleWordsSelected(event: WordsSelectedEvent): void {
    const { category, selections, isReplay } = event.detail;
    gameSession = new GameSession(category);
    //if (!gameSession) return;

    gameSession.setIsReplay(isReplay);
    gameSession.setCategory(category);
    gameSession.setWords(selections.map((s) => s.word));
}

/** Return true if mobile device, else false.
 *  This is based on detecting touch points that mobile
 *  devices have.
 */
function isMobile(): boolean {
    const hasCoarsePointer = matchMedia("(pointer: coarse)").matches;
    const maxTouchPoints = navigator.maxTouchPoints > 0;

    return hasCoarsePointer && maxTouchPoints;
}

/** Renders the empty slots after answering or when initializing the first word */
function setupWordInput(): void {
    const wordGuess = getGameSession().getCurrentWordGuess();
    wordGuess.render(letterSlots);
    hiddenInput.value = "";
    letterSlots.addEventListener("click", () => hiddenInput.focus());
    focusHiddenInput();
}

/** Handle the typing events when using both physical keyboard and phone's keyboard */
function handleInputEvent(): void {
    if (!gameSession) return;

    const wordGuess = gameSession.getCurrentWordGuess();
    const locked = wordGuess.getLockedLettersArray();

    let typed = hiddenInput.value.toUpperCase();

    const fullSplit = wordGuess.getSplitWord();

    const lettersOnly = fullSplit.filter(([_, isLetter]) => isLetter);
    // Max number of letters is lettersOnly.length - lockedCount,
    // as hint (locked) letters are not in the hidden input
    // field anymore
    //const lockedCount = locked.filter((v) => v).length;
    const maxTypedLength = lettersOnly.length - wordGuess.getHintLettersCount();

    // Restrict typed input to number of letters
    if (typed.length > maxTypedLength) {
        typed = typed.slice(0, maxTypedLength);
        hiddenInput.value = typed;
    }

    const newGuess: string[] = [];
    let typedIndex = 0;

    for (let i = 0; i < fullSplit.length; i++) {
        const [char, isLetter] = fullSplit[i]!;
        if (!isLetter) {
            // Special char stays visible
            newGuess[i] = char;
            continue;
        }

        if (locked[i]) {
            // Keep locked letter
            newGuess[i] = wordGuess.getGuess()[i]!;
            continue;
        }

        // Use next typed letter or blank
        const next = typed[typedIndex];

        // Stop immediately when typed has no more characters
        if (next === undefined) {
            break;
        }
        newGuess[i] = next;
        typedIndex++;
    }

    // Save guess
    wordGuess.setGuessFromString(newGuess.join(""));

    // Hidden input always = letters only
    hiddenInput.value = typed;

    setTimeout(() => {
        hiddenInput.setSelectionRange(hiddenInput.value.length, hiddenInput.value.length);
    }, 0);

    // Render
    wordGuess.render(letterSlots);
}

/** Function that guarantees to return a valid game session object or throw an error */
function getGameSession(): GameSession {
    if (gameSession === null) {
        throw new Error("Game session is not initialized yet!");
    }
    return gameSession;
}

/** Handle the letter hint logic when the letter hint is requested */
function handleUseLetterHint(): void {
    if (!gameSession) return;
    gameSession.useLetterHint();
    const wordGuess = gameSession.getCurrentWordGuess();
    const done = wordGuess.useLetterHint();

    //hiddenInput.value = wordGuess.getGuess();
    hiddenInput.value = "";
    wordGuess.render(letterSlots);

    if (done) {
        // word completed with hints, move to next word
        handleAnswer(wordGuess);
    }
    focusHiddenInput();
}

/** Set current word's text hint */
function handleUseTextHint() {
    if (!gameSession) return;

    const isTextHintVisible = !textHintButton.classList.contains("toggled");

    if (isTextHintVisible) {
        gameSession.useTextHint();
        const currentWord = gameSession.getCurrentWord();
        textHint.textContent = currentWord.hint;
        textHintButton.classList.add("toggled");
    } else {
        textHint.textContent = "";
        textHintButton.classList.remove("toggled");
    }
    focusHiddenInput();
}

async function handleUseVocalHint(): Promise<void> {
    if (!gameSession) return;
    gameSession.useVocalHint();
    const word: string = gameSession.getCurrentWord().name;
    const syllables: string[] = Array.from(splitToSyllables(word));
    if (gameSession.getLastHintWord() !== word) {
        gameSession.setLastHintWord(word);
        gameSession.setPlayedFullSyllablesOnce(false);
    }
    const fiVoice = await getFinnishVoice();
    const useFallBack = gameSession.getCurrentWord().fallBackPlayer === true;
    if (!useFallBack && fiVoice !== undefined) {
        await playWord(syllables, fiVoice);
    } else {
        await handlePlayback(syllables);
    }

    // Focus back to input from the button
    focusHiddenInput();
}

/** Check if the user's answer is correct */
function isCorrectAnswer(correctAnswer: string, answer: string): boolean {
    if (correctAnswer === answer) {
        return true;
    }
    return false;
}

function setButtonsEnabled(enabled: boolean): void {
    answerButton.disabled = !enabled;
    letterHintButton.disabled = !enabled;
    syllableHintButton.disabled = !enabled;
    skipButton.disabled = !enabled;
    textHintButton.disabled = !enabled;
}

function getGameResults(gameSession: GameSession): GameResults {
    const gameResults: GameResults = {
        correctAnswers: gameSession.getCountByStatus(WordGuessStatus.CORRECT),
        incorrectAnswers: gameSession.getCountByStatus(WordGuessStatus.INCORRECT),
        skippedWords: gameSession.getCountByStatus(WordGuessStatus.SKIPPED),
        wordsSolvedUsingHints: gameSession.getCountByStatus(WordGuessStatus.CORRECT_USED_HINT),
        totalWords: gameSession.getTotalWordCount(),
        totalVocalHintsUsed: gameSession.getVocalHintsUsed(),
        totalTextHintsUsed: gameSession.getTextHintsUsed(),
        totalLetterHintsUsed: gameSession.getLetterHintsUsed(),
    };
    return gameResults;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetTextHint() {
    textHint.textContent = "";
    textHintButton.classList.remove("toggled");
    gameSession?.resetTextHintFlag();
}

async function handleSkipWord(): Promise<void> {
    if (!gameSession) return;
    gameSession.markCurrentSkipped();
    // Style the card to indicate skipping
    guessCard.classList.add("skip");

    await delayBeforeNextWord();

    const isGameOver: boolean = gameSession.isGameOver();
    if (isGameOver) {
        processGameOver(gameSession);
        return;
    }

    handleNextWordLogic(gameSession);
}

function generateParticles(gameSession: GameSession, color: string): void {
    //const container = document.getElementById("word-guess-slots")!;
    const spans = letterSlots.querySelectorAll(".letter-slot");

    spans.forEach((span) => {
        gameSession
            .getCurrentWordGuess()
            .createCaretParticles(span as HTMLElement, color, 1000, 25, 50);
    });
}

/** Handle the user's guess when the answer btn is pressed */
async function handleAnswer(wordGuess: WordGuess) {
    const answer = wordGuess.getGuess().toLowerCase();
    const correctAnswer: string = wordImage.alt;
    if (isAnswerInvalid(answer, correctAnswer)) return;

    const gameSession: GameSession = getGameSession();
    const isCorrect: boolean = isCorrectAnswer(correctAnswer, answer);
    markAnswerResult(gameSession, isCorrect);

    await delayBeforeNextWord();

    const isGameOver: boolean = gameSession.isGameOver();
    if (isGameOver) {
        processGameOver(gameSession);
        return;
    }

    handleNextWordLogic(gameSession);
}

/**
 * Check if answer is invalid and indicate the user about invalid answer.
 * Answer is invalid if the answer length is shorter than correctAnswer.
 *
 * @param answer user's answer
 * @param correctAnswer correct answer
 * @returns if the answer length was invalid
 */
function isAnswerInvalid(answer: string, correctAnswer: string): boolean {
    // Check if the answer is the correct length (cannot submit empty word for example)
    if (answer.length < correctAnswer.length) {
        // Indicate the user about invalid answer. The user can answer
        // again with a correct length word.
        guessCard.classList.add("shake");
        // Non-blocking timeout to remove the shake class
        setTimeout(() => {
            guessCard.classList.remove("shake");
        }, 400);
        return true;
    }
    return false;
}

/**
 * Mark if the answer was correct or incorrect. If hints were used with correct answer,
 * mark the answer result as hints used.
 *
 * @param gameSession current gameSession
 * @param isCorrect whether the answer is correct
 */
function markAnswerResult(gameSession: GameSession, isCorrect: boolean) {
    if (isCorrect) {
        const usedAnyHints: boolean = gameSession.getCurrentWordGuess().getHintsUsed();
        if (usedAnyHints) {
            gameSession.markHintUsed();
        } else {
            gameSession.markCurrentCorrect();
        }
        guessCard.classList.add("correct");
        answerButtonIcon.src = "/assets/icons/correct_answer.svg";
        // Generate green particles for a correct guess
        generateParticles(gameSession, "limegreen");
    } else {
        gameSession.markIncorrectlyGuessed();
        guessCard.classList.add("wrong");
        answerButtonIcon.src = "/assets/icons/wrong_answer.svg";
    }
}

/**
 * Keep the current style for some time before next word.
 * Disable buttons when this time is running.
 */
async function delayBeforeNextWord(): Promise<void> {
    // Set buttons disabled during the delay
    setButtonsEnabled(false);
    await delay(1000);
    setButtonsEnabled(true);

    // Remove the indication of correct/wrong/skipped answer before moving to the next card
    guessCard.classList.remove("correct", "wrong", "skip");
    answerButtonIcon.src = answerButtonDefaultIcon;
}

/**
 * Process game over situation. Check if the words will be replayed
 * and dispatch gameOver event.
 *
 * @param gameSession current gameSession
 */
function processGameOver(gameSession: GameSession) {
    let showResults: boolean = gameSession.getTotalWordCount() > 1;
    const isReplay: boolean = gameSession.getIsReplay();
    if (isReplay) {
        // Always show results if the user is replaying correct words,
        // even if there was only one word replayed
        showResults = true;
    }
    dispatchCustomEvent("show-results", { showResults, gameResults: getGameResults(gameSession) });
}

/**
 * Make the necessary changes/resets before changing to the next word
 *
 * @param gameSession current gameSession
 */
function handleNextWordLogic(gameSession: GameSession) {
    const nextWord: Word = gameSession.getNextWord();
    gameSession.resetVocalHints();
    updateGameProgressCounter();
    resetTextHint();
    setImage();

    setupWordInput();
}

function handleImageCredits(): void {
    if (!gameSession) return;

    const currentWord = gameSession.getCurrentWord();

    showCreditsModal(currentWord.image.credit);
}

function handleGameInstructions(): void {
    if (!gameSession) return;
    showInstructionsModal(GAME_INSTRUCTIONS);
}
function moveCursorToEnd(input: HTMLInputElement) {
    const length = input.value.length;
    input.setSelectionRange(length, length);
}

/** Set focus on the hidden input field if the
 * user clicks inside the game dialog */
function handleClickGameDialog(event: PointerEvent): void {
    // On mobile we cannot prevent the default behaviour, as the
    // mobile keyboard will then remain popped all the time.
    // On PC we can as we want the input to be active all the time.
    if (!isMobile()) {
        event.preventDefault();
    }

    // Get the clicked element
    const target = event.target as HTMLElement;

    // Elements that were clicked and should be ignored
    const interactiveSelector = ["button", "summary", "details", "input", "a"].join(",");

    // If the clicked element is any of the ones in the list, skip
    if (target.closest(interactiveSelector)) {
        return;
    }

    // Otherwise, focus on the input
    focusHiddenInput();
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer(): void {
    window.addEventListener("category-selected", handleGameStart);
    window.addEventListener("word-selected", handleWordSelected);
    window.addEventListener("words-selected", handleWordsSelected);
    window.addEventListener("show-results", handleGameOver);
    closeButton.addEventListener("click", handleDialogClose);

    guessDialog.addEventListener("close", handleGameClose);

    // Focus on the input field if the dialog is clicked
    guessCard.addEventListener("pointerdown", handleClickGameDialog);

    answerButton.addEventListener("click", () => {
        if (!gameSession) return;
        const wordGuess = gameSession.getCurrentWordGuess();
        handleAnswer(wordGuess);
        // Focus back to input from the button
        focusHiddenInput();
    });

    // No suggestions
    hiddenInput.setAttribute("autocomplete", "off");
    hiddenInput.setAttribute("autocorrect", "off");
    hiddenInput.setAttribute("autocapitalize", "off");
    hiddenInput.setAttribute("spellcheck", "false");
    hiddenInput.setAttribute("name", "hidden-no-autocomplete");

    // Use enter as "Answer button"
    hiddenInput.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!gameSession) return;

            const wordGuess = gameSession.getCurrentWordGuess();
            handleAnswer(wordGuess);
        }
    });

    letterHintButton.addEventListener("click", handleUseLetterHint);
    syllableHintButton.addEventListener("click", handleUseVocalHint);
    imageCreditsButton.addEventListener("click", handleImageCredits);
    textHintButton.addEventListener("click", handleUseTextHint);
    skipButton.addEventListener("click", handleSkipWord);
    instructionsOpenButton.addEventListener("click", handleGameInstructions);

    hiddenInput.addEventListener("input", handleInputEvent);

    /* Make sure that cursor is always at the very end of the hidden input */
    hiddenInput.addEventListener("focus", () => moveCursorToEnd(hiddenInput));
    hiddenInput.addEventListener("click", () => moveCursorToEnd(hiddenInput));
    hiddenInput.addEventListener("keyup", () => moveCursorToEnd(hiddenInput));

    // Enable the caret blink when the input is focused
    hiddenInput.addEventListener("focus", () => {
        letterSlots.classList.add("caret-enabled");
    });

    // Disable the blink when the focus is lost
    hiddenInput.addEventListener("blur", () => {
        letterSlots.classList.remove("caret-enabled");
    });
}
