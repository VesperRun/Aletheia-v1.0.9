(() => {
  const $ = (id) => document.getElementById(id);

  const COPY = {
    showPanel: "Show on-page controls",
    hidePopup: "Hide this popup",
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

  function pingTab(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: "ALETHEIA_PING" }, (response) => {
        resolve(Boolean(response?.ok) && !chrome.runtime.lastError);
      });
    });
  }

  function showOnPagePanel(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: "ALETHEIA_SHOW_PANEL" }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  async function connectPanel(tabId) {
    if (await pingTab(tabId)) {
      await showOnPagePanel(tabId);
      return true;
    }
    await showOnPagePanel(tabId);
    return pingTab(tabId);
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
      try {
        await connectPanel(tab.id);
        setPanelReady(true);
        window.close();
      } catch {
        setPanelReady(false);
        setStatus("Refresh this tab once, then try again.");
      }
    });

    try {
      const ready = await connectPanel(tab.id);
      setPanelReady(ready);
      if (!ready) setStatus(COPY.refresh);
    } catch {
      setPanelReady(false);
      setStatus(COPY.refresh);
    }
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
