import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubtotal, calculateTax, calculateTotal, getItemAmount } from '../src/utils/calculations';
import { formatDate } from '../src/utils/date';
import { createBackup, parseBackup, restoreBackup, PROFILE_STORAGE_KEY, INVOICES_STORAGE_KEY } from '../src/utils/backup';
import { Invoice, Profile } from '../src/schemas/invoice.schema';

const profile: Profile = {
  companyName: 'Test Business',
  email: 'billing@example.com',
  phone: '',
  address: 'Edmonton, Alberta',
  gstNumber: '',
  logo: '',
  currency: 'CAD',
  taxLabel: 'GST',
  invoiceConfig: { prefix: 'INV-', nextNumber: 1002 },
};

const invoice: Invoice = {
  id: '6b42d3ec-6f91-4d9c-8bb3-9a1c9d35f8b1',
  invoiceNumber: 'INV-1001',
  date: '2026-10-27',
  dueDate: '2026-10-27',
  profile,
  client: {
    clientName: 'Customer',
    clientEmail: '',
    clientAddress: 'Surrey, British Columbia',
    jobNumber: '',
    taxRate: 5,
    discount: 0,
    paymentTerms: 'Due on receipt',
    notes: '',
  },
  items: [{
    id: '4d5cc4a5-2ed7-4a63-95cc-f5e60f34d2e8',
    description: 'Construction clean',
    details: '',
    quantity: '6 hrs',
    unitPrice: 70,
  }],
};

test('parses a quantity with a unit such as "6 hrs" without underbilling', () => {
  assert.equal(getItemAmount(invoice.items[0]), 420);
  assert.equal(calculateSubtotal(invoice.items), 420);
  assert.equal(calculateTax(420, 5), 21);
  assert.equal(calculateTotal(420, 21), 441);
});

test('invalid quantity does not silently become one billable unit', () => {
  assert.equal(getItemAmount({ ...invoice.items[0], quantity: 'not a quantity' }), 0);
});

test('rounds monetary results to cents', () => {
  assert.equal(calculateTax(0.1, 5), 0.01);
  assert.equal(calculateTotal(0.1, 0.01), 0.11);
});

test('formats ISO calendar dates without shifting to the previous day', () => {
  assert.equal(formatDate('2026-10-27'), 'October 27, 2026');
});

test('backup round-trips the profile and invoices', () => {
  const backup = createBackup(profile, [invoice], '2026-10-29T12:00:00.000Z');
  const parsed = parseBackup(JSON.stringify(backup));
  assert.equal(parsed.profile.currency, 'CAD');
  assert.equal(parsed.invoices[0].invoiceNumber, 'INV-1001');
  assert.equal(parsed.invoices[0].items[0].quantity, '6 hrs');
});

test('rejects malformed and unsupported backup versions', () => {
  assert.throws(() => parseBackup('{broken'), /valid JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ format: 'invoice-pro-backup', version: 99 })), /unsupported version/);
});

test('restore rolls back existing data if the second write fails', () => {
  const initial = new Map<string, string>([
    [PROFILE_STORAGE_KEY, JSON.stringify({ old: 'profile' })],
    [INVOICES_STORAGE_KEY, JSON.stringify([{ old: 'invoice' }])],
  ]);
  let failOnce = true;
  const storage = {
    getItem: (key: string) => initial.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === INVOICES_STORAGE_KEY && failOnce) {
        failOnce = false;
        throw new Error('simulated storage quota failure');
      }
      initial.set(key, value);
    },
    removeItem: (key: string) => { initial.delete(key); },
  };
  const backup = createBackup(profile, [invoice], '2026-10-29T12:00:00.000Z');
  assert.throws(() => restoreBackup(backup, storage), /Existing data was preserved/);
  assert.deepEqual(JSON.parse(initial.get(PROFILE_STORAGE_KEY)!), { old: 'profile' });
  assert.deepEqual(JSON.parse(initial.get(INVOICES_STORAGE_KEY)!), [{ old: 'invoice' }]);
});
