import React, { useState } from 'react';

export const DONE_LABELS = { read_now: 'Reading', later: 'Saved for later', build: 'To build', dismiss: 'Dismissed' };

// The four decisions. Dismiss needs a reason (it feeds error analysis); Build takes an optional note.
// After a decision the card shows what was chosen plus Undo, instead of disappearing.
function DecisionButtons({ state, onDecide, onUndo, compact = false }) {
  const [asking, setAsking] = useState(null); // 'dismiss' | 'build' | null
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = (fn) => {
    setBusy(true);
    return Promise.resolve(fn()).finally(() => setBusy(false));
  };

  if (state.decision) {
    return (
      <div className={`decision-done ${compact ? 'compact' : ''}`}>
        <span className="decision-done-label">✓ {DONE_LABELS[state.decision]}</span>
        {state.reason && <span className="decision-done-reason">“{state.reason}”</span>}
        <button className="today-btn ghost" disabled={busy} onClick={() => run(() => onUndo(state.decision_event_id))}>
          Undo
        </button>
      </div>
    );
  }

  if (asking) {
    const isDismiss = asking === 'dismiss';
    const ready = !isDismiss || text.trim().length > 0;
    return (
      <div className="decision-ask">
        <textarea
          autoFocus
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isDismiss ? 'Why dismiss it? (required)' : 'What would you build? (optional)'}
          aria-label={isDismiss ? 'Dismiss reason' : 'Build note'}
        />
        <div className="decision-row">
          <button
            className="today-btn primary"
            disabled={!ready || busy}
            onClick={() => run(() => onDecide(asking, { reason: text.trim() || undefined }))
              .then(() => { setAsking(null); setText(''); })  // a stale note must never become the next reason
              .catch(() => {})}  // save failed: keep the box open with the text; the page shows the error
          >
            {isDismiss ? 'Dismiss' : 'Save build idea'}
          </button>
          <button className="today-btn ghost" onClick={() => { setAsking(null); setText(''); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`decision-row ${compact ? 'compact' : ''}`}>
      <button className="today-btn" disabled={busy} onClick={() => run(() => onDecide('read_now'))}>Read now</button>
      <button className="today-btn" disabled={busy} onClick={() => run(() => onDecide('later'))}>Later</button>
      <button className="today-btn" disabled={busy} onClick={() => setAsking('build')}>Build</button>
      <button className="today-btn" disabled={busy} onClick={() => setAsking('dismiss')}>Dismiss</button>
    </div>
  );
}

export default DecisionButtons;
