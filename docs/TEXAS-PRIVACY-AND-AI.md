# Aletheia — Texas-facing privacy & AI disclosures

**Important:** This document is for transparency and internal product hygiene. **It is not legal advice.** Texas privacy and AI statutes change, and applicability depends on your role (individual developer, company, nonprofit), revenue, data practices, and distribution model. **Consult a Texas-licensed attorney** before relying on this for compliance, contracting, or regulatory filings.

## What Aletheia is (plain English)

Aletheia is a **local-first browser extension** that applies **on-device** heuristics and user-defined rules to change how web pages are displayed (for example, hiding or collapsing certain panels and offering a reading layout). **Aletheia is not a remote analytics product**, does not collect user data, does not ship browsing history to Aletheia-operated servers as part of its design, and does not claim to “prove” whether content was AI-generated.

## Backend and operational posture

Aletheia is intentionally designed for **near-zero backend effort**. The user's browser and local system do the work:

- page analysis runs in the local content script;
- site preferences and custom rules stay in local browser extension storage;
- reading layout is generated locally from the current page;
- there is no required account system, cloud sync, remote AI classifier, analytics SDK, hosted rule engine, user database, or browsing-history service.

Public positioning should avoid saying that liability is “displaced” to users. The safer and more accurate language is:

> Aletheia minimizes centralized data responsibility by keeping processing and settings local to the user's browser.

## Texas Data Privacy and Security Act (TDPSA) — product alignment

The **Texas Data Privacy and Security Act** is Chapter **541**, Texas Business & Commerce Code. Official overview materials are published by Texas state agencies and the Office of the Attorney General (see links below).

### What personal data Aletheia is designed to handle

For most users, Aletheia’s relevant data is **local extension configuration** stored in the browser (for example, per-site feature choices and custom CSS selector rules). That data typically **stays on the user’s device** and is not transmitted to Aletheia as part of the extension’s core design.

**Aletheia does not, by design:**

- operate Aletheia-controlled remote servers to collect browsing history for product analytics;
- collect user information through the extension;
- transmit page contents or custom rules to Aletheia-operated systems;
- sell personal data (there is no “sale” business model in the reference implementation);
- use personal data to run **targeted advertising** through the extension itself; or
- profile consumers for automated decisions in the sense contemplated by many consumer privacy regimes.

### Consumer-facing practices (TDPSA-style expectations)

Even when a law’s applicability is uncertain, many Texas-facing products still publish a clear notice because it reduces risk and matches consumer expectations. Aletheia’s reference implementation aims to support:

- **Transparency:** describe what is stored locally and why (see Options in the extension).
- **Data minimization:** store what is needed for functionality (settings/rules), not “everything about the user.”
- **User control:** users can reset per-site choices, delete custom rules, clear extension storage via browser controls, or uninstall.
- **Security hygiene:** keep dependencies minimal; avoid remote calls in the core design; follow Chrome extension security best practices.

### If you are the publisher / “business” distributing Aletheia

If you distribute Aletheia commercially, you may need:

- a **privacy notice** hosted at an **HTTPS** URL (Chrome Web Store commonly expects this);
- a **contact method** for privacy requests if TDPSA applies to you;
- documented processes for **consumer rights requests** if applicable (access, correction, deletion, appeal), even if the practical answer is often “we do not hold a cloud copy; delete local data in the browser.”

Replace the bracketed fields in this repo’s notices with your real contact information before publication.

## Texas AI-related laws — how Aletheia is positioned (high level)

Texas has enacted (and continues to enact) statutes addressing **AI, deepfakes, and online harms**. The list evolves. As a general matter, Aletheia’s reference implementation is intended as a **client-side reading and decluttering utility**, not:

- a system for generating **deepfake media**;
- a product for creating **sexually explicit synthetic depictions** of real people; or
- a tool intended to **circumvent security**, scrape private data, or impersonate others.

**No software “complies with AI laws” by default**—compliance is contextual. The positioning above matters because it describes what Aletheia is *not* trying to be.

## Children

Aletheia is **not directed to children** as a product category. Parents/guardians should manage browser profiles and extensions for minors.

## Security

If you fork Aletheia, keep permissions minimal, review third-party code before shipping, and follow Chrome’s extension security guidance.

## Official Texas resources (starting points)

- Texas Attorney General — consumer privacy rights / TDPSA materials:  
  https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/texas-data-privacy-and-security-act  
- Texas Statutes (Texas Constitution and Statutes) — verify current text with the official site maintained by the State of Texas.

## Change log

Maintain a short change log when you materially change data practices (new remote service, new data fields stored, new permissions).

---

**Publisher fields (fill before distribution)**

- Legal / privacy contact email: `[REPLACE_ME]`
- Physical mailing address (if required for your notices): `[REPLACE_ME]`
- Last updated date: `[REPLACE_ME]`
