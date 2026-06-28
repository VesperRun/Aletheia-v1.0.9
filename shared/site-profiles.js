/**
 * Aletheia site profiles — local host-specific selectors (no remote feed).
 * Conservative heuristics only; not proof of AI.
 */
(function initAletheiaSiteProfiles(global) {
  const PROFILES = [
    {
      id: "google",
      hosts: ["www.google.com", "google.com"],
      hide: [
        '[data-initq]',
        ".related-question-pair",
        '[aria-label*="People also ask" i]',
        '[aria-label*="AI Overview" i]',
        '[aria-label*="AI overview" i]',
        '[data-attrid*="kc:/collection/knowledge_panels" i]',
        'div[data-subtree="molecule"]',
        'textarea[aria-label*="Ask anything" i]',
        '[aria-label*="AI Mode" i]',
        '[class*="AI-overview" i]',
        '[class*="ai-overview" i]',
        "div.g[data-hveid] g-expandable-content",
      ],
      collapse: ['[aria-label*="Related searches" i]', '[aria-label*="People also search for" i]'],
      headingHide: [
        "people also ask",
        "ai overview",
        "generative ai is experimental",
        "search generative experience",
      ],
      ariaHide: ["ask anything", "search with ai"],
    },
    {
      id: "youtube",
      hosts: ["www.youtube.com", "youtube.com", "m.youtube.com"],
      hide: [
        '[class*="ytd-engagement-panel-section-list" i][target-id*="summary" i]',
        '[aria-label*="Summarize" i]',
        '[class*="summary" i][class*="panel" i]',
      ],
      collapse: ['ytd-watch-next-secondary-results-renderer', "#secondary"],
      headingHide: ["summarize", "key moments"],
      ariaHide: [],
    },
    {
      id: "reddit",
      hosts: ["www.reddit.com", "old.reddit.com", "reddit.com"],
      hide: ['[class*="AiSummary" i]', '[data-testid*="summary" i]'],
      collapse: ['aside[class*="related" i]', '[class*="related" i]'],
      headingHide: ["ai summary", "summary of comments"],
      ariaHide: [],
    },
    {
      id: "nytimes",
      hosts: ["www.nytimes.com", "nytimes.com"],
      hide: ['[data-testid*="summary" i]', '[class*="ai-summary" i]', '[class*="summary-panel" i]'],
      collapse: ['aside', '[data-testid*="related" i]'],
      headingHide: ["ask the news", "summary"],
      ariaHide: [],
    },
    {
      id: "bbc",
      hosts: ["www.bbc.com", "bbc.com", "www.bbc.co.uk"],
      hide: ['[data-component*="summary" i]', '[class*="ai-summary" i]'],
      collapse: ['aside[data-component="related"]', '[data-component="related"]'],
      headingHide: ["summary", "explainer"],
      ariaHide: [],
    },
    {
      id: "cnn",
      hosts: ["www.cnn.com", "cnn.com", "edition.cnn.com"],
      hide: ['[class*="ai-summary" i]', '[data-zone-label*="summary" i]'],
      collapse: ['aside', '[class*="related" i]'],
      headingHide: ["summary", "key points"],
      ariaHide: [],
    },
    {
      id: "washpost",
      hosts: ["www.washingtonpost.com", "washingtonpost.com"],
      hide: ['[class*="ai-overview" i]', '[class*="summary" i][class*="panel" i]'],
      collapse: ['aside', '[class*="related" i]'],
      headingHide: ["summary", "key takeaways"],
      ariaHide: [],
    },
  ];

  function profileForHost(host) {
    const h = String(host || "").toLowerCase();
    return PROFILES.filter((p) => p.hosts.includes(h));
  }

  function normalizeLabel(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function findBlockContainer(el) {
    if (!el || !(el instanceof Element)) return null;
    let node = el;
    for (let depth = 0; depth < 12 && node; depth += 1) {
      if (!(node instanceof Element)) break;
      if (node.matches('section,[role="region"],main,article,div.g,div[data-hveid],div[jscontroller]')) {
        return node;
      }
      node = node.parentElement;
    }
    return el.parentElement;
  }

  function applyHeadingBlocks(profiles, applyHide) {
    if (!document.body) return;
    const labels = new Set();
    for (const profile of profiles) {
      for (const label of profile.headingHide || []) labels.add(normalizeLabel(label));
    }
    if (!labels.size) return;

    const candidates = document.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,[role='heading'],span,div,p,button"
    );
    for (const el of candidates) {
      if (!(el instanceof Element)) continue;
      const text = normalizeLabel(el.textContent);
      if (!text || text.length > 80) continue;
      let matched = false;
      for (const label of labels) {
        if (text === label || text.startsWith(`${label} `)) {
          matched = true;
          break;
        }
      }
      if (!matched) continue;
      const block = findBlockContainer(el);
      if (block) applyHide(block, "site-heading-block");
    }
  }

  function applyAriaBlocks(profiles, applyHide) {
    const needles = new Set();
    for (const profile of profiles) {
      for (const label of profile.ariaHide || []) needles.add(label);
    }
    if (!needles.size) return;

    for (const el of document.querySelectorAll("[aria-label],textarea,input")) {
      if (!(el instanceof Element)) continue;
      const label = normalizeLabel(el.getAttribute("aria-label") || el.getAttribute("placeholder") || "");
      if (!label) continue;
      let matched = false;
      for (const needle of needles) {
        if (label.includes(needle)) {
          matched = true;
          break;
        }
      }
      if (!matched) continue;
      const block = findBlockContainer(el);
      if (block) applyHide(block, "site-aria-block");
    }
  }

  function applyProfiles(profiles, eff, helpers) {
    if (!profiles.length || !eff.active) return;

    for (const profile of profiles) {
      if (eff.hideSummaries) {
        for (const sel of profile.hide || []) {
          for (const el of helpers.queryAll(sel)) {
            helpers.applyHide(el, `site-${profile.id}-summary`);
          }
        }
        applyHeadingBlocks([profile], helpers.applyHide);
        applyAriaBlocks([profile], helpers.applyHide);
      }

      if (eff.clutterMode === "hide") {
        for (const sel of [...(profile.hide || []), ...(profile.collapse || [])]) {
          for (const el of helpers.queryAll(sel)) {
            helpers.applyHide(el, `site-${profile.id}-clutter-hide`);
          }
        }
      } else if (eff.clutterMode === "collapse") {
        for (const sel of profile.collapse || []) {
          for (const el of helpers.queryAll(sel)) {
            helpers.applyCollapse(el, `site-${profile.id}-clutter`);
          }
        }
      }
    }
  }

  global.AletheiaSiteProfiles = {
    profileForHost,
    applyProfiles,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
