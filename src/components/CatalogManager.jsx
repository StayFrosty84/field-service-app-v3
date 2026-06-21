import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createCatalogItem, deleteCatalogItem } from '../db/db.js';
import { money } from '../lib/format.js';
import { useToast } from './Toast.jsx';

// Manage saved parts/labor presets used by the bill editor's "Add from catalog".
export default function CatalogManager() {
  const toast = useToast();
  const items = useLiveQuery(() => db.catalogItems.orderBy('description').toArray());
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');

  async function add() {
    if (!desc.trim()) return toast('Enter a description');
    await createCatalogItem({ description: desc.trim(), unitPrice: Number(price) || 0 });
    setDesc('');
    setPrice('');
    toast('Added to catalog');
  }

  async function remove(id, description) {
    if (!confirm(`Remove "${description}" from the catalog?`)) return;
    await deleteCatalogItem(id);
  }

  if (!items) return null;

  return (
    <div className="card">
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
        Saved parts &amp; labor you can tap to add on a bill (e.g. “Service call”, “Labor / hr”).
      </p>

      <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <span className="muted" style={{ fontSize: 12 }}>Description</span>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Service call" />
        </div>
        <div style={{ flex: 1 }}>
          <span className="muted" style={{ fontSize: 12 }}>Price</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={add}>
        ＋ Add item
      </button>

      {items.length > 0 && (
        <div className="list" style={{ marginTop: 14 }}>
          {items.map((it) => (
            <div key={it.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                {it.description} <span className="muted">· {money(it.unitPrice)}</span>
              </span>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => remove(it.id, it.description)}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
