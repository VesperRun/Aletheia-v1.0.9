# Aletheia Launch Directives

These are the operating rules for launching Aletheia efficiently while preserving the product's local-first posture.

## 1. Keep the Product Shape Narrow

Launch as a **Chrome Manifest V3 browser extension**.

Do not launch as:

- SaaS;
- PWA;
- account-based dashboard;
- hosted AI detector;
- cloud-sync product.

The extension is the product. A website may exist only for install instructions, privacy notice, support, and marketing.

## 2. Keep Backend Effort Near Zero

Do not add a backend unless a clear revenue or compliance reason requires it.

Avoid:

- accounts;
- user databases;
- analytics pipelines;
- server-side page processing;
- hosted rule feeds;
- remote AI classifiers;
- cloud settings sync.

Prefer:

- `chrome.storage.local`;
- local content scripts;
- local options UI;
- user-authored rules;
- static documentation;
- static support email or form.

## 3. Launch With Honest Claims

Core product truth:

> Aletheia should miss some things. Restraint is part of trust.

Use:

- “likely AI clutter”;
- “common AI summary panels”;
- “local-first”;
- “no user data collection”;
- “no browsing telemetry”;
- “no remote servers required”;
- “user-controlled rules”;
- “conservative by design”;
- “honest user control.”

Avoid:

- “detects all AI”;
- “blocks AI everywhere”;
- “guaranteed compliance”;
- “bypass”;
- “scraping”;
- “circumvention.”

## 4. Minimum Launch Assets

Before public launch, prepare:

- final icon exports (`16`, `32`, `48`, `128`);
- Chrome Web Store screenshots;
- hosted privacy notice;
- support contact;
- final `README.md`;
- final `PRIVACY.md`;
- final Texas-facing notice review.

## 5. Launch Sequence

1. Finalize icon PNGs.
2. Fill legal/contact placeholders.
3. Test in a clean Chrome profile.
4. Package the extension as a ZIP.
5. Submit to Chrome Web Store.
6. Publish a simple landing page.
7. Announce with the message: “Quiet the AI-heavy web, locally.”

## 6. Post-Launch Discipline

Measure success through:

- store reviews;
- support emails;
- user-reported site patterns;
- manual QA;
- optional anonymous feedback form that does not collect browsing history.

Do not add telemetry just because it is convenient.

## 7. Privacy Promise

The privacy promise is a selling point and a constraint:

> Aletheia is for the people. No user data is collected or sent. Ever.

Keep this true by rejecting features that require centralized collection of browsing behavior, page content, user accounts, or identity data. If a future feature needs data movement, it must be explicitly opt-in, clearly documented, and treated as a separate product decision.

