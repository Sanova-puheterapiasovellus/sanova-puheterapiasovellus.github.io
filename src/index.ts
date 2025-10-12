// @ts-expect-error seemingly doesn't understand bundlers?
import "./index.css";
import { initializeCategorySelector } from "./components/categories.ts";
import { initializeGameContainer } from "./components/game.ts";
import { initializeSyllablePlayer } from "./components/syllables.ts";
import { initializeAllWords } from "./components/allwords.ts";

initializeCategorySelector();
initializeGameContainer();
initializeSyllablePlayer();
initializeAllWords()
