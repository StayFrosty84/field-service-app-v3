export const money = (n) =>
  (Number(n) || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export const fmtDate = (ts) =>
  ts ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

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
