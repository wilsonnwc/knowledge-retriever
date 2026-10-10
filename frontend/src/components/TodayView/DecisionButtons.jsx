import React, { useState } from 'react';

// Revised with the user on 2026-10-05 (mobile reviews):
// - Toggle buttons, no Undo button: unselected = light tint + coloured border, selected = filled. Tapping a
//   selected button undoes that press (history-based: Later → Useful, tap Useful again → back to Later).
// - A reading status — Useful / Later / Not useful, in the order of the reading flow — one at a time; picking
//   another replaces it. 'read_now' is the retired "Read now" (no button; it reads as nothing selected).
// - Build is a separate flag beside any status, styled apart; it takes an optional typed note.
// - Not useful asks "why?" with multi-select reason pills, then ✓ saves (no pill = no reason) or ✕ goes back
//   without saving. Only the "Other…" pill opens a text box (and the phone keyboard). Several reasons are
//   stored as one text joined by REASON_SEP, so they split back into countable categories.
// Revised with the user on 2026-10-10 (system/signal-model.md): Completed → Useful, Skip → Not useful, on the
// card and in the reader alike; `surface` ('card' | 'reader') goes with every press, so the same tap says whether
// the summary or the article was judged. The stored codes stay 'read' / 'dismiss'.
export const STATUS_BUTTONS = [
  { action: 'read', label: 'Useful', tone: 'completed' },
  { action: 'later', label: 'Later', tone: 'later' },
  { action: 'dismiss', label: 'Not useful', tone: 'skip' },
];
// Statuses that still leave the reading open (the card isn't greyed out): Later and the retired "Read now".
export const OPEN_STATUSES = ['later', 'read_now'];
export const SKIP_REASONS = ['Not relevant', 'Already know it', 'Low quality'];
export const READER_ONLY_REASON = 'Summary was enough'; // topic fine, but the article added nothing
export const OTHER = 'Other…';
export const REASON_SEP = '; ';

function DecisionButtons({ state, onDecide, onUndo, surface, compact = false }) {
  const reasonChoices = surface === 'reader' ? [...SKIP_REASONS, READER_ONLY_REASON] : SKIP_REASONS;
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
  const save = (action, reason) => run(() => onDecide(action, { reason: reason || undefined, surface })).then(reset).catch(() => {});

  if (asking === 'skip') {
    const other = picked.includes(OTHER);
    const reasons = [...reasonChoices.filter((r) => picked.includes(r)), ...(other && text.trim() ? [text.trim()] : [])];
    return (
      <div className="decision-ask" role="group" aria-label="Why not useful?">
        <span className="reason-chips-label">Why not useful? Pick any, then ✓</span>
        <div className="reason-chips">
          {[...reasonChoices, OTHER].map((r) => (
            <button key={r} className={`today-btn toggle tone-skip reason-chip ${picked.includes(r) ? 'on' : ''}`}
                    aria-pressed={picked.includes(r)} disabled={busy} onClick={() => toggle(r)}>
              {r}
            </button>
          ))}
        </div>
        {other && (
          <textarea autoFocus rows={2} value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Other reason" aria-label="Not useful reason" />
        )}
        <div className="decision-row confirm-row">
          <button className="today-btn toggle tone-skip on" disabled={busy} aria-label="Save not useful"
                  onClick={() => save('dismiss', reasons.join(REASON_SEP))}>✓</button>
          <button className="today-btn ghost" disabled={busy} aria-label="Cancel not useful" onClick={reset}>✕</button>
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
    return run(() => onDecide(b.action, { surface }));
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
      {state.status === 'dismiss' && state.reason && <p className="decision-note">Not useful: “{state.reason}”</p>}
      {state.build && state.build_note && <p className="decision-note">Build idea: “{state.build_note}”</p>}
    </div>
  );
}

export default DecisionButtons;
