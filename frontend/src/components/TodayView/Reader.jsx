import React, { useEffect, useRef, useState } from 'react';
import MarkdownLite from '../MarkdownLite';
import DecisionButtons from './DecisionButtons';
import * as api from '../../api/client';

const HIDE_AFTER_PX = 12; // scroll this far in one direction before the bars hide or come back
const EDGE_PX = 40;       // near the top or the end of the text, the bars always show

// Full text inside the page when it was fetched; otherwise the newsletter's own description.
// Opening is logged as an 'open' event (not counted toward the metrics).
// Reading room (user's mobile review, 2026-10-05): the title scrolls with the text, and the top bar and the
// decision buttons fade away while scrolling down, back on scrolling up, at the top or end, or on a tap.
// Back: opening pushes a history entry, so the phone's own back swipe / back button closes the reader.
function Reader({ card, onClose, onDecide, onUndo }) {
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [barsHidden, setBarsHidden] = useState(false);
  const [pad, setPad] = useState({ top: 0, bottom: 0 });
  const bodyRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const anchorY = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let alive = true;
    api.fetchTodayItem(card.id).then((it) => alive && setItem(it)).catch((e) => alive && setError(e.message));
    api.recordEvent(card.id, 'open').catch(() => {});
    return () => { alive = false; };
  }, [card.id]);

  useEffect(() => {
    if (!window.history.state || window.history.state.reader !== card.id) {
      window.history.pushState({ reader: card.id }, '');
    }
    const onPop = () => onCloseRef.current();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [card.id]);

  // The bars overlay the text, so the text is padded by their real heights (the footer grows with notes).
  useEffect(() => {
    const measure = () => setPad({
      top: headerRef.current ? headerRef.current.offsetHeight : 0,
      bottom: footerRef.current ? footerRef.current.offsetHeight : 0,
    });
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    [headerRef.current, footerRef.current].forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = bodyRef.current;
    const y = el.scrollTop;
    if (y < EDGE_PX || y + el.clientHeight >= el.scrollHeight - EDGE_PX) {
      setBarsHidden(false);
      anchorY.current = y;
      return;
    }
    if (y - anchorY.current > HIDE_AFTER_PX) { setBarsHidden(true); anchorY.current = y; }
    else if (anchorY.current - y > HIDE_AFTER_PX) { setBarsHidden(false); anchorY.current = y; }
    else if ((barsHidden && y > anchorY.current) || (!barsHidden && y < anchorY.current)) anchorY.current = y;
  };

  const fullText = item && item.retrieval_status === 'ok' && item.content_md;
  const hidden = barsHidden ? 'bars-hidden' : '';
  return (
    <div className="reader-overlay" role="dialog" aria-label={card.title}>
      <div className="reader">
        <header ref={headerRef} className={`reader-header ${hidden}`}>
          <button className="today-btn ghost" onClick={() => window.history.back()} aria-label="Close reader">← Back</button>
          {card.url && <a className="reader-original" href={card.url} target="_blank" rel="noopener noreferrer">Open original ↗</a>}
        </header>
        <div
          ref={bodyRef}
          className="reader-body"
          style={{ paddingTop: pad.top + 8, paddingBottom: pad.bottom + 16 }}
          onScroll={onScroll}
          onClick={(e) => { if (barsHidden && !e.target.closest('a')) setBarsHidden(false); }}
        >
          <h2 className="reader-title">{card.title}</h2>
          <div className="today-meta">{card.source}</div>
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
        <footer ref={footerRef} className={`reader-footer ${hidden}`}>
          <DecisionButtons state={card.state} onDecide={(a, o) => onDecide(card.id, a, o)} onUndo={(e) => onUndo(card.id, e)} />
        </footer>
      </div>
    </div>
  );
}

export default Reader;
