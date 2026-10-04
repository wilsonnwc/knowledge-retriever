import React, { useEffect, useState } from 'react';
import MarkdownLite from '../MarkdownLite';
import DecisionButtons from './DecisionButtons';
import * as api from '../../api/client';

// Full text inside the page when it was fetched; otherwise the newsletter's own description.
// Opening is logged as an 'open' event (not counted toward the metrics).
function Reader({ card, onClose, onDecide, onUndo }) {
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api.fetchTodayItem(card.id).then((it) => alive && setItem(it)).catch((e) => alive && setError(e.message));
    api.recordEvent(card.id, 'open').catch(() => {});
    return () => { alive = false; };
  }, [card.id]);

  const fullText = item && item.retrieval_status === 'ok' && item.content_md;
  return (
    <div className="reader-overlay" role="dialog" aria-label={card.title}>
      <div className="reader">
        <header className="reader-header">
          <button className="today-btn ghost" onClick={onClose} aria-label="Close reader">← Back</button>
          {card.url && <a className="reader-original" href={card.url} target="_blank" rel="noopener noreferrer">Open original ↗</a>}
        </header>
        <h2 className="reader-title">{card.title}</h2>
        <div className="today-meta">{card.source}</div>
        <div className="reader-body">
          {error && <p className="today-error">{error}</p>}
          {!item && !error && <p className="today-muted">Loading…</p>}
          {item && fullText && <MarkdownLite content={item.content_md} />}
          {item && !fullText && (
            <>
              <span className="today-tag">
                {item.kind === 'media' ? 'video/podcast — not fetched' : 'full article unavailable'} — the newsletter's own description
              </span>
              {item.heading && <h3>{item.heading}</h3>}
              <p>{item.context || item.summary || 'No description in the newsletter.'}</p>
            </>
          )}
        </div>
        <footer className="reader-footer">
          <DecisionButtons state={card.state} onDecide={(a, o) => onDecide(card.id, a, o)} onUndo={(e) => onUndo(card.id, e)} />
        </footer>
      </div>
    </div>
  );
}

export default Reader;
