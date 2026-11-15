# Shahajada Hasib: portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Structure

```
index.html            All content, in section order (Home → Contact)
assets/css/style.css  Design tokens (colours, fonts, spacing) at the top, then components and sections
assets/js/main.js     Theme toggle, mobile menu, scroll reveal, project filter, contact form
assets/img/           Optimised WebP screenshots and the social preview image
assets/fonts/         Self-hosted variable fonts (Bricolage Grotesque, Inter, JetBrains Mono)
```

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

The site is static, so any static host works.

**GitHub Pages:** repository Settings → Pages → Source "Deploy from a branch" → `master` / root.
The site is then served at `https://shahajadahasib.github.io/Personal-Portfolio/`.

If you deploy to a different address (a custom domain, Netlify, Vercel), update that URL in
`index.html` (canonical, Open Graph and JSON-LD tags), `robots.txt` and `sitemap.xml`.

## Contact form

Messages are delivered by [FormSubmit](https://formsubmit.co) to the address set in two places:

- `CONTACT_EMAIL` at the top of `assets/js/main.js`
- the `action` attribute of `#contact-form` in `index.html` (used only if JavaScript is off)

**One-time activation:** the first message submitted from the live site triggers an activation email
from FormSubmit to that address. Click the link in it once; every message after that is delivered
straight to the inbox. FormSubmit's activation email also offers a random alias you can use in place
of the address if you would rather not have it in the page source.

Spam protection: a hidden honeypot field, a minimum fill time, a per-browser cooldown, and
FormSubmit's own filtering.

## Editing content

- **Add a project:** copy one `<li class="project">` block in `index.html` and set `data-cat` to any of
  `web`, `mobile`, `ai` (space-separated) so the filter picks it up.
- **Colours:** change the custom properties under `:root` in `style.css`. Light and dark palettes are
  both defined there.
