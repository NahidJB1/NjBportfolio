import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = "http://localhost:4173";
const route = "/research/bangladesh-political-families.html";
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (e) => runtimeErrors.push(e.message));
await page.goto(base + route);
assert.equal(await page.locator(".article-figure").count(), 4);
assert.equal(await page.locator("#term-evidence").isVisible(), true);
assert.equal(await page.locator("#career-evidence").isVisible(), false);
assert.deepEqual(
  await page.locator("#term-evidence .evidence-bar strong").allTextContents(),
  ["22.4%", "40.8%", "50.3%"],
);
await page.locator("#evidence-basis").selectOption("career");
assert.equal(await page.locator("#term-evidence").isVisible(), true);
assert.deepEqual(
  await page.locator("#term-evidence .evidence-bar strong").allTextContents(),
  ["22.4%", "38.7%", "48.0%"],
);
await page.locator("#evidence-basis").selectOption("term");
const issues = [];
for (const width of [320, 360, 390, 600, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.evaluate(async () => {
    document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((i) => i.hasAttribute("src"))
        .map((i) => i.decode()),
    );
  });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `Overflow at ${width}`,
  );
  if ([360, 768, 1440].includes(width)) {
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    issues.push(
      ...axe.violations.map((x) => ({
        width,
        id: x.id,
        nodes: x.nodes.map((n) => n.target),
      })),
    );
    await page.screenshot({
      path: `.preview/research-${width}.png`,
      fullPage: true,
    });
  }
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(base + route);
await page.screenshot({ path: ".preview/research-hero.png" });
await page.locator(".figure-enlarge").first().click();
assert(await page.locator("dialog").isVisible());
await page.keyboard.press("Escape");
assert(
  await page
    .locator(".figure-enlarge")
    .first()
    .evaluate((e) => e === document.activeElement),
);
await page.locator(".article-sources summary").click();
assert(await page.locator(".article-sources details[open] p").isVisible());
for (const link of await page
  .locator(".article-sources a,.figure-heading a")
  .all())
  assert(
    (
      await context.request.get(
        new URL(await link.getAttribute("href"), base).href,
      )
    ).ok(),
  );
for (const entry of ["/", "/research/"]) {
  await page.goto(base + entry);
  assert((await page.locator(`a[href="${route}"]`).count()) > 0);
}
const plain = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 360, height: 900 },
});
const fallback = await plain.newPage();
await fallback.goto(base + route);
assert(await fallback.locator("#term-evidence").isVisible());
assert(await fallback.locator("#career-evidence").isVisible());
assert(await fallback.locator("#evidence-basis").isDisabled());
assert.equal(await fallback.locator(".article-figure").count(), 4);
await plain.close();
const hash = (b) => createHash("sha256").update(b).digest("hex");
const integrity = JSON.parse(
  await readFile(
    "assets/research/bangladesh-dynasties/source-integrity.json",
    "utf8",
  ),
);
for (const [file, digest] of Object.entries(integrity.files)) {
  assert.equal(
    hash(await readFile("assets/research/bangladesh-dynasties/" + file)),
    digest,
  );
  if (process.argv[2] && file.endsWith(".png"))
    assert.equal(hash(await readFile(process.argv[2] + "/" + file)), digest);
}
await browser.close();
const report = {
  route,
  widths: [320, 360, 390, 600, 768, 1024, 1440, 1920],
  figures: 4,
  originalFigures: "SHA-256 matches the current imported research edition",
  sourceCounts: "Checked",
  interactions:
    "comparison selector, enlargement, Escape/focus return, source disclosure, no-JS fallback",
  runtimeErrors,
  issues,
};
await writeFile(
  ".preview/research-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
assert.equal(runtimeErrors.length, 0);
assert.equal(issues.length, 0);
