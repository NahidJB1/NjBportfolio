import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch();
const p = await b.newPage({ reducedMotion: "no-preference" });
await p.goto(
  "http://localhost:4173/research/bangladesh-political-families.html",
);
await p.evaluate(async () => {
  document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
  await document.fonts.ready;
  await Promise.all(
    [...document.images]
      .filter((i) => i.hasAttribute("src"))
      .map((i) => i.decode()),
  );
});
const report = [];
const charts = p.locator("[data-comparison]");
assert.equal(await charts.count(), 3);
const geometry = (chart) =>
  chart.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return {
      height: r.height,
      rows: [
        ...e.querySelector("[data-chart-panel]").querySelectorAll(".bar-track"),
      ].map((x) => ({
        top: x.getBoundingClientRect().top - r.top,
        left: x.getBoundingClientRect().left - r.left,
        width: x.getBoundingClientRect().width,
      })),
    };
  });
for (const width of [320, 360, 390, 600, 768, 1024, 1440, 1920]) {
  await p.setViewportSize({ width, height: 1000 });
  for (const chart of await charts.all()) {
    const select = chart.locator("select");
    const states = await chart
      .locator("[data-chart-states]")
      .evaluate((e) => JSON.parse(e.textContent));
    const initial = await geometry(chart);
    for (const state of states) {
      await select.selectOption(state.key);
      await p.waitForTimeout(90);
      assert.deepEqual(
        await geometry(chart),
        initial,
        `${width} moving during ${state.name}`,
      );
      await p.waitForTimeout(610);
      assert.deepEqual(
        await geometry(chart),
        initial,
        `${width} moved after ${state.name}`,
      );
      assert.deepEqual(
        await chart
          .locator("[data-chart-panel]")
          .first()
          .locator("strong")
          .allTextContents(),
        state.rows.map((r) => r.value.toFixed(1) + "%"),
      );
      assert.equal(
        await chart.locator("[data-chart-panel]:visible").count(),
        1,
      );
    }
    report.push({
      width,
      chart: await select.getAttribute("id"),
      states: states.length,
      stable: true,
    });
  }
}
// Intermediate values prove that counters animate instead of swapping instantly.
await p.setViewportSize({ width: 1440, height: 1000 });
const main = charts.first();
await main.locator("select").selectOption("term");
await p.waitForTimeout(700);
await main.locator("select").selectOption("career");
await p.waitForTimeout(100);
let mid = parseFloat(await main.locator("strong").nth(1).textContent());
assert(mid > 38.7 && mid < 40.8);
await main.locator("select").selectOption("term");
await p.waitForTimeout(100);
await main.locator("select").selectOption("career");
await p.waitForTimeout(700);
assert.equal(await main.locator("strong").nth(1).textContent(), "38.7%");
await p.emulateMedia({ reducedMotion: "reduce" });
await main.locator("select").selectOption("term");
assert.equal(await main.locator("strong").nth(1).textContent(), "40.8%");
assert.equal(await main.getAttribute("data-animating"), "false");
assert.equal(
  await p.locator("body").evaluate((e) => e.textContent.includes("\uFFFD")),
  false,
);
await p.setViewportSize({ width: 1440, height: 1000 });
await main.scrollIntoViewIfNeeded();
await p.screenshot({ path: ".preview/comparison-desktop.png" });
await p.setViewportSize({ width: 360, height: 1000 });
await charts.nth(2).scrollIntoViewIfNeeded();
await p.screenshot({ path: ".preview/comparison-mobile.png" });
await writeFile(
  ".preview/comparison-verification.json",
  JSON.stringify(
    {
      checks: report,
      intermediateCounter: mid,
      rapidChanges: "passed",
      reducedMotion: "passed",
    },
    null,
    2,
  ),
);
console.log({
  stableChecks: report.length,
  statesPerWidth: 17,
  intermediateCounter: mid,
  rapidChanges: "passed",
  reducedMotion: "passed",
});
await b.close();
