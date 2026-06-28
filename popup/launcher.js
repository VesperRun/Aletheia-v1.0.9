(() => {
  const $ = (id) => document.getElementById(id);

  const COPY = {
    showPanel: "Show on-page controls",
    hidePopup: "Minimize",
    hintPending: "Full controls live on the page in the floating panel.",
    hintReady: "Your controls are on the page (bottom-right).",
    refresh: "Refresh this tab once to connect on-page controls.",
  };

  const els = {
    restricted: $("restricted"),
    main: $("main"),
    hostLabel: $("hostLabel"),
    hint: $("hint"),
    showPanel: $("showPanel"),
    openOptions: $("openOptions"),
    openOptionsRestricted: $("openOptionsRestricted"),
    status: $("status"),
  };

  let panelReady = false;

  function setStatus(text) {
    if (els.status) els.status.textContent = text || "";
  }

  function setPanelReady(ready) {
    panelReady = Boolean(ready);
    if (!els.showPanel) return;
    els.showPanel.textContent = panelReady ? COPY.hidePopup : COPY.showPanel;
    if (els.hint) {
      els.hint.textContent = panelReady ? COPY.hintReady : COPY.hintPending;
    }
  }

  function isRestrictedUrl(url) {
    if (!url) return true;
    return (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("devtools://") ||
      url.startsWith("view-source:") ||
      url.startsWith("chrome-untrusted://")
    );
  }

  function labelFromHost(host) {
    if (host === "__local_file__") return "local file";
    return host || "this page";
  }

  function hostFromUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "file:") return "__local_file__";
      return parsed.hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function sendTabMessage(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false });
          return;
        }
        resolve({ ok: Boolean(response?.ok), response });
      });
    });
  }

  async function pingTab(tabId) {
    const result = await sendTabMessage(tabId, { type: "ALETHEIA_PING" });
    return result.ok;
  }

  async function showOnPagePanel(tabId) {
    const result = await sendTabMessage(tabId, { type: "ALETHEIA_SHOW_PANEL" });
    return result.ok;
  }

  async function connectPanel(tabId) {
    for (const delay of [0, 300, 900, 1800]) {
      if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
      if (await pingTab(tabId)) {
        await showOnPagePanel(tabId);
        return true;
      }
      if (await showOnPagePanel(tabId)) return true;
    }
    return false;
  }

  async function init() {
    const tab = await activeTab();
    const url = tab?.url || "";

    if (!tab?.id || isRestrictedUrl(url)) {
      els.restricted.hidden = false;
      els.main.hidden = true;
      return;
    }

    els.restricted.hidden = true;
    els.main.hidden = false;
    els.hostLabel.textContent = labelFromHost(hostFromUrl(url));
    setPanelReady(false);

    els.showPanel.addEventListener("click", async () => {
      setStatus("");
      if (panelReady) {
        window.close();
        return;
      }
      const ready = await connectPanel(tab.id);
      if (ready) {
        setPanelReady(true);
        window.close();
        return;
      }
      setPanelReady(false);
      setStatus("Refresh this tab once, then try again.");
    });

    const ready = await connectPanel(tab.id);
    setPanelReady(ready);
    if (!ready) setStatus(COPY.refresh);
  }

  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  els.openOptions?.addEventListener("click", openOptionsPage);
  els.openOptionsRestricted?.addEventListener("click", openOptionsPage);

  init().catch(() => {
    els.restricted.hidden = false;
    els.main.hidden = true;
  });
})();
