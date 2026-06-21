import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getProfile } from '../db/db.js';
import { money, fmtDate } from '../lib/format.js';

export default function Billing() {
  const [showPaid, setShowPaid] = useState(false);

  const data = useLiveQuery(async () => {
    const bills = await db.billsOfSale.orderBy('createdAt').reverse().toArray();
    const accounts = Object.fromEntries((await db.accounts.toArray()).map((a) => [a.id, a]));
    const orders = Object.fromEntries((await db.workOrders.toArray()).map((o) => [o.id, o]));
    const profile = await getProfile();
    return { bills, accounts, orders, profile };
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    let outstanding = 0;
    let mtd = 0;
    let ytd = 0;
    for (const b of data.bills) {
      if (b.paymentStatus !== 'paid') outstanding += b.total || 0;
      const t = b.pdfGeneratedAt || b.createdAt || 0;
      if (t >= monthStart) mtd += b.total || 0;
      if (t >= yearStart) ytd += b.total || 0;
    }
    return { outstanding, mtd, ytd };
  }, [data]);

  if (!data) return null;
  const { bills, accounts, orders, profile } = data;
  const prefix = profile?.billPrefix || 'BOS-';
  const visible = showPaid ? bills : bills.filter((b) => b.paymentStatus !== 'paid');

  return (
    <>
      <h1 style={{ marginTop: 4 }}>Billing</h1>

      {bills.length === 0 ? (
        <div className="empty">
          <span className="ico">💵</span>
          No bills yet.
          <br />
          Generate a Bill of Sale from a completed work order.
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat stat--wide">
              <div className="stat__label">Outstanding</div>
              <div className="stat__value" style={{ color: stats.outstanding > 0 ? 'var(--badge-open-fg)' : 'inherit' }}>
                {money(stats.outstanding)}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">Billed this month</div>
              <div className="stat__value">{money(stats.mtd)}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Billed this year</div>
              <div className="stat__value">{money(stats.ytd)}</div>
            </div>
          </div>

          <div className="chips">
            <button
              className={`chip ${!showPaid ? 'chip--active' : ''}`}
              onClick={() => setShowPaid(false)}
            >
              Unpaid ({bills.filter((b) => b.paymentStatus !== 'paid').length})
            </button>
            <button
              className={`chip ${showPaid ? 'chip--active' : ''}`}
              onClick={() => setShowPaid(true)}
            >
              All ({bills.length})
            </button>
          </div>

          {visible.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
              Nothing outstanding — you're all paid up. 🎉
            </p>
          )}

          <div className="list">
            {visible.map((b) => {
              const acct = accounts[orders[b.workOrderId]?.accountId];
              const paid = b.paymentStatus === 'paid';
              return (
                <Link key={b.id} className="list-item" to={`/work-orders/${b.workOrderId}`}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <p className="list-item__title">{acct?.name || 'Unknown'}</p>
                    <span className={`badge badge--${paid ? 'paid' : 'unpaid'}`}>
                      {paid ? 'paid' : 'unpaid'}
                    </span>
                  </div>
                  <p className="list-item__sub">
                    {b.billNumber ? `${prefix}${String(b.billNumber).padStart(4, '0')} · ` : ''}
                    {money(b.total || 0)} · {fmtDate(b.pdfGeneratedAt || b.createdAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
