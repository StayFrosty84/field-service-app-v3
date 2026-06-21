import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';
import { fmtDate } from '../lib/format.js';
import SearchBar from '../components/SearchBar.jsx';

export default function Work() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | open | completed

  const data = useLiveQuery(async () => {
    const orders = await db.workOrders.orderBy('createdAt').reverse().toArray();
    const accounts = Object.fromEntries((await db.accounts.toArray()).map((a) => [a.id, a]));
    return { orders, accounts };
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      const acct = data.accounts[o.accountId]?.name || '';
      return (
        acct.toLowerCase().includes(q) ||
        (o.issue || '').toLowerCase().includes(q) ||
        (o.location?.text || '').toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  if (!data) return null;
  const { orders, accounts } = data;

  return (
    <>
      <h1 style={{ marginTop: 4 }}>Work Orders</h1>

      {orders.length === 0 && (
        <div className="empty">
          <span className="ico">🧰</span>
          No work orders yet.
          <br />
          Tap ＋ to log your first job.
        </div>
      )}

      {orders.length > 0 && (
        <>
          <SearchBar value={query} onChange={setQuery} placeholder="Search jobs, customers, locations…" />
          <div className="chips">
            {[
              ['all', 'All'],
              ['open', 'Open'],
              ['completed', 'Completed'],
            ].map(([val, label]) => (
              <button key={val} className={`chip ${filter === val ? 'chip--active' : ''}`} onClick={() => setFilter(val)}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {orders.length > 0 && filtered.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>No matches.</p>
      )}

      <div className="list">
        {filtered.map((o) => (
          <OrderRow key={o.id} order={o} account={accounts[o.accountId]} />
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/work-orders/new')} aria-label="New work order">
        ＋
      </button>
    </>
  );
}

function OrderRow({ order, account }) {
  return (
    <Link className="list-item" to={`/work-orders/${order.id}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="list-item__title">{account?.name || 'Unknown account'}</p>
        <span className={`badge badge--${order.status}`}>{order.status}</span>
      </div>
      <p className="list-item__sub">
        {order.issue ? order.issue.slice(0, 80) : 'No issue noted'} · {fmtDate(order.serviceDate)}
      </p>
    </Link>
  );
}
