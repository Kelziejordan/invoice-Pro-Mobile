export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  if (isNaN(amount)) return formatCurrency(0, currencyCode);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}
