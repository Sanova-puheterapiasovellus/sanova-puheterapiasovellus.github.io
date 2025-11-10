import "./index.css";
import { reactiveHash } from "./common/dom.ts";
import { dispatchInternalNotification } from "./common/events.ts";
import { initializeAllWords } from "./components/allwords.ts";
import { initializeCategorySelector } from "./components/categories.ts";
import { initializeGameContainer } from "./components/game.ts";
import { initializeHeader } from "./components/navbar.ts";
import { initializeNotificationSystem } from "./components/notifications.ts";
import { initializeSyllableHintPlayer } from "./components/syllablesHint.ts";

const route = reactiveHash();

initializeHeader(route);
initializeCategorySelector();
initializeGameContainer();
initializeSyllablePlayer();
initializeSyllableHintPlayer();
initializeAllWords(route);
initializeNotificationSystem();

dispatchInternalNotification(document.body, "Testi-ilmoitus", "Lisätietoja");
