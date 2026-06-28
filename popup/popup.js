(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    restricted: $("restricted"),
    main: $("main"),
    hostLabel: $("hostLabel"),
    summaryPolicy: $("summaryPolicy"),
    clutterPolicy: $("clutterPolicy"),
    globalHideSummaries: $("globalHideSummaries"),
    globalCollapseClutter: $("globalCollapseClutter"),
    clarifyToggle: $("clarifyToggle"),
    siteReset: $("siteReset"),
    openOptions: $("openOptions"),
    popupStatus: $("popupStatus"),
    readingShortcut: $("readingShortcut"),
  };

  let currentHost = "";

  function setPopupStatus(text) {
    if (els.popupStatus) els.popupStatus.textContent = text || "";
  }

  function isRestrictedUrl(url) {
    if (!url) return true;
    return (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("devtools://") ||
      url.startsWith("view-source:")
    );
  }

  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function siteKeyFromUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "file:") return "__local_file__";
      return parsed.hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  function labelFromSiteKey(key) {
    if (key === "__local_file__") return "local file";
    return key || "unknown host";
  }

  function readSite(settings, host) {
    return settings.sites?.[host] || {};
  }

  async function load() {
    const tab = await activeTab();
    const url = tab?.url || "";
    if (!tab?.id || isRestrictedUrl(url)) {
      els.restricted.style.display = "block";
      els.main.style.display = "none";
      return;
    }

    els.restricted.style.display = "none";
    els.main.style.display = "block";

    currentHost = siteKeyFromUrl(url);
    els.hostLabel.textContent = labelFromSiteKey(currentHost);

    const settings = await AletheiaStorage.loadSettings();
    render(settings);
    setPopupStatus("");
    await hydrateShortcutLabel();
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "ALETHEIA_SHOW_PANEL" });
    } catch {
      /* Content script may not be ready yet — refresh the tab once. */
    }
  }

  async function hydrateShortcutLabel() {
    if (!els.readingShortcut) return;
    try {
      const cmds = await chrome.commands.getAll();
      const cmd = cmds.find((c) => c.name === "aletheia_toggle_reading");
      if (cmd?.shortcut) els.readingShortcut.textContent = cmd.shortcut;
    } catch {
      /* ignore */
    }
  }

  function render(settings) {
    const site = readSite(settings, currentHost);
    els.summaryPolicy.value = site.summaryPanels || "default";
    els.clutterPolicy.value = site.likelyClutter || "default";

    els.globalHideSummaries.checked = Boolean(settings.global.hideSummaries);
    els.globalCollapseClutter.checked = Boolean(settings.global.collapseClutter);
    els.clarifyToggle.textContent = isClarified(settings) ? "Show this page as-is" : "Clarify this page";
  }

  function isClarified(settings) {
    const site = readSite(settings, currentHost);
    const summariesHidden =
      site.summaryPanels === "hide" || (site.summaryPanels !== "allow" && Boolean(settings.global.hideSummaries));
    const clutterClarified =
      site.likelyClutter === "hide" ||
      site.likelyClutter === "collapse" ||
      (site.likelyClutter !== "allow" && Boolean(settings.global.collapseClutter));
    return summariesHidden || clutterClarified;
  }

  async function persistGlobal(patch) {
    await AletheiaStorage.saveSettings({ global: { ...(await AletheiaStorage.loadSettings()).global, ...patch } });
    await load();
  }

  async function persistSitePatch(patch) {
    const settings = await AletheiaStorage.loadSettings();
    const nextSites = { ...settings.sites };
    const nextEntry = { ...readSite(settings, currentHost), ...patch };

    for (const key of Object.keys(nextEntry)) {
      if (nextEntry[key] == null || nextEntry[key] === "default") delete nextEntry[key];
    }

    if (Object.keys(nextEntry).length) {
      nextSites[currentHost] = nextEntry;
    } else {
      delete nextSites[currentHost];
    }

    await AletheiaStorage.saveSettings({ sites: nextSites });
    await load();
  }

  els.summaryPolicy.addEventListener("change", async () => {
    await persistSitePatch({ summaryPanels: els.summaryPolicy.value });
  });

  els.clutterPolicy.addEventListener("change", async () => {
    await persistSitePatch({ likelyClutter: els.clutterPolicy.value });
  });

  els.globalHideSummaries.addEventListener("change", async () => {
    await persistGlobal({ hideSummaries: els.globalHideSummaries.checked });
  });

  els.globalCollapseClutter.addEventListener("change", async () => {
    await persistGlobal({ collapseClutter: els.globalCollapseClutter.checked });
  });

  els.siteReset.addEventListener("click", async () => {
    const settings = await AletheiaStorage.loadSettings();
    const nextSites = { ...settings.sites };
    const hadSiteOverride = Boolean(nextSites[currentHost]);
    delete nextSites[currentHost];
    els.summaryPolicy.value = "default";
    els.clutterPolicy.value = "default";
    await AletheiaStorage.saveSettings({ sites: nextSites });
    await load();
    setPopupStatus(hadSiteOverride ? "Site choices cleared. Your defaults now apply." : "No site choices to reset. Your defaults already apply.");
  });

  els.clarifyToggle.addEventListener("click", async () => {
    const settings = await AletheiaStorage.loadSettings();
    const nextPatch = isClarified(settings)
      ? { summaryPanels: "allow", likelyClutter: "allow" }
      : { summaryPanels: "hide", likelyClutter: "hide" };

    await persistSitePatch(nextPatch);
    try {
      const tab = await activeTab();
      if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "ALETHEIA_REAPPLY" });
    } catch {
      /* Content script may not be ready yet. */
    }
    setPopupStatus(isClarified(await AletheiaStorage.loadSettings()) ? "Page clarified for this site." : "Page shown as-is for this site.");
  });

  els.openOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  load().catch(() => {
    els.restricted.style.display = "block";
    els.main.style.display = "none";
  });
})();
