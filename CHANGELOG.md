# Changelog

## 1.1.0

- Added a **minimal toolbar launcher** so clicking the Aletheia icon always shows UI; full controls stay on the page.
- **Rules & help** now opens Options via the background worker (fixes silent failure from content scripts).
- Fixed floating panel **boot race** — panel inits before the clarity engine; `ensureReady` + launcher retries for late page loads.
- Replaced the **Clarity** checkbox with explicit **Aletheia On / Off** on the floating panel.
- Launcher primary button reads **Minimize** when on-page controls are connected; **Minimize** uses the blue accent style.
- Fixed icon filenames (`icon16.png`, etc.), regenerated proper **16/32/48/128** sizes, and wired `icons` + `default_icon` in `manifest.json`.

## 1.0.9

- Simplified the floating panel to match the product vision: **Clarity** on/off, **This site** (Clarify / Default / Allow), **What changed?**, and **Show page as-is**.
- Added honest change tracking (hidden vs collapsed counts, broken down by summaries, clutter, site packs, and custom rules).
- **Show page as-is** pauses clarity for the current page only; restore anytime without changing saved site settings.
- SPA resilience: hooks `history.pushState` / `popstate` and retries after late page hydration (YouTube, Reddit, Google).
- Moved **My defaults** (clarity, summary panels, clutter) to the Options page.
- Added news site packs: NYT, BBC, CNN, Washington Post.

## 1.0.8

- Fixed **Extension context invalidated** errors after reloading the extension without refreshing open tabs.
- Storage calls now fail safely and prompt a one-time page refresh when needed.

## 1.0.7

- Removed the toolbar popup so only the in-page floating panel is used (no duplicate UI).
- Clicking the Aletheia toolbar icon now toggles the floating panel open or minimized.
- `popup/` files remain in the repo for reference; controls live on the page.

## 1.0.6

- **Clarify this page** now hides likely clutter entirely (not just collapse) for a cleaner view.
- Added local **site profiles** for Google, YouTube, and Reddit.
- Google clarify targets likely AI shells: AI Overview, **People also ask**, **Ask anything**, and related blocks.
- Uses conservative selectors plus heading/aria heuristics — not AI detection claims.

## 1.0.5

- Added a persistent in-page floating control panel that stays fixed while you scroll.
- Panel remains expanded until you deliberately choose **Minimize**; a small **Aletheia** pill restores it.
- Minimized state is remembered locally across pages via `chrome.storage.local`.
- Toolbar popup still works and will expand the on-page panel when opened.

## 1.0.4

- Simplified popup controls into independent site and default choices for summary panels and likely clutter.
- Changed the main popup button into a clarify/show toggle for the current site.
- Fixed local “Use my default” choices so they clear prior site-specific allow/hide/collapse choices.
- Added product-truth language: conservative by design, with restraint as part of trust.
- Removed the single site-wide setting from the active UI model.

## 1.0.3

- Added Texas-facing privacy and AI disclosures.
- Clarified local-first, near-zero-backend product posture.
- Added publisher-ready privacy documentation.
- Added launch and testing documentation.
- Added first icon direction asset.

## 1.0.2

- Improved reading layout behavior.
- Added keyboard shortcut support.
- Added custom rule import/export.
- Improved popup feedback.

## 1.0.0

- Initial Chrome Manifest V3 extension prototype.
- Added summary panel hiding, likely clutter collapsing, reading layout, per-site controls, and safe custom rules.

