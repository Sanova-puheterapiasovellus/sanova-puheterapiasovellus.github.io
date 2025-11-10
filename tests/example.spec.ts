import { expect, test } from "@playwright/test";

test("dummy test", async ({ page }) => {
    await page.goto('about:blank');
    expect(true).toBe(true);
});
