# Nahid Jahan Bhuiyan — Portfolio

Buildless HTML, CSS and vanilla JavaScript. Oxblood ink (#651F2B), grey paper (#ECEDEA), self-hosted Barlow Condensed and IBM Plex Sans. Font licenses are included in assets/fonts.

## Local preview

Run `npm ci`, then `npm run dev`. Open http://localhost:4173.

The redesign is local. To deploy to the existing static host, upload the root HTML files, projects/, research/, assets/, favicons and sitemap.

## Complete source

- assets/css/styles.css — the single shared stylesheet loaded by all pages.
- assets/js/main.js — the shared script, approximately 4 KB before compression. Optional scroll reveals, clipboard feedback and native image dialogs.
- index.html — homepage and the eight-project index. CSS previews respond to hover and keyboard focus; touch and narrow layouts display the images in place.
- projects/*.html — all eight complete case studies, using one shared design system.
- research/index.html — publication index with a commented repeatable HTML entry pattern.
- research/entry-template.html — explicitly unpublished template with noindex. Replace every bracketed placeholder before publishing a real entry.
- 404.html — matching error page.

The old stylesheets remain for reference but are no longer loaded. There are no external runtime scripts or font requests.

## Case-study master

Use projects/onestepmy.html as the master for future projects. Every existing study follows the same pattern: .craft-hero for title and subtitle; .craft-meta-grid for role, timeline, stack/scope and links; .case-preview and .case-summary for the product, challenge, contribution and outcome; .craft-section for reading text and image plates; .next-project for the following study.

Add a project year only when verified. The work index uses existing project types because the source does not provide consistent years. Existing case-study text, image references and alt text, destination links and metadata were checked against the original Git revision.

assets/header.html and assets/footer.html are authoring sources. Run `npm run sync-layout` after editing them to update all twelve pages. Static navigation stays available on mobile without JavaScript.

## Add research

Duplicate research/entry-template.html under a meaningful filename. Replace every placeholder, add the verified publication date and type, and supply the publication or PDF link. Update title, description and canonical URL, then remove noindex when ready. Copy the commented .research-row in research/index.html, fill it in and remove the forthcoming block after the first publication. Update the homepage research block and sitemap as appropriate.

## Verification

With the server running, run `npm test`. Browser checks cover twelve pages at 320, 390, 768 and 1440 pixels: images, local links and anchors, duplicate IDs, landmarks, overflow, desktop/mobile axe accessibility, index previews, image-dialog Escape and focus return, clipboard success/failure, reduced motion, and JavaScript-disabled navigation. Reports and screenshots are in .preview/ (ignored by Git).

Release checklist:

- Browse the work index with mouse, keyboard and touch.
- Read a case study and check its next-project and external links.
- Open and dismiss an image; verify focus returns to its trigger.
- Check résumé, email and social destinations.
- Check browser zoom and reduced motion.
- Run Lighthouse on the deployed host; local checks do not establish live performance.

All required assets are included. `npm run prepare-assets` regenerates images and downloads both fonts with their licenses; it requires network access.

The supplied logo is `assets/photo/njblogo.png`. `node scripts/prepare-brand.mjs` regenerates the multi-resolution favicon, PNG icons and Apple touch icon from that artwork, and synchronizes icon declarations across every page. Run `node scripts/verify-brand.mjs` with the server running to check additional layouts at 360, 600, 1024 and 1920 pixels and validate the icon files. Search-result icons require deployment and a subsequent Google recrawl; their display is controlled by Google.

Portfolio content and project assets © 2026 Nahid Jahan Bhuiyan. Font licenses are included alongside the fonts.
