import { synthesizeSpeech } from "../common/playback.ts";
import { gameSession } from "./game.ts";

async function playSyllable(syllable: string, voice: SpeechSynthesisVoice) {
    return synthesizeSpeech(syllable, voice);
}

export async function playWord(syllables: string[], voice: SpeechSynthesisVoice) {
    if (!syllables || syllables.length === 0) return;
    const syllablesToPlayCount = Math.min(
        gameSession?.getVocalHintsUsedForCurrentWord() ?? 0,
        syllables.length,
    );
    window.speechSynthesis.cancel();
    if (syllablesToPlayCount === syllables.length) {
        // Play whole word one syllable at a time first time
        if (!gameSession?.getPlayedFullSyllablesOnce()) {
            gameSession?.setPlayedFullSyllablesOnce(true);
            for (const s of syllables) {
                await playSyllable(s, voice);
            }
        }
        // Play entire word continuously
        else {
            const wholeWord = syllables.join("");
            await playSyllable(wholeWord, voice);
        }
        return;
    }
    // Play limited amount of syllables
    const syllablesToPlay = syllables.slice(0, syllablesToPlayCount);
    for (const syllable of syllablesToPlay) {
        await playSyllable(syllable, voice);
    }
}
