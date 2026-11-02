"use strict";

const mapSource = document.getElementById("dynasty-map-data");
if (mapSource) {
  let loading = false;
  const loadMap = async () => {
    if (loading) return;
    loading = true;
    try {
      const config = JSON.parse(mapSource.textContent);
      const responses = await Promise.all([
        fetch(config.url),
        fetch(config.shapes),
      ]);
      if (responses.some((r) => !r.ok)) throw Error("Map assets unavailable");
      const data = await responses[0].json();
      const shapeText = await responses[1].text();
      const svg = new DOMParser().parseFromString(
        shapeText,
        "image/svg+xml",
      ).documentElement;
      if (svg.localName !== "svg") throw Error("Invalid map geometry");
      document
        .querySelector(".map-preview")
        .replaceWith(document.importNode(svg, true));
      const byId = (id) => document.getElementById("map-" + id);
      const geography = byId("geography"),
        period = byId("parliament"),
        area = byId("area");
      const paths = [
        ...document.querySelectorAll("[data-map-level] [data-area]"),
      ];
      const palette = ["#eee9e6", "#dfb8b8", "#bc797f", "#934453", "#651f2b"];
      const aggregate = (unit) => {
        const years =
          period.value === "all" ? unit.years : [unit.years[+period.value - 1]];
        return years.reduce((s, y) => ({ n: s.n + y.n, d: s.d + y.d }), {
          n: 0,
          d: 0,
        });
      };
      const percentage = (s) =>
        s.n ? ((100 * s.d) / s.n).toFixed(1) + "%" : "No data";
      function update() {
        const level = geography.value,
          units = data[level],
          selected = units[area.value];
        document.querySelectorAll("[data-map-level]").forEach((svg) => {
          svg.toggleAttribute("hidden", svg.dataset.mapLevel !== level);
        });
        const stats = aggregate(selected);
        const caption =
          period.value === "all"
            ? `all available parliaments, ${level === "districts" ? "1986" : "1973"}–2026`
            : `${data.years[+period.value - 1]} / Parliament ${period.value}`;
        byId("period").textContent =
          `${level === "districts" ? "District" : "Regional"} view · ${caption}`;
        byId("area-name").textContent = selected.name;
        byId("share").textContent = percentage(stats);
        byId("count").textContent = stats.n
          ? `${stats.d} of ${stats.n} mapped general-seat records.`
          : "No records are mapped here in this parliament; this is not a zero share.";
        byId("recurrence").textContent =
          `Across the available history: family-linked representation in ${selected.years.filter((y) => y.d).length} of ${selected.years.filter((y) => y.n).length} covered parliaments.`;
        for (const path of paths) {
          if (path.closest("[data-map-level]").dataset.mapLevel !== level)
            continue;
          const key = path.dataset.area,
            value = aggregate(units[key]);
          const color = value.n
            ? palette[
                value.d === 0
                  ? 0
                  : Math.min(4, Math.ceil((value.d / value.n) * 4))
              ]
            : `url(#map-no-data-${level})`;
          path.setAttribute("fill", color);
          path.setAttribute("aria-pressed", String(key === area.value));
          path.setAttribute(
            "aria-label",
            `${units[key].name}: ${percentage(value)}; ${value.d} of ${value.n} mapped records. Select to inspect.`,
          );
        }
        byId("history").replaceChildren(
          ...selected.years.map((y, i) => {
            const button = document.createElement("button");
            button.type = "button";
            button.disabled = !y.n;
            button.innerHTML = `<span class="map-history-track" aria-hidden="true"><i style="transform:scaleY(${y.n ? y.d / y.n : 0})"></i></span><span>${i + 1}</span>`;
            button.title = `${data.years[i]}: ${percentage(y)}, ${y.d} / ${y.n}`;
            button.setAttribute("aria-label", button.title);
            button.setAttribute(
              "aria-pressed",
              String(period.value === String(i + 1)),
            );
            button.addEventListener("click", () => {
              period.value = String(i + 1);
              update();
              byId("history").children[i].focus({ preventScroll: true });
            });
            return button;
          }),
        );
        const ranking = Object.entries(units)
          .map(([key, u]) => ({ key, name: u.name, ...aggregate(u) }))
          .filter((u) => u.n)
          .sort((a, b) => b.d / b.n - a.d / a.n || b.n - a.n);
        byId("ranking").replaceChildren(
          ...ranking.slice(0, 5).map((u) => {
            const li = document.createElement("li"),
              button = document.createElement("button");
            button.type = "button";
            button.textContent = `${u.name} — ${percentage(u)} (${u.d}/${u.n})`;
            button.addEventListener("click", () => {
              area.value = u.key;
              update();
              area.focus({ preventScroll: true });
            });
            li.append(button);
            return li;
          }),
        );
        const summary =
          level === "districts"
            ? `${data.audit.districtMapped} records mapped across 1986–2026. Ten cross-district records are excluded from this district view.`
            : `${data.audit.regionalMapped} records mapped across 1973–2026. Regional shapes group modern districts; they are not historical boundaries.`;
        byId("summary").textContent = summary;
        byId("status").textContent =
          `${selected.name}, ${caption}: ${percentage(stats)}, ${stats.d} of ${stats.n} mapped records.`;
        let families = byId("families");
        if (!families) {
          families = document.createElement("details");
          families.id = "map-families";
          families.className = "map-families";
          byId("recurrence").after(families);
        }
        const years =
            period.value === "all"
              ? selected.years
              : [selected.years[+period.value - 1]],
          ids = [...new Set(years.flatMap((y) => y.f))];
        families.replaceChildren();
        const heading = document.createElement("summary");
        heading.textContent = `Families recorded in this view (${ids.length})`;
        families.append(heading);
        const list = document.createElement("ul");
        if (ids.length) {
          list.tabIndex = 0;
          list.setAttribute(
            "aria-label",
            "Families identified in the research",
          );
        }
        for (const id of ids) {
          const item = document.createElement("li");
          item.textContent = data.families[id] || id;
          list.append(item);
        }
        families.append(list);
      }
      geography.addEventListener("change", () => {
        const district = geography.value === "districts";
        const previous = area.value;
        const desired = district
          ? Object.keys(data.districts).find(
              (key) => data.districts[key].region === previous,
            )
          : data.districts[previous]?.region;
        [...period.options].forEach((option) => {
          option.disabled = district && +option.value > 0 && +option.value < 3;
        });
        if (district && +period.value < 3) period.value = "all";
        area.replaceChildren(
          ...Object.entries(data[geography.value])
            .sort((a, b) => a[1].name.localeCompare(b[1].name))
            .map(([key, u]) => new Option(u.name, key)),
        );
        if (desired) area.value = desired;
        update();
        document.getElementById("geography").classList.add("map-ready");
      });
      for (const select of [geography, period, area]) {
        select.disabled = false;
        if (select !== geography) select.addEventListener("change", update);
      }
      for (const path of paths) {
        path.setAttribute("role", "button");
        path.setAttribute("tabindex", "0");
        const choose = () => {
          area.value = path.dataset.area;
          update();
        };
        path.addEventListener("click", choose);
        path.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            choose();
          }
        });
      }
      update();
    } catch {
      document.getElementById("map-status").textContent =
        "Interactive map could not load. The preview and full district table remain available.";
    }
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadMap();
        }
      },
      { rootMargin: "900px" },
    );
    observer.observe(document.getElementById("geography"));
  } else loadMap();
}

// Update a single, stable plot; all states remain readable without JavaScript.
document.querySelectorAll("[data-comparison]").forEach((chart) => {
  const states = JSON.parse(
    chart.querySelector("[data-chart-states]").textContent,
  );
  const select = chart.querySelector("select");
  const panels = [...chart.querySelectorAll("[data-chart-panel]")];
  const plot = panels[0];
  const rows = [...plot.querySelectorAll(".evidence-bar")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const status = chart.querySelector("[data-chart-status]");
  let current = states
    .find((state) => state.key === select.value)
    .rows.map((row) => row.value);
  let frame;
  let target;
  panels.slice(1).forEach((panel) => {
    panel.hidden = true;
  });
  chart.classList.add("comparison-ready");
  select.disabled = false;
  function paint(values) {
    values.forEach((value, i) => {
      rows[i].querySelector("strong").textContent = value.toFixed(1) + "%";
      rows[i].querySelector(".bar-track span").style.transform =
        `scaleX(${value / 100})`;
    });
    current = values;
  }
  function settle() {
    cancelAnimationFrame(frame);
    paint(target.rows.map((row) => row.value));
    chart.dataset.animating = "false";
  }
  select.addEventListener("change", () => {
    cancelAnimationFrame(frame);
    target = states.find((state) => state.key === select.value);
    plot.querySelector(".comparison-label").textContent = target.caption;
    target.rows.forEach((row, i) => {
      rows[i].querySelector("div > span").textContent = row.label;
      rows[i].querySelector("p").textContent =
        `${row.n.toLocaleString("en")} of ${row.total.toLocaleString("en")} coded seat records`;
    });
    status.textContent =
      target.caption +
      ". " +
      target.rows
        .map((row) => `${row.label}: ${row.value.toFixed(1)}%.`)
        .join(" ");
    if (motion.matches) {
      settle();
      return;
    }
    const from = [...current];
    const start = performance.now();
    chart.dataset.animating = "true";
    function tick(now) {
      const progress = Math.min(1, (now - start) / 650);
      const eased = 1 - (1 - progress) ** 3;
      paint(
        target.rows.map((row, i) => from[i] + (row.value - from[i]) * eased),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
      else settle();
    }
    frame = requestAnimationFrame(tick);
  });
  motion.addEventListener("change", () => {
    if (motion.matches && target) settle();
  });
});

// Content remains visible unless motion is supported and explicitly permitted.
if (
  !matchMedia("(prefers-reduced-motion: reduce)").matches &&
  "IntersectionObserver" in window
) {
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          reveal.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".section-heading, .craft-heading, .recognition-card")
    .forEach((el) => {
      el.classList.add("reveal-ready");
      reveal.observe(el);
    });
}

document.querySelectorAll("[data-copy-email]").forEach((button) => {
  let resetTimer;
  button.addEventListener("click", async () => {
    const status = document.getElementById("copy-status");
    clearTimeout(resetTimer);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      if (status)
        status.textContent = "Email copied. Say hello when you’re ready.";
      button.setAttribute("aria-label", "Email address copied");
    } catch {
      if (status)
        status.textContent =
          "Couldn’t copy. Select the address or use the email link.";
    }
    resetTimer = setTimeout(() => {
      if (status) status.textContent = "";
      button.setAttribute("aria-label", "Copy email address");
    }, 5000);
  });
});

// Native dialog provides focus containment, Escape, and screen reader semantics.
const lightbox = document.createElement("dialog");
lightbox.className = "image-dialog";
lightbox.setAttribute("aria-label", "Expanded image");
lightbox.setAttribute("aria-describedby", "dialog-caption");
lightbox.innerHTML =
  '<button class="dialog-close" type="button" aria-label="Close image">×</button><img alt=""><p class="dialog-caption" id="dialog-caption"></p>';
document.body.append(lightbox);
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector(".dialog-caption");
let previousOverflow = "";
let imageTrigger;
function openImage(src, caption, alt) {
  imageTrigger = document.activeElement;
  lightboxImage.src = src;
  lightboxImage.alt = alt || caption || "Project screenshot";
  lightboxCaption.textContent = caption || alt || "";
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  lightbox.showModal();
}
lightbox
  .querySelector("button")
  .addEventListener("click", () => lightbox.close());
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    lightbox.querySelector("button").focus();
  }
});
lightbox.addEventListener("click", (event) => {
  const bounds = lightbox.getBoundingClientRect();
  if (
    event.target === lightbox &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  )
    lightbox.close();
});
lightbox.addEventListener("close", () => {
  document.body.style.overflow = previousOverflow;
  lightboxImage.removeAttribute("src");
  imageTrigger?.focus({ preventScroll: true });
});
document
  .querySelectorAll("[data-lightbox]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      openImage(
        button.dataset.lightbox,
        button.dataset.caption,
        button.querySelector("img")?.alt,
      ),
    ),
  );
document
  .querySelectorAll(
    ".craft-gallery img, .hackathon-gallery img, .mockup-img, .case-preview img",
  )
  .forEach((img) => {
    if (img.closest("a,button")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-image-button";
    button.setAttribute("aria-label", "Enlarge " + img.alt);
    img.before(button);
    button.append(img);
    const caption =
      img
        .closest(".craft-img-wrapper")
        ?.querySelector(".craft-img-caption")
        ?.textContent.trim() || img.alt;
    button.addEventListener("click", () =>
      openImage(img.currentSrc || img.src, caption, img.alt),
    );
  });
