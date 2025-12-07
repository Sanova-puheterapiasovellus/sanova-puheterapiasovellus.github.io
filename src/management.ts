import "./management.css";
import { buildHtml, debounceEvent, expectElement } from "./common/dom";
import { AuthorizationClient, ManagementClient } from "./common/github";
import { loadSoundClip } from "./common/playback";
import { type AudioSegment, offsetsData } from "./data/offset-data-model";
import {
    type Category,
    type Data,
    getCategoryImage,
    getImagePath,
    type Image,
    type Word,
    wordsData,
} from "./data/word-data-model";
import { splitToSyllables } from "./utils/syllable-split";

/** Item that has a known array position. */
type Entry<T> = { value: T; index: number };

const cookieManualToken = "manual_token";

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
const wordImagePreview = expectElement("#word-image-preview", HTMLImageElement, wordDialog);
const wordIndex = expectElement("#word-index", HTMLInputElement, wordForm);
const wordCategory = expectElement("#word-category", HTMLInputElement, wordForm);
const wordName = expectElement("#word-name", HTMLInputElement, wordForm);
const wordHint = expectElement("#word-hint", HTMLTextAreaElement, wordForm);
const wordFallbackPlayer = expectElement("#word-fallback-player", HTMLInputElement, wordForm);
const wordImageReplacement = expectElement("#word-image-replacement", HTMLInputElement, wordForm);
const wordImageCredit = expectElement("#word-image-credit", HTMLTextAreaElement, wordForm);
const categoryDialog = expectElement("#edit-category", HTMLDialogElement, document.body);
const categoryImagePreview = expectElement(
    "#category-image-preview",
    HTMLImageElement,
    categoryDialog,
);
const categoryForm = expectElement("form", HTMLFormElement, categoryDialog);
const categoryIndex = expectElement("#category-index", HTMLInputElement, categoryForm);
const categoryName = expectElement("#category-name", HTMLInputElement, categoryForm);
const categoryWordImage = expectElement("#category-word-image", HTMLSelectElement, categoryForm);
const categoryImageReplacement = expectElement(
    "#category-image-replacement",
    HTMLInputElement,
    categoryForm,
);
const categoryImageCredit = expectElement(
    "#category-image-credit",
    HTMLTextAreaElement,
    categoryForm,
);

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

    const repository = new ManagementClient(authToken.value);
    const actions = [] as (() => Promise<void>)[];

    const branchName = customBranch.value.length !== 0 ? customBranch.value : undefined;
    if (branchName !== undefined) {
        actions.push(() => repository.createBranch(branchName));
    }

    if (soundsChanged) {
        actions.push(() =>
            repository.addOrUpdateFile(
                "sound offset refinement",
                "src/data/offset-data.json",
                JSON.stringify(soundOffsets, undefined, 4),
                branchName,
            ),
        );
    }

    for (const [name, file] of addedImages) {
        actions.push(async () => {
            const data = await file.bytes();

            await repository.addOrUpdateFile(
                "image asset change",
                `public/assets/images/${name}`,
                String.fromCharCode(...data),
                branchName,
            );
        });
    }

    if (wordsChanged || removedWords.size !== 0) {
        const unneededImages = new Set<string>();
        const categories = wordList
            .values()
            .filter((category, index) => {
                if (!removedWords.has([index, undefined])) {
                    return true;
                }

                for (const word of category.words) {
                    unneededImages.add(word.image.file);
                }

                if (!("word" in category.image)) {
                    unneededImages.add(category.image.file);
                }

                return false;
            })
            .map(({ words, ...rest }, parent) => ({
                words: words
                    .values()
                    .filter(({ image }, index) => {
                        if (!removedWords.has([parent, index])) {
                            return true;
                        }

                        unneededImages.add(image.file);
                        return false;
                    })
                    .toArray(),
                ...rest,
            }))
            .toArray();

        actions.push(() =>
            repository.addOrUpdateFile(
                "word data refinement",
                "src/data/word-data.json",
                JSON.stringify({ categories } satisfies Data, undefined, 4),
                branchName,
            ),
        );

        for (const name of unneededImages) {
            actions.push(() =>
                repository.ensureFileDeleted(
                    "unneeded image asset",
                    `src/assets/images/${name}`,
                    branchName,
                ),
            );
        }
    }

    for (const callback of actions) {
        await callback();
        await ManagementClient.waitBetweenRequests();
    }

    if (branchName !== undefined) {
        const url = await repository.createPullRequest("requested changes", branchName);
        pullRequest.href = url;
        pullRequest.hidden = false;
    }
}

/** Handle authorization flow or prepare for allowing it. */
async function authorizationFlow(): Promise<string | undefined> {
    const token = new AuthorizationClient();

    const existing = await token.attemptExisting();
    if (existing !== undefined) {
        return existing;
    }

    const search = new URLSearchParams(location.search);
    if (search.size !== 0) {
        return token.handleRedirect(search);
    }

    const parameters = await token.initiateFlow();
    authLink.href += `?${parameters.toString()}`;
    authLink.hidden = false;
    return;
}

/** Handle loading an image that might me one that the user has replaced. */
function changeImage(
    element: HTMLImageElement,
    target: Image,
    replacement = addedImages.get(target.file),
): Promise<void> {
    if (replacement !== undefined) {
        element.src = URL.createObjectURL(replacement);
        return element.decode();
    }

    if (target.file === "") {
        element.src = "";
        return Promise.resolve();
    }

    element.src = getImagePath(target);
    return element.decode();
}

/** The word selection for the category image changed. */
function categoryMainChanged(_: Event): Promise<void> {
    const index = Number.parseInt(categoryIndex.value, 10);
    const entry = wordList[index];
    if (entry === undefined) {
        throw new Error("invalid category selection");
    }

    const selection = Number.parseInt(categoryWordImage.value, 10);
    if (Number.isNaN(selection)) {
        categoryImageReplacement.disabled = categoryImageCredit.disabled = false;
        categoryImageCredit.value = "";

        return changeImage(categoryImagePreview, getCategoryImage(entry));
    }

    categoryImageReplacement.disabled = categoryImageCredit.disabled = true;
    categoryImageCredit.value = getCategoryImage(entry).credit;

    return changeImage(
        categoryImagePreview,
        entry.words[selection]?.image ?? { file: "", credit: "" },
    );
}

/** Open word editing dialog. */
async function selectWord(
    category: Entry<Category>,
    current: Word,
    existing?: number,
): Promise<void> {
    wordIndex.value = (existing ?? -1).toString(10);
    wordCategory.value = category.index.toString(10);
    wordName.value = current.name;
    wordName.disabled = existing !== undefined;
    wordHint.value = current.hint;
    wordFallbackPlayer.checked = current.fallBackPlayer ?? false;
    wordImageReplacement.value = "";
    wordImageCredit.value = current.image.credit;

    await changeImage(wordImagePreview, current.image);

    wordDialog.showModal();
}

/** Open category editing dialog. */
async function selectCategory(current: Category, existing?: number): Promise<void> {
    categoryIndex.value = (existing ?? -1).toString(10);
    categoryName.value = current.name;
    categoryName.disabled = existing !== undefined;
    categoryImageReplacement.value = "";
    categoryImageReplacement.disabled = categoryImageCredit.disabled = false;

    categoryWordImage.replaceChildren(
        buildHtml("option", { value: "" }),
        ...current.words.map(({ name }, index) =>
            buildHtml("option", {
                value: index.toString(10),
                innerHTML: name,
            }),
        ),
    );

    const image = getCategoryImage(current);
    categoryImageCredit.value = image.credit;
    if ("word" in current.image) {
        categoryImageReplacement.disabled = categoryImageCredit.disabled = true;
        categoryWordImage.selectedIndex = current.image.word + 1;
    } else {
        categoryImageReplacement.disabled = categoryImageCredit.disabled = false;
        categoryWordImage.selectedIndex = 0;
    }

    await changeImage(categoryImagePreview, image);

    categoryDialog.showModal();
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

    updateCategory.addEventListener("click", (_) => selectCategory(category.value, category.index));
    createWord.addEventListener("click", (_) =>
        selectWord(category, {
            name: "",
            hint: "",
            image: {
                file: "",
                credit: "",
            },
        }),
    );

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

/** Capture the value of a image file input. */
function getInputFile(input: HTMLInputElement): File | undefined {
    if (input.value === "") {
        return;
    }

    const file = input.files?.[0];
    if (file === undefined) {
        return;
    }

    return file;
}

/** Capture the value of a image file input as modified. */
function captureImageModification(input: HTMLInputElement): string {
    const file = getInputFile(input);
    if (file === undefined) {
        return "";
    }

    const name = `${wordName.value}.png`;
    addedImages.set(name, file);

    return name;
}

/** Handle a word being created or updated. */
function wordEdited(_: Event): void {
    const index = Number.parseInt(wordIndex.value, 10);
    const category = Number.parseInt(wordCategory.value, 10);

    const parent = wordList[category];
    if (parent === undefined) {
        throw new Error("invalid category selection");
    }

    if (index === -1) {
        if (wordName.value === "") {
            return;
        }

        const index = parent.words.length;
        const value: Word = {
            name: wordName.value,
            hint: wordHint.value,
            fallBackPlayer: wordFallbackPlayer.checked,
            image: {
                file: captureImageModification(wordImageReplacement),
                credit: wordImageCredit.value,
            },
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

    wordsChanged = true;
    entry.name = wordName.value;
    entry.hint = wordHint.value;
    entry.fallBackPlayer = wordFallbackPlayer.checked;
    entry.image.credit = wordImageCredit.value;

    const replacement = captureImageModification(wordImageReplacement);
    if (replacement !== "") {
        entry.image.file = replacement;
    }
}

/** Handle a category being created or updated. */
function categoryEdited(_: Event): void {
    const index = Number.parseInt(categoryIndex.value, 10);
    if (index === -1) {
        if (categoryName.value === "") {
            return;
        }

        const index = wordList.length;
        const value: Category = {
            name: categoryName.value,
            image: {
                file: captureImageModification(categoryImageReplacement),
                credit: categoryImageCredit.value,
            },
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

    wordsChanged = true;
    entry.name = categoryName.value;

    const selection = Number.parseInt(categoryWordImage.value, 10);
    entry.image = Number.isNaN(selection)
        ? {
              file: captureImageModification(categoryImageReplacement),
              credit: categoryImageCredit.value,
          }
        : { word: selection };
}

/** Build up dynamic state and connect events for using the management page. */
async function initializeState(): Promise<void> {
    soundSelection.addEventListener("change", handleSoundSelectionChange);
    soundStart.addEventListener("change", handleSoundOffsetChange);
    soundEnd.addEventListener("change", handleSoundOffsetChange);
    managementForm.addEventListener("submit", handleFormSubmit);
    wordDialog.addEventListener("close", wordEdited);
    wordForm.addEventListener("submit", (event) => {
        event.preventDefault();
        wordDialog.requestClose();
    });
    categoryWordImage.addEventListener("change", categoryMainChanged);
    categoryDialog.addEventListener("close", categoryEdited);
    categoryForm.addEventListener("submit", (event) => {
        event.preventDefault();
        categoryDialog.requestClose();
    });

    for (const key in offsetsData) {
        soundSelection.appendChild(
            buildHtml("option", { value: key, innerText: key.toUpperCase() }),
        );
    }

    const missingSyllableSounds = new Set(
        wordList
            .values()
            .flatMap((category) => category.words.values())
            .flatMap((word) => splitToSyllables(word.name)),
    ).difference(new Set(Object.keys(offsetsData)));

    missingSoundCount.innerText = missingSyllableSounds.size.toString();
    for (const value of missingSyllableSounds) {
        missingSoundList.appendChild(buildHtml("li", { innerText: value }));
    }

    for (const [index, value] of wordList.entries()) {
        categoryList.appendChild(buildCategory({ value, index }));
    }

    const addCategory = buildHtml("button", { type: "button" }, "Lisää kategoria");
    categoryList.parentNode?.appendChild(addCategory);
    addCategory.addEventListener("click", () =>
        selectCategory({
            name: "",
            image: {
                file: "",
                credit: "",
            },
            words: [],
        }),
    );

    // Make a deferred selection to ensure our event listener gets invoked.
    queueMicrotask(() => {
        soundSelection.selectedIndex = -1;
    });

    // Try and figure out the current access token.
    authToken.value =
        (await authorizationFlow()) ?? (await cookieStore.get(cookieManualToken))?.value ?? "";

    // Persist access token if manually changed.
    authToken.addEventListener(
        "input",
        debounceEvent(async (_) => cookieStore.set(cookieManualToken, authToken.value)),
    );
}

initializeState();
