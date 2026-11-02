import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const data = JSON.parse(
  await readFile("assets/research/bangladesh-dynasties/map-data.json", "utf8"),
);
assert.equal(Object.keys(data.districts).length, 64);
assert.equal(Object.keys(data.regions).length, 19);
const total = (units, k) =>
  Object.values(units).reduce(
    (sum, u) => sum + u.years.reduce((s, y) => s + y[k], 0),
    0,
  );
assert.equal(total(data.regions, "n"), 4050);
assert.equal(total(data.regions, "d"), 949);
assert.equal(total(data.districts, "n"), 3433);
assert.equal(data.audit.unmapped.length, 0);
assert.equal(data.audit.ambiguousDistrict.length, 10);
const source =
  process.argv[2] ||
  "C:/Users/User/Desktop/Research/BD_Leadrs_Dinasty/bangladesh_dynasties_q1_complete_submission_and_replication_bundle (1)/bangladesh_mps_1st_to_13th_q1_replication_4527.csv";
const raw = await readFile(source, "utf8");
assert.equal(
  createHash("sha256").update(raw).digest("hex"),
  data.audit.sourceSHA256,
);
const code = await readFile("scripts/prepare-dynasties.mjs", "utf8");
const csv = Function(
  code.slice(code.indexOf("function csv("), code.indexOf("const data =")) +
    ";return csv;",
)();
const eligible = csv(raw).filter(
  (r) => r.Is_Reserved_Seat === "0" && r.Is_Vacant_Placeholder === "0",
);
for (let i = 0; i < 13; i++) {
  const regional = eligible.filter((r) => +r.Parl_Int === i + 1),
    district = regional.filter(
      (r) => i >= 2 && !r.Constituency_EN.includes("-cum-"),
    );
  for (const [units, rows] of [
    [data.regions, regional],
    [data.districts, district],
  ]) {
    assert.equal(
      Object.values(units).reduce((s, u) => s + u.years[i].n, 0),
      rows.length,
    );
    assert.equal(
      Object.values(units).reduce((s, u) => s + u.years[i].d, 0),
      rows.filter((r) => r.Is_Dynastic_Num === "1").length,
    );
  }
}
const browser = await chromium.launch(),
  context = await browser.newContext({ reducedMotion: "reduce" }),
  page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(
  "http://localhost:4173/research/bangladesh-political-families.html",
);
await page.evaluate(() => document.fonts.ready);
await page.locator("#geography").scrollIntoViewIfNeeded();
await page.waitForFunction(
  () => !document.getElementById("map-geography").disabled,
);
assert.equal(
  await page.locator('[data-map-level="districts"] [data-area]').count(),
  64,
);
assert.equal(
  await page.locator('[data-map-level="regions"] [data-area]').count(),
  19,
);
assert.equal(await page.locator("#map-area-name").textContent(), "Faridpur");
assert.equal(await page.locator("#map-share").textContent(), "51.9%");
await page.locator('[data-map-level="districts"] [data-area="Dhaka"]').focus();
await page.keyboard.press("Enter");
assert.equal(await page.locator("#map-area").inputValue(), "Dhaka");
await page.locator("#map-history button").nth(12).click();
assert.equal(await page.locator("#map-parliament").inputValue(), "13");
assert(
  await page
    .locator("#map-history button")
    .nth(12)
    .evaluate((e) => e === document.activeElement),
);
await page.locator("#map-geography").selectOption("regions");
assert.equal(await page.locator("#map-area").inputValue(), "Dhaka");
await page.locator("#map-parliament").selectOption("1");
assert(await page.locator('[data-map-level="regions"]').isVisible());
assert(!(await page.locator('[data-map-level="districts"]').isVisible()));
await page.locator("#map-geography").selectOption("districts");
assert.equal(await page.locator("#map-parliament").inputValue(), "all");
assert(await page.locator('#map-parliament option[value="1"]').isDisabled());
// Exhaust all supported area/period combinations against the prepared values.
const combinations = await page.evaluate((data) => {
  let checked = 0;
  const set = (id, value) => {
    const e = document.getElementById("map-" + id);
    e.value = value;
    e.dispatchEvent(new Event("change", { bubbles: true }));
  };
  for (const level of ["districts", "regions"]) {
    set("geography", level);
    for (const p of [
      "all",
      ...Array.from({ length: 13 }, (_, i) => String(i + 1)).filter(
        (x) => level === "regions" || +x >= 3,
      ),
    ]) {
      set("parliament", p);
      for (const [key, u] of Object.entries(data[level])) {
        set("area", key);
        const rows = p === "all" ? u.years : [u.years[+p - 1]],
          n = rows.reduce((s, y) => s + y.n, 0),
          d = rows.reduce((s, y) => s + y.d, 0),
          expected = n ? ((d / n) * 100).toFixed(1) + "%" : "No data";
        if (document.getElementById("map-share").textContent !== expected)
          throw Error(level + "/" + key + "/" + p);
        if (
          document.querySelectorAll(
            '[data-map-level="' + level + '"] [aria-pressed="true"]',
          ).length !== 1
        )
          throw Error("Selection marker");
        checked++;
      }
    }
  }
  return checked;
}, data);
const issues = [];
for (const width of [320, 360, 390, 600, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const level of ["districts", "regions"]) {
    await page.locator("#map-geography").selectOption(level);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${width} ${level}`,
    );
  }
  if ([360, 1440].includes(width)) {
    const a = await new AxeBuilder({ page })
      .include("#geography")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    issues.push(
      ...a.violations.map((v) => ({
        width,
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
  }
}
await page.locator("#map-geography").selectOption("districts");
await page.locator("#map-parliament").selectOption("all");
await page.locator("#map-area").selectOption("Faridpur");
await page.setViewportSize({ width: 1440, height: 1000 });
await page.locator(".map-workspace").scrollIntoViewIfNeeded();
await page.screenshot({ path: ".preview/map-final-desktop.png" });
await page.setViewportSize({ width: 360, height: 900 });
await page.locator("#geography").scrollIntoViewIfNeeded();
await page.screenshot({ path: ".preview/map-final-mobile.png" });
const plain = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 900 },
  }),
  fallback = await plain.newPage();
await fallback.goto(
  "http://localhost:4173/research/bangladesh-political-families.html",
);
assert(await fallback.locator("#map-geography").isDisabled());
await fallback.locator(".map-fallback summary").click();
assert.equal(await fallback.locator(".map-fallback tbody tr").count(), 64);
assert(await fallback.locator(".map-fallback table").isVisible());
await plain.close();
await browser.close();
const report = {
  combinations,
  source: "CSV checksum and all thirteen per-parliament totals reconciled",
  units: { districts: 64, regions: 19 },
  regionRecords: 4050,
  districtRecords: 3433,
  excludedCrossDistrict: 10,
  widths: [320, 360, 390, 600, 768, 1024, 1440, 1920],
  keyboard: "passed",
  noJavaScript: "64-row table available",
  runtimeErrors: errors,
  accessibility: issues,
};
await writeFile(
  ".preview/map-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
assert.equal(errors.length, 0);
assert.equal(issues.length, 0);
