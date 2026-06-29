(() => {
  const MARK = "data-aletheia-touch";
  const UI_ROOT_CLASS = "aletheia-float-root";
  const BTN_CLASS = "aletheia-expand-btn";
  const SHELL_CLASS = "aletheia-reading-shell";

  /** Heuristics only — matches common “summary” UI shells, not proof of AI. */
  const BUILTIN_SUMMARY_SELECTORS = [
    '[class*="ai-overview" i]',
    '[class*="ai_summary" i]',
    '[class*="ai-summary" i]',
    '[class*="summary-panel" i]',
    '[class*="tldr" i]',
    '[id*="ai-summary" i]',
    '[id*="ai_overview" i]',
    '[aria-label*="ai overview" i]',
    '[aria-label*="summary" i][role="region"]',
    '[data-testid*="summary" i]',
    '[data-test*="ai-summary" i]',
  ];

  /** “Likely clutter” — conservative, user can disable per site. */
  const BUILTIN_CLUTTER_SELECTORS = [
    'aside[class*="related" i]',
    'div[class*="related-stories" i]',
    'section[class*="related" i]',
    '[data-testid*="related" i]',
    '[aria-label*="related articles" i]',
  ];

  let settingsCache = null;
  let scheduled = 0;
  let observer = null;
  let storageListenerBound = false;
  let readingActive = false;
  let readingShell = null;
  let keyHandler = null;
  let sessionPaused = false;
  let spaHooksBound = false;
  let changeStats = emptyChangeStats();

  function emptyChangeStats() {
    return { hidden: 0, collapsed: 0, summaries: 0, clutter: 0, custom: 0, site: 0 };
  }

  function bucketReason(reason) {
    const r = String(reason || "");
    if (r.includes("summary") || r.includes("heading") || r.includes("aria")) return "summaries";
    if (r.startsWith("site-")) return "site";
    if (r.startsWith("user-")) return "custom";
    if (r.includes("clutter")) return "clutter";
    return "summaries";
  }

  function recordChange(kind, reason) {
    const bucket = bucketReason(reason);
    if (kind === "hide") changeStats.hidden += 1;
    else changeStats.collapsed += 1;
    changeStats[bucket] = (changeStats[bucket] || 0) + 1;
  }

  function disconnectObserver() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  }

  function bindObserver() {
    if (observer) return;
    if (readingActive) return;
    observer = new MutationObserver((mutations) => {
      const externalChange = mutations.some((mutation) => {
        const target = mutation.target;
        return !(target instanceof Element) || (!target.closest(`[${MARK}]`) && !target.closest(`.${BTN_CLASS}`) && !target.closest(`.${UI_ROOT_CLASS}`));
      });
      if (externalChange) scheduleApply();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
  }

  function hostname() {
    try {
      if (location.protocol === "file:") return "__local_file__";
      return String(location.hostname || "").toLowerCase();
    } catch {
      return "";
    }
  }

  function effectiveForHost(h, settings) {
    if (!Boolean(settings.global?.clarityEnabled ?? true)) {
      return {
        active: false,
        hideSummaries: false,
        collapseClutter: false,
        hideClutter: false,
        clutterMode: "off",
      };
    }

    const g = settings.global;
    const entry = settings.sites[h] || {};
    const summaryPanels = entry.summaryPanels || "default";
    const likelyClutter = entry.likelyClutter || "default";

    const hideSummaries =
      summaryPanels === "hide" ? true : summaryPanels === "allow" ? false : Boolean(g.hideSummaries);

    const collapseClutter =
      likelyClutter === "collapse"
        ? true
        : likelyClutter === "hide"
          ? false
          : likelyClutter === "allow"
            ? false
            : Boolean(g.collapseClutter);

    const hideClutter =
      likelyClutter === "hide" ? true : likelyClutter === "allow" ? false : false;

    let clutterMode = "off";
    if (hideClutter) clutterMode = "hide";
    else if (collapseClutter) clutterMode = "collapse";

    return {
      active: hideSummaries || clutterMode !== "off",
      hideSummaries,
      collapseClutter,
      hideClutter,
      clutterMode,
    };
  }

  function hostMatchesRuleHost(ruleHost, h) {
    if (!ruleHost || ruleHost === "*") return true;
    if (ruleHost === h) return true;
    if (ruleHost.startsWith("*.")) {
      const suf = ruleHost.slice(1);
      return h.endsWith(suf);
    }
    return false;
  }

  function clearAletheiaUi() {
    document.querySelectorAll(`[${MARK}]`).forEach((el) => {
      el.removeAttribute(MARK);
      el.classList.remove("aletheia-hidden", "aletheia-collapsed");
    });
    document.querySelectorAll(`.${BTN_CLASS}`).forEach((n) => n.remove());
  }

  function resetExpandedClutter() {
    document.querySelectorAll("[data-aletheia-expanded]").forEach((el) => {
      el.removeAttribute("data-aletheia-expanded");
    });
  }

  function exitReadingMode() {
    if (keyHandler) {
      window.removeEventListener("keydown", keyHandler, true);
      keyHandler = null;
    }
    readingActive = false;
    document.documentElement.classList.remove("aletheia-reading");
    if (readingShell && readingShell.parentNode) {
      readingShell.parentNode.removeChild(readingShell);
    }
    readingShell = null;
    globalThis.AletheiaFloatingPanel?.setVisible(true);
    bindObserver();
  }

  function isLikelyHidden(el) {
    if (!el || !(el instanceof Element)) return true;
    if (el.closest(`.${SHELL_CLASS}`)) return true;
    try {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return true;
    } catch {
      return true;
    }
    if (el.getAttribute("aria-hidden") === "true") return true;
    if (el.closest("[hidden]")) return true;
    return false;
  }

  function visibleArea(el) {
    const r = el.getBoundingClientRect();
    return Math.max(0, r.width) * Math.max(0, r.height);
  }

  function isValidReadingRoot(el) {
    if (!el || !(el instanceof Element)) return false;
    if (el === document.body || el === document.documentElement) return false;
    if (!el.isConnected) return false;
    if (el.closest(`.${UI_ROOT_CLASS}`) || el.closest(`.${SHELL_CLASS}`)) return false;
    return true;
  }

  function sanitizeReadingClone(clone) {
    if (!(clone instanceof Element)) return clone;
    for (const node of clone.querySelectorAll("script, iframe, object, embed")) {
      node.remove();
    }
    return clone;
  }

  function mountReadingShell(shell) {
    const mount = document.body;
    if (!mount || !(mount instanceof Element)) return false;
    try {
      if (typeof mount.prepend === "function") {
        mount.prepend(shell);
        return mount.contains(shell);
      }
    } catch {
      /* try fallback */
    }
    try {
      mount.insertBefore(shell, mount.firstChild);
      return mount.contains(shell);
    } catch {
      try {
        mount.appendChild(shell);
        return mount.contains(shell);
      } catch {
        return false;
      }
    }
  }

  function scoreReadingCandidate(el) {
    if (isLikelyHidden(el)) return -1;
    const text = (el.innerText || "").trim();
    if (text.length < 220) return -1;
    const area = visibleArea(el);
    if (area < 1600) return -1;
    const links = el.querySelectorAll("a").length;
    const linkRatio = links / Math.max(1, text.length / 90);
    if (linkRatio > 0.48) return -1;
    return text.length * Math.log10(area + 10);
  }

  function pickReadingRoot() {
    const selectors = ["article", '[role="main"]', "main", '[itemprop="articleBody"]'];
    let best = null;
    let bestScore = -1;
    for (const sel of selectors) {
      for (const el of queryAllSafe(sel)) {
        if (!isValidReadingRoot(el)) continue;
        const s = scoreReadingCandidate(el);
        if (s > bestScore) {
          bestScore = s;
          best = el;
        }
      }
    }
    if (best) return best;
    return bestParagraphContainer();
  }

  function bestParagraphContainer() {
    const ps = Array.from(document.querySelectorAll("p"));
    let best = null;
    let bestScore = -1;
    const seen = new Set();
    for (const p of ps) {
      if (!p.textContent || p.textContent.trim().length < 120) continue;
      let n = p.parentElement;
      let depth = 0;
      while (n && n !== document.body && depth < 8) {
        if (seen.has(n)) break;
        seen.add(n);
        if (!isValidReadingRoot(n)) {
          n = n.parentElement;
          depth += 1;
          continue;
        }
        const s = scoreReadingCandidate(n);
        if (s > bestScore) {
          bestScore = s;
          best = n;
        }
        n = n.parentElement;
        depth += 1;
      }
    }
    return best;
  }

  function enterReadingMode() {
    exitReadingMode();
    if (!document.body) {
      notify("Aletheia needs a normal HTML page to use reading layout here.");
      return;
    }

    const root = pickReadingRoot();
    if (!root || !isValidReadingRoot(root)) {
      notify("Aletheia could not find a comfortable reading block on this page.");
      return;
    }

    disconnectObserver();
    globalThis.AletheiaFloatingPanel?.setVisible(false);

    try {
      const shell = document.createElement("div");
      shell.className = SHELL_CLASS;
      shell.setAttribute(MARK, "reading-shell");

      const bar = document.createElement("div");
      bar.className = "aletheia-reading-bar";

      const title = document.createElement("div");
      title.className = "aletheia-reading-title";
      const docTitle = (document.title || "").trim();
      title.textContent = docTitle ? `Reading layout · ${docTitle}` : "Reading layout (local-only)";

      const exit = document.createElement("button");
      exit.type = "button";
      exit.className = "aletheia-reading-exit";
      exit.textContent = "Exit reading layout";
      exit.addEventListener("click", () => exitReadingMode());

      bar.appendChild(title);
      bar.appendChild(exit);

      const inner = document.createElement("div");
      inner.className = "aletheia-reading-inner";
      inner.appendChild(sanitizeReadingClone(root.cloneNode(true)));

      shell.appendChild(bar);
      shell.appendChild(inner);

      if (!mountReadingShell(shell)) {
        notify("Aletheia could not open reading layout on this page.");
        globalThis.AletheiaFloatingPanel?.setVisible(true);
        return;
      }

      document.documentElement.classList.add("aletheia-reading");
      readingShell = shell;
      readingActive = true;

      keyHandler = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          exitReadingMode();
        }
      };
      window.addEventListener("keydown", keyHandler, true);
    } catch {
      exitReadingMode();
      globalThis.AletheiaFloatingPanel?.setVisible(true);
      notify("Aletheia could not open reading layout on this page.");
    }
  }

  function notify(message) {
    const n = document.createElement("div");
    n.setAttribute(MARK, "toast");
    n.textContent = message;
    n.style.cssText = [
      "all:initial",
      "position:fixed",
      "left:50%",
      "bottom:1.25rem",
      "transform:translateX(-50%)",
      "z-index:2147483647",
      "max-width:min(520px,92vw)",
      "padding:0.65rem 0.85rem",
      "border-radius:0.5rem",
      "font:600 13px/1.35 system-ui,sans-serif",
      "color:CanvasText",
      "background:Canvas",
      "border:1px solid color-mix(in srgb,CanvasText 20%,transparent)",
      "box-shadow:0 8px 30px rgba(0,0,0,0.12)",
    ].join(";");
    (document.body || document.documentElement).appendChild(n);
    setTimeout(() => {
      if (n.parentNode) n.parentNode.removeChild(n);
    }, 4200);
  }

  function ensureCollapseButton(container) {
    if (!container || container.querySelector(`:scope > .${BTN_CLASS}`)) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = BTN_CLASS;
    btn.textContent = "Show section";
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const nowCollapsed = container.classList.toggle("aletheia-collapsed");
      btn.setAttribute("aria-expanded", nowCollapsed ? "false" : "true");
      btn.textContent = nowCollapsed ? "Show section" : "Hide section";
      container.toggleAttribute("data-aletheia-expanded", !nowCollapsed);
    });
    container.prepend(btn);
  }

  function applyHide(el, reason) {
    if (!el || el.closest(`.${SHELL_CLASS}`) || el.closest(`.${UI_ROOT_CLASS}`)) return;
    const already = el.classList.contains("aletheia-hidden");
    el.setAttribute(MARK, reason);
    el.classList.add("aletheia-hidden");
    if (!already) recordChange("hide", reason);
  }

  function applyCollapse(el, reason) {
    if (!el || el.closest(`.${SHELL_CLASS}`) || el.closest(`.${UI_ROOT_CLASS}`)) return;
    const already = el.classList.contains("aletheia-collapsed");
    el.setAttribute(MARK, reason);
    if (el.hasAttribute("data-aletheia-expanded")) {
      ensureCollapseButton(el);
      return;
    }
    el.classList.add("aletheia-collapsed");
    ensureCollapseButton(el);
    if (!already) recordChange("collapse", reason);
  }

  function queryAllSafe(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  function applyCustomRules(settings, h, eff) {
    if (!eff.active) return;
    for (const rule of settings.customRules || []) {
      if (!hostMatchesRuleHost(String(rule.host || "").toLowerCase(), h)) continue;
      for (const sel of rule.selectors || []) {
        const v = globalThis.AletheiaSelectors?.validateUserSelector?.(sel);
        if (!v || !v.ok) continue;
        const els = queryAllSafe(v.selector);
        for (const el of els) {
          if (rule.action === "collapse") applyCollapse(el, "user-collapse");
          else applyHide(el, "user-hide");
        }
      }
    }
  }

  function applyBuiltins(eff) {
    if (eff.hideSummaries) {
      for (const sel of BUILTIN_SUMMARY_SELECTORS) {
        for (const el of queryAllSafe(sel)) {
          applyHide(el, "summary-panel");
        }
      }
    }
    if (eff.clutterMode === "hide") {
      for (const sel of BUILTIN_CLUTTER_SELECTORS) {
        for (const el of queryAllSafe(sel)) {
          applyHide(el, "clutter-hide");
        }
      }
    } else if (eff.clutterMode === "collapse") {
      for (const sel of BUILTIN_CLUTTER_SELECTORS) {
        for (const el of queryAllSafe(sel)) {
          applyCollapse(el, "clutter");
        }
      }
    }
  }

  function applySiteProfiles(eff, h) {
    const profiles = globalThis.AletheiaSiteProfiles?.profileForHost?.(h) || [];
    if (!profiles.length) return;
    globalThis.AletheiaSiteProfiles.applyProfiles(profiles, eff, {
      queryAll: queryAllSafe,
      applyHide,
      applyCollapse,
    });
  }

  async function refreshSettings() {
    settingsCache = await globalThis.AletheiaStorage.loadSettings();
    return settingsCache;
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = window.requestAnimationFrame(() => {
      scheduled = 0;
      window.setTimeout(() => {
        applyNow().catch(() => {
          /* ignore */
        });
      }, 120);
    });
  }

  async function applyNow() {
    const settings = settingsCache || (await refreshSettings());
    const h = hostname();
    const eff = effectiveForHost(h, settings);

    if (readingActive) {
      return;
    }

    clearAletheiaUi();
    changeStats = emptyChangeStats();

    if (sessionPaused || !eff.active) {
      globalThis.AletheiaPageClarity?.onStatsChanged?.(changeStats);
      if (!sessionPaused) {
        applyCustomRules(settings, h, { active: true });
      }
      return;
    }

    applyBuiltins(eff);
    applySiteProfiles(eff, h);
    applyCustomRules(settings, h, eff);
    globalThis.AletheiaPageClarity?.onStatsChanged?.(changeStats);
  }

  function pauseSessionClarity() {
    sessionPaused = true;
    document.documentElement.setAttribute("data-aletheia-session-pause", "1");
    clearAletheiaUi();
    changeStats = emptyChangeStats();
    globalThis.AletheiaPageClarity?.onStatsChanged?.(changeStats);
  }

  function resumeSessionClarity() {
    sessionPaused = false;
    document.documentElement.removeAttribute("data-aletheia-session-pause");
    applyNow().catch(() => {
      /* ignore */
    });
  }

  function bindSpaHooks() {
    if (spaHooksBound) return;
    spaHooksBound = true;
    window.addEventListener("popstate", scheduleApply);
    const wrap = (original) =>
      function historyHook(...args) {
        const result = original.apply(this, args);
        scheduleApply();
        return result;
      };
    try {
      history.pushState = wrap(history.pushState);
      history.replaceState = wrap(history.replaceState);
    } catch {
      /* read-only history in some contexts */
    }
    for (const delay of [800, 2000, 4500]) {
      window.setTimeout(() => scheduleApply(), delay);
    }
  }

  function bindStorageListener() {
    if (storageListenerBound) return;
    if (!globalThis.AletheiaStorage?.isContextValid?.()) return;
    storageListenerBound = true;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (!globalThis.AletheiaStorage?.isContextValid?.()) return;
      if (area !== "local") return;
      if (!changes[globalThis.AletheiaStorage.STORAGE_KEY]) return;
      settingsCache = null;
      resetExpandedClutter();
      scheduleApply();
    });
  }

  function bindMessageListener() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "ALETHEIA_PING") {
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "ALETHEIA_GET_STATUS") {
        const h = hostname();
        const s = settingsCache;
        if (!s) {
          refreshSettings().then((fresh) => {
            sendResponse({ ok: true, hostname: h, effective: effectiveForHost(h, fresh), settings: fresh });
          });
          return true;
        }
        sendResponse({ ok: true, hostname: h, effective: effectiveForHost(h, s), settings: s });
        return true;
      }
      if (msg.type === "ALETHEIA_TOGGLE_READING") {
        if (readingShell) exitReadingMode();
        else enterReadingMode();
        sendResponse({ ok: true, readingActive: Boolean(readingShell) });
        return true;
      }
      if (msg.type === "ALETHEIA_EXIT_READING") {
        exitReadingMode();
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "ALETHEIA_SHOW_PANEL") {
        (async () => {
          await globalThis.AletheiaFloatingPanel?.ensureReady?.();
          globalThis.AletheiaFloatingPanel?.showExpanded();
          sendResponse({ ok: true });
        })();
        return true;
      }
      if (msg.type === "ALETHEIA_TOGGLE_PANEL") {
        (async () => {
          await globalThis.AletheiaFloatingPanel?.ensureReady?.();
          globalThis.AletheiaFloatingPanel?.togglePanel();
          sendResponse({ ok: true });
        })();
        return true;
      }
      if (msg.type === "ALETHEIA_REAPPLY") {
        settingsCache = null;
        applyNow()
          .then(() => sendResponse({ ok: true }))
          .catch(() => sendResponse({ ok: false }));
        return true;
      }
      if (msg.type === "ALETHEIA_SESSION_PAUSE") {
        pauseSessionClarity();
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "ALETHEIA_SESSION_RESUME") {
        resumeSessionClarity();
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "ALETHEIA_GET_CHANGES") {
        sendResponse({ ok: true, stats: changeStats, sessionPaused });
        return true;
      }
      return undefined;
    });
  }

  globalThis.AletheiaPageClarity = {
    reapply: () => applyNow(),
    getChangeStats: () => ({ ...changeStats, sessionPaused }),
    pauseSession: pauseSessionClarity,
    resumeSession: resumeSessionClarity,
    onStatsChanged: null,
  };

  async function boot() {
    if (window.top !== window) return;
    if (document.documentElement.hasAttribute("data-aletheia-boot")) return;

    if (!document.body) {
      await new Promise((resolve) => {
        if (document.body) resolve();
        else document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
      });
    }
    if (!document.body) return;
    if (document.documentElement.hasAttribute("data-aletheia-boot")) return;

    document.documentElement.setAttribute("data-aletheia-boot", "1");

    document.addEventListener(
      "aletheia-context-invalidated",
      () => {
        notify("Aletheia was updated. Refresh this page to reconnect.");
      },
      { once: true }
    );

    await refreshSettings();
    bindMessageListener();
    if (globalThis.AletheiaFloatingPanel) {
      await globalThis.AletheiaFloatingPanel.init();
    }
    await applyNow();
    bindObserver();
    bindSpaHooks();
    bindStorageListener();
  }

  boot().catch(() => {
    /* no-op: keep page untouched on failure */
  });
})();
