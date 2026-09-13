"use strict";

// HTML supplies the navigation. JavaScript adds the small-screen disclosure.
const menuButton = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
function closeMenu(returnFocus = false) {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  mobileMenu.hidden = true;
  if (returnFocus) menuButton.focus();
}
if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
    mobileMenu.hidden = !open;
  });
  mobileMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileMenu.hidden) closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (!mobileMenu.hidden && !event.target.closest(".site-header"))
      closeMenu();
  });
  matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}

// Local anchors avoid an unnecessary reload from the homepage.
if (
  !location.pathname.includes("/projects/") &&
  document.getElementById("hero")
) {
  document
    .querySelectorAll('a[href^="/index.html#"]')
    .forEach((link) => link.setAttribute("href", new URL(link.href).hash));
  const navLinks = [...document.querySelectorAll(".nav-link")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const active = link.hash === "#" + entry.target.id;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
    );
    ["projects", "about", "community", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((section) => observer.observe(section));
  }
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
