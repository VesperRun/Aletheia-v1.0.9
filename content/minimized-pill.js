/* Copyright (c) 2026 VesperRun. All rights reserved. */
/* Proprietary — Aletheia local-first Chrome extension. */

function aletheiaExpandFloatingPanel() {
  try {
    parent.postMessage({ type: "ALETHEIA_EXPAND_FLOATING_PANEL" }, "*");
  } catch {
    /* parent gone */
  }
}

const pillHit = document.getElementById("pill-hit");
if (pillHit) {
  pillHit.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    aletheiaExpandFloatingPanel();
  });
  pillHit.addEventListener("click", (event) => {
    event.preventDefault();
    aletheiaExpandFloatingPanel();
  });
}
