/**
 * Aletheia — shared defaults and storage helpers (no network).
 * All settings live in chrome.storage.local on this device.
 */

(function initAletheiaStorage(global) {
  const STORAGE_KEY = "aletheia_settings_v1";

  const DEFAULTS = Object.freeze({
    v: 1,
    global: Object.freeze({
      enabled: true,
      clarityEnabled: true,
      hideSummaries: true,
      collapseClutter: true,
    }),
    sites: Object.freeze({}),
    customRules: Object.freeze([]),
    ui: Object.freeze({
      floatingPanelMinimized: false,
    }),
  });

  let contextInvalidatedNotified = false;

  function isContextValid() {
    try {
      return Boolean(typeof chrome !== "undefined" && chrome.runtime?.id && chrome.storage?.local);
    } catch {
      return false;
    }
  }

  function notifyContextInvalidated() {
    if (contextInvalidatedNotified) return;
    contextInvalidatedNotified = true;
    try {
      if (typeof document !== "undefined") {
        document.dispatchEvent(new CustomEvent("aletheia-context-invalidated"));
      }
    } catch {
      /* no-op */
    }
  }

  function storageGetLocal(keys) {
    return new Promise((resolve) => {
      if (!isContextValid()) {
        notifyContextInvalidated();
        resolve({});
        return;
      }
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            if (String(chrome.runtime.lastError.message || "").includes("invalidated")) {
              notifyContextInvalidated();
            }
            resolve({});
            return;
          }
          resolve(result || {});
        });
      } catch {
        notifyContextInvalidated();
        resolve({});
      }
    });
  }

  function storageSetLocal(items) {
    return new Promise((resolve) => {
      if (!isContextValid()) {
        notifyContextInvalidated();
        resolve(false);
        return;
      }
      try {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            if (String(chrome.runtime.lastError.message || "").includes("invalidated")) {
              notifyContextInvalidated();
            }
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch {
        notifyContextInvalidated();
        resolve(false);
      }
    });
  }

  async function loadSettings() {
    const raw = await storageGetLocal(STORAGE_KEY);
    const merged = mergeDeep(structuredClone(DEFAULTS), raw[STORAGE_KEY] || {});
    return normalizeSettings(merged);
  }

  async function saveSettings(patch) {
    const current = await loadSettings();
    const merged = mergeDeep(current, patch);
    if (Object.prototype.hasOwnProperty.call(patch || {}, "sites")) merged.sites = patch.sites;
    const next = normalizeSettings(merged);
    await storageSetLocal({ [STORAGE_KEY]: next });
    return next;
  }

  function mergeDeep(base, extra) {
    if (!extra || typeof extra !== "object") return base;
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const [k, v] of Object.entries(extra)) {
      if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && out[k] && !Array.isArray(out[k])) {
        out[k] = mergeDeep(out[k], v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function normalizeSettings(s) {
    s.v = 1;
    const legacyGlobalDisabled = s.global?.enabled === false;
    s.global = {
      enabled: true,
      clarityEnabled: legacyGlobalDisabled ? false : Boolean(s.global?.clarityEnabled ?? DEFAULTS.global.clarityEnabled),
      hideSummaries: legacyGlobalDisabled ? false : Boolean(s.global?.hideSummaries ?? DEFAULTS.global.hideSummaries),
      collapseClutter: legacyGlobalDisabled ? false : Boolean(s.global?.collapseClutter ?? DEFAULTS.global.collapseClutter),
    };
    s.sites = normalizeSites(s.sites);
    s.customRules = Array.isArray(s.customRules) ? s.customRules.map(normalizeRule).filter(Boolean) : [];
    s.ui = {
      floatingPanelMinimized: Boolean(s.ui?.floatingPanelMinimized ?? DEFAULTS.ui.floatingPanelMinimized),
    };
    return s;
  }

  function normalizeSites(sites) {
    if (!sites || typeof sites !== "object") return {};
    const out = {};
    for (const [host, raw] of Object.entries(sites)) {
      const entry = normalizeSiteEntry(raw);
      if (entry) out[host] = entry;
    }
    return out;
  }

  function normalizeSiteEntry(raw) {
    if (!raw || typeof raw !== "object") return null;

    let summaryPanels = raw.summaryPanels;
    let likelyClutter = raw.likelyClutter;

    // Migrate the earlier site-wide mode into independent feature choices.
    if (!summaryPanels && !likelyClutter && raw.mode) {
      if (raw.mode === "off") {
        summaryPanels = "allow";
        likelyClutter = "allow";
      } else if (raw.mode === "on") {
        summaryPanels = raw.hideSummaries === false ? "allow" : "hide";
        likelyClutter = raw.collapseClutter === false ? "allow" : "collapse";
      }
    }

    const normalized = {};
    if (summaryPanels === "hide" || summaryPanels === "allow") normalized.summaryPanels = summaryPanels;
    if (likelyClutter === "collapse" || likelyClutter === "allow" || likelyClutter === "hide") normalized.likelyClutter = likelyClutter;

    return Object.keys(normalized).length ? normalized : null;
  }

  function normalizeRule(rule) {
    if (!rule || typeof rule !== "object") return null;
    const host = String(rule.host || "").trim().toLowerCase();
    const selectors = Array.isArray(rule.selectors)
      ? rule.selectors.map((x) => String(x).trim()).filter(Boolean)
      : [];
    const action = rule.action === "collapse" ? "collapse" : "hide";
    if (!host || !selectors.length) return null;
    const id =
      String(rule.id || "").trim() ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `rule-${host}-${selectors[0]}`.slice(0, 80));
    return {
      id,
      host,
      selectors,
      action,
    };
  }

  global.AletheiaStorage = {
    STORAGE_KEY,
    DEFAULTS,
    isContextValid,
    loadSettings,
    saveSettings,
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
