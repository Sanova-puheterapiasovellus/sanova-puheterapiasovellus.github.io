import "./index.css";
import { reactiveHash } from "./common/dom.ts";
import { dispatchInternalNotification } from "./common/events.ts";
import { initializeAboutPage } from "./components/aboutpage.ts";
import { initializeAllWords } from "./components/allwords.ts";
import { initializeCategorySelector } from "./components/categories.ts";
import { initializeGameContainer } from "./components/game.ts";
import { initializeGameInstructionsDialog } from "./components/gameInstructions.ts";
import { initializeImageCreditsDialog } from "./components/imageCredits.ts";
import { initializeHeader } from "./components/navbar.ts";
import { initializeNotificationSystem } from "./components/notifications.ts";

const route = reactiveHash();

initializeHeader(route);
initializeCategorySelector();
initializeGameContainer();
initializeAllWords(route);
initializeAboutPage(route);
initializeNotificationSystem();
initializeImageCreditsDialog();
initializeGameInstructionsDialog();

dispatchInternalNotification(document.body, "Testi-ilmoitus", "Lisätietoja");
