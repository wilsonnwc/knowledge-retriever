import React, { useState } from 'react';

// Revised with the user on 2026-10-05 (first mobile review):
// - A reading status — Later / Completed / Skip — one at a time; picking another replaces it. After Later,
//   Completed and Skip stay on offer (that's the point of Later). 'read_now' is the retired "Read now".
// - Build is a separate flag that can sit beside any status, with its own Undo.
// - Skip (stored as 'dismiss') and Build both offer an optional note.
export const STATUS_LABELS = { read: 'Completed', later: 'Saved for later', dismiss: 'Skipped', read_now: 'Reading' };
// Statuses that still leave the reading open: Later, and the retired "Read now" (meant "about to read").
export const OPEN_STATUSES = ['later', 'read_now'];

function DecisionButtons({ state, onDecide, onUndo, compact = false }) {
  const [asking, setAsking] = useState(null); // 'dismiss' | 'build' | null
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = (fn) => {
    setBusy(true);
    return Promise.resolve(fn()).finally(() => setBusy(false));
  };
  const decide = (action) => run(() => onDecide(action));

  if (asking) {
    const isSkip = asking === 'dismiss';
    return (
      <div className="decision-ask">
        <textarea
          autoFocus
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isSkip ? 'Why skip it? (optional)' : 'What would you build? (optional)'}
          aria-label={isSkip ? 'Skip reason' : 'Build note'}
        />
        <div className="decision-row">
          <button
            className="today-btn primary"
            disabled={busy}
            onClick={() => run(() => onDecide(asking, { reason: text.trim() || undefined }))
              .then(() => { setAsking(null); setText(''); })  // a stale note must never become the next reason
              .catch(() => {})}  // save failed: keep the box open with the text; the page shows the error
          >
            {isSkip ? 'Skip' : 'Save build idea'}
          </button>
          <button className="today-btn ghost" onClick={() => { setAsking(null); setText(''); }}>Cancel</button>
        </div>
      </div>
    );
  }

  const status = state.status;
  const offerStatus = !status || OPEN_STATUSES.includes(status);
  return (
    <div className={`decision-row ${compact ? 'compact' : ''}`}>
      {status && (
        <span className="decision-chip">
          <span className="decision-done-label">✓ {STATUS_LABELS[status]}</span>
          {state.reason && <span className="decision-done-reason">“{state.reason}”</span>}
          <button className="today-btn ghost" disabled={busy}
                  onClick={() => run(() => onUndo(state.status_event_id))} aria-label={`Undo ${STATUS_LABELS[status]}`}>
            Undo
          </button>
        </span>
      )}
      {offerStatus && (
        <>
          {!status && <button className="today-btn" disabled={busy} onClick={() => decide('later')}>Later</button>}
          <button className="today-btn" disabled={busy} onClick={() => decide('read')}>Completed</button>
          <button className="today-btn" disabled={busy} onClick={() => setAsking('dismiss')}>Skip</button>
        </>
      )}
      {state.build ? (
        <span className="decision-chip">
          <span className="decision-done-label">🛠 Build idea</span>
          {state.build_note && <span className="decision-done-reason">“{state.build_note}”</span>}
          <button className="today-btn ghost" disabled={busy}
                  onClick={() => run(() => onUndo(state.build_event_id))} aria-label="Undo Build idea">
            Undo
          </button>
        </span>
      ) : (
        <button className="today-btn" disabled={busy} onClick={() => setAsking('build')}>Build</button>
      )}
    </div>
  );
}

export default DecisionButtons;
