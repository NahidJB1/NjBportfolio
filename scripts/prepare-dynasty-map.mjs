import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
let bundle =
  process.argv[2] ||
  "C:/Users/User/Desktop/Research/BD_Leadrs_Dinasty/bangladesh_dynasties_q1_complete_submission_and_replication_bundle";
if (!process.argv[2]) {
  try {
    await access(bundle);
  } catch {
    bundle += " (1)";
  }
}
async function sourceFile(name) {
  try {
    return await readFile(
      join(bundle, "03_Dataverse_Replication_Package", name),
      "utf8",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return readFile(join(bundle, name), "utf8");
  }
}
const out = "assets/research/bangladesh-dynasties";
await mkdir(out, { recursive: true });
const metadata = await (
  await fetch("https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/")
).json();
const response = await fetch(metadata.simplifiedGeometryGeoJSON);
if (!response.ok) throw Error("Boundary download failed");
const geo = await response.json();
if (geo.features.length !== 64) throw Error("Expected 64 districts");
const parser = await readFile("scripts/prepare-dynasties.mjs", "utf8");
const csv = Function(
  parser.slice(
    parser.indexOf("function csv("),
    parser.indexOf("const data ="),
  ) + ";return csv;",
)();
const source = await sourceFile(
  "bangladesh_mps_1st_to_13th_q1_replication_4527.csv",
);
const rows = csv(source);
const familyRows = csv(
  await sourceFile("bangladesh_dynastic_families_q1_replication_170.csv"),
);
const families = Object.fromEntries(
  familyRows.map((r) => [r.Family_ID, r.Family_Dynasty_Name]),
);
// Membership follows Appendix A's greater-district concordance. These are
// regional groupings on modern outlines, not reconstructed historical borders.
const regions = {
  Dinajpur: ["Panchagarh", "Thakurgaon", "Dinajpur"],
  Rangpur: ["Nilphamari", "Lalmonirhat", "Rangpur", "Kurigram", "Gaibandha"],
  Bogra: ["Joypurhat", "Bogra"],
  Rajshahi: ["Nawabganj", "Naogaon", "Rajshahi", "Natore"],
  Pabna: ["Sirajganj", "Pabna"],
  Kushtia: ["Meherpur", "Kushtia", "Chuadanga"],
  Jessore: ["Jhenaidah", "Jessore", "Magura", "Narail"],
  Khulna: ["Bagerhat", "Khulna", "Satkhira"],
  Bakerganj: ["Jhalokati", "Barisal", "Pirojpur", "Bhola"],
  Patuakhali: ["Barguna", "Patuakhali"],
  Tangail: ["Tangail"],
  Mymensingh: ["Jamalpur", "Sherpur", "Mymensingh", "Netrakona", "Kishoreganj"],
  Dhaka: [
    "Manikganj",
    "Munshiganj",
    "Dhaka",
    "Gazipur",
    "Narsingdi",
    "Narayanganj",
  ],
  Faridpur: ["Rajbari", "Faridpur", "Gopalganj", "Madaripur", "Shariatpur"],
  Sylhet: ["Sunamganj", "Sylhet", "Maulvibazar", "Habiganj"],
  Comilla: ["Brahamanbaria", "Comilla", "Chandpur"],
  Noakhali: ["Feni", "Noakhali", "Lakshmipur"],
  Chittagong: ["Chittagong", "Cox's Bazar"],
  HillTracts: ["Khagrachhari", "Rangamati", "Bandarban"],
};
const parent = Object.fromEntries(
  Object.entries(regions).flatMap(([r, ds]) => ds.map((d) => [d, r])),
);
const aliases = {
  Bogura: "Bogra",
  Barishal: "Barisal",
  Brahmanbaria: "Brahamanbaria",
  "Chapai Nawabganj": "Nawabganj",
  Chattogram: "Chittagong",
  Cumilla: "Comilla",
  Jashore: "Jessore",
  Khagrachari: "Khagrachhari",
  Moulvibazar: "Maulvibazar",
  Netrokona: "Netrakona",
  ব্রাক্ষ্মণবাড়িয়া: "Brahamanbaria",
  "পার্বত্য রাঙ্গামাটি": "Rangamati",
};
const display = {
  Bogra: "Bogura",
  Barisal: "Barishal",
  Brahamanbaria: "Brahmanbaria",
  Nawabganj: "Chapai Nawabganj",
  Chittagong: "Chattogram",
  Comilla: "Cumilla",
  Jessore: "Jashore",
  Maulvibazar: "Moulvibazar",
  Netrakona: "Netrokona",
};
const districtNames = geo.features.map((f) => f.properties.shapeName);
if (
  new Set(Object.values(regions).flat()).size !== 64 ||
  districtNames.some((n) => !parent[n])
)
  throw Error("Incomplete region crosswalk");
const empty = () => Array.from({ length: 13 }, () => ({ n: 0, d: 0, f: [] }));
const districts = Object.fromEntries(
  districtNames.map((n) => [
    n,
    { name: display[n] || n, region: parent[n], years: empty() },
  ]),
);
const regionData = Object.fromEntries(
  Object.keys(regions).map((n) => [
    n,
    {
      name:
        n === "HillTracts"
          ? "Chittagong Hill Tracts"
          : `Greater ${n === "Bogra" ? "Bogra" : n}`,
      years: empty(),
    },
  ]),
);
const audit = {
  sourceSHA256: createHash("sha256").update(source).digest("hex"),
  total: rows.length,
  reserved: 0,
  vacantGeneral: 0,
  eligibleGeneral: 0,
  regionalMapped: 0,
  districtMapped: 0,
  earlyRegionalOnly: 0,
  ambiguousDistrict: [],
  unmapped: [],
};
function add(target, row) {
  const y = target.years[+row.Parl_Int - 1];
  y.n++;
  y.d += +row.Is_Dynastic_Num;
  if (row.Family_ID && !y.f.includes(row.Family_ID)) y.f.push(row.Family_ID);
}
for (const r of rows) {
  if (r.Is_Reserved_Seat === "1") {
    audit.reserved++;
    continue;
  }
  if (r.Is_Vacant_Placeholder === "1") {
    audit.vacantGeneral++;
    continue;
  }
  audit.eligibleGeneral++;
  const prefix = r.Constituency_EN.replace(/-\d+.*$/, "");
  const key = aliases[prefix] || prefix;
  let region, district;
  if (+r.Parl_Int < 3) {
    region =
      key === "Jamalpur"
        ? "Mymensingh"
        : key === "Hill Chittagong"
          ? "HillTracts"
          : key;
    audit.earlyRegionalOnly++;
  } else if (prefix.includes("-cum-")) {
    region = prefix.startsWith("Bakerganj")
      ? "Bakerganj"
      : prefix.startsWith("Mymensingh")
        ? "Mymensingh"
        : null;
    audit.ambiguousDistrict.push({
      parliament: +r.Parl_Int,
      constituency: r.Constituency_EN,
      dynastic: +r.Is_Dynastic_Num,
    });
  } else {
    district = key;
    region = parent[key];
  }
  if (!regionData[region]) {
    audit.unmapped.push({ p: r.Parl_Int, constituency: r.Constituency_EN });
    continue;
  }
  add(regionData[region], r);
  audit.regionalMapped++;
  if (districts[district]) {
    add(districts[district], r);
    audit.districtMapped++;
  }
}
if (audit.unmapped.length) throw Error(JSON.stringify(audit.unmapped));
const years = [
  "1973",
  "1979",
  "1986",
  "1988",
  "1991",
  "Feb 1996",
  "Jun 1996",
  "2001",
  "2009",
  "2014",
  "2019",
  "2024",
  "2026",
];
const data = { years, districts, regions: regionData, families, audit };
await writeFile(out + "/map-data.json", JSON.stringify(data));
await writeFile(
  out + "/map-boundary-source.json",
  JSON.stringify(
    {
      ...metadata,
      adaptation:
        "Simplified and projected to local SVG. Regional outlines combine modern district shapes using the supplied Appendix concordance; not historical boundaries.",
      downloaded: "2026-11-02",
    },
    null,
    2,
  ),
);
const coords = [];
function rings(g) {
  return g.type === "Polygon" ? g.coordinates : g.coordinates.flat();
}
geo.features.forEach((f) =>
  rings(f.geometry).forEach((r) => coords.push(...r)),
);
// Equirectangular projection at 24 degrees north; only a small local extent.
const c = Math.cos((24 * Math.PI) / 180);
const minX = Math.min(...coords.map((p) => p[0] * c)),
  maxX = Math.max(...coords.map((p) => p[0] * c));
const minY = Math.min(...coords.map((p) => p[1])),
  maxY = Math.max(...coords.map((p) => p[1]));
const scale = Math.min(560 / (maxX - minX), 700 / (maxY - minY));
function simplify(points) {
  if (points.length < 4) return points;
  const a = points[0],
    b = points.at(-1),
    dx = b[0] - a[0],
    dy = b[1] - a[1];
  let max = 0.45 * 0.45,
    index = -1;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i],
      t = Math.max(
        0,
        Math.min(
          1,
          ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
    const distance = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2;
    if (distance > max) {
      max = distance;
      index = i;
    }
  }
  return index < 0
    ? [a, b]
    : [
        ...simplify(points.slice(0, index + 1)).slice(0, -1),
        ...simplify(points.slice(index)),
      ];
}
function path(f) {
  return rings(f.geometry)
    .map((r) => {
      const points = r.map((p) => [
        (600 - (maxX - minX) * scale) / 2 + (p[0] * c - minX) * scale,
        20 + (maxY - p[1]) * scale,
      ]);
      const area =
        Math.abs(
          points.reduce((s, p, i) => {
            const q = points[(i + 1) % points.length];
            return s + p[0] * q[1] - q[0] * p[1];
          }, 0),
        ) / 2;
      if (area < 0.3) return "";
      let reduced = simplify(points);
      if (reduced.length < 4)
        reduced = [
          points[0],
          points[Math.floor(points.length / 3)],
          points[Math.floor((points.length * 2) / 3)],
          points[0],
        ];
      return (
        "M" +
        reduced.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L") +
        "Z"
      );
    })
    .join("");
}
const paths = Object.fromEntries(
  geo.features.map((f) => [f.properties.shapeName, path(f)]),
);
const attr = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
function svg(level, units, selected) {
  return (
    '<g data-map-level="' +
    level +
    '" ' +
    (level === "regions" ? "hidden" : "") +
    ' role="group" aria-label="Bangladesh ' +
    level +
    ' map">' +
    Object.entries(units)
      .map(([key, u]) => {
        const n = u.years.reduce((s, y) => s + y.n, 0),
          dy = u.years.reduce((s, y) => s + y.d, 0);
        const keys = level === "districts" ? [key] : regions[key];
        return (
          '<g data-area="' +
          attr(key) +
          '" role="img" aria-label="' +
          attr(u.name) +
          ": " +
          (n
            ? ((100 * dy) / n).toFixed(1) + "% family-linked records"
            : "no mapped records") +
          '" fill="' +
          (n ? color(dy / n) : "#ecedea") +
          '"><title>' +
          u.name +
          "</title>" +
          keys
            .map(
              (k) => '<use href="#bd-shape-' + districtNames.indexOf(k) + '"/>',
            )
            .join("") +
          "</g>"
        );
      })
      .join("") +
    "</g>"
  );
}
const mapDefs =
  "<defs>" +
  Object.entries(paths)
    .map(
      ([key, d]) =>
        '<path id="bd-shape-' +
        districtNames.indexOf(key) +
        '" d="' +
        d +
        '"/>',
    )
    .join("") +
  ["districts", "regions"]
    .map(
      (level) =>
        '<pattern id="map-no-data-' +
        level +
        '" patternUnits="userSpaceOnUse" width="6" height="6"><path d="M0 0L6 6" stroke="#a9aba5" stroke-width="1"/></pattern>',
    )
    .join("") +
  "</defs>";
function color(r) {
  return ["#eee9e6", "#dfb8b8", "#bc797f", "#934453", "#651f2b"][
    r === 0 ? 0 : Math.min(4, Math.ceil(r * 4))
  ];
}
const unitKeys = Object.keys(districts).sort((a, b) =>
  districts[a].name.localeCompare(districts[b].name),
);
const rank = (units) =>
  Object.entries(units)
    .map(([k, u]) => ({
      key: k,
      ...u,
      n: u.years.reduce((s, y) => s + y.n, 0),
      d: u.years.reduce((s, y) => s + y.d, 0),
    }))
    .sort((a, b) => b.d / b.n - a.d / a.n || b.n - a.n);
const initial = rank(districts)[0];
const fallback = `<details class="map-fallback"><summary>All-period district data table (1986–2026)</summary><div class="map-table-wrap"><table><caption>Named general-seat records assigned to one modern district. Not vote shares.</caption><thead><tr><th scope="col">District</th><th scope="col">Family-linked / mapped</th><th scope="col">Share</th></tr></thead><tbody>${rank(
  districts,
)
  .map(
    (u) =>
      `<tr><th scope="row">${u.name}</th><td>${u.d} / ${u.n}</td><td>${((u.d / u.n) * 100).toFixed(1)}%</td></tr>`,
  )
  .join("")}</tbody></table></div></details>`;
const html = `<section class="article-map-section container" id="geography" aria-labelledby="geography-title"><div class="map-heading"><p class="article-chapter">The geography of representation</p><h2 id="geography-title">Where do political families<br>keep appearing?</h2><p>Explore family-linked representation across Bangladesh, one parliament at a time. Darker areas have a higher share of dynastic records. This shows who held seats—not how residents voted or whether they preferred dynasties.</p></div><div class="map-controls"><div><label for="map-geography">Geographic detail</label><select id="map-geography" disabled><option value="districts">64 districts · 1986–2026</option><option value="regions">19 regional groups · 1973–2026</option></select></div><div><label for="map-parliament">Parliament / start year</label><select id="map-parliament" disabled><option value="all">All available parliaments</option>${years.map((y, i) => `<option value="${i + 1}" ${i < 2 ? "disabled" : ""}>${y} / Parliament ${i + 1}</option>`).join("")}</select></div><div><label for="map-area">Select an area</label><select id="map-area" disabled>${unitKeys.map((k) => `<option value="${attr(k)}" ${k === initial.key ? "selected" : ""}>${districts[k].name}</option>`).join("")}</select></div></div><div class="map-workspace"><div class="map-canvas"><svg class="dynasty-map-svg" viewBox="0 0 600 740" role="group" aria-label="Bangladesh dynastic representation map">${mapDefs}${svg("districts", districts, initial.key)}${svg("regions", regionData, "Faridpur")}<text x="30" y="40" class="map-north">N</text></svg><div class="map-legend" aria-label="Family-linked record share"><span>0%</span><i style="background:#eee9e6"></i><i style="background:#dfb8b8"></i><i style="background:#bc797f"></i><i style="background:#934453"></i><i style="background:#651f2b"></i><span>100%</span></div><p class="map-hint">Select a shape or use the area list. Hatching means no mapped records. Outlines are geographic guides, not constituency boundaries.</p></div><div class="map-detail"><p class="map-period" id="map-period">District view · all available parliaments, 1986–2026</p><h3 id="map-area-name">${initial.name}</h3><p class="map-score"><strong id="map-share">${((initial.d / initial.n) * 100).toFixed(1)}%</strong><span>family-linked records</span></p><p id="map-count">${initial.d} of ${initial.n} mapped general-seat records.</p><p id="map-recurrence">Family-linked representation in ${initial.years.filter((y) => y.d).length} of ${initial.years.filter((y) => y.n).length} covered parliaments.</p><h4>Follow this area through time</h4><div class="map-history" id="map-history"></div><p class="map-history-note">Bar height = family-linked share. Numbers under bars are parliament numbers. Select a bar to change the year. Hatched bars have no mapped records.</p><div class="map-ranking"><h4>Highest shares in this view</h4><ol id="map-ranking"></ol><p>Ranked by share of mapped records, not vote share. A high percentage based on few records needs care.</p></div></div></div><p id="map-summary" class="map-summary">${audit.districtMapped} named general-seat records assigned to modern districts, 1986–2026. ${audit.ambiguousDistrict.length} cross-district records are retained only in the regional view.</p><p class="sr-only" id="map-status" role="status" aria-live="polite"></p><noscript><p>The map shows the all-period district comparison. The full table below works without JavaScript; enable JavaScript to explore individual parliaments and regional history.</p></noscript>${fallback}<details class="map-method"><summary>How the geography was matched</summary><p>Districts use constituency-name prefixes from the replication file, with documented spelling aliases. No constituency polygons are inferred. For 1973 and 1979, only the 19 broader groups are mapped; the appendix’s successor-district concordance groups later records to the same regions. The shapes are grouped modern outlines, not reconstructed historical borders.</p><p>Of ${audit.total} records, ${audit.reserved} reserved-seat records and ${audit.vacantGeneral} vacant general-seat placeholders are excluded. The regional view covers all ${audit.regionalMapped} remaining general-seat records. The district view begins in 1986 and excludes ${audit.ambiguousDistrict.length} records labelled across two districts. Repeated terms, by-elections and simultaneous constituency wins remain separate records. An area’s recurrence counts parliaments with at least one family-linked record, among parliaments with mapped records.</p><p>Boundaries: <a href="https://www.geoboundaries.org/">geoBoundaries</a>, BBS / OCHA ROAP, 2020 district layer; <a href="https://creativecommons.org/licenses/by/3.0/igo/">CC BY 3.0 IGO</a>. Adapted to simplified local SVG and regional groups.</p></details><script type="application/json" id="dynasty-map-data">${JSON.stringify(data)}</script></section>`;
const inlineSVG = html.match(/<svg class="dynasty-map-svg"[\s\S]*?<\/svg>/)[0];
const externalSVG = inlineSVG
  .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
  .replace(/ hidden(?=[ >])/g, ' hidden="hidden"');
await writeFile(out + "/map-shapes.svg", externalSVG);
const previewSVG = externalSVG.replace(
  "<defs>",
  "<style>[data-area]{stroke:#ecedea;stroke-width:.7}[hidden]{display:none}</style><defs>",
);
await sharp(Buffer.from(previewSVG))
  .resize({ width: 600 })
  .webp({ quality: 85 })
  .toFile(out + "/map-preview.webp");
const mapHTML = html
  .replace(
    inlineSVG,
    '<img class="dynasty-map-svg map-preview" src="/assets/research/bangladesh-dynasties/map-preview.webp" width="600" height="740" loading="lazy" alt="Bangladesh district map showing the all-period family-linked share of mapped general-seat records">',
  )
  .replace(
    '<script type="application/json" id="dynasty-map-data">' +
      JSON.stringify(data) +
      "</script>",
    '<script type="application/json" id="dynasty-map-data">{"url":"/assets/research/bangladesh-dynasties/map-data.json","shapes":"/assets/research/bangladesh-dynasties/map-shapes.svg"}</script>',
  );
let page = await readFile(
  "research/bangladesh-political-families.html",
  "utf8",
);
const marker = '<section class="article-section" id="inheritance">';
if (!page.includes(marker)) throw Error("Article insertion point not found");
if (page.includes('id="geography"'))
  page = page.replace(
    /<section\b[^>]*id="geography"[^>]*>[\s\S]*?<\/section>/,
    mapHTML,
  );
else
  page = page
    .replace(marker, mapHTML + "\n" + marker)
    .replace(
      '<a href="#inheritance">',
      '<a href="#geography">The map</a><a href="#inheritance">',
    );
if (!page.includes('href="#geography"'))
  page = page.replace(
    /<a\s+href="#inheritance"/,
    '<a href="#geography">The map</a><a href="#inheritance"',
  );
await writeFile("research/bangladesh-political-families.html", page);
await writeFile(out + "/map-match-audit.json", JSON.stringify(audit, null, 2));
console.log({
  ...audit,
  ambiguousDistrict: audit.ambiguousDistrict.length,
  topDistrict: initial.name,
  svgPathsBytes: Object.values(paths).reduce((s, p) => s + p.length, 0),
});
