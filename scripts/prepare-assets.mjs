import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
await mkdir(resolve(root, "assets/images"), { recursive: true });
await mkdir(resolve(root, "assets/fonts"), { recursive: true });
const images = {
  portrait: "photo/photo.jpg",
  onestep: "photo/OS/SS1-OS.png",
  medelife: "photo/ML/SS2-ML.png",
  percentage: "photo/PC/SS1-PC.png",
  championship: "photo/hackathonchampdn.jpeg",
  "hult-prize": "photo/hultprize.jpeg",
  "deans-award": "photo/ACHV/njbdean.jpeg",
};
for (const [name, file] of Object.entries(images)) {
  const result = await sharp(resolve(root, "assets", file))
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(resolve(root, `assets/images/${name}.webp`));
  console.log(
    `${name}: ${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB`,
  );
}
const cssResponse = await fetch(
  "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  },
);
if (!cssResponse.ok) throw new Error("Font stylesheet download failed");
const css = await cssResponse.text();
const latin = css.match(/\/\* latin \*\/[\s\S]*?url\(([^)]+)\)/)?.[1];
if (!latin) throw new Error("Latin Inter font URL not found");
const font = await fetch(latin);
if (!font.ok) throw new Error("Font download failed");
await writeFile(
  resolve(root, "assets/fonts/inter-latin.woff2"),
  Buffer.from(await font.arrayBuffer()),
);
const license = await fetch(
  "https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt",
);
if (!license.ok) throw new Error("Font license download failed");
await writeFile(resolve(root, "assets/fonts/OFL.txt"), await license.text());
console.log("Inter Latin font and its license saved locally.");
