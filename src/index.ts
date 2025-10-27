import "./index.css";
import { dispatchInternalNotification } from "./common/events.ts";
import { initializeAllWords } from "./components/allwords.ts";
import { initializeCategorySelector } from "./components/categories.ts";
import { initializeGameContainer } from "./components/game.ts";
import { initializeHeader } from "./components/navbar.ts";
import { initializeNotificationSystem } from "./components/notifications.ts";
import { initializeSyllablePlayer } from "./components/syllables.ts";
import { initializeSyllableHintPlayer } from "./components/syllablesHint.ts";

initializeHeader();
initializeCategorySelector();
initializeGameContainer();
initializeSyllablePlayer();
initializeSyllableHintPlayer();
initializeAllWords();
initializeNotificationSystem();

dispatchInternalNotification(document.body, "Testi-ilmoitus", "Lisätietoja");
