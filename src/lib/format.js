export const money = (n) =>
  (Number(n) || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export const fmtDate = (ts) =>
  ts ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

// <input type="date"> helpers (local-time safe).
export const toDateInput = (ts) => {
  const d = ts ? new Date(ts) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const fromDateInput = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
};

export const fmtDateTime = (ts) =>
  ts
    ? new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

// Bill-of-sale totals from line items + optional tax and credit-card surcharge.
// The card fee (when applied) is charged on subtotal + tax — the amount that hits the card.
export function computeTotals(lineItems = [], taxRate = 0, ccFeeRate = 0, ccFeeApplied = false) {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + (Number(li.qty) || 0) * (Number(li.unitPrice) || 0),
    0
  );
  const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
  const beforeFee = subtotal + taxAmount;
  const ccFeeAmount = ccFeeApplied ? beforeFee * ((Number(ccFeeRate) || 0) / 100) : 0;
  return { subtotal, taxAmount, ccFeeAmount, total: beforeFee + ccFeeAmount };
}
