import sharp from "sharp";
import { readFile, writeFile, readdir } from "node:fs/promises";

// Use the supplied artwork unchanged, padded on the site's signature ink.
const artwork = "assets/photo/njblogo.png";
async function icon(size) {
  const inset = Math.round(size * 0.12);
  const logo = await sharp(artwork)
    .resize(size - inset * 2, size - inset * 2, { fit: "contain" })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: "#651f2b" },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}
for (const [file, size] of [
  ["favicon.png", 96],
  ["favicon-32.png", 32],
  ["apple-touch-icon.png", 180],
]) {
  await writeFile(file, await icon(size));
}
// Valid multi-resolution ICO: PNG-encoded images with an ICONDIR directory.
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(icon));
const directory = Buffer.alloc(6 + 16 * sizes.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
sizes.forEach((size, i) => {
  const entry = 6 + i * 16;
  directory[entry] = size === 256 ? 0 : size;
  directory[entry + 1] = size === 256 ? 0 : size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(images[i].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile("favicon.ico", Buffer.concat([directory, ...images]));
const files = [
  "index.html",
  "404.html",
  ...(await readdir("projects"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => "projects/" + f),
  ...(await readdir("research"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => "research/" + f),
];
for (const file of files) {
  let html = await readFile(file, "utf8");
  html = html.replace(/<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>/g, "");
  html = html.replace(
    "</head>",
    `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64 128x128 256x256">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  </head>`,
  );
  await writeFile(file, html);
}
console.log("Generated logo icons and updated all twelve page heads.");
