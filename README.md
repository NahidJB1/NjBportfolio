# Nahid Jahan Bhuiyan — Portfolio

A static portfolio for a UI/UX designer and full-stack developer. The homepage leads with selected work, real product screenshots, clear contributions, and professional recognition. Eight detailed case studies remain available.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:4173. The site has no runtime dependencies or build requirement; deploy the HTML, `assets`, and `projects` directories to a static host. Keep `404.html`, the favicons, `CNAME`, and `sitemap.xml` at the root when appropriate for the host.

## Design decisions

- **Visual hierarchy and proximity:** project screenshots, contributions, and outcomes are grouped together. A warm ivory background, charcoal typography, and restrained olive accents keep the work in focus.
- **Hick’s law:** three main navigation choices and four featured projects simplify the first scan. A native disclosure contains the remaining four projects.
- **Fitts’s law:** large project covers link to case studies. Primary actions, mobile navigation controls, and dialog controls have generous targets.
- **Recognition over recall:** real screenshots and named projects give visitors evidence before the detailed story. Every case study begins with the challenge, contribution, and outcome.
- **Predictable feedback:** visible keyboard focus, explicit navigation state, clipboard success/failure messages, Escape dismissal, and focus return for enlarged images.
- **Accessible defaults:** semantic landmarks, a skip link, meaningful alternative text, reduced-motion support, and content visible immediately. Navigation, résumé links, and the archive work without JavaScript.

The portfolio uses the supplied project information and real photography. Team design credits are preserved. Project descriptions do not introduce conversion metrics or client testimonials.

## Edit content

- `index.html`: homepage content and project selection.
- `projects/*.html`: the full case studies.
- `assets/css/style.css`: shared design tokens, homepage, navigation, and responsive layout.
- `assets/css/projects/editorial.css`: the consistent case-study treatment, loaded after existing project styles.
- `assets/js/main.js`: navigation, clipboard feedback, and accessible image dialogs.
- `assets/header.html` and `assets/footer.html`: shared layout source. After editing either, run `npm run sync-layout` to update the static copies in every page. Visitors do not need JavaScript or an asynchronous fetch to see the navigation.

Optimized WebP images are in `assets/images`; the original photos and screenshots remain in `assets/photo`. Inter is self-hosted in `assets/fonts` with its SIL Open Font License. `node scripts/prepare-assets.mjs` regenerates the image derivatives and downloads the font from Google Fonts and its license from the Inter project.

## Verification

Start the local server, then run:

```sh
npx playwright install chromium
npm test
```

The browser checks cover all ten pages at 320, 390, 768, and 1440 pixels, including image loading, local destinations, duplicate IDs, landmarks, and horizontal overflow. Axe checks desktop and mobile pages. Interaction checks exercise the menu, archive, modal keyboard focus, clipboard success and failure, reduced motion, and the JavaScript-disabled fallback.

Screenshots and the JSON report are saved to `.preview/` (ignored by Git). Automated accessibility checks are useful evidence, not a substitute for testing with assistive technology and real users.

## License

Portfolio content and project assets © 2026 Nahid Jahan Bhuiyan. All rights reserved. The Inter font uses its included SIL Open Font License.
