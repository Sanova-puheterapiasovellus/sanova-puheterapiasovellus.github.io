import { gameSession } from "./game.ts";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

/** Load available speech synthesis voices */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (cachedVoices) return Promise.resolve(cachedVoices);
    return new Promise((resolve) => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            cachedVoices = voices;
            resolve(voices);
            return;
        }
        speechSynthesis.onvoiceschanged = () => {
            const voicesNow = speechSynthesis.getVoices();
            cachedVoices = voicesNow;
            resolve(voicesNow);
        };
    });
}

/** Return a finnish voice */
async function getFinnishVoice() {
    const voices = (await loadVoices()).filter((v) => v.lang.startsWith("fi"));
    voices.forEach((v) => {
        console.log(v.name);
    });
    if (voices.length === 0) {
        return null;
    }

    let voice = voices.find((v) => v.name === "Satu");
    if (!voice) voice = voices[0];

    return voice;
}

function speak(text: string, voice: SpeechSynthesisVoice): Promise<void> {
    return new Promise((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = voice;
        utter.lang = "fi-FI";
        utter.rate = 0.8;
        utter.onend = () => resolve();
        speechSynthesis.speak(utter);
    });
}

async function playSyllable(syllable: string) {
    if (!("speechSynthesis" in window)) {
        alert("Puheentunnistus ei ole käytettävissä tässä selaimessa.");
        return;
    }

    const voice = await getFinnishVoice();
    if (!voice) {
        alert("Ei löytynyt suomenkielisiä TTS-ääniä.");
        return;
    }

    return speak(syllable, voice);
}

export async function playWord(syllables: string[]) {
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
                await playSyllable(s);
            }
        }
        // Play entire word continuously
        else {
            const wholeWord = syllables.join("");
            await playSyllable(wholeWord);
        }
        return;
    }
    // Play limited amount of syllables
    const syllablesToPlay = syllables.slice(0, syllablesToPlayCount);
    for (const syllable of syllablesToPlay) {
        await playSyllable(syllable);
    }
}
