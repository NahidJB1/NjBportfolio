import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
const root = resolve(import.meta.dirname, "..");
const header = (
  await readFile(resolve(root, "assets/header.html"), "utf8")
).trim();
const footer = (
  await readFile(resolve(root, "assets/footer.html"), "utf8")
).trim();
const files = [
  "index.html",
  "404.html",
  ...(await readdir(resolve(root, "research")))
    .filter((file) => file.endsWith(".html"))
    .map((file) => "research/" + file),
  ...(await readdir(resolve(root, "projects")))
    .filter((file) => file.endsWith(".html"))
    .map((file) => "projects/" + file),
];
for (const file of files) {
  const path = resolve(root, file);
  let html = await readFile(path, "utf8");
  for (const [name, markup] of [
    ["header", header],
    ["footer", footer],
  ]) {
    const block = `<!-- site-${name} -->\n${markup}\n  <!-- /site-${name} -->`;
    const pattern = new RegExp(
      `<!-- site-${name} -->[\\s\\S]*?<!-- /site-${name} -->`,
    );
    if (pattern.test(html)) {
      html = html.replace(pattern, block);
    } else if (html.includes(`<div id="${name}-placeholder"></div>`)) {
      html = html.replace(`<div id="${name}-placeholder"></div>`, block);
    } else {
      // Older research templates shipped with static layout but no sync markers.
      const existing =
        name === "header"
          ? /<a class="skip-link"[\s\S]*?<\/header>/
          : /<footer class="footer">[\s\S]*?<\/footer>/;
      if (!existing.test(html)) throw new Error(`Missing ${name} in ${file}`);
      html = html.replace(existing, block);
    }
  }
  await writeFile(path, await format(html, { parser: "html" }));
}
console.log(`Shared navigation and footer synced to ${files.length} pages.`);
