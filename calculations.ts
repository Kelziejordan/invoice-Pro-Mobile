import { InvoiceItem } from '../schemas/invoice.schema';

export function getItemAmount(item: InvoiceItem): number {
  const qty = typeof item.quantity === 'string' 
    ? (isNaN(Number(item.quantity)) ? 1 : Number(item.quantity)) 
    : (Number(item.quantity) || 0);
  const price = Number(item.unitPrice) || 0;
  return qty * price;
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + getItemAmount(item), 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  const validSubtotal = Number(subtotal) || 0;
  const validRate = Number(taxRate) || 0;
  return validSubtotal * (validRate / 100);
}

export function calculateTotal(subtotal: number, tax: number, discount: number = 0): number {
  const validSubtotal = Number(subtotal) || 0;
  const validTax = Number(tax) || 0;
  const validDiscount = Number(discount) || 0;
  return Math.max(0, validSubtotal + validTax - validDiscount);
}
