import { writeFile } from "node:fs/promises";
const fonts = [
  ["Barlow+Condensed:wght@600", "barlow-condensed"],
  ["IBM+Plex+Sans:wght@400", "ibm-plex-sans"],
];
for (const [family, name] of fonts) {
  const r = await fetch(
    "https://fonts.googleapis.com/css2?family=" + family + "&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    },
  );
  const css = await r.text();
  const url = css.match(/\/\* latin \*\/[\s\S]*?url\(([^)]+)\)/)?.[1];
  if (!url) throw Error(css);
  const font = await fetch(url);
  await writeFile(
    "assets/fonts/" + name + "-latin.woff2",
    Buffer.from(await font.arrayBuffer()),
  );
  const lic = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/" +
      name.replaceAll("-", "") +
      "/OFL.txt",
  );
  if (!lic.ok) throw Error("License missing " + name);
  await writeFile("assets/fonts/" + name + "-OFL.txt", await lic.text());
  console.log(name + " downloaded");
}
