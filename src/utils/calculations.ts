// filepath: src/utils/calculations.ts
import { InvoiceItem } from '../schemas/invoice.schema';

export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calculateTax(subtotal: number, taxRatePercentage: number): number {
  return subtotal * (taxRatePercentage / 100);
}

export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}
