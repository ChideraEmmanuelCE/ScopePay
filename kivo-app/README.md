# Kivo — interactive fintech wallet demo

A standalone responsive web experience with a distinctive plum-and-lime design. Inspired by mainstream wallet UX, but independently branded.

## Features
- Dashboard with wallet balance, illustrative charts, transaction feed and quick actions
- Send demo funds to an email, with review, validation, confirmation, receipt, and balance changes
- Request demo payments, list pending requests, simulate receipt
- Add and withdraw fictional wallet funds
- Virtual card UI with working freeze/unfreeze state (no real card credentials)
- Search and filter activity, export CSV, transaction details
- Recipients, personalization, dark theme, balance privacy, local notifications, help
- Responsive mobile bottom navigation
- Browser-local persistence via localStorage and demo reset

## Important
**Prototype only.** No real payments, banking services, KYC, authentication, shared database, payment processor, or actual cards. Never enter genuine sensitive financial information. Demo data lives in the browser where it is opened.

## Tech / deployment
Single static `index.html` (HTML/CSS/vanilla JavaScript). This repository branch stores the app under `kivo-app/`; deploy it as a static site from that directory on Vercel. No build command is required.

A production financial service would require server-side identity, an append-only double-entry ledger, payment service integrations, reconciliation, KYC/AML, fraud and regulatory review.
