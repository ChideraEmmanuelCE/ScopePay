# ScopePay demo acceptance checklist

Updated 27 October 2026. This is a testing checklist, not a claim that all items passed.

## Verified

- [x] Public Vercel page loads and API status route responds.
- [x] Manual sample, rate editing, review, saving and loading passed browser QA on the shared application UI.
- [x] Six automated tests passed, including the Vercel adapter and payment amount/session protections.
- [x] PayPal sandbox authentication and creation of a $1 test order succeed on Vercel.
- [x] PayPal returns a sandbox approval URL.
- [x] User reports Devpost registration is complete.

## Complete before final recording/submission

- [ ] Confirm AI access later, then generate a real quote and review the output.
- [ ] Complete buyer approval with a sandbox Personal account.
- [ ] Return to ScopePay in the same Safari tab; verify a completed capture receipt and matching amount.
- [ ] Reload the return link: ensure no duplicate capture.
- [ ] Cancel a new sandbox checkout and verify the quote is restored without a success claim.
- [ ] Confirm the completed transaction in PayPal's sandbox activity.
- [x] Publish public source repository with root LICENSE, source files and setup instructions: https://github.com/ChideraEmmanuelCE/ScopePay
- [ ] Check repository accessibility while signed out.
- [ ] Record an actual working demo under three minutes and publish it publicly on YouTube.
- [ ] Fill Devpost fields with verified features, repository URL, demo URL and video URL.
- [ ] Submit and retain the Devpost confirmation before 12 November 2026, 21:00 WAT.

## Recording hygiene

Show a fictional client and brief. Hide bookmarks, notifications, personal email, test-account login, environment settings and API keys. Do not replace missing AI output or payment confirmation with staged success. Editing out waiting time is fine if the sequence remains truthful.
