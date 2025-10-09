import "./index.css";
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
