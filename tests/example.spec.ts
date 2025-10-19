import { expect, test } from "@playwright/test";

test("syllable player is usable", async ({ page }) => {
    // Define components that we utilize below.
    const button = page.getByRole("button", { name: "Tavutoistin" });
    const heading = page.getByRole("heading", { name: "Tavutoistin" });
    const input = page.getByLabel("Sana toistettavaksi");
    const playback = page.getByRole("button", { name: "Toista tavut" });

    // Open page and dialog.
    await page.goto("/");
    await button.click();

    // Provide example word.
    await input.fill("autotie");
    await input.press("Enter");

    // Check that the form reacted to changes.
    await expect(playback).toBeEnabled();

    // Check that the dialog reacts to close.
    await page.keyboard.press("Escape");
    await expect(heading).not.toBeVisible();
});
