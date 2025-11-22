import { expect, type Page, test } from "@playwright/test";
import { Word, wordsData } from "../src/data/word-data-model.ts";

test("Test Clothes Categories", async ({ page }) => {
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
        const word = wordList?.find((p) => imgSrcText?.includes(p.image))?.name;
        expect(word).not.toBeUndefined();
        expect(word).not.toBeNull();
        await page.locator("#hidden-input").fill(word);
        await page.locator("#word-guess-submit").click();
        if (count <= numWords - 1) {
            await expect(page.locator(".letter-slot").first()).toHaveText("_");
        }
        count++;
    }

    await expect(page.locator("#correct-answers")).toHaveText("Oikeita vastauksia: 14 / 14");
    await expect(page.locator("#correct-with-hints")).toBeHidden();
    await expect(page.locator("#letter-hints-used")).toHaveText("Käytettyja kirjainvihjeitä: 0");
    await expect(page.locator("#text-hints-used")).toHaveText("Käytettyja kuvailevia vihjeitä: 0");
    await expect(page.locator("#vocal-hints-used")).toHaveText("Käytettyja tavuvihjeitä: 0");
    await page.locator("#word-guess-results-close").click();

    await page.close();
});
