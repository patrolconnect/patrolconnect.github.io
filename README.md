# patrolconnect.github.io

Sales website for Patrol Connect, served by GitHub Pages at `https://info.patrol-connect.com`. Static HTML, one stylesheet (`assets/css/site.css`) and one script (`assets/js/site.js`); no build step, no framework, no CDN except Cloudflare Turnstile.

## Source of truth

Every statement on the page comes from `docs/MARKETING.md` in the Patrol Connect app repo. Do not add a feature, certification, integration or number that file does not state. CJIS uses its exact sentence. When `MARKETING.md` changes, update the sections below.

| `MARKETING.md` section | `index.html` section |
|---|---|
| *Product summary* | Hero (`#top`) lead, meta description |
| *Differentiators* | Paperwork and In the field rows, FAQ "Does it replace our RMS?" |
| *Modules* (one `###` per module) | Module catalog (`#modules`), one card per module, grouped by **Category** |
| *Plans and pricing* | Key figures, Pricing (`#pricing`), Getting started (`#start`) |
| *Plans and pricing* → *Contact* | Contact topics (`#contact`) |
| *Platform features* | Getting started, FAQ |
| *Security and privacy*, *Technical appendix* → *Third-party services* | Privacy (`#privacy`) checklist and data-flow diagram (`.dataflow`), FAQ |

## Copy

- Case follows the app (`docs/design/patterns.md` *States & content*): Title Case for headings, card and step titles, key figures, buttons, nav and footer links, form labels and select options; sentence case for body, eyebrows, group captions, hints, notes and anything written as a sentence or question (the hero and highlight headlines, FAQ questions, "Ready to subscribe yourself?"). The flyer and the overview video follow the same rule.
- The company is "BlueShield Solutions LLC" in full, with no comma, every time, including the CJIS sentence. Never the shorthand "BlueShield" (`MARKETING.md` *Voice and terminology*).

## Tokens

`site.css` `:root` reuses the app's token names from `docs/design/foundations.md`. A token with an app name keeps the app's value, so a rule copied between the app and this site renders the same. A value the app does not have gets a site-only name (`--letter-spacing-display`, `--layout-max-width-reading`, `--font-size-h1`).

## Header

- The header is sticky. `--layout-header-height` is its row height (60px, 76px from 1024px), and `html`'s `scroll-padding-top` adds it so a linked section lands below the header. Keep the two together when the nav padding changes. The skip link stacks above the header (`--z-toast` over `--z-sticky`).
- Below 1024px the bar shows only the brand and a Menu button. The section links, Sign in and Sign up sit in `#site-menu`, a native `popover`, so Esc and a tap outside close it with no script. From 1024px the same element is laid out inline as the desktop row. A browser without popover support (`@supports selector(:popover-open)`) gets the links and buttons wrapped under the brand, without the sticky header.
- `site.js` closes the menu when a link in it is followed or the viewport crosses 1024px, and sets `aria-current="true"` on the link whose section crosses the middle of the viewport. A new nav link needs an `id` on its target section.

## Module card

Copy an existing card inside the right group's `<ul class="module-grid">`. The heading is the module name exactly as its `MARKETING.md` heading, and the `summary` repeats it in its `.visually-hidden` span so each Details control has its own accessible name. Update the module count in the Key figures strip and the flyer's module list and "22 Modules" key figure when a module is added or removed.

```html
<li>
  <article class="module-card">
    <h4>Module Name</h4>
    <p>What it does, in one sentence.</p>
    <p class="module-card__output">Output: what the officer gets</p>
    <details>
      <summary>Details<span class="visually-hidden"> for Module Name</span></summary>
      <p><strong>Data: </strong>Privacy and data handling.</p>
      <p><strong>Limits: </strong>Limits.</p>
    </details>
  </article>
</li>
```

## Where pricing appears

Change all of these together:

- Key figures strip: "$80 a year" and its $500 agency minimum.
- Pricing: both price cards ($80 per seat, $500 annual minimum, $100 per booking facility per year; $80 individual).
- FAQ: "Which jails can receive Booking?" ($100 a year per facility).
- Contact topic `facility`: its `data-next` text ($100 yearly fee).
- Flyer: the key figure and both pricing cards, then re-export the PDF (see *Flyer*).

## Flyer

`Patrol Connect Flyer.pptx` is the editable source; `Patrol_Connect_Flyer.pdf` is exported from it and linked from the Pricing flyer card and the footer. Its copy follows the same `MARKETING.md` rules as the page, with the CJIS sentence verbatim in the fine print.

- One US Letter slide: hero, key figures (the same four as the page's strip), three benefits, every module as a chip under its Home page category, and a pricing and QR band. Every shape has a name (Selection Pane) and each block is one text box, so edit text in place rather than adding boxes. A module chip is a rounded rectangle holding its name; copy one and retype it, keeping chips 0.05" apart.
- Print-ready for black-and-white office printers: white page, nothing within 0.55" of the left, right or top edge, dark gray body text (`#111827`, `#1f2937`, `#4b5563`), blue text only at display size or in `--accent-blue-pressed` (`#1d4ed8`, eyebrows and URLs), and `--accent-blue` only on rules, bars and borders. Keep new elements to the same rule; a dark fill wastes toner and loses contrast in grayscale.
- No buttons: on paper the QR code is the call to action.
- Fonts: Poppins Regular, Medium, SemiBold and Bold (Google Fonts, OFL) must be installed on the editing computer, or PowerPoint or LibreOffice substitutes another font and the layout shifts.
- Export: in PowerPoint, File > Export > Create PDF/XPS, Standard quality, saved over `Patrol_Connect_Flyer.pdf`; on Linux, `soffice --headless --convert-to pdf "Patrol Connect Flyer.pptx"` from this folder, then rename the output to `Patrol_Connect_Flyer.pdf`. Check that the text selects (it has a text layer) and both links open: the contact form and `www.patrol-connect.com/signup`.
- Thumbnail: after every export, re-render the Pricing flyer card's `images/flyer-thumb.png` (400px wide) with `pdftoppm -png -singlefile -scale-to-x 400 -scale-to-y -1 Patrol_Connect_Flyer.pdf images/flyer-thumb`. Keep its `width` and `height` in `index.html` matching the image.
- The QR code encodes `https://info.patrol-connect.com`; replace the image only with a code that scans to the same address.

## Contact form

- Posts to `https://www.patrol-connect.com/contactSubmit` (`main-php-scripts/main-contact-form-submit.php`; contract in `docs/engineering/modules/contact-form.md`). Field names, topic values and length caps must match that contract; deploy the endpoint and this site together when either changes.
- Topic options carry their "What happens next" copy in `data-next` and an optional note in `data-note`. Fields shown per topic are set by `data-topics` on each field; hidden fields are also disabled, so they do not post.
- The endpoint redirects back with `?contact=success|invalid|security|failed|ratelimited`; `site.js` shows the matching banner and removes the query. The `ratelimited` copy states the endpoint's 10-minute window.
- On submit, `site.js` saves the typed fields (not the honeypot or the Turnstile token) to `sessionStorage` under `pc.contact.draft`. The next page load always removes the key, and refills the form from it only when the result is not `success`, so the copy lives for one round trip.
- Turnstile uses the app's signup widget. Its public site key is in `#contact-challenge`'s `data-sitekey`; the widget's hostname `patrol-connect.com` covers `info.patrol-connect.com`, because Cloudflare authorizes every subdomain of a listed hostname.

## Illustrations

Every image is an `<img>` with `alt` text, `width` and `height`.

- `images/pc-statement-generator.svg` and `images/dwi-hazmat-phones.svg` are drawn mockups of the app, not screenshots. Their labels copy the app: the PC Statement Generator sections from `pc-generator/form-config.json`, DWI Investigation Toolkit section 8 from `dwi-field-support/index.php`, and the Hazmat Quick Reference result for UN 1005 from `dependencies/erg2024-*.json`. Redraw a mockup when its module's labels change, or replace it with a real screenshot at the same 880 × 660 size. Content is placeholder bars, never officer data.
- An `<img>` SVG cannot load the page's fonts, so each mockup embeds Poppins 400, 500 and 600 as `data:` URIs in its `<style>`. Edit the drawing below that block; leave the block as is.
- `images/missouri.svg` is the county map from the US Census Bureau 2010 cartographic boundary files (public domain), with Jefferson City marked.
- The Privacy data-flow diagram is HTML (`.dataflow`), so it reflows at phone width and reads as text. Each route names only a recipient that `MARKETING.md` lists under *Third-party services*.

## Overview video

`media/patrol-connect-overview.mp4` and the poster `images/video-poster.jpg` are generated by `tools/overview-video/` in the app repo. Do not edit them by hand; re-render from the app repo root:

```
node tools/overview-video/render.js
```

- The video states the premise and its impact as animated concept diagrams rather than pictures of the app: the paperwork that outlasts the shift; scattered forms, templates and sites gathered on one Home page; a guided form landing on the agency's own template for the officer's review; field references beside the paperwork; drafts encrypted on the device, PII swapped before most AI and data never sold; then what it means for the officer and for the agency; ending on the logo. Its poster is the opening "The shift ends. The paperwork doesn't." frame. It has no captions: there is no speech, and the on-screen text carries the content. It copies no sentence from this page, and it uses none of this page's images except the logo, so redrawing a mockup here does not affect it. The steps and their timing live in `tools/overview-video/scenes.js`; every statement there must hold in `MARKETING.md`, the same rule as this page.
- A step stays on screen for at least 0.45 s plus 0.3 s a word before its scene starts to fade out.
- The render stops before writing anything when a step marked as a module has no module card here, a step leaves before it can be read, a sound would land off the beat, or text leaves the frame or runs into the diagram. Rename or retime the step in `scenes.js`.
- Re-render after a module named in the video is renamed.
- Preview frames without writing the video: `node tools/overview-video/render.js --stills 7.5,13.5 --out <dir>`.
- Rules, scene format, workflow and verification for changing or redesigning the video: `tools/overview-video/README.md` in the app repo.
