import { describe } from "node:test";
import { expect, type Page, test } from "@playwright/test";
import { type Word, wordsData } from "../src/data/word-data-model.ts";
import { splitWord } from "../src/utils/wordSplitUtils.ts";

describe("Test Categories", () => {
    test("All Correct", async ({ page }) => {
        await page.goto("/index.html");
        await page.getByText("Vaatteet").first().click();
        const wordList = wordsData.categories.find((p) => p.name === "vaatteet")?.words;

        let count = 1;
        const numWords = parseInt(
            (await page.locator("#word-guess-progress-counter").textContent()).substring(2),
            10,
        );

        await expect(numWords).toBe(wordList?.length);

        //
        while (count <= numWords) {
            const imgSrcText = await page.getAttribute("#word-guess-image", "src");
            expect(imgSrcText).toContain("/assets/");
            expect(wordList).not.toBeUndefined();
            const word = wordList?.find((p) => imgSrcText?.includes(p.image.file))?.name;
            expect(word).not.toBeUndefined();
            expect(word).not.toBeNull();

            // Create a Word object
            const wordObj: Word = {
                name: word!,
                image: {
                    file: "noImage",
                    credit: "noCredits",
                },
                hint: "noHint",
            };

            // Use the split to check any special characters
            const split: [string, boolean][] = splitWord(wordObj);

            // True, if the word contains any special chars, such as "-"
            const hasSpecialChars = split.some(([_, isLetter]) => !isLetter);

            // Combine a string form the normal letters
            const combined = split
                .filter(([_, isLetter]) => isLetter)
                .map(([char]) => char)
                .join("");

            if (hasSpecialChars) {
                // Fill the input field without any special characters
                // if the word contains any
                await page.locator("#hidden-input").fill(combined);
            } else {
                await page.locator("#hidden-input").fill(word);
            }

            await page.locator("#word-guess-submit").click();
            if (count <= numWords - 1) {
                await expect(page.locator(".letter-slot").first()).toHaveText("_");
            }
            count++;
        }

        await expect(page.locator("#correct-answers")).toHaveText("Oikeita vastauksia: 14 / 14");
        await expect(page.locator("#correct-with-hints")).toBeHidden();
        await expect(page.locator("#letter-hints-used")).toHaveText(
            "Käytettyja kirjainvihjeitä: 0",
        );
        await expect(page.locator("#text-hints-used")).toHaveText(
            "Käytettyja kuvailevia vihjeitä: 0",
        );
        await expect(page.locator("#vocal-hints-used")).toHaveText("Käytettyja tavuvihjeitä: 0");
        await page.locator("#word-guess-results-close").click();

        await page.close();
    });

    test("Words Input Incorrectly", async ({ page }) => {
        await page.goto("/index.html");
        var categories = await page.locator("#category-selector-list>li>button").all();
        await categories.at(1)?.click();
        var allCategoryElements = (await page.locator("#category-selector-list>li").all()).at(1);
        var category = await allCategoryElements?.locator("button>img");
        var firstCategory = await category?.getAttribute("alt");
        const wordList = wordsData.categories.find(
            (p) => p.name === firstCategory?.toLowerCase(),
        )?.words;
        let count = 1;
        const numWords = parseInt(
            (await page.locator("#word-guess-progress-counter").textContent()).substring(2),
            10,
        );

        await expect(numWords).toBe(wordList?.length);

        //
        while (count <= numWords) {
            const imgSrcText = await page.getAttribute("#word-guess-image", "src");
            expect(imgSrcText).toContain("/assets/");
            expect(wordList).not.toBeUndefined();
            const word = wordList?.find((p) => imgSrcText?.includes(p.image.file))?.name;
            expect(word).not.toBeUndefined();
            expect(word).not.toBeNull();

            // Create a Word object
            const wordObj: Word = {
                name: word!,
                image: {
                    file: "noImage",
                    credit: "noCredits",
                },
                hint: "noHint",
            };

            // Use the split to check any special characters
            const split: [string, boolean][] = splitWord(wordObj);

            // True, if the word contains any special chars, such as "-"
            const hasSpecialChars = split.some(([_, isLetter]) => !isLetter);

            // Combine a string form the normal letters
            const combined = split
                .filter(([_, isLetter]) => isLetter)
                .map(([char]) => char)
                .join("");

            if (hasSpecialChars) {
                // Fill the input field without any special characters
                // if the word contains any
                await page.locator("#hidden-input").fill(combined);
            } else {
                await page.locator("#hidden-input").fill("a".repeat(word!.length));
            }

            await page.locator("#word-guess-submit").click();
            if (count <= numWords - 1) {
                await expect(page.locator(".letter-slot").first()).toHaveText("_");
            }
            count++;
        }

        await expect(page.locator("#correct-answers")).toHaveText(
            `Oikeita vastauksia: 0 / ${numWords}`,
        );
        await expect(page.locator("#correct-with-hints")).toBeHidden();
        await expect(page.locator("#letter-hints-used")).toHaveText(
            "Käytettyja kirjainvihjeitä: 0",
        );
        await expect(page.locator("#text-hints-used")).toHaveText(
            "Käytettyja kuvailevia vihjeitä: 0",
        );
        await expect(page.locator("#vocal-hints-used")).toHaveText("Käytettyja tavuvihjeitä: 0");
        await page.locator("#word-guess-results-close").click();

        await page.close();
    });

    test("Syllable Hints used", async ({ page }) => {
        await page.goto("/index.html");
        var categories = await page.locator("#category-selector-list>li>button").all();
        await categories.at(1)?.click();
        var allCategoryElements = (await page.locator("#category-selector-list>li").all()).at(1);
        var category = await allCategoryElements?.locator("button>img");
        var firstCategory = await category?.getAttribute("alt");
        const wordList = wordsData.categories.find(
            (p) => p.name === firstCategory?.toLowerCase(),
        )?.words;
        let count = 1;
        const numWords = parseInt(
            (await page.locator("#word-guess-progress-counter").textContent()).substring(2),
            10,
        );

        await expect(numWords).toBe(wordList?.length);

        //
        while (count <= numWords) {
            const imgSrcText = await page.getAttribute("#word-guess-image", "src");
            expect(imgSrcText).toContain("/assets/");
            expect(wordList).not.toBeUndefined();
            const word = wordList?.find((p) => imgSrcText?.includes(p.image.file))?.name;
            expect(word).not.toBeUndefined();
            expect(word).not.toBeNull();
            await page.locator("#word-guess-syllable-hint").click();

            // Create a Word object
            const wordObj: Word = {
                name: word!,
                image: {
                    file: "noImage",
                    credit: "noCredits",
                },
                hint: "noHint",
            };

            // Use the split to check any special characters
            const split: [string, boolean][] = splitWord(wordObj);

            // True, if the word contains any special chars, such as "-"
            const hasSpecialChars = split.some(([_, isLetter]) => !isLetter);

            // Combine a string form the normal letters
            const combined = split
                .filter(([_, isLetter]) => isLetter)
                .map(([char]) => char)
                .join("");

            if (hasSpecialChars) {
                // Fill the input field without any special characters
                // if the word contains any
                await page.locator("#hidden-input").fill(combined);
            } else {
                await page.locator("#hidden-input").fill(word);
            }

            await page.locator("#word-guess-submit").click();
            if (count <= numWords - 1) {
                await expect(page.locator(".letter-slot").first()).toHaveText("_");
            }
            count++;
        }

        await expect(page.locator("#correct-answers")).toHaveText(
            `Oikeita vastauksia: ${numWords} / ${numWords}`,
        );
        // await expect(page.locator("#correct-with-hints")).toBeHidden();
        await expect(page.locator("#letter-hints-used")).toHaveText(
            "Käytettyja kirjainvihjeitä: 0",
        );
        await expect(page.locator("#text-hints-used")).toHaveText(
            "Käytettyja kuvailevia vihjeitä: 0",
        );
        await expect(page.locator("#vocal-hints-used")).toHaveText(
            `Käytettyja tavuvihjeitä: ${numWords}`,
        );
        await page.locator("#word-guess-results-close").click();

        await page.close();
    });

    test("Words Skipped", async ({ page }) => {
        await page.goto("/index.html");
        var categories = await page.locator("#category-selector-list>li>button").all();
        await categories.at(1)?.click();
        var allCategoryElements = (await page.locator("#category-selector-list>li").all()).at(1);
        var category = await allCategoryElements?.locator("button>img");
        var firstCategory = await category?.getAttribute("alt");
        const wordList = wordsData.categories.find(
            (p) => p.name === firstCategory?.toLowerCase(),
        )?.words;
        let count = 1;
        const numWords = parseInt(
            (await page.locator("#word-guess-progress-counter").textContent()).substring(2),
            10,
        );

        await expect(numWords).toBe(wordList?.length);

        //
        while (count <= numWords) {
            const imgSrcText = await page.getAttribute("#word-guess-image", "src");
            expect(imgSrcText).toContain("/assets/");
            expect(wordList).not.toBeUndefined();
            const word = wordList?.find((p) => imgSrcText?.includes(p.image.file))?.name;
            expect(word).not.toBeUndefined();
            expect(word).not.toBeNull();
            await page.locator("#skip-word").click();
            await expect(page.locator("#skip-word")).not.toBeDisabled();

            count++;
        }

        await expect(page.locator("#correct-answers")).toHaveText(
            `Oikeita vastauksia: 0 / ${numWords}`,
        );
        await expect(page.locator("#skipped-answers")).toHaveText(`Ohitettuja sanoja: ${numWords}`);
        await expect(page.locator("#letter-hints-used")).toHaveText(
            "Käytettyja kirjainvihjeitä: 0",
        );
        await expect(page.locator("#text-hints-used")).toHaveText(
            "Käytettyja kuvailevia vihjeitä: 0",
        );
        await expect(page.locator("#vocal-hints-used")).toHaveText(`Käytettyja tavuvihjeitä: 0`);
        await page.locator("#word-guess-results-close").click();

        await page.close();
    });
});
