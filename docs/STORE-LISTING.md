# Chrome Web Store Listing Draft

## Name

Aletheia

## Short Description

Quiet AI-heavy websites with local-first controls for summary panels, likely AI clutter, and clean reading.

## Detailed Description

Aletheia is a privacy-first browser extension that helps you take back control of AI-heavy websites. It is built for users, not data collection.

Modern pages can feel crowded with AI summaries, generated-looking side rails, recommendation blocks, and repeated answer panels. Aletheia gives you simple local controls to quiet the page:

- hide common AI summary panels;
- collapse likely AI clutter;
- switch into a clean reading layout;
- set summary-panel and likely-clutter choices independently for each site or use your defaults;
- add safe custom rules for your own browsing preferences.

Aletheia runs locally in your browser. It does not require an account, does not collect user information, does not send browsing activity to remote servers, and does not claim perfect AI detection. It uses conservative page patterns and user-controlled rules to help reduce clutter while keeping you in control.

Aletheia is conservative by design. It may miss some clutter because it does not spy, score, or overclaim. The goal is not perfect detection. The goal is honest user control.

## Privacy Summary

- No account required.
- No user information collected.
- No browsing telemetry.
- No page content transmitted.
- No remote AI detection.
- No Aletheia-operated backend required.
- Settings and custom rules stay in local browser storage.

## Permissions Explanation

- `storage`: saves local settings, per-site preferences, and custom rules.
- `activeTab`: lets the popup work with the current tab when the user opens it.
- `<all_urls>` host access: lets the local content script run on pages so Aletheia can hide or collapse elements in the user's browser.

## Category

Productivity

## Suggested Tags

privacy, reading, productivity, browser control, AI clutter, local-first

## Icon Direction

Preferred icon concept:

- luminous eye / lens;
- open book or clean page;
- digital clutter pushed to the sides;
- midnight navy, teal, and warm gold;
- no chatbot bubble, no robot, no “AI magic” sparkle overload.

Preferred simplified toolbar draft:

`C:\Users\jaeso\.cursor\projects\empty-window\assets\aletheia-icon-simple.png`

Earlier detailed concept asset:

`C:\Users\jaeso\.cursor\projects\empty-window\assets\aletheia-icon.png`

Before Chrome Web Store submission, export final PNGs at:

- `16x16`
- `32x32`
- `48x48`
- `128x128`

