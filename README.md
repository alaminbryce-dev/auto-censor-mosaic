# Bulk Watermark — AlaminBryce Style

A tiny static web app (no server) to watermark **many images at once** directly in the browser.

- Default watermark: [`assets/watermark.png`](assets/watermark.png) — from your prompt image.
- Upload your own watermark anytime (PNG or SVG recommended).
- Controls to change size (% of image width), corner, offsets, opacity.
- Optional *drag to reposition* on the preview — it updates the global offsets for all images.
- Download each image individually **or** as a ZIP (uses JSZip & FileSaver via CDN).

## Deploy on Vercel
1. Create a new project from this folder (or push to GitHub and import).
2. Framework preset: **Other** (static).
3. Build command: **none**. Output dir: **/**.
4. Add custom domain (e.g., `watermark.alaminbryce.com`) and set it as the primary if you want.

## Tips
- Transparent PNG works best for watermarks.
- If the ZIP button doesn’t work on some browsers/content-blockers, download per-card (always works).
- For exact top-right placement like your current site vibe, set Corner = Top right, Offset X = negative margin (e.g., -20), Offset Y = positive margin (e.g., 20).

— Enjoy!
