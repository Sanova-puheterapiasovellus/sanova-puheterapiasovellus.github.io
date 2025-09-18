// @ts-expect-error seemingly doesn't understand bundlers?
import "./index.css";
import { initializeSyllablePlayer } from "./components/syllables.ts";

initializeSyllablePlayer();
