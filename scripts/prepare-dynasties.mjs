import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  copyFile,
  access,
} from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

let bundle =
  process.argv[2] ||
  "C:/Users/User/Desktop/Research/BD_Leadrs_Dinasty/bangladesh_dynasties_q1_complete_submission_and_replication_bundle";
if (!process.argv[2]) {
  try { await access(bundle); }
  catch { bundle += " (1)"; }
}
const sourceFile = async (folder, name) => {
  const nested = join(bundle, folder, name);
  try { await access(nested); return nested; }
  catch { return join(bundle, name); }
};
const out = "assets/research/bangladesh-dynasties";
await mkdir(out, { recursive: true });
function csv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const head = rows.shift().map((x) => x.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])));
}
const data = csv(
  await readFile(
    await sourceFile("03_Dataverse_Replication_Package", "bangladesh_mps_1st_to_13th_q1_replication_4527.csv"),
    "utf8",
  ),
);
const fam = csv(
  await readFile(
    await sourceFile("03_Dataverse_Replication_Package", "bangladesh_dynastic_families_q1_replication_170.csv"),
    "utf8",
  ),
);
const sum = (rows, key) => rows.reduce((n, r) => n + Number(r[key] || 0), 0);
const dyn = (rows) => rows.filter((r) => r.Is_Dynastic_Num === "1");
const share = (rows, key) => {
  const yes = rows.filter((r) => r[key] === "1");
  return {
    records: yes.length,
    dynastic: dyn(yes).length,
    percent: (100 * dyn(yes).length) / yes.length,
  };
};
const parliaments = Array.from({ length: 13 }, (_, i) => {
  const rows = data.filter((r) => +r.Parl_Int === i + 1);
  return {
    parliament: i + 1,
    total: rows.length,
    dynastic: dyn(rows).length,
    heirs: dyn(rows).filter((r) => /^[23]/.test(r.Generation_in_Dynasty))
      .length,
    inTerm: share(rows, "Cabinet_In_Term"),
    parties: ["AL", "BNP", "JP"].map((p) => {
      const r = rows.filter((r) => r.Party_Bucket_Table2 === p);
      return { party: p, total: r.length, dynastic: dyn(r).length };
    }),
  };
});
const freshmen = data.filter((r) => r.Cumulative_Terms_t === "1");
const rates = [true, false].map((d) => {
  const r = freshmen.filter((r) => (r.Is_Dynastic_Num === "1") === d);
  return {
    dynastic: d,
    total: r.length,
    careerCabinet: sum(r, "Career_In_Cabinet"),
    careerFull: sum(r, "Career_Full_Minister"),
    termCabinet: sum(r, "Cabinet_In_Term"),
    termFull: sum(r, "Full_Minister_In_Term"),
  };
});
const summary = {
  source:
    "Supplied replication CSVs; descriptive aggregation only. Original model estimates have not been independently replicated.",
  records: data.length,
  namedSeatRecords: data.filter((r) => r.Is_Vacant_Placeholder === "0").length,
  uniqueNamed: new Set(
    data.filter((r) => r.Is_Vacant_Placeholder === "0").map((r) => r.Person_ID),
  ).size,
  placeholders: sum(data, "Is_Vacant_Placeholder"),
  dynasticSeats: dyn(data).length,
  families: fam.length,
  uniqueDynasts: new Set(dyn(data).map((r) => r.Person_ID)).size,
  careerCabinet: share(data, "Career_In_Cabinet"),
  termCabinet: share(data, "Cabinet_In_Term"),
  careerFull: share(data, "Career_Full_Minister"),
  termFull: share(data, "Full_Minister_In_Term"),
  freshmen: rates,
  parliaments,
};
summary.familyPartyDefinitions = {
  allLabels: sum(fam, "Multi_Party_All_60"),
  excludingIndependents: sum(fam, "Multi_Party_NoInd_52"),
  majorThree: sum(fam, "Multi_Party_Major_44"),
};
await writeFile(
  out + "/descriptive-checks.json",
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(JSON.stringify({ ...summary, parliaments: undefined }, null, 2));
console.log(
  "Generations:",
  parliaments.map((x) => [x.parliament, x.heirs, x.dynastic]),
);
const figures = [];
let figureDir = join(bundle, "02_Publication_Figures_300DPI");
try { await access(figureDir); }
catch { figureDir = bundle; }
for (const file of (await readdir(figureDir))
  .filter((f) => f.endsWith(".png"))
  .sort()) {
  const name = file.replace(".png", "");
  await copyFile(
    join(figureDir, file),
    join(out, file),
  );
  const meta = await sharp(join(out, file)).metadata();
  for (const width of [800, 1600])
    await sharp(join(out, file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(join(out, name + "-" + width + ".webp"));
  figures.push({ name, width: meta.width, height: meta.height });
}
await writeFile(out + "/figures.json", JSON.stringify(figures, null, 2));
for (const [source, name] of [
  [
    "bangladesh_dynasties_q1_step1_theoretical_and_econometric_paper.pdf",
    "working-paper.pdf",
  ],
  [
    "bangladesh_dynasties_q1_online_supplementary_appendix.pdf",
    "supplementary-appendix.pdf",
  ],
])
  await copyFile(await sourceFile("01_Manuscript_and_Cover_Letter", source), join(out, name));
const integrity = {
  scope: "Updated synchronized research edition supplied 2026-11-02; source PNGs and public PDFs copied from the current bundle.",
  files: {},
};
for (const file of [...figures.map(({ name }) => `${name}.png`), "supplementary-appendix.pdf", "working-paper.pdf"]) {
  integrity.files[file] = createHash("sha256").update(await readFile(join(out, file))).digest("hex");
}
await writeFile(join(out, "source-integrity.json"), JSON.stringify(integrity, null, 2) + "\n");
