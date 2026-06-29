# Aletheia Privacy Notice

Last updated: `[REPLACE_ME]`

**Hosted bundle (Chrome Web Store):** publish `privacy/index.html` at an HTTPS URL. That page includes this privacy notice, EULA, TDPSA, TRAIGA, and Galvenais disclosures in one place. See `privacy/HOSTING.md` for GitHub Pages setup.

This markdown file mirrors the privacy section of the hosted page. Replace bracketed fields before public distribution.

## Summary

Aletheia is a local-first browser extension. It is designed to reduce likely AI clutter and improve reading control without collecting user data or sending browsing activity to Aletheia-operated servers.

**Aletheia does not collect or transmit user data.** The extension stores only local settings needed to function, and those settings remain in the user's browser profile unless the user exports or removes them.

## Data Aletheia Stores Locally

Aletheia may store the following in `chrome.storage.local` on the user's browser profile:

- default feature settings;
- per-site choices for summary panels and likely clutter;
- user-authored custom rules;
- imported custom rules.

## Data Aletheia Does Not Collect

The reference implementation does not:

- collect user information;
- collect browsing history;
- collect page contents to a remote server;
- transmit custom rules to Aletheia;
- run remote AI detection;
- sell personal data;
- use targeted advertising;
- require an account;
- include an analytics SDK.

## Processing Location

Page checks, DOM changes, reading layout generation, and custom rules run locally in the browser. Aletheia is intentionally designed with no required backend service.

## User Controls

Users can:

- choose default behavior for hiding summary panels and collapsing likely clutter;
- choose site-specific behavior for summary panels and likely clutter;
- add, remove, import, and export custom rules;
- clear extension data through Chrome settings;
- uninstall the extension.

## Permissions

- `storage`: saves local settings.
- `activeTab`: lets the popup read the active tab context when the user opens it.
- `<all_urls>` host access: lets the declared content script run locally on pages the user visits.

## Contact

Privacy contact: `[REPLACE_ME]`

## Texas Notice

For Texas-facing privacy, AI, and Galvenais context, see `privacy/index.html` (hosted) or `docs/TEXAS-PRIVACY-AND-AI.md` (repository detail). This project documentation is not legal advice.

