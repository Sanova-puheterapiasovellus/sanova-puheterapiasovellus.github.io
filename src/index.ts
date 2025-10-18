import "./index.css";
import { dispatchInternalNotification } from "./common/events.ts";
import { initializeCategorySelector } from "./components/categories.ts";
import { initializeGameContainer } from "./components/game.ts";
import { initializeHeader } from "./components/navbar.ts";
import { initializeNotificationSystem } from "./components/notifications.ts";
import { initializeSyllablePlayer } from "./components/syllables.ts";

initializeHeader();
initializeCategorySelector();
initializeGameContainer();
initializeSyllablePlayer();
initializeNotificationSystem();

dispatchInternalNotification(document.body, "Testi-ilmoitus", "Lisätietoja");
