import "./management.css";
import { buildHtml, expectElement } from "./common/dom";
import {
    addOrUpdateFile,
    attemptPreExistingToken,
    createBranch,
    createPullRequest,
    ensureFileDeleted,
    handleAuthorizationRedirect,
    initiateAuthorizationFlow,
} from "./common/github";
import { loadSoundClip } from "./common/playback";
import { type AudioSegment, offsetsData } from "./data/offset-data-model";
import { type Category, type Data, type Word, wordsData } from "./data/word-data-model";
import { splitToSyllables } from "./utils/syllable-split";

/** Item that has a known array position. */
type Entry<T> = { value: T; index: number };

const authLink = expectElement("#auth-link", HTMLAnchorElement, document.body);
const managementForm = expectElement("form", HTMLFormElement, document.body);
const authToken = expectElement("#auth-token", HTMLInputElement, managementForm);
const soundSelection = expectElement("#sound-selection", HTMLSelectElement, managementForm);
const soundStart = expectElement("#sound-start", HTMLInputElement, managementForm);
const soundEnd = expectElement("#sound-end", HTMLInputElement, managementForm);
const missingSoundCount = expectElement("#missing-sound-count", HTMLSpanElement, managementForm);
const missingSoundList = expectElement("#missing-sound-list", HTMLUListElement, managementForm);
const categoryList = expectElement("#category-list", HTMLUListElement, managementForm);
const customBranch = expectElement("#branch-name", HTMLInputElement, managementForm);
const pullRequest = expectElement("#pull-request", HTMLAnchorElement, managementForm);
const wordDialog = expectElement("#edit-word", HTMLDialogElement, document.body);
const wordForm = expectElement("form", HTMLFormElement, wordDialog);
const wordIndex = expectElement("#word-index", HTMLInputElement, wordForm);
const wordCategory = expectElement("#word-category", HTMLInputElement, wordForm);
const wordName = expectElement("#word-name", HTMLInputElement, wordForm);
const wordHint = expectElement("#word-hint", HTMLTextAreaElement, wordForm);
const wordImage = expectElement("#word-image", HTMLInputElement, wordForm);
const wordCredit = expectElement("#word-credit", HTMLTextAreaElement, wordForm);
const categoryDialog = expectElement("#edit-category", HTMLDialogElement, document.body);
const categoryForm = expectElement("form", HTMLFormElement, categoryDialog);
const categoryIndex = expectElement("#category-index", HTMLInputElement, categoryForm);
const categoryName = expectElement("#category-name", HTMLInputElement, categoryForm);
const categoryImage = expectElement("#category-image", HTMLInputElement, categoryForm);
const categoryCredit = expectElement("#category-credit", HTMLTextAreaElement, categoryForm);

let soundsChanged = false;
const soundOffsets = structuredClone(offsetsData);

let wordsChanged = false;
const wordList = structuredClone(wordsData.categories);
const removedWords = new Set<[number, number | undefined]>();
const addedImages = new Map<string, File>();

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
        Math.fround(first.start) === Math.fround(second?.start ?? 0) &&
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

    await Promise.all(
        addedImages.entries().map(async ([name, file]) => {
            const data = await file.bytes();

            await addOrUpdateFile(
                "image asset change",
                `public/assets/images/${name}`,
                String.fromCharCode(...data),
                authToken.value,
                branchName,
            );
        }),
    );

    if (wordsChanged || removedWords.size !== 0) {
        const unneededImages = new Set<string>();
        const categories = wordList
            .values()
            .filter(({ image }, category) => {
                if (!removedWords.has([category, undefined])) {
                    return true;
                }

                unneededImages.add(image);
                return false;
            })
            .map(({ words, ...rest }, category) => ({
                words: words
                    .values()
                    .filter(({ image }, word) => {
                        if (!removedWords.has([category, word])) {
                            return true;
                        }

                        unneededImages.add(image);
                        return false;
                    })
                    .toArray(),
                ...rest,
            }))
            .toArray();

        await addOrUpdateFile(
            "word data refinement",
            "src/data/word-data.json",
            JSON.stringify({ categories } satisfies Data, undefined, 4),
            authToken.value,
            branchName,
        );

        await Promise.all(
            unneededImages
                .values()
                .filter(Boolean)
                .map((name) =>
                    ensureFileDeleted(
                        "unneeded image asset",
                        `src/assets/images/${name}`,
                        authToken.value,
                        branchName,
                    ),
                ),
        );
    }

    if (branchName !== undefined) {
        const url = await createPullRequest("requested changes", branchName, authToken.value);
        pullRequest.href = url;
        pullRequest.hidden = false;
    }
}

/** Handle authorization flow or prepare for allowing it. */
async function authorizationFlow(): Promise<string | undefined> {
    const existing = await attemptPreExistingToken();
    if (existing !== undefined) {
        return existing;
    }

    const search = new URLSearchParams(location.search);
    if (search.size !== 0) {
        return handleAuthorizationRedirect(search);
    }

    const parameters = await initiateAuthorizationFlow();
    authLink.href += `?${parameters.toString()}`;
    authLink.hidden = false;
    return;
}

/** Open word editing dialog. */
function selectWord(category: Entry<Category>, current: Partial<Word>, existing?: number): void {
    wordDialog.showModal();
    wordIndex.value = (existing ?? -1).toString(10);
    wordCategory.value = category.index.toString(10);
    wordName.value = current.name ?? "";
    wordName.disabled = existing !== undefined;
    wordHint.value = current.hint ?? "";
    wordImage.required = !current.image;
    wordCredit.value = current.image_credit ?? "";
}

/** Open category editing dialog. */
function selectCategory(current: Partial<Category>, existing?: number): void {
    categoryDialog.showModal();
    categoryIndex.value = (existing ?? -1).toString(10);
    categoryName.value = current.name ?? "";
    categoryName.disabled = existing !== undefined;
    categoryImage.required = !current.image;
    categoryCredit.value = current.image_credit ?? "";
}

/** Build a word entry. */
function buildWord(category: Entry<Category>, word: Entry<Word>): HTMLLIElement {
    const updateWord = buildHtml("button", { type: "button" }, "Muokkaa sanaa");
    const deleteWord = buildHtml("button", { type: "button" }, "Poista sana");
    const wordItem = buildHtml(
        "li",
        {},
        buildHtml(
            "div",
            {},
            buildHtml("span", {}, word.value.name),
            buildHtml("section", {}, updateWord, deleteWord),
        ),
    );

    updateWord.addEventListener("click", (_) => selectWord(category, word.value, word.index));
    deleteWord.addEventListener("click", (_) => {
        wordItem.classList.add("removed");
        for (const element of wordItem.querySelectorAll("button")) {
            element.disabled = true;
        }

        removedWords.add([category.index, word.index]);
    });

    return wordItem;
}

/** Build a category entry. */
function buildCategory(category: Entry<Category>): HTMLLIElement {
    const createWord = buildHtml("button", { type: "button" }, "Lisää sana");
    const updateCategory = buildHtml("button", { type: "button" }, "Muokkaa kategoriaa");
    const deleteCategory = buildHtml("button", { type: "button" }, "Poista kategoria");

    createWord.addEventListener("click", (_) => selectWord(category, {}));
    updateCategory.addEventListener("click", (_) => selectCategory(category.value, category.index));

    const categoryItem = buildHtml(
        "li",
        {},
        buildHtml(
            "details",
            { name: "category" },
            buildHtml("summary", {}, buildHtml("span", {}, category.value.name)),
            buildHtml(
                "ul",
                {},
                ...category.value.words.map((value, index) =>
                    buildWord(category, { index, value }),
                ),
            ),
            buildHtml("section", {}, createWord, updateCategory, deleteCategory),
        ),
    );

    deleteCategory.addEventListener("click", (_) => {
        categoryItem.classList.add("removed");
        for (const element of categoryItem.querySelectorAll("button")) {
            element.disabled = true;
        }

        removedWords.add([category.index, undefined]);
    });

    return categoryItem;
}

/** Handle a word being created or updated. */
function wordChanged(event: SubmitEvent): void {
    event.preventDefault();
    wordDialog.requestClose();

    const index = Number.parseInt(wordIndex.value, 10);
    const category = Number.parseInt(wordCategory.value, 10);

    const parent = wordList[category];
    if (parent === undefined) {
        throw new Error("invalid category selection");
    }

    if (index === -1) {
        const index = parent.words.length;
        const value: Word = {
            name: wordName.value,
            image: `${wordName.value}.png`,
            image_credit: wordCredit.value,
            hint: wordHint.value,
        };

        parent.words.push(value);
        categoryList.children
            .item(category)
            ?.querySelector("ul")
            ?.appendChild(buildWord({ index: category, value: parent }, { index, value }));

        wordsChanged = true;
        return;
    }

    const entry = parent.words[index];
    if (entry === undefined) {
        throw new Error("invalid word selection");
    }

    if (entry.name === wordName.value) {
        return;
    }

    wordsChanged = true;
    entry.name = wordName.value;
}

/** Handle a category being created or updated. */
function categoryChanged(event: SubmitEvent): void {
    event.preventDefault();
    categoryDialog.requestClose();

    const index = Number.parseInt(categoryIndex.value, 10);
    if (index === -1) {
        const index = wordList.length;
        const value: Category = {
            name: categoryName.value,
            image: `${categoryName.value}.png`,
            image_credit: categoryCredit.value,
            words: [],
        };

        wordList.push(value);
        categoryList.appendChild(buildCategory({ value, index }));

        wordsChanged = true;
        return;
    }

    const entry = wordList[index];
    if (entry === undefined) {
        throw new Error("invalid category selection");
    }

    if (entry.name === categoryName.value) {
        return;
    }

    wordsChanged = true;
    entry.name = categoryName.value;
}

/** Build up dynamic state and connect events for using the management page. */
async function initializeState(): Promise<void> {
    soundSelection.addEventListener("change", handleSoundSelectionChange);
    soundStart.addEventListener("change", handleSoundOffsetChange);
    soundEnd.addEventListener("change", handleSoundOffsetChange);
    managementForm.addEventListener("submit", handleFormSubmit);
    wordForm.addEventListener("submit", wordChanged);
    categoryForm.addEventListener("submit", categoryChanged);

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

    for (const [index, value] of wordsData.categories.entries()) {
        categoryList.appendChild(buildCategory({ value, index }));
    }

    const addCategory = buildHtml("button", { type: "button" }, "Lisää kategoria");
    addCategory.addEventListener("click", () => selectCategory({}));
    categoryList.parentNode?.appendChild(addCategory);

    // Make a deferred selection to ensure our event listener gets invoked.
    queueMicrotask(() => {
        soundSelection.selectedIndex = -1;
    });

    const token = await authorizationFlow();
    if (token !== undefined) {
        authToken.value = token;
        authLink.hidden = true;
    }
}

initializeState();
