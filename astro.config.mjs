// @ts-check
import { defineConfig } from 'astro/config';

// ── Where this site lives ────────────────────────────────────────────────
// Served at the root of its own domain, so there is no `base`. GitHub Pages
// learns the domain from Settings → Pages → Custom domain (a CNAME file is
// ignored when deploying from Actions). Moving back to a
// <user>.github.io/<repo> address would mean setting `site` to
// https://<user>.github.io and adding `base: '/<repo>'`.
const site = 'https://elliesbellie.com';

export default defineConfig({
  site,
  trailingSlash: 'always',
});
