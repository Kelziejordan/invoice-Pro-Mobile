import { InvoiceItem } from '../schemas/invoice.schema';

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseQuantity(quantity: number | string): number {
  if (typeof quantity === 'number') {
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  }

  // Quantities may include units ("6 hrs", "2 days"). Parse only the leading
  // numeric quantity; malformed text must never silently become one billable unit.
  const match = quantity.trim().match(/^(\d+(?:\.\d+)?|\.\d+)/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getItemAmount(item: InvoiceItem): number {
  const quantity = parseQuantity(item.quantity);
  const unitPrice = Number(item.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return 0;
  return roundMoney(quantity * unitPrice);
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  if (!Array.isArray(items)) return 0;
  return roundMoney(items.reduce((sum, item) => sum + getItemAmount(item), 0));
}

export function calculateTax(subtotal: number, taxRate: number): number {
  const validSubtotal = Number.isFinite(Number(subtotal)) ? Math.max(0, Number(subtotal)) : 0;
  const validRate = Number.isFinite(Number(taxRate)) ? Math.max(0, Number(taxRate)) : 0;
  return roundMoney(validSubtotal * (validRate / 100));
}

export function calculateTotal(subtotal: number, tax: number, discount: number = 0): number {
  const validSubtotal = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
  const validTax = Number.isFinite(Number(tax)) ? Number(tax) : 0;
  const validDiscount = Number.isFinite(Number(discount)) ? Math.max(0, Number(discount)) : 0;
  return roundMoney(Math.max(0, validSubtotal + validTax - validDiscount));
}
