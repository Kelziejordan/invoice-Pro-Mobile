# Invoice Pro Mobile

Invoice Pro is a mobile-friendly Progressive Web App for creating, saving, reviewing, and exporting professional invoices. Invoice data is stored in this browser on this device unless you export a backup.

## Features

- Business profile with logo, contact details, currency, and tax label.
- Customer details, invoice and due dates, line items, discounts, payment terms, and notes.
- CAD and 5% GST defaults suitable for a typical Alberta invoice; verify the correct tax treatment and rate for each transaction.
- Invoice history with view/edit and delete actions.
- PDF export and browser printing.
- JSON backup and restore for the business profile and saved invoices.
- Optional AI text/photo extraction. These features require provider configuration and internet access; do not put a private API key in a client-side build. A secure server-side provider proxy is required before using AI features with a production secret.

## Requirements

- Node.js 22 recommended.
- npm.

## Local development

```sh
npm ci
npm run dev
```

## Verification

```sh
npm run lint
npm test
npm run build
```

The CI workflow runs the same three validation commands on pull requests and pushes to `main` or `preview`. Passing these checks verifies the tested source/build boundary only; it does not establish production deployment or live AI-provider behavior.

## Data protection

Use **Backup** from the dashboard before changing devices, clearing site data, or reinstalling the app. Store the exported JSON somewhere safe: it contains business and customer information. **Restore** replaces the current saved invoices and business profile after confirmation. Keep backups private and do not send them to untrusted parties.

Browser-local data is not cloud-synced and can be lost if browser/site data is cleared. This app does not currently provide multi-user accounts, cloud synchronization, payment processing, or accounting/tax filing.

## Deployment

Build with `npm run build` and deploy the generated `dist/` directory to a static hosting provider. Configure HTTPS for installable PWA behavior. Do not configure a client-exposed API key as a production secret.
