import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';
import SearchBar from '../components/SearchBar.jsx';

export default function Contacts() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const data = useLiveQuery(async () => {
    const contacts = await db.contacts.orderBy('name').toArray();
    const accounts = Object.fromEntries((await db.accounts.toArray()).map((a) => [a.id, a]));
    return { contacts, accounts };
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.contacts;
    return data.contacts.filter((c) => {
      const acct = data.accounts[c.accountId]?.name || '';
      return [c.name, c.phone, c.email, c.role, acct].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [data, query]);

  if (!data) return null;
  const { contacts, accounts } = data;

  return (
    <>
      <h1 style={{ marginTop: 4 }}>Contacts</h1>

      {contacts.length === 0 && (
        <div className="empty">
          <span className="ico">👤</span>
          No contacts yet.
        </div>
      )}

      {contacts.length > 0 && (
        <SearchBar value={query} onChange={setQuery} placeholder="Search contacts…" />
      )}

      {contacts.length > 0 && filtered.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
          No matches.
        </p>
      )}

      <div className="list">
        {filtered.map((c) => (
          <Link key={c.id} className="list-item" to={`/contacts/${c.id}`}>
            <p className="list-item__title">{c.name}</p>
            <p className="list-item__sub">
              {[accounts[c.accountId]?.name, c.phone].filter(Boolean).join(' · ') || '—'}
            </p>
          </Link>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/contacts/new')} aria-label="New contact">
        ＋
      </button>
    </>
  );
}
