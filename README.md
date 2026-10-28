# ScopePay

A freelancer quote studio built for the PayPal AI Hackathon 2026. Turn a client brief into editable deliverables, review estimated hours and assumptions, then approve a PayPal sandbox checkout.

**Hosted prototype:** https://scopepay-ridea1.vercel.app

**Source:** https://github.com/ChideraEmmanuelCE/ScopePay

**License:** [MIT](LICENSE). **Author:** Chidera Emmanuel Okpala.

## Current status

Working sandbox prototype. Manual quotes, a clearly labelled illustrative sample, per-task estimates, USD totals, client review preview, browser-local quote saving, JSON export, and print/PDF are implemented. Server adapters for Groq, OpenAI, and PayPal Orders v2 are implemented and tested with mocked providers. PayPal sandbox order creation has been verified on the original Sites deployment; buyer approval and completed capture remain to be verified. OpenAI requests have returned HTTP 429. Live AI generation through Groq using `openai/gpt-oss-20b` was verified on Vercel on October 28, 2026, including validated tasks and recomputed totals. The app does not claim to generate AI output or complete payments when credentials are absent.

The Vercel interface is publicly accessible. PayPal sandbox authentication and order creation have also been verified on Vercel. This prototype is not yet ready for final hackathon submission: buyer-approved capture and the demo video remain unfinished. The review preview is not a shareable customer link. Devpost registration has been completed by the author.

## Judge quick start

1. Open the hosted prototype in a normal browser tab.
2. Select **Try a sample brief**. This loads illustrative data, not AI output.
3. Change the hourly rate from $40 to $50: the 30-hour sample should change from $1,200 to $1,500. Edit a deliverable and verify the total again.
4. Select **Review proposal**. Save the quote, close the dialog, then open **My quotes** to reload it. Quotes are stored only in that browser.
5. For a sandbox payment, review and approve the quote, continue to PayPal, sign in with a separate **sandbox Personal/buyer** account, approve, and return in the same tab. Use only test accounts. A completed capture must produce a receipt in ScopePay; a checkout page by itself does not prove payment completion.
6. Paste a project brief and select **Generate a scope**. Live Groq generation has been verified. Review every suggested task, hour estimate, assumption, and question before approving. Free-tier usage limits still apply; the sample and manual editor remain available if a limit is reached.

For PayPal test accounts, use the Developer Dashboard's **Testing Tools / Sandbox Accounts** section. Use a Personal account as buyer and the sandbox app's Business account as seller. Never publish account passwords or API keys in a public repository or video.

### Run with your own credentials

Download or clone this repository, use Node 22 or newer, and copy `.env.example` to an ignored `.env` file. Fill in a Groq key (free tier available) or an OpenAI key, plus PayPal sandbox app credentials. Run:

```sh
node --env-file=.env scripts/dev.mjs
```

Open http://localhost:5173. A dependency installation is not required. Never commit the populated `.env` file. Run `npm test` for automated tests of pricing, payment safeguards, error handling, and Vercel routing; those tests use mocked provider responses.

## Run locally

Requires Node 22 or newer. No third-party dependencies.

```sh
npm run dev
```

Open http://localhost:5173. By default integrations are unconfigured. Use **Try a sample brief**, edit a task or rate, open **Review proposal**, and save or print. The sample is illustrative and is not AI-generated.

Set environment variables securely before running. Node can load a local ignored .env file with `node --env-file=.env scripts/dev.mjs`. Never commit credentials. For hosted Sites, configure these through runtime environment settings:

- `GROQ_API_KEY`: Groq key, server-only. Available from https://console.groq.com/keys. Remain on the Free plan to avoid paid usage; free quotas still apply.
- `GROQ_MODEL`: optional, defaults to `openai/gpt-oss-20b`.
- `AI_PROVIDER`: optional `groq` or `openai`; otherwise Groq is preferred when its key is present. There is no automatic paid fallback.
- `OPENAI_API_KEY`: alternative AI provider key, server-only.
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`.
- `PAYPAL_CLIENT_ID`: your PayPal sandbox application client ID.
- `PAYPAL_CLIENT_SECRET`: matching sandbox app secret, server-only.

Only `https://api-m.sandbox.paypal.com` is used. There is no live-payment mode.

## Integration test checklist

1. Configure your sandbox application and a separate PayPal sandbox buyer account.
2. Generate a scope from a real brief. Review all estimated hours, assumptions, and questions.
3. Adjust tasks and rate; check the displayed USD total.
4. Open the review preview and explicitly approve the quote.
5. Continue to PayPal and sign in with the sandbox buyer. Approve payment and return to ScopePay in the same browser tab.
6. Verify the receipt and amount in the application and PayPal sandbox dashboard.
7. Test cancellation, rejected payments, invalid credentials, and a repeated return request.

## How it works

The AI prompt returns deliverables, hours, assumptions, and open questions as JSON. The server validates the output; pricing is calculated from the user's chosen rate, not invented by AI. All model suggestions require human review.

Order creation recomputes totals server-side. It signs a checkout session binding the PayPal order ID, reference, amount, and expiry with HMAC. Capture verifies that session, retrieves the order, checks its amount/currency/reference, and requires PayPal approval. Completion is shown only for a completed capture with a matching amount. Repeated capture attempts reuse a deterministic PayPal request ID and check completed order status first.

The original Sites deployment is owner-private; the Vercel deployment is an accessible sandbox testing link. POST requests require the same origin, which is not user authentication. Browser-local quote storage is not a durable database. Production customer use requires account authorization, server-stored quote snapshots, abuse controls, durable payment records, verified webhook processing, and explicit client access. The UI currently includes no public client-sharing capability. Print/export for a backup; clearing browser storage removes local quotes. Start each checkout on the intended hosting domain in Safari and return to the same tab; browser storage is not shared between hosts.

## Vercel hosting

The `api/app.js` adapter uses Node's Web Request/Response interface and passes only server environment variables to the existing application. `vercel.json` routes API requests to that adapter; `node scripts/build-vercel.mjs` generates the static UI in `public/`. No dependencies are required.

Project: `ridea1/scopepay`. Configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and either `GROQ_API_KEY` or `OPENAI_API_KEY` as Production secrets in Vercel, then redeploy. Saved Sites secrets cannot be read back through its configuration API and are not included in deployment files. Never use live PayPal credentials in this sandbox application. Vercel hosting does not resolve OpenAI account quota or billing errors.

Quotes currently use USD only and do not calculate taxes. Estimates and timelines are proposals, not guarantees. Never place secrets or sensitive customer information into a sample or source file.

## Tests and Vercel build

```sh
npm test
npm run build
npm run validate
```

Tests cover cent-based pricing, invalid quotes, missing setup, cross-origin writes, AI failure handling, tampered payment sessions, altered payment amounts, and repeated captures using mocked providers. These tests do not establish successful live integration.

## Hackathon narrative

Problem: freelancers receive vague briefs, manually turn them into scope and price, and separately chase payment. ScopePay connects these steps while keeping the freelancer in control of estimates and prices.

Demonstration: paste a brief; generate and edit scope; identify an unresolved question; review a USD quote; approve and complete a PayPal sandbox payment; show a verified receipt. Target video length: under three minutes.

License: MIT. Built by Chidera Emmanuel Okpala with AI coding assistance.
