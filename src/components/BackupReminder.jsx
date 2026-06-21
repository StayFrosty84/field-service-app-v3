import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lastBackupAt } from '../lib/backup.js';

const DISMISS_KEY = 'fs-backup-reminder-dismissed';
const STALE_DAYS = 14;

// Shown on Home when there's data and no recent backup. Dismissal lasts the session only —
// a backup safety nudge shouldn't be hidden forever.
export default function BackupReminder({ hasData }) {
  const [dismissed, setDismissed] = useState(sessionStorage.getItem(DISMISS_KEY) === '1');
  if (!hasData || dismissed) return null;

  const last = lastBackupAt();
  const stale = !last || Date.now() - last > STALE_DAYS * 86400000;
  if (!stale) return null;

  return (
    <div className="banner">
      <span>⚠️</span>
      <span>
        {last ? 'It’s been a while since your last backup. ' : 'You haven’t backed up yet. '}
        <Link to="/settings">Back up now</Link>
      </span>
      <button
        className="b-x"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1');
          setDismissed(true);
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
