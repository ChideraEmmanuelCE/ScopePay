# PauseProof — Check before you trust

**PauseProof** is a free, privacy-first consumer-safety web application inspired by documented social-media scams and recurring community complaints about fake stores, job offers, investment groups, rental listings, and impersonation.

It runs on Vercel with a static UI and one lightweight serverless function for live website checks. No paid API key is required for the core service.

## What users can do

- **Scan live website information** by entering a public hostname or URL. The serverless scanner checks Google Public DNS (A / AAAA), domain registration age through public RDAP, and historical public records via urlscan.io, when those sources are available.
- **Check suspicious messages and links locally** with explainable, rule-based patterns across five scam categories.
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

**This tool cannot prove a website or person is legitimate or fraudulent.** A low-warning result is *not verified*, not *safe*. Results can contain false positives and false negatives. DNS and registration facts do not establish business legitimacy. The server does not fetch the submitted site's HTML, contact the site, browse the page, run scripts, check malicious downloads, or independently verify the site's seller.

**Privacy:** Message and offer text analysis still runs only in your browser. The new website scanner sends the entered URL in a POST request to the PauseProof Vercel function. The function parses it, and forwards **only the domain name** to Google Public DNS, the public RDAP lookup, and urlscan.io. It never visits the submitted site or forwards its full path and query to those providers. The function uses short-lived in-memory caching of hostname-level results and does not write submitted URLs to a database; network providers may log their queries. Case summaries are stored in browser `localStorage`; users can export or delete them. Google Fonts may receive normal font requests.

**No payments:** The safety service is intentionally free; it neither charges users nor supports donations without an explicitly configured and approved payment processor.

## Technical architecture

- Static `index.html`, `styles.css`, `design-v2.css`, `monochrome.css`, `app.js`
- Vanilla JavaScript, browser-native URL parsing, deterministic rule explanations
- One serverless handler: `api/scan.mjs`, with fixed public-data lookups, input validation, simple per-instance rate limits, timeouts and a bounded cache
- No user account, persistent central database, paid API secrets, or third-party JavaScript runtime dependencies
- Local storage for explicitly saved minimal case metadata
- Fixed official reporting URLs, no outgoing requests to checked user-supplied links

To try message checks locally, start any static web server in this directory (e.g. `python3 -m http.server 8080`), then visit http://localhost:8080. Live domain scans require a function-capable runtime such as Vercel and access to the public lookup services.

Vercel deploy settings: **Other framework**, project root this directory, no build command. Deploy the static site and the `api/scan.mjs` function together.

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

## Design v2 — mobile overhaul (November 2026)

- Redesigned dark-green and citrus hero and clearer scanning-first information architecture
- A true 3-column/two-row category grid on narrow phones; no horizontal carousel needed
- Viewport-safe layouts, mobile navigation, improved input sizes and touch targets
- Responsive coverage verified at approximately 320px and 390px mobile widths
- Scanning and navigation smoke-tested against the live production domain
- New styles kept in `design-v2.css` to preserve the existing safety-analysis logic

## Website Scanner + monochrome release (November 2026)

- Dedicated website scanning screen with black, white and neutral gray styling, including all original features and a five-tab mobile navigation
- Live passive DNS lookups, public domain age lookup and public historical scan lookup, with explicit unavailable/unknown states
- Evidence-based output: 'Strong warning signs', 'Some warning signs', or 'Not verified', never an unqualified 'safe' verdict
- Known deceptive URL patterns, such as username `@` redirects, HTTP, very young domains, punycode, and lookalike branding
- Does not fetch a submitted website, follow its links, process its content, execute code or submit scans to the historical scanning provider
- SSRF-resistant routing through fixed public lookup endpoints, public-only domain validation, timeout and rate limiting
- Smoke-tested against `example.com` and a fictional deceptive `paypal.com@evil.example` input
