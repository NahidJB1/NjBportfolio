import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, ".preview");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const issues = [];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (
    response.status() >= 400 &&
    !response.url().endsWith("/missing-test-page")
  )
    errors.push(`${response.status()} ${response.url()}`);
});
const base = "http://localhost:4173";
const pages = [
  "/",
  ...(await readdir(resolve(root, "projects")))
    .filter((file) => file.endsWith(".html"))
    .map((file) => "/projects/" + file),
  "/404.html",
];
const links = new Set();
for (const route of pages) {
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    document.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((img) => img.hasAttribute("src"))
        .map((img) => img.decode().catch(() => {})),
    );
  });
  const content = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    main: document.querySelectorAll("main").length,
    images: [...document.images]
      .filter((img) => img.hasAttribute("src") && !img.naturalWidth)
      .map((img) => img.src),
    links: [...document.querySelectorAll("a[href]")].map((link) => link.href),
    ids: [...document.querySelectorAll("[id]")].map((node) => node.id),
  }));
  if (content.h1 !== 1 || content.main !== 1)
    issues.push({ route, headingOrMain: content.h1 + "/" + content.main });
  if (content.images.length)
    issues.push({ route, brokenImages: content.images });
  if (new Set(content.ids).size !== content.ids.length)
    issues.push({ route, duplicateIds: true });
  content.links
    .filter((link) => link.startsWith(base))
    .forEach((link) => links.add(link));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(() => ({
      viewport: innerWidth,
      page: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width &&
            (r.right > innerWidth + 1 || r.left < -1) &&
            getComputedStyle(el).position !== "fixed" &&
            !el.closest(".craft-ascii-diagram, .image-dialog, .archive-image")
          );
        })
        .slice(0, 8)
        .map((el) => el.tagName + "." + el.className),
    }));
    if (overflow.page > width + 1) issues.push({ route, width, overflow });
    if (width === 1440 || width === 390) {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      if (results.violations.length)
        issues.push({
          route,
          width,
          accessibility: results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        });
    }
    if (route === "/" && (width === 1440 || width === 390))
      await page.screenshot({
        path: resolve(output, `home-${width}.png`),
        fullPage: true,
      });
    if (
      ["/projects/medelife.html", "/projects/smart-attendance.html"].includes(
        route,
      ) &&
      width === 390
    )
      await page.screenshot({
        path: resolve(output, route.split("/").pop() + "-mobile.png"),
        fullPage: true,
      });
  }
  if (route === "/") {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: resolve(output, "home-desktop-viewport.png"),
    });
  }
  console.log(
    `Checked ${route}: images, semantics, 4 widths, desktop/mobile accessibility.`,
  );
}

// Check local destinations and cross-page anchors, including the résumé.
for (const link of links) {
  const url = new URL(link);
  const response = await context.request.get(url.origin + url.pathname);
  if (!response.ok()) {
    issues.push({ brokenLink: link, status: response.status() });
    continue;
  }
  if (url.hash && response.headers()["content-type"]?.includes("text/html")) {
    const html = await response.text();
    if (!html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`))
      issues.push({ missingAnchor: link });
  }
}

await writeFile(
  resolve(output, "verification.json"),
  JSON.stringify(
    { pages: pages.length, runtimeErrors: errors, issues },
    null,
    2,
  ),
);
console.log(
  `Visual audit found ${issues.length} issues; details saved in .preview/verification.json.`,
);
await page.goto(base, { waitUntil: "networkidle" });
await page.setViewportSize({ width: 390, height: 844 });
await page
  .getByRole("button", { name: "Open navigation", exact: true })
  .click();
assert.equal(
  await page.locator("#hamburger").getAttribute("aria-expanded"),
  "true",
);
await page.keyboard.press("Escape");
assert.equal(await page.locator("#mobileMenu").isVisible(), false);
assert.equal(
  await page
    .locator("#hamburger")
    .evaluate((el) => el === document.activeElement),
  true,
);
await page.locator("#hamburger").click();
await page.locator("#mobileMenu").getByRole("link", { name: "Work" }).click();
assert.equal(new URL(page.url()).hash, "#projects");
assert.equal(await page.locator("#mobileMenu").isVisible(), false);
await page.locator(".project-archive summary").click();
assert.equal(await page.locator(".archive-card:visible").count(), 4);
await page.locator(".project-archive summary").click();
assert.equal(await page.locator(".archive-card:visible").count(), 0);
const imageButton = page.getByRole("button", {
  name: "Enlarge CityU hackathon championship photo",
});
await imageButton.click();
assert.equal(await page.getByRole("dialog").isVisible(), true);
await page.keyboard.press("Tab");
assert.equal(
  await page
    .locator("dialog")
    .evaluate((el) => el.contains(document.activeElement)),
  true,
);
await page.keyboard.press("Escape");
assert.equal(await page.getByRole("dialog").isVisible(), false);
assert.equal(
  await imageButton.evaluate((el) => el === document.activeElement),
  true,
);
assert.equal(await page.evaluate(() => document.body.style.overflow), "");
await context.grantPermissions(["clipboard-read", "clipboard-write"], {
  origin: base,
});
await page
  .getByRole("button", { name: "Copy email address", exact: true })
  .click();
assert.equal(
  await page.evaluate(() => navigator.clipboard.readText()),
  "njb@nahidjahanbhuiyan.com",
);
assert.match(await page.locator("#copy-status").textContent(), /Email copied/);
await page.evaluate(() =>
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async () => {
        throw new Error("Denied in test");
      },
    },
    configurable: true,
  }),
);
await page.locator("[data-copy-email]").click();
assert.match(await page.locator("#copy-status").textContent(), /Couldn’t copy/);
assert.equal(
  await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  ),
  "auto",
);
console.log(
  "Passed: mobile menu, Escape/focus return, project archive, image dialog, clipboard success/failure, reduced motion.",
);

const noJS = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 390, height: 844 },
});
const plain = await noJS.newPage();
await plain.goto(base);
assert.equal(await plain.locator("h1").isVisible(), true);
assert.equal(await plain.locator("header").isVisible(), true);
await plain.locator(".project-archive summary").click();
assert.equal(await plain.locator(".archive-card:visible").count(), 4);
console.log(
  "Passed: content, shared navigation, and project archive without JavaScript.",
);
await noJS.close();
const report = {
  pages: pages.length,
  viewportWidths: [1440, 768, 390, 320],
  localDestinations: links.size,
  runtimeErrors: errors,
  issues,
};
await writeFile(
  resolve(output, "verification.json"),
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
if (issues.length || errors.length) process.exitCode = 1;
