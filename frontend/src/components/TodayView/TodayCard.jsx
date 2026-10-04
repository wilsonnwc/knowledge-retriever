import React from 'react';
import DecisionButtons from './DecisionButtons';

export function availabilityTag(card) {
  if (card.kind === 'media') return 'video/podcast — not fetched';
  if (card.kind === 'article' && card.retrieval_status !== 'ok') return 'full article unavailable';
  return null;
}

function Meta({ card }) {
  const parts = [card.source, card.category, card.read_time_min ? `~${card.read_time_min} min` : null].filter(Boolean);
  return (
    <div className="today-meta">
      {parts.join(' · ')}
      {card.also_in && card.also_in.length > 0 && <span className="today-also"> · also in {card.also_in.join(', ')}</span>}
    </div>
  );
}

// A full card (Top 3 / Next 7) or a compact row (Everything else). Tapping the title opens the reader.
function TodayCard({ card, variant = 'card', onOpen, onDecide, onUndo }) {
  const tag = availabilityTag(card);
  const done = Boolean(card.state.decision);
  return (
    <article className={`today-${variant} ${done ? 'done' : ''}`}>
      <button className="today-title" onClick={() => onOpen(card)}>
        {variant === 'card' && card.rank && <span className="today-rank">#{card.rank}</span>}
        {card.title}
      </button>
      <Meta card={card} />
      {tag && <span className="today-tag">{tag}</span>}
      {variant === 'card' ? (
        <>
          {card.summary && <p className="today-summary">{card.summary}</p>}
          {card.why && <p className="today-why"><strong>Why it ranks here:</strong> {card.why}</p>}
        </>
      ) : (
        card.one_liner && <p className="today-oneliner">{card.one_liner}</p>
      )}
      <DecisionButtons state={card.state} compact={variant !== 'card'}
                       onDecide={(action, opts) => onDecide(card.id, action, opts)}
                       onUndo={(eventId) => onUndo(card.id, eventId)} />
    </article>
  );
}

export default TodayCard;
