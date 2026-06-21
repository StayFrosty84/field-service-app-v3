import { useEffect, useMemo, useState } from 'react';
import { listCatalog } from '../db/db.js';
import { money } from '../lib/format.js';
import SearchBar from './SearchBar.jsx';

// Bottom-sheet that lists saved parts/labor; tapping one calls onPick (stays open so
// several can be added quickly). Close via Done or the backdrop.
export default function CatalogPicker({ onPick, onClose }) {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    listCatalog().then(setItems);
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.description.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Add from catalog</h2>

        {items && items.length === 0 && (
          <p className="muted">
            No saved items yet. Add parts &amp; labor presets in Settings → Parts &amp; Labor catalog.
          </p>
        )}

        {items && items.length > 0 && (
          <>
            <SearchBar value={query} onChange={setQuery} placeholder="Search catalog…" />
            <div className="list">
              {filtered.map((it) => (
                <button
                  key={it.id}
                  className="list-item"
                  style={{ textAlign: 'left' }}
                  onClick={() => onPick(it)}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="list-item__title">{it.description}</span>
                    <span>{money(it.unitPrice)}</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="muted">No matches.</p>}
            </div>
          </>
        )}

        <button className="btn" style={{ marginTop: 14 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
