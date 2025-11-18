import "./index.css";
import { reactiveHash } from "./common/dom.ts";
import { dispatchInternalNotification } from "./common/events.ts";
import { historyState } from "./common/persistence.ts";
import { initializeAllWords } from "./components/allwords.ts";
import { initializeCategorySelector } from "./components/categories.ts";
import { initializeGameContainer } from "./components/game.ts";
import { initializeImageCreditsDialog } from "./components/imageCredits.ts";
import { initializeManagementDialog } from "./components/management.ts";
import { initializeHeader } from "./components/navbar.ts";
import { initializeNotificationSystem } from "./components/notifications.ts";
import { initializeSyllableHintPlayer } from "./components/syllablesHint.ts";

const history = historyState();
const route = reactiveHash();

initializeHeader(route);
initializeCategorySelector();
initializeGameContainer();
initializeSyllableHintPlayer();
initializeAllWords(route);
initializeNotificationSystem();
initializeManagementDialog(route);
initializeImageCreditsDialog();

dispatchInternalNotification(document.body, "Testi-ilmoitus", "Lisätietoja");

history.subscribe((entries) => {
    const pretty = entries.map(({ date, ...result }) => ({
        date: new Date(date * 1000),
        ...result,
    }));

    console.table(pretty);
});
