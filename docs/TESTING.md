# Testing Aletheia

## Manual Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `aletheia-extension` folder.
5. Reload the extension after code changes.

## Fixture Test

Use `dev/fixture.html` for predictable local testing.

If you open it as a `file://` page, enable **Allow access to file URLs** for Aletheia on `chrome://extensions`.

Alternatively, serve the folder locally and open it over `http://localhost`.

## Smoke Test Checklist

- The extension loads without manifest errors.
- The popup opens on a normal web page.
- The fixture summary panel hides when summary hiding is selected.
- The fixture related rail collapses when likely clutter collapse is selected.
- The collapse control expands and recollapses the section.
- “Clarify this page” hides summary panels and collapses likely clutter for the current site.
- Clicking the same button again shows the page as-is for the current site.
- `Esc` exits reading layout.
- `Alt+Shift+L` toggles reading layout when Chrome has assigned the shortcut.
- Summary panels can use the default, hide on this site, or be allowed on this site.
- Likely clutter can use the default, collapse on this site, or be allowed on this site.
- Reset site choices clears local choices and returns both features to defaults.
- A custom rule can be added, exported, removed, and imported.
- Options page opens and displays Texas-facing disclosures.

## Restricted Pages

Aletheia should not attempt to run on restricted browser pages such as:

- `chrome://`
- `chrome-extension://`
- `edge://`
- `about:`
- `devtools://`
- Chrome Web Store pages

## Launch Gate

Before submission:

- Fill placeholders in `PRIVACY.md`.
- Fill publisher fields in `docs/TEXAS-PRIVACY-AND-AI.md`.
- Export and add final PNG icons.
- Verify no remote calls, analytics SDKs, or account flows were added.
- Test a fresh install in a clean Chrome profile.

