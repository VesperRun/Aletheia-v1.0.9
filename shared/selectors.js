/**
 * Conservative validation for user-authored CSS selectors.
 * This is not a full CSS parser; it rejects patterns that are commonly unsafe or surprising.
 */
(function initAletheiaSelectors(global) {
  const MAX_SELECTOR_LEN = 280;
  const MAX_RULES = 80;
  const MAX_SELECTORS_PER_RULE = 40;

  const BLOCKED = /url\s*\(|@import|expression\s*\(|javascript:|behavior:|<!--|-->|<\/|\/\*/i;

  /**
   * @param {string} raw
   * @returns {{ ok: true, selector: string } | { ok: false, error: string }}
   */
  function validateUserSelector(raw) {
    const selector = String(raw).trim();
    if (!selector) return { ok: false, error: "Empty selector." };
    if (selector.length > MAX_SELECTOR_LEN) return { ok: false, error: "Selector is too long." };
    if (BLOCKED.test(selector)) return { ok: false, error: "This selector pattern is not allowed." };
    if (/[<>]/.test(selector)) return { ok: false, error: "Angle brackets are not allowed." };
    // Allow typical CSS selector tokens only (conservative).
    if (!/^[a-zA-Z0-9#.\[\]="':_*|\-+>~\s,():]+$/.test(selector)) {
      return { ok: false, error: "Contains characters that are not permitted." };
    }
    const parts = selector.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > MAX_SELECTORS_PER_RULE) return { ok: false, error: "Too many comma-separated selectors." };
    for (const p of parts) {
      if (p.length > MAX_SELECTOR_LEN) return { ok: false, error: "A selector segment is too long." };
    }
    return { ok: true, selector };
  }

  /**
   * @param {string[]} list
   */
  function validateSelectorList(list) {
    const ok = [];
    const errors = [];
    for (const line of list) {
      const res = validateUserSelector(line);
      if (res.ok) ok.push(res.selector);
      else errors.push(res.error);
    }
    return { selectors: ok, errors };
  }

  global.AletheiaSelectors = {
    validateUserSelector,
    validateSelectorList,
    MAX_RULES,
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
