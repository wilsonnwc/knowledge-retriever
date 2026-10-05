import React, { useState } from 'react';

// Revised with the user on 2026-10-05 (mobile reviews):
// - A reading status — Completed / Later / Skip, in the order of the reading flow — one at a time; picking
//   another replaces it. After Later, Completed and Skip stay on offer. 'read_now' is the retired "Read now".
// - Build is a separate flag that can sit beside any status, with its own Undo, styled apart from the rest.
// - Skip (stored as 'dismiss') asks "why?" with one-tap reason chips, so the phone keyboard only opens for
//   "Other…"; Build takes an optional typed note.
export const STATUS_LABELS = { read: 'Completed', later: 'Saved for later', dismiss: 'Skipped', read_now: 'Reading' };
// Statuses that still leave the reading open: Later, and the retired "Read now" (meant "about to read").
export const OPEN_STATUSES = ['later', 'read_now'];
export const SKIP_REASONS = ['Not relevant', 'Already know it', 'Low quality'];

function DecisionButtons({ state, onDecide, onUndo, compact = false }) {
  const [asking, setAsking] = useState(null); // 'skip' (chips) | 'skip-other' | 'build' | null
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = (fn) => {
    setBusy(true);
    return Promise.resolve(fn()).finally(() => setBusy(false));
  };
  const reset = () => { setAsking(null); setText(''); };
  // a stale note must never become the next reason; a failed save keeps the question open (the page shows the error)
  const save = (action, reason) => run(() => onDecide(action, { reason: reason || undefined })).then(reset).catch(() => {});

  if (asking === 'skip') {
    return (
      <div className="reason-chips decision-ask" role="group" aria-label="Why skip it?">
        <span className="reason-chips-label">Why skip it?</span>
        {SKIP_REASONS.map((r) => (
          <button key={r} className="today-btn reason-chip" disabled={busy} onClick={() => save('dismiss', r)}>{r}</button>
        ))}
        <button className="today-btn reason-chip" disabled={busy} onClick={() => save('dismiss')}>Just skip</button>
        <button className="today-btn reason-chip" disabled={busy} onClick={() => setAsking('skip-other')}>Other…</button>
        <button className="today-btn ghost" onClick={reset}>Cancel</button>
      </div>
    );
  }

  if (asking) {
    const isSkip = asking === 'skip-other';
    return (
      <div className="decision-ask">
        <textarea
          autoFocus
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isSkip ? 'Why skip it?' : 'What would you build? (optional)'}
          aria-label={isSkip ? 'Skip reason' : 'Build note'}
        />
        <div className="decision-row">
          <button className="today-btn primary" disabled={busy}
                  onClick={() => save(isSkip ? 'dismiss' : 'build', text.trim())}>
            {isSkip ? 'Skip' : 'Save build idea'}
          </button>
          <button className="today-btn ghost" onClick={reset}>Cancel</button>
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
          <button className="today-btn btn-completed" disabled={busy} onClick={() => run(() => onDecide('read'))}>Completed</button>
          {!status && <button className="today-btn btn-later" disabled={busy} onClick={() => run(() => onDecide('later'))}>Later</button>}
          <button className="today-btn btn-skip" disabled={busy} onClick={() => setAsking('skip')}>Skip</button>
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
        <button className="today-btn btn-build" disabled={busy} onClick={() => setAsking('build')}>🛠 Build</button>
      )}
    </div>
  );
}

export default DecisionButtons;
