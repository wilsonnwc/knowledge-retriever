import React, { useCallback, useEffect, useState } from 'react';
import TodayCard from './TodayCard';
import Reader from './Reader';
import * as api from '../../api/client';
import './TodayView.css';

const SECTIONS = ['top', 'next', 'rest', 'junk'];

function formatDay(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function lastUpdatedText(lu) {
  if (!lu) return 'Not updated yet';
  const t = new Date(lu.finished_at);
  return `Last updated ${t.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`;
}

// Junk today: the Haiku judge's borderline calls first (worth a look when time is short), then
// everything the rules filtered (tickers, polls, footer links) underneath.
export function splitJunk(junk) {
  const borderline = junk.filter((c) => (c.class_reason || '').startsWith('judge'));
  return [['Borderline calls', borderline], ['Filtered by rules', junk.filter((c) => !borderline.includes(c))]];
}

// Everything else arrives sorted (oldest email first, each newsletter in its own order): split it into
// one group per newsletter, keeping that order.
export function groupBySource(rows) {
  const groups = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0] === row.source) last[1].push(row);
    else groups.push([row.source, [row]]);
  }
  return groups;
}

// The daily triage page: Top 3 and Next 7 as cards, everything else as compact rows, plus the
// Later list and the "Junk today" list with its "Not junk" corrections.
function TodayView() {
  const [date, setDate] = useState(null);
  const [page, setPage] = useState(null);
  const [later, setLater] = useState([]);
  const [tab, setTab] = useState('today'); // today | later | junk
  const [reading, setReading] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    return api.fetchToday(date).then(setPage).catch((e) => setError(e.message));
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'later') api.fetchLater().then(setLater).catch((e) => setError(e.message)); }, [tab]);

  // Apply a card's new state everywhere it is shown, without refetching the page.
  const applyState = (itemId, state) => {
    setPage((p) => p && Object.fromEntries(Object.entries(p).map(([k, v]) =>
      [k, SECTIONS.includes(k) ? v.map((c) => (c.id === itemId ? { ...c, state } : c)) : v])));
    setLater((l) => l.map((c) => (c.id === itemId ? { ...c, state } : c)));
    setReading((r) => (r && r.id === itemId ? { ...r, state } : r));
  };

  const afterPress = (itemId) => ({ state, metrics }) => {
    applyState(itemId, state);
    setPage((p) => (p ? { ...p, metrics } : p));
  };

  // A failed save is never silent: the error is shown and re-thrown so the buttons keep their input.
  const decide = (itemId, action, opts = {}) =>
    api.recordEvent(itemId, action, opts)
      .then(afterPress(itemId))
      .catch((e) => { setError(`Couldn't save that — ${e.message}`); throw e; });

  const undo = (itemId, eventId) =>
    api.recordEvent(itemId, 'undo', { undoesEventId: eventId })
      .then(afterPress(itemId))
      .catch((e) => setError(`Couldn't undo — ${e.message}`));

  const notJunk = (itemId) =>
    api.recordEvent(itemId, 'not_junk').then(load).catch((e) => setError(`Couldn't save that — ${e.message}`));

  if (!page && !error) return <div className="today"><p className="today-muted">Loading today…</p></div>;
  const m = page && page.metrics;
  const handlers = { onOpen: setReading, onDecide: decide, onUndo: undo };

  return (
    <div className="today">
      <header className="today-header">
        <div>
          <h1>{page && page.date ? formatDay(page.date) : 'Today'}</h1>
          {page && <p className="today-muted">{lastUpdatedText(page.last_updated)}</p>}
        </div>
        {page && page.previous_dates.length > 0 && (() => {
          // every digest day including the one shown, newest first; the newest one means "latest"
          const days = [...new Set([page.date, ...page.previous_dates])].sort().reverse();
          return (
            <select className="today-days" aria-label="Previous days" value={page.date}
                    onChange={(e) => { setDate(e.target.value === days[0] ? null : e.target.value); setTab('today'); }}>
              {days.map((d, i) => <option key={d} value={d}>{i === 0 ? `Latest — ${formatDay(d)}` : formatDay(d)}</option>)}
            </select>
          );
        })()}
      </header>

      {m && (
        <div className="today-metrics" aria-label="Your progress">
          Active <strong>{m.active_days}</strong> of {m.days_so_far} days this month · <strong>{m.actioned_today}</strong>{' '}
          {m.actioned_today === 1 ? 'card' : 'cards'} actioned today
        </div>
      )}
      {error && <p className="today-error" role="alert">{error}</p>}

      <nav className="today-tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Today</button>
        <button className={tab === 'later' ? 'active' : ''} onClick={() => setTab('later')}>Later</button>
        <button className={tab === 'junk' ? 'active' : ''} onClick={() => setTab('junk')}>
          Junk today{page ? ` (${page.junk.length})` : ''}
        </button>
      </nav>

      {page && tab === 'today' && (
        page.top.length + page.next.length + page.rest.length === 0 ? (
          <p className="today-muted">Nothing here yet — the next digest arrives tonight.</p>
        ) : (
          <>
            {page.top.length > 0 && <h2 className="today-section">Top 3</h2>}
            {page.top.map((c) => <TodayCard key={c.id} card={c} {...handlers} />)}
            {page.next.length > 0 && <h2 className="today-section">Next 7</h2>}
            {page.next.map((c) => <TodayCard key={c.id} card={c} {...handlers} />)}
            {page.rest.length > 0 && <h2 className="today-section">Everything else ({page.rest.length})</h2>}
            {groupBySource(page.rest).map(([source, rows]) => (
              <React.Fragment key={source}>
                <h3 className="today-group">{source} <span className="today-group-count">· {rows.length}</span></h3>
                {rows.map((c) => <TodayCard key={c.id} card={c} variant="row" {...handlers} />)}
              </React.Fragment>
            ))}
          </>
        )
      )}

      {tab === 'later' && (
        later.length === 0 ? <p className="today-muted">Nothing saved for later.</p>
          : later.map((c) => <TodayCard key={c.id} card={c} variant="row" {...handlers} />)
      )}

      {page && tab === 'junk' && (
        <>
          <p className="today-muted">Links set aside as not worth reading, and why. Wrong call? Mark it “Not junk” — it moves to Everything else, and the correction becomes a test case for the filter.</p>
          {page.junk.length === 0 && <p className="today-muted">No junk today.</p>}
          {splitJunk(page.junk).map(([heading, rows]) => rows.length > 0 && (
            <React.Fragment key={heading}>
              <h2 className="today-section">{heading} ({rows.length})</h2>
              {rows.map((c) => (
                <div key={c.id} className="junk-row">
                  <div className="junk-text">
                    <a href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a>
                    <div className="today-meta">{c.source} · {c.class_reason}</div>
                  </div>
                  <button className="today-btn" onClick={() => notJunk(c.id)}>Not junk</button>
                </div>
              ))}
            </React.Fragment>
          ))}
        </>
      )}

      {reading && <Reader card={reading} onClose={() => setReading(null)} onDecide={decide} onUndo={undo} />}
    </div>
  );
}

export default TodayView;
