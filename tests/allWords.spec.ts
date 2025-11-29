import { expect, test } from "@playwright/test";
import { wordsData } from "../src/data/word-data-model.ts";

test.describe("Test All Words", () => {
    test("Search one word and complete game", async ({ page }) => {
        await page.goto("/index.html");
        // Get words in food and drink categories
        const wordList = wordsData.categories.find((p) => p.name === "ruoat ja juomat")?.words;
        expect(wordList).not.toBeNull();
        expect(wordList).not.toBeUndefined();

        await page.locator("#all-words-link").click();

        await page.locator("#search-container>input").fill("banaani");

        const displayedWords = await page.locator("#all-words-list>li").all();

        expect(displayedWords.length).toBe(2);
        expect(page.getByAltText("banaani")).toBeVisible();

        await page.getByAltText("banaani").click({ timeout: 1000 });

        const imgSrcText = await page.getAttribute("#word-guess-image", "src");
        expect(wordList).not.toBeUndefined();
        const word = wordList?.find((p) => imgSrcText?.includes(p.image))?.name;
        expect(word).not.toBeUndefined();
        expect(word).not.toBeNull();
        await page.locator("#hidden-input").fill(word);
        await page.locator("#word-guess-submit").click();

        await expect(page.locator("#all-words-page")).toBeVisible();

        await page.close();
    });

    test("Pick a category and search one word and complete game", async ({ page }) => {
        await page.goto("/index.html");
        // Get words in food and drink categories
        const wordList = wordsData.categories.find((p) => p.name === "ruoat ja juomat")?.words;

        expect(wordList).not.toBeNull();
        expect(wordList).not.toBeUndefined();

        await page.locator("#all-words-link").click();

        await page.getByRole("checkbox", { name: "ruoat ja juomat" }).click();

        const displayedWords = await page.locator("#all-words-list>li").all();

        expect(displayedWords.length).toBe(wordList?.length + 1);

        await page.locator("#search-container>input").fill("banaani");
        expect(page.getByAltText("banaani")).toBeVisible();

        await page.getByAltText("banaani").click({ timeout: 1000 });

        const imgSrcText = await page.getAttribute("#word-guess-image", "src");
        expect(wordList).not.toBeUndefined();
        const word = wordList?.find((p) => imgSrcText?.includes(p.image))?.name;
        expect(word).not.toBeUndefined();
        expect(word).not.toBeNull();
        await page.locator("#hidden-input").fill(word);
        await page.locator("#word-guess-submit").click();

        await expect(page.locator("#all-words-page")).toBeVisible();

        await page.close();
    });
});
