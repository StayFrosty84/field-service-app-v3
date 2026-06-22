import { useRef, useState } from 'react';

// Touch + mouse drag-to-reorder using Pointer Events (HTML5 draggable doesn't work
// on phones). Only the drag handle starts a drag; everything else (inputs, buttons)
// stays interactive. The list reorders live as you drag past each row's midpoint.
//
// renderItem(item, index, handleProps) — spread handleProps onto your drag handle.
export default function SortableList({ items, getKey, onReorder, renderItem }) {
  const containerRef = useRef(null);
  const drag = useRef({ pointerId: null, handle: null });
  const [draggingKey, setDraggingKey] = useState(null);

  function down(e, key) {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { pointerId: e.pointerId, handle: e.currentTarget };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setDraggingKey(key);
  }

  function move(e) {
    if (drag.current.pointerId == null || e.pointerId !== drag.current.pointerId) return;
    const container = containerRef.current;
    if (!container) return;
    const rows = [...container.querySelectorAll('[data-sortable-row]')];
    const y = e.clientY;
    let target = rows.length - 1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { target = i; break; }
    }
    const from = items.findIndex((it) => getKey(it) === draggingKey);
    if (from === -1 || from === target) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    onReorder(next);
  }

  function up(e) {
    if (e.pointerId !== drag.current.pointerId) return;
    try { drag.current.handle?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    drag.current = { pointerId: null, handle: null };
    setDraggingKey(null);
  }

  return (
    <div ref={containerRef}>
      {items.map((item, i) => {
        const key = getKey(item);
        const handleProps = {
          className: 'drag-handle',
          'aria-label': 'Drag to reorder',
          onPointerDown: (e) => down(e, key),
          onPointerMove: move,
          onPointerUp: up,
          onPointerCancel: up,
        };
        return (
          <div key={key} data-sortable-row className={draggingKey === key ? 'sortable-dragging' : ''}>
            {renderItem(item, i, handleProps)}
          </div>
        );
      })}
    </div>
  );
}
