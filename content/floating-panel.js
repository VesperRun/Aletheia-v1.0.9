/**
 * Aletheia floating panel — simplified in-page controls (local-only).
 */
(function initAletheiaFloatingPanel(global) {
  const ROOT_CLASS = "aletheia-float-root";
  const UI_MARK = "data-aletheia-ui";

  let rootEl = null;
  let pillEl = null;
  let panelEl = null;
  let statusEl = null;
  let hostLabelEl = null;
  let aletheiaPowerGroup = null;
  let powerHintEl = null;
  let siteModeGroup = null;
  let changesDrawer = null;
  let changesBody = null;
  let showAsIsBtn = null;
  let changesBtn = null;

  let minimized = false;
  let visible = true;
  let currentHost = "";
  let changesOpen = false;
  let sessionPaused = false;

  function hostname() {
    try {
      if (location.protocol === "file:") return "__local_file__";
      return String(location.hostname || "").toLowerCase();
    } catch {
      return "";
    }
  }

  function labelHost(key) {
    if (key === "__local_file__") return "local file";
    return key || "this page";
  }

  function readSite(settings, host) {
    return settings.sites?.[host] || {};
  }

  function detectSiteMode(settings, host) {
    const site = readSite(settings, host);
    const sp = site.summaryPanels || "default";
    const lc = site.likelyClutter || "default";
    if (sp === "allow" && lc === "allow") return "allow";
    if (sp === "hide" && lc === "hide") return "clarify";
    if (!site.summaryPanels && !site.likelyClutter) return "default";
    if (sp === "hide" || lc === "hide") return "clarify";
    return "default";
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  async function persistGlobal(patch) {
    const settings = await global.AletheiaStorage.loadSettings();
    await global.AletheiaStorage.saveSettings({
      global: { ...settings.global, ...patch },
    });
    await refresh();
    await global.AletheiaPageClarity?.reapply?.();
    setStatus("");
  }

  async function persistSiteMode(mode) {
    const settings = await global.AletheiaStorage.loadSettings();
    const nextSites = { ...settings.sites };

    if (mode === "clarify") {
      nextSites[currentHost] = { summaryPanels: "hide", likelyClutter: "hide" };
    } else if (mode === "allow") {
      nextSites[currentHost] = { summaryPanels: "allow", likelyClutter: "allow" };
    } else {
      delete nextSites[currentHost];
    }

    await global.AletheiaStorage.saveSettings({ sites: nextSites });
    await refresh();
    await global.AletheiaPageClarity?.reapply?.();
  }

  async function persistMinimized(next) {
    minimized = Boolean(next);
    const settings = await global.AletheiaStorage.loadSettings();
    await global.AletheiaStorage.saveSettings({
      ui: { ...(settings.ui || {}), floatingPanelMinimized: minimized },
    });
    applyChromeState();
  }

  function applyChromeState() {
    if (!rootEl) return;
    rootEl.classList.toggle("is-minimized", minimized);
    rootEl.classList.toggle("is-hidden", !visible);
    rootEl.setAttribute("aria-hidden", !visible ? "true" : minimized ? "true" : "false");
    if (pillEl) pillEl.setAttribute("aria-expanded", minimized ? "false" : "true");
  }

  function formatChanges(stats) {
    const hidden = stats?.hidden || 0;
    const collapsed = stats?.collapsed || 0;
    const total = hidden + collapsed;
    if (sessionPaused) {
      return "Clarity is paused for this page. Nothing is hidden right now.";
    }
    if (!total) {
      return "Nothing hidden or collapsed on this view yet. Aletheia only acts on likely summary panels and clutter it recognizes.";
    }
    const lines = [];
    lines.push(`${hidden} hidden · ${collapsed} collapsed`);
    const parts = [];
    if (stats.summaries) parts.push(`${stats.summaries} summary panels`);
    if (stats.clutter) parts.push(`${stats.clutter} likely clutter`);
    if (stats.site) parts.push(`${stats.site} site pack matches`);
    if (stats.custom) parts.push(`${stats.custom} custom rules`);
    if (parts.length) lines.push(parts.join(" · "));
    return lines.join("\n");
  }

  function renderChanges(stats) {
    if (!changesBody) return;
    changesBody.textContent = formatChanges(stats || global.AletheiaPageClarity?.getChangeStats?.() || {});
  }

  function syncAletheiaPower(clarityOn) {
    if (!aletheiaPowerGroup) return;
    const mode = clarityOn ? "on" : "off";
    for (const btn of aletheiaPowerGroup.querySelectorAll("[data-aletheia-power]")) {
      const active = btn.getAttribute("data-aletheia-power") === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (powerHintEl) powerHintEl.hidden = clarityOn;
  }

  function syncSiteModeButtons(mode) {
    if (!siteModeGroup) return;
    for (const btn of siteModeGroup.querySelectorAll("[data-site-mode]")) {
      const active = btn.getAttribute("data-site-mode") === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function syncSessionButton() {
    if (!showAsIsBtn) return;
    showAsIsBtn.textContent = sessionPaused ? "Restore clarity on this page" : "Show page as-is";
    showAsIsBtn.classList.toggle("is-active", sessionPaused);
  }

  async function refresh() {
    if (!panelEl) return;
    const settings = await global.AletheiaStorage.loadSettings();
    currentHost = hostname();
    if (hostLabelEl) hostLabelEl.textContent = labelHost(currentHost);

    const clarityOn = Boolean(settings.global?.clarityEnabled ?? true);
    syncAletheiaPower(clarityOn);

    syncSiteModeButtons(detectSiteMode(settings, currentHost));

    const stats = global.AletheiaPageClarity?.getChangeStats?.();
    sessionPaused = Boolean(stats?.sessionPaused);
    syncSessionButton();
    renderChanges(stats);

    if (siteModeGroup) {
      siteModeGroup.classList.toggle("is-disabled", !clarityOn);
    }
    if (changesBtn) changesBtn.disabled = !clarityOn;
    if (showAsIsBtn) showAsIsBtn.disabled = !clarityOn && !sessionPaused;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildPowerSegment() {
    const wrap = el("div", "aletheia-float-segment-wrap");
    wrap.appendChild(el("div", "aletheia-float-segment-label", "Aletheia"));
    const group = el("div", "aletheia-float-segment");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Turn Aletheia on or off");

    for (const opt of [
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ]) {
      const btn = el("button", "aletheia-float-segment-btn", opt.label);
      btn.type = "button";
      btn.setAttribute("data-aletheia-power", opt.value);
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", async () => {
        const nextOn = opt.value === "on";
        await persistGlobal({ clarityEnabled: nextOn });
        setStatus(
          nextOn
            ? "Aletheia is on."
            : "Aletheia is off. Pages stay untouched until you turn it back on."
        );
      });
      group.appendChild(btn);
    }

    wrap.appendChild(group);
    powerHintEl = el(
      "p",
      "aletheia-float-hint",
      "Aletheia is off. Nothing on this page will change."
    );
    powerHintEl.hidden = true;
    wrap.appendChild(powerHintEl);
    return { wrap, group };
  }

  function buildSegment(labelText, name, options) {
    const wrap = el("div", "aletheia-float-segment-wrap");
    wrap.appendChild(el("div", "aletheia-float-segment-label", labelText));
    const group = el("div", "aletheia-float-segment");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", labelText);

    for (const opt of options) {
      const btn = el("button", "aletheia-float-segment-btn", opt.label);
      btn.type = "button";
      btn.setAttribute("data-site-mode", opt.value);
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", async () => {
        await persistSiteMode(opt.value);
        setStatus(
          opt.value === "clarify"
            ? "This site will stay clarified."
            : opt.value === "allow"
              ? "This site will stay untouched."
              : "Using your defaults on this site."
        );
      });
      group.appendChild(btn);
    }

    wrap.appendChild(group);
    return { wrap, group };
  }

  function buildUi() {
    if (rootEl) return;

    rootEl = el("div", ROOT_CLASS);
    rootEl.setAttribute(UI_MARK, "floating-panel");
    rootEl.setAttribute("role", "region");
    rootEl.setAttribute("aria-label", "Aletheia clarity controls");

    pillEl = el("button", "aletheia-float-pill", "Aletheia");
    pillEl.type = "button";
    pillEl.title = "Show Aletheia controls";
    pillEl.addEventListener("click", () => persistMinimized(false));

    panelEl = el("div", "aletheia-float-panel");

    const header = el("div", "aletheia-float-header");
    const brand = el("div", "aletheia-float-brand");
    brand.appendChild(el("div", "aletheia-float-name", "Aletheia"));
    brand.appendChild(el("div", "aletheia-float-tag", "Quiet the noisy web · local-only"));
    hostLabelEl = el("div", "aletheia-float-host", "—");
    brand.appendChild(hostLabelEl);

    const minimizeBtn = el("button", "aletheia-float-minimize", "Minimize");
    minimizeBtn.type = "button";
    minimizeBtn.title = "Minimize until you open again";
    minimizeBtn.addEventListener("click", () => persistMinimized(true));

    header.appendChild(brand);
    header.appendChild(minimizeBtn);

    const body = el("div", "aletheia-float-body");

    const powerSegment = buildPowerSegment();
    aletheiaPowerGroup = powerSegment.group;
    body.appendChild(powerSegment.wrap);

    const siteSegment = buildSegment("This site", "site-mode", [
      { value: "clarify", label: "Clarify" },
      { value: "default", label: "Default" },
      { value: "allow", label: "Allow" },
    ]);
    siteModeGroup = siteSegment.group;
    body.appendChild(siteSegment.wrap);

    const utilityRow = el("div", "aletheia-float-utility");
    changesBtn = el("button", "aletheia-float-ghost aletheia-float-utility-btn", "What changed?");
    changesBtn.type = "button";
    showAsIsBtn = el("button", "aletheia-float-ghost aletheia-float-utility-btn", "Show page as-is");
    showAsIsBtn.type = "button";
    utilityRow.appendChild(changesBtn);
    utilityRow.appendChild(showAsIsBtn);
    body.appendChild(utilityRow);

    changesDrawer = el("div", "aletheia-float-changes");
    changesDrawer.hidden = true;
    changesBody = el("div", "aletheia-float-changes-body");
    changesDrawer.appendChild(changesBody);
    body.appendChild(changesDrawer);

    const actions = el("div", "aletheia-float-actions");
    const optionsBtn = el("button", "aletheia-float-primary", "Rules & help");
    optionsBtn.type = "button";
    actions.appendChild(optionsBtn);
    body.appendChild(actions);

    statusEl = el("p", "aletheia-float-status");
    statusEl.setAttribute("aria-live", "polite");
    body.appendChild(statusEl);

    body.appendChild(
      el(
        "p",
        "aletheia-float-foot",
        "For the people: no user data is collected or sent. Ever. Click the Aletheia toolbar icon to show or tuck controls."
      )
    );

    panelEl.appendChild(header);
    panelEl.appendChild(body);
    rootEl.appendChild(pillEl);
    rootEl.appendChild(panelEl);

    changesBtn.addEventListener("click", () => {
      changesOpen = !changesOpen;
      changesDrawer.hidden = !changesOpen;
      changesBtn.setAttribute("aria-expanded", changesOpen ? "true" : "false");
      renderChanges(global.AletheiaPageClarity?.getChangeStats?.());
    });

    showAsIsBtn.addEventListener("click", async () => {
      if (sessionPaused) {
        global.AletheiaPageClarity?.resumeSession?.();
        sessionPaused = false;
        setStatus("Clarity restored for this page.");
      } else {
        global.AletheiaPageClarity?.pauseSession?.();
        sessionPaused = true;
        setStatus("Showing this page as-is for now.");
      }
      syncSessionButton();
      renderChanges(global.AletheiaPageClarity?.getChangeStats?.());
    });

    optionsBtn.addEventListener("click", () => {
      try {
        if (!global.AletheiaStorage?.isContextValid?.()) {
          setStatus("Refresh this page, then open Rules & help again.");
          return;
        }
        chrome.runtime.sendMessage({ type: "ALETHEIA_OPEN_OPTIONS" }, (response) => {
          if (chrome.runtime.lastError) {
            setStatus(
              "Could not open Rules & help. Use chrome://extensions → Aletheia → Extension options."
            );
            return;
          }
          if (!response?.ok) {
            setStatus(
              "Could not open Rules & help. Use chrome://extensions → Aletheia → Extension options."
            );
          }
        });
      } catch {
        setStatus("Refresh this page, then open Rules & help again.");
      }
    });

    (document.body || document.documentElement).appendChild(rootEl);
  }

  function bindStatsListener() {
    if (!global.AletheiaPageClarity) return;
    global.AletheiaPageClarity.onStatsChanged = (stats) => {
      sessionPaused = Boolean(stats?.sessionPaused);
      syncSessionButton();
      if (changesOpen) renderChanges(stats);
    };
  }

  function bindStorageListener() {
    if (!global.AletheiaStorage?.isContextValid?.()) return;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (!global.AletheiaStorage?.isContextValid?.()) return;
      if (area !== "local") return;
      if (!changes[global.AletheiaStorage.STORAGE_KEY]) return;
      global.AletheiaStorage.loadSettings().then((settings) => {
        minimized = Boolean(settings.ui?.floatingPanelMinimized);
        applyChromeState();
        refresh();
      });
    });
  }

  async function ensureReady() {
    if (window.top !== window) return false;
    if (!document.body) return false;
    if (rootEl) return true;

    buildUi();
    bindStatsListener();
    const settings = await global.AletheiaStorage.loadSettings();
    minimized = Boolean(settings.ui?.floatingPanelMinimized);
    await refresh();
    applyChromeState();
    bindStorageListener();
    return true;
  }

  async function init() {
    await ensureReady();
  }

  function setVisible(next) {
    visible = Boolean(next);
    applyChromeState();
  }

  function showExpanded() {
    ensureReady().then((ready) => {
      if (!ready) return;
      visible = true;
      minimized = false;
      applyChromeState();
      persistMinimized(false);
    });
  }

  function togglePanel() {
    ensureReady().then((ready) => {
      if (!ready) return;
      if (!visible || minimized) {
        visible = true;
        minimized = false;
        applyChromeState();
        persistMinimized(false);
        return;
      }
      persistMinimized(true);
    });
  }

  global.AletheiaFloatingPanel = {
    init,
    ensureReady,
    refresh,
    setVisible,
    showExpanded,
    togglePanel,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
