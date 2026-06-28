(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    defaultClarity: $("defaultClarity"),
    defaultHideSummaries: $("defaultHideSummaries"),
    defaultCollapseClutter: $("defaultCollapseClutter"),
    defaultsStatus: $("defaultsStatus"),
    ruleHost: $("ruleHost"),
    ruleAction: $("ruleAction"),
    ruleSelectors: $("ruleSelectors"),
    addRule: $("addRule"),
    exportRules: $("exportRules"),
    importJson: $("importJson"),
    importRules: $("importRules"),
    status: $("status"),
    rulesList: $("rulesList"),
    emptyRules: $("emptyRules"),
  };

  function setStatus(text) {
    els.status.textContent = text || "";
  }

  function validateHost(raw) {
    const host = String(raw || "").trim().toLowerCase();
    if (!host) return { ok: false, error: "Host is required." };
    if (host === "*") return { ok: true, host };
    if (host.includes("/") || host.includes(":") || host.includes(" ") || host.includes("?")) {
      return { ok: false, error: "Host must not include schemes, paths, or spaces." };
    }
    if (host.startsWith("*.")) {
      const rest = host.slice(2);
      if (!rest || !/^[a-z0-9.-]+$/.test(rest)) return { ok: false, error: "Invalid wildcard host." };
      return { ok: true, host };
    }
    if (!/^[a-z0-9.-]+$/.test(host)) return { ok: false, error: "Invalid host." };
    return { ok: true, host };
  }

  function renderRules(settings) {
    const rules = settings.customRules || [];
    els.emptyRules.style.display = rules.length ? "none" : "block";
    els.rulesList.innerHTML = "";

    for (const rule of rules) {
      const li = document.createElement("li");
      li.className = "rule";

      const top = document.createElement("div");
      top.className = "rule-top";

      const meta = document.createElement("div");
      const pill = document.createElement("div");
      pill.className = "pill";
      const strong = document.createElement("strong");
      strong.textContent = rule.host;
      pill.appendChild(strong);
      pill.appendChild(document.createTextNode(" · "));
      pill.appendChild(document.createTextNode(rule.action));
      meta.appendChild(pill);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "danger";
      del.textContent = "Remove";
      del.addEventListener("click", async () => {
        const fresh = await AletheiaStorage.loadSettings();
        const next = (fresh.customRules || []).filter((r) => r.id !== rule.id);
        await AletheiaStorage.saveSettings({ customRules: next });
        setStatus("Rule removed.");
        await renderAll();
      });

      top.appendChild(meta);
      top.appendChild(del);

      const pre = document.createElement("pre");
      pre.textContent = (rule.selectors || []).join("\n");

      li.appendChild(top);
      li.appendChild(pre);
      els.rulesList.appendChild(li);
    }
  }

  function setDefaultsStatus(text) {
    if (els.defaultsStatus) els.defaultsStatus.textContent = text || "";
  }

  async function renderDefaults(settings) {
    if (!els.defaultClarity) return;
    els.defaultClarity.checked = Boolean(settings.global?.clarityEnabled ?? true);
    els.defaultHideSummaries.checked = Boolean(settings.global?.hideSummaries);
    els.defaultCollapseClutter.checked = Boolean(settings.global?.collapseClutter);
  }

  async function saveDefaults() {
    const current = await AletheiaStorage.loadSettings();
    await AletheiaStorage.saveSettings({
      global: {
        ...current.global,
        clarityEnabled: els.defaultClarity.checked,
        hideSummaries: els.defaultHideSummaries.checked,
        collapseClutter: els.defaultCollapseClutter.checked,
      },
    });
    setDefaultsStatus("Saved.");
  }

  if (els.defaultClarity) {
    els.defaultClarity.addEventListener("change", () => {
      saveDefaults();
    });
  }
  if (els.defaultHideSummaries) {
    els.defaultHideSummaries.addEventListener("change", () => {
      saveDefaults();
    });
  }
  if (els.defaultCollapseClutter) {
    els.defaultCollapseClutter.addEventListener("change", () => {
      saveDefaults();
    });
  }

  async function renderAll() {
    const settings = await AletheiaStorage.loadSettings();
    await renderDefaults(settings);
    renderRules(settings);
  }

  els.addRule.addEventListener("click", async () => {
    setStatus("");

    const hostRes = validateHost(els.ruleHost.value);
    if (!hostRes.ok) {
      setStatus(hostRes.error);
      return;
    }

    const lines = String(els.ruleSelectors.value || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const validated = AletheiaSelectors.validateSelectorList(lines);
    if (validated.errors.length) {
      setStatus(validated.errors[0] || "Invalid selector.");
      return;
    }
    if (!validated.selectors.length) {
      setStatus("Add at least one selector.");
      return;
    }

    const settings = await AletheiaStorage.loadSettings();
    const rules = [...(settings.customRules || [])];
    if (rules.length >= AletheiaSelectors.MAX_RULES) {
      setStatus("Rule limit reached. Remove a rule before adding more.");
      return;
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    rules.push({
      id,
      host: hostRes.host,
      selectors: validated.selectors,
      action: els.ruleAction.value === "collapse" ? "collapse" : "hide",
    });

    await AletheiaStorage.saveSettings({ customRules: rules });
    els.ruleSelectors.value = "";
    setStatus("Saved. Refresh open tabs if a page does not pick it up immediately.");
    await renderAll();
  });

  els.exportRules.addEventListener("click", async () => {
    const settings = await AletheiaStorage.loadSettings();
    const payload = JSON.stringify(settings.customRules || [], null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setStatus("Copied custom rules JSON to the clipboard.");
    } catch {
      setStatus("Could not access the clipboard from this page.");
    }
  });

  els.importRules.addEventListener("click", async () => {
    setStatus("");
    let parsed;
    try {
      parsed = JSON.parse(String(els.importJson.value || "").trim() || "[]");
    } catch {
      setStatus("Could not parse JSON.");
      return;
    }

    if (!Array.isArray(parsed)) {
      setStatus("Import must be a JSON array of rule objects.");
      return;
    }

    const settings = await AletheiaStorage.loadSettings();
    const rules = [...(settings.customRules || [])];
    const usedIds = new Set(rules.map((r) => r.id));

    let added = 0;
    let skipped = 0;

    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        skipped += 1;
        continue;
      }
      if (rules.length >= AletheiaSelectors.MAX_RULES) break;

      const hostRes = validateHost(item.host);
      if (!hostRes.ok) {
        skipped += 1;
        continue;
      }

      const action = item.action === "collapse" ? "collapse" : "hide";
      const lines = Array.isArray(item.selectors) ? item.selectors.map((x) => String(x)) : [];
      const validated = AletheiaSelectors.validateSelectorList(lines);
      if (!validated.selectors.length) {
        skipped += 1;
        continue;
      }

      let id = typeof item.id === "string" ? item.id.trim() : "";
      if (!id || usedIds.has(id)) {
        id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }
      usedIds.add(id);

      rules.push({
        id,
        host: hostRes.host,
        selectors: validated.selectors,
        action,
      });
      added += 1;
    }

    await AletheiaStorage.saveSettings({ customRules: rules });
    setStatus(`Merged rules. Added ${added}. Skipped ${skipped}.`);
    await renderAll();
  });

  renderAll().catch(() => setStatus("Could not load settings."));
})();
