# PauseProof — Check before you trust

**PauseProof** is a free, privacy-first consumer-safety web application inspired by documented social-media scams and recurring community complaints about fake stores, job offers, investment groups, rental listings, and impersonation.

It works as a standalone static site — no package installation or paid service required.

## What users can do

- **Check suspicious messages and links** with explainable, rule-based patterns across five scam categories.
- **Review each indicator and recommended next steps**. Outcomes are deliberately cautious: no "verified safe" claim, black-box confidence percentage, or automatic accusation.
- **Add context** with six optional situation checkboxes.
- **Try fictional examples** demonstrating tactics reported in current scam complaints.
- **Save cases locally**: short title, category, checked hostname, date, warning titles, status. Full pasted messages and URLs are *not* saved.
- **Review, close/reopen, delete and export** case summaries.
- **Get recovery steps** for bank transfer, card, payment apps, cryptocurrency and gift cards, with official US, UK, and Nigerian reporting resources.
- **Download recovery plans** and copy findings.
- **Use it on desktop or mobile** with accessible controls.

## Problem evidence and sources

The FTC reports **$2.1 billion** lost in 2025 to scams originating on social media. Online-shopping scams accounted for over 40% of loss-reporting cases tied to social media. Scam categories also include investment fraud, romance scams, impersonation, job and rental fraud.

Primary references:
- [FTC — Reported losses to social-media scams (April 2026)](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2026/04/reported-losses-scams-social-media-eight-times-higher-2020)
- [FTC — What to do if you were scammed](https://consumer.ftc.gov/articles/what-do-if-you-were-scammed)
- [FTC — How to spot and avoid task scams](https://consumer.ftc.gov/consumer-alerts/2025/08/how-spot-avoid-task-scams)
- [FTC — Common signs of a scam](https://consumer.ftc.gov/consumer-alerts/2025/03/what-are-signs-scam)
- [UK — Report Fraud](https://www.reportfraud.police.uk/)
- [Nigeria Police National Cybercrime Centre](https://nccc.npf.gov.ng/)

Community reports informing the MVP include discussions in r/Scams and r/CryptoScams about lookalike shopping sites, fake recruiters, advance-fee rentals, and Telegram/WhatsApp investment groups. These are illustrative reports, not verified findings about named companies.

## Important limits

**This tool cannot prove a website or person is legitimate or fraudulent.** A green/low-signals result means *not verified*, not *safe*. The scan is heuristic and may produce false positives and false negatives. No URL reputation provider, live site crawler, external AI model or risk-scoring database is integrated.

All matching runs in the browser. Messages and URLs are never sent to a scanning service or automatically saved. Case summaries are stored only in `localStorage` on the user's browser; the user can export or delete them. The site loads web fonts from Google Fonts, which may involve ordinary font-host requests, but does not transmit analysed text there.

**No payments:** The safety service is intentionally free; it neither charges users nor supports donations without an explicitly configured and approved payment processor.

## Technical architecture

- Static `index.html`, `styles.css`, `app.js`
- Vanilla JavaScript, browser-native URL parsing, deterministic rule explanations
- No server, account, persistent central database, API secrets or third-party JavaScript dependencies
- Local storage for explicitly saved minimal case metadata
- Fixed official reporting URLs, no outgoing requests to checked user-supplied links

To run locally, start any static web server in this directory (e.g. `python3 -m http.server 8080`), then visit http://localhost:8080.

Vercel deploy settings: **Other framework**, project root this directory, no build command. Deploy the three files as static assets.

## Roadmap for responsible scale

- User research with affected communities and accessibility testing
- Opt-in business verification using authoritative registries rather than assumptions
- Consent-based, audited threat-intelligence APIs with abuse-rate limits
- Translations and region-specific reporting resources
- Optional end-to-end encrypted case synchronization
- Fraud-pattern review with human experts; benchmark false positives and false negatives
- No public accusations or sensitive crowdsourced exposure without robust moderation

### Contributing

The rules in `app.js` are self-contained and intentionally easy to audit. Proposed patterns should include false-positive considerations and independently verifiable evidence.
