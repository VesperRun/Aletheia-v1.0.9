# Hosting `privacy/index.html` for Chrome Web Store

Chrome Web Store requires a **public HTTPS URL** for the privacy policy. Use the bundled page at `privacy/index.html` — it includes privacy notice, EULA, TDPSA, TRAIGA, and Galvenais disclosures.

## Before you publish

1. Open `privacy/index.html` and replace all `[REPLACE_ME]` fields (publisher name, email, address, date, hosted URL).
2. Mirror the same contact email in `PRIVACY.md` and `options/options.html` (`#privacyPolicyLink` href).

## GitHub Pages (recommended)

1. Push `privacy/` to the default branch on GitHub.
2. Repository **Settings → Pages**.
3. **Build and deployment → Source:** Deploy from a branch.
4. **Branch:** `main` (or your default) → folder **`/privacy`**.
5. Save. After a minute or two, the site is live at:

   `https://<username>.github.io/<repo-name>/`

   For this repo, that is typically:

   `https://vesperrun.github.io/Aletheia-v1.0.9/`

6. Paste that URL into:
   - Chrome Web Store → Privacy practices → Privacy policy URL
   - `options/options.html` → `#privacyPolicyLink` href
   - `privacy/index.html` → Publisher & contact → Hosted policy URL

## Verify

- URL loads over HTTPS with no login wall.
- Page shows all sections (Privacy, EULA, TDPSA, TRAIGA, Galvenais, Contact).
- Contact email matches what you submit to Google.

## Not legal advice

Have a Texas-licensed attorney review before commercial reliance on TDPSA / TRAIGA positioning.
