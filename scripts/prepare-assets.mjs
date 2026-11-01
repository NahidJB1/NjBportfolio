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
await import("./download-fonts.mjs");
await import("./prepare-brand.mjs");
