import { expect, type Page, test } from "@playwright/test";
import { Word, wordsData } from "../src/data/word-data-model.ts";

test("Test Clothes Categories", async ({ page }) => {
    await page.goto("/index.html");
    await page.getByText("Vaatteet").first().click();
    const wordList = wordsData.categories.find((p) => p.name === "vaatteet")?.words;

    while (await page.getByText("Sanaharjoittelu").first()) {
        const imgSrcText = await page.getAttribute("#word-guess-image", "src");
        expect(imgSrcText).toContain("/assets/");
        expect(wordList).not.toBeUndefined();
        const word = wordList?.find((p) => imgSrcText?.includes(p.image))?.name;
        expect(word).not.toBeUndefined();
        expect(word).not.toBeNull();
        await page.locator("#hidden-input").fill(word);
        await page.locator("#word-guess-submit").click();
        await expect(page.locator(".letter-slot").first()).toHaveText("_");
    }
    await page.locator("#word-guess-results-close").click();

    await page.close();
});
