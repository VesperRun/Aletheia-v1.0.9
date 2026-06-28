# Icon Direction

## Preferred Draft

Simplified toolbar-friendly draft:

`C:\Users\jaeso\.cursor\projects\empty-window\assets\aletheia-icon-simple.png`

Earlier detailed draft (better as a splash/marketing graphic than a toolbar icon):

`C:\Users\jaeso\.cursor\projects\empty-window\assets\aletheia-icon.png`

Editable vector source:

`icons/aletheia-icon.svg`

Simplified editable vector source:

`icons/aletheia-icon-simple.svg`

## Concept

The icon should communicate:

- clarity through digital noise;
- local control;
- reading and truth-seeking;
- privacy and calm;
- intelligence without looking like a chatbot.

## Visual Language

Preferred elements:

- bold A-shaped symbol;
- eye / lens negative space;
- one clarity slash or aperture cue;
- high contrast at small sizes;
- rounded-square composition.

Preferred colors:

- midnight navy;
- teal;
- warm gold;
- white/cream highlight.

Avoid:

- book/page detail in the toolbar icon;
- robot heads;
- chatbot bubbles;
- generic AI sparkle overload;
- too much small detail at `16x16`;
- aggressive surveillance aesthetics.

## Required Export Sizes

For Chrome Web Store and `manifest.json`, export final PNGs:

- `icons/icon16.png`
- `icons/icon32.png`
- `icons/icon48.png`
- `icons/icon128.png`

Use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-icons.ps1
```

The script expects the preferred draft at:

`..\assets\aletheia-icon-simple.png`

If you prefer to export from the simplified vector source instead, install Inkscape and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-icons.ps1 -Source .\icons\aletheia-icon-simple.svg
```

After exports are added, update `manifest.json` with:

```json
"icons": {
  "16": "icons/icon16.png",
  "32": "icons/icon32.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

