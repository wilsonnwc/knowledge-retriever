import React, { useState } from 'react';

// Revised with the user on 2026-10-05 (mobile reviews):
// - Toggle buttons, no Undo button: unselected = light tint + coloured border, selected = filled. Tapping a
//   selected button undoes that press (history-based: Later → Completed, tap Completed again → back to Later).
// - A reading status — Completed / Later / Skip, in the order of the reading flow — one at a time; picking
//   another replaces it. 'read_now' is the retired "Read now" (no button; it reads as nothing selected).
// - Build is a separate flag beside any status, styled apart; it takes an optional typed note.
// - Skip asks "why?" with multi-select reason pills, then ✓ saves (no pill = skip without a reason) or ✕ goes
//   back without skipping. Only the "Other…" pill opens a text box (and the phone keyboard). Several reasons are
//   stored as one text joined by REASON_SEP, so they split back into countable categories.
export const STATUS_BUTTONS = [
  { action: 'read', label: 'Completed', tone: 'completed' },
  { action: 'later', label: 'Later', tone: 'later' },
  { action: 'dismiss', label: 'Skip', tone: 'skip' },
];
// Statuses that still leave the reading open (the card isn't greyed out): Later and the retired "Read now".
export const OPEN_STATUSES = ['later', 'read_now'];
export const SKIP_REASONS = ['Not relevant', 'Already know it', 'Low quality'];
export const OTHER = 'Other…';
export const REASON_SEP = '; ';

function DecisionButtons({ state, onDecide, onUndo, compact = false }) {
  const [asking, setAsking] = useState(null); // 'skip' (reason pills) | 'build' | null
  const [text, setText] = useState('');
  const [picked, setPicked] = useState([]);  // skip reasons selected so far
  const [busy, setBusy] = useState(false);

  const run = (fn) => {
    setBusy(true);
    return Promise.resolve(fn()).finally(() => setBusy(false));
  };
  const reset = () => { setAsking(null); setText(''); setPicked([]); };
  const toggle = (r) => setPicked((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));
  // a stale note must never become the next reason; a failed save keeps the question open (the page shows the error)
  const save = (action, reason) => run(() => onDecide(action, { reason: reason || undefined })).then(reset).catch(() => {});

  if (asking === 'skip') {
    const other = picked.includes(OTHER);
    const reasons = [...SKIP_REASONS.filter((r) => picked.includes(r)), ...(other && text.trim() ? [text.trim()] : [])];
    return (
      <div className="decision-ask" role="group" aria-label="Why skip it?">
        <span className="reason-chips-label">Why skip it? Pick any, then ✓</span>
        <div className="reason-chips">
          {[...SKIP_REASONS, OTHER].map((r) => (
            <button key={r} className={`today-btn toggle tone-skip reason-chip ${picked.includes(r) ? 'on' : ''}`}
                    aria-pressed={picked.includes(r)} disabled={busy} onClick={() => toggle(r)}>
              {r}
            </button>
          ))}
        </div>
        {other && (
          <textarea autoFocus rows={2} value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Other reason" aria-label="Skip reason" />
        )}
        <div className="decision-row confirm-row">
          <button className="today-btn toggle tone-skip on" disabled={busy} aria-label="Save skip"
                  onClick={() => save('dismiss', reasons.join(REASON_SEP))}>✓</button>
          <button className="today-btn ghost" disabled={busy} aria-label="Cancel skip" onClick={reset}>✕</button>
        </div>
      </div>
    );
  }

  if (asking === 'build') {
    return (
      <div className="decision-ask">
        <textarea autoFocus rows={2} value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="What would you build? (optional)" aria-label="Build note" />
        <div className="decision-row">
          <button className="today-btn primary" disabled={busy} onClick={() => save('build', text.trim())}>Save build idea</button>
          <button className="today-btn ghost" onClick={reset}>Cancel</button>
        </div>
      </div>
    );
  }

  const press = (b) => {
    if (state.status === b.action) return run(() => onUndo(state.status_event_id)); // tap again = undo
    if (b.action === 'dismiss') return setAsking('skip');
    return run(() => onDecide(b.action));
  };
  return (
    <div className={`decision ${compact ? 'compact' : ''}`}>
      <div className="decision-row">
        {STATUS_BUTTONS.map((b) => {
          const on = state.status === b.action;
          return (
            <button key={b.action} className={`today-btn toggle tone-${b.tone} ${on ? 'on' : ''}`} aria-pressed={on}
                    disabled={busy} onClick={() => press(b)}>
              {on && '✓ '}{b.label}
            </button>
          );
        })}
        <button className={`today-btn toggle tone-build ${state.build ? 'on' : ''}`} aria-pressed={state.build}
                disabled={busy}
                onClick={() => (state.build ? run(() => onUndo(state.build_event_id)) : setAsking('build'))}>
          {state.build ? '✓' : '🛠'} Build
        </button>
      </div>
      {state.status === 'dismiss' && state.reason && <p className="decision-note">Skipped: “{state.reason}”</p>}
      {state.build && state.build_note && <p className="decision-note">Build idea: “{state.build_note}”</p>}
    </div>
  );
}

export default DecisionButtons;
