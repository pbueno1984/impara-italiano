/* ============================================================
   Leaving a lesson halfway does not wipe it, and a wrong answer is
   not a dead end.

   Before: answers lived only in memory until the LAST exercise, so a
   student who left after five got 0/9 on return; and a wrong answer
   locked the exercise with no way to try it again.
   ============================================================ */
const { test, expect } = require("@playwright/test");

const URL = "/index.html#/lezione?id=a1-u01-l1";

/** Answers the first exercise (mcq, right answer index 1) with option `k`. */
async function answerFirst(page, k) {
  const ex = page.locator(".exq").first();
  await ex.locator('input[type="radio"]').nth(k).check();
  await ex.locator(".js-check").click();
  return ex;
}

test("answers survive leaving the lesson", async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector(".exq");
  await answerFirst(page, 0);                      // wrong
  await expect(page.locator("#lessonScore")).toHaveText(/^0\//);
  await page.waitForTimeout(400);                  // the save is debounced

  await page.goto("/index.html#/percorso");
  await page.goto(URL);
  await page.reload();
  await page.waitForSelector(".exq");
  const ex = page.locator(".exq").first();
  await expect(ex).toHaveClass(/exq--ko/);
  await expect(ex.locator(".js-check")).toBeDisabled();
  // the bar shows the exercise as done even though it was wrong
  await expect(page.locator("#lessonBar")).not.toHaveAttribute("style", /width:0%/);
});

test("a wrong answer can be tried again and raises the score", async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector(".exq");
  const ex = await answerFirst(page, 0);           // wrong
  await ex.locator(".js-retry").click();
  await answerFirst(page, 1);                      // right
  await expect(page.locator("#lessonScore")).toHaveText(/^1\//);
  await expect(page.locator(".exq").first().locator(".js-retry")).toHaveCount(0);
});
