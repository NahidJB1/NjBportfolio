"use strict";

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
