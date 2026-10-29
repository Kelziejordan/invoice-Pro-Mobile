export function formatCurrency(amount: number, currencyCode: string = 'CAD'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    const locale = currencyCode === 'CAD' ? 'en-CA' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
    // Explicitly label Canadian dollars to avoid confusion with USD.
    return currencyCode === 'CAD' ? formatted.replace(/^\s*\$/, 'CA$') : formatted;
  } catch {
    return `${currencyCode} ${safeAmount.toFixed(2)}`;
  }
}
