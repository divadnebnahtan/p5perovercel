# P5pero

A static p5.js sketch gallery. Run `./dev.ps1` (uses `npx serve --single`) for local sketch routes, or serve this directory as the web root (for example `python -m http.server 8000`) and open `/`. Sketch routes need a fallback to `index.html`; `vercel.json` supplies the hosted rewrites. With a basic static server, open `/index.html` for the gallery; direct sketch routes require those rewrites.

`scripts/gallery.js` owns route selection and canvas downloads. `sketches/` contains p5 global-mode programs, including experimental substrate sketches. `libraries/` contains vendored p5 builds; `assets/` contains artwork and `style.css` styles the gallery. To add a sketch, add its file, link, and allowlist entry. Sketches use the shared p5 runtime and must not be bundled together.
