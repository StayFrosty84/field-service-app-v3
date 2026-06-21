import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';
import SearchBar from '../components/SearchBar.jsx';

export default function Accounts() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const accounts = useLiveQuery(() => db.accounts.orderBy('name').toArray());

  const filtered = useMemo(() => {
    if (!accounts) return [];
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      [a.name, a.phone, a.email, a.address].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [accounts, query]);

  if (!accounts) return null;

  return (
    <>
      <h1 style={{ marginTop: 4 }}>Accounts</h1>

      {accounts.length === 0 && (
        <div className="empty">
          <span className="ico">🏢</span>
          No accounts yet.
        </div>
      )}

      {accounts.length > 0 && (
        <SearchBar value={query} onChange={setQuery} placeholder="Search accounts…" />
      )}

      {accounts.length > 0 && filtered.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
          No matches.
        </p>
      )}

      <div className="list">
        {filtered.map((a) => (
          <Link key={a.id} className="list-item" to={`/accounts/${a.id}`}>
            <p className="list-item__title">{a.name}</p>
            <p className="list-item__sub">{[a.phone, a.address].filter(Boolean).join(' · ') || '—'}</p>
          </Link>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/accounts/new')} aria-label="New account">
        ＋
      </button>
    </>
  );
}
