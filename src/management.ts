import { buildHtml, expectElement } from "./common/dom";
import { addOrUpdateFile, createBranch, createPullRequest } from "./common/github";
import { loadSoundClip } from "./common/playback";
import { type AudioSegment, offsetsData } from "./data/offset-data-model";
import { wordsData } from "./data/word-data-model";
import { splitToSyllables } from "./utils/syllable-split";

const managementForm = expectElement("form", HTMLFormElement, document.body);
const authToken = expectElement("#auth-token", HTMLInputElement, managementForm);
const soundSelection = expectElement("#sound-selection", HTMLSelectElement, managementForm);
const soundStart = expectElement("#sound-start", HTMLInputElement, managementForm);
const soundEnd = expectElement("#sound-end", HTMLInputElement, managementForm);
const missingSoundCount = expectElement("#missing-sound-count", HTMLSpanElement, managementForm);
const missingSoundList = expectElement("#missing-sound-list", HTMLUListElement, managementForm);
const customBranch = expectElement("#branch-name", HTMLInputElement, managementForm);

let soundsChanged = false;
const soundOffsets = structuredClone(offsetsData);

let loadMetadataCancellation: AbortController | undefined;

/** Load appropriate properties for the selected sound. */
async function handleSoundSelectionChange(_: Event): Promise<void> {
    // Reset cancellation state.
    loadMetadataCancellation?.abort("user didn't wait for previous audio clip to be loaded");
    loadMetadataCancellation = new AbortController();

    // Disable editing for load duration.
    soundStart.disabled = soundEnd.disabled = true;

    try {
        // Fetch buffer for it's metadata.
        const buffer = await loadSoundClip(loadMetadataCancellation.signal, soundSelection.value);

        // Apply appropriate values and limits.
        soundStart.valueAsNumber = soundOffsets[soundSelection.value]?.start ?? 0;
        soundEnd.valueAsNumber = soundOffsets[soundSelection.value]?.end ?? buffer.duration;
        soundStart.max = soundEnd.max = buffer.duration.toString();
    } finally {
        // Clear out cancellation and allow editing.
        loadMetadataCancellation = undefined;
        soundStart.disabled = soundEnd.disabled = false;
    }
}

/** Hacky way to attempt floating point equality. */
function audioSegmentsRoughlyEqual(first: AudioSegment, second?: AudioSegment): boolean {
    return (
        Math.fround(first.start) === Math.fround(second?.start ?? 0) ||
        Math.fround(first.end) === Math.fround(second?.end ?? 0)
    );
}

/** Track changes to either offset. */
function handleSoundOffsetChange(_: Event): void {
    soundOffsets[soundSelection.value] ??= { start: 0, end: 0 };

    // biome-ignore lint/style/noNonNullAssertion: nullish coalescing assignment above
    const entry = soundOffsets[soundSelection.value]!;
    entry.start = soundStart.valueAsNumber;
    entry.end = soundEnd.valueAsNumber;

    // FIXME: this is a horrible idea and we need to track this some other way
    soundsChanged = !audioSegmentsRoughlyEqual(entry, offsetsData[soundSelection.value]);
}

/** Make changes when requested. */
async function handleFormSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    const branchName = customBranch.value.length !== 0 ? customBranch.value : undefined;
    if (branchName !== undefined) {
        await createBranch(branchName, authToken.value);
    }

    if (soundsChanged) {
        await addOrUpdateFile(
            "sound offset refinement",
            "src/data/offset-data.json",
            JSON.stringify(soundOffsets, undefined, 4),
            authToken.value,
            branchName,
        );
    }

    if (branchName !== undefined) {
        await createPullRequest("requested changes", branchName, authToken.value);
    }
}

/** Build up dynamic state and connect events for using the management page. */
function initializeState() {
    soundSelection.addEventListener("change", handleSoundSelectionChange);
    soundStart.addEventListener("change", handleSoundOffsetChange);
    soundEnd.addEventListener("change", handleSoundOffsetChange);
    managementForm.addEventListener("submit", handleFormSubmit);

    for (const key in offsetsData) {
        soundSelection.appendChild(
            buildHtml("option", { value: key, innerText: key.toUpperCase() }),
        );
    }

    const missingSyllableSounds = new Set(
        wordsData.categories
            .values()
            .flatMap((category) => category.words.values())
            .flatMap((word) => splitToSyllables(word.name)),
    ).difference(new Set(Object.keys(offsetsData)));

    missingSoundCount.innerText = missingSyllableSounds.size.toString();
    for (const value of missingSyllableSounds) {
        missingSoundList.appendChild(buildHtml("li", { innerText: value }));
    }

    // Make a deferred selection to ensure our event listener gets invoked.
    queueMicrotask(() => {
        soundSelection.selectedIndex = 0;
    });
}

initializeState();
