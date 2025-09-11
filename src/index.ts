// @ts-expect-error seemingly doesn't understand bundlers?
import "./index.css";
import { SyllablePlayer } from "./components/syllables.ts";

customElements.define("syllable-player", SyllablePlayer);
