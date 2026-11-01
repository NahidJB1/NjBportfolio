import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
const b = await chromium.launch();
const p = await b.newPage({ reducedMotion: "reduce" });
const routes = [
  "/",
  "/404.html",
  "/research/",
  "/research/entry-template.html",
  ...(await readdir("projects")).map((f) => "/projects/" + f),
];
let checks = 0;
for (const route of routes) {
  await p.goto("http://localhost:4173" + route);
  for (const width of [360, 600, 1024, 1920]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.evaluate(() => document.fonts.ready);
    assert(
      await p
        .locator(".site-header .brand-logo img")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    );
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    for (const link of await p.locator(".nav a").all())
      assert(await link.isVisible());
    checks++;
  }
  assert.equal(await p.locator('link[rel="icon"][sizes="96x96"]').count(), 1);
}
for (const [file, size] of [
  ["favicon.png", 96],
  ["favicon-32.png", 32],
  ["apple-touch-icon.png", 180],
]) {
  const m = await sharp(file).metadata();
  assert.equal(m.width, size);
  assert.equal(m.height, size);
  assert((await p.request.get("http://localhost:4173/" + file)).ok());
}
const ico = await readFile("favicon.ico");
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 6);
await p.goto("http://localhost:4173/");
await p.setViewportSize({ width: 360, height: 900 });
await p.screenshot({ path: ".preview/logo-mobile.png" });
await p.setViewportSize({ width: 1920, height: 1080 });
await p.screenshot({ path: ".preview/logo-wide.png" });
await p.locator(".brand-logo").first().focus();
assert(
  await p
    .locator(".brand-logo")
    .first()
    .evaluate((e) => e === document.activeElement),
);
await b.close();
const report = {
  pages: routes.length,
  extraWidths: [360, 600, 1024, 1920],
  layoutChecks: checks,
  icons: "PNG dimensions, HTTP and multi-resolution ICO passed",
  issues: [],
};
await writeFile(
  ".preview/brand-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
