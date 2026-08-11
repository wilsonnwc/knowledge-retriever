import React from 'react';
import { mockNotes } from '../../mockData/mockData';
import { mockNoteContent } from '../../mockData/mockConversations';

// Renders **bold** spans within a line of plain text.
function renderInline(text, keyPrefix) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyPrefix}-${i}`}>{part}</strong> : part
  );
}

// Minimal renderer for the note's markdown-ish body: title/meta lines are
// pulled into the modal header/meta row, blank-line-separated blocks become
// paragraphs, and "> " lines become a highlighted quote block.
function renderBody(content) {
  const blocks = content.trim().split(/\n\n+/);
  const elements = [];

  blocks.forEach((block, i) => {
    if (block.startsWith('# ')) return; // title already shown in the modal header
    if (block.startsWith('**Source:**') || block.startsWith('**Type:**')) return; // shown in meta row
    if (block.startsWith('> ')) {
      const quoteText = block.replace(/^>\s*/, '');
      elements.push(
        <div className="article-modal-quote" key={`quote-${i}`}>
          {renderInline(quoteText, `quote-${i}`)}
        </div>
      );
      return;
    }
    elements.push(<p key={`p-${i}`}>{renderInline(block, `p-${i}`)}</p>);
  });

  return elements;
}

function ArticleModal({ noteId, onClose, onGoToArticle }) {
  const note = mockNotes.find((n) => n.id === noteId);
  const content = mockNoteContent[noteId];

  if (!note) return null;

  return (
    <div className="article-modal-overlay" onClick={onClose}>
      <div className="article-modal" onClick={(e) => e.stopPropagation()}>
        <div className="article-modal-header">
          <h3>{note.title}</h3>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="article-modal-body">
          <div className="article-modal-meta">
            <span>{note.source}</span>
            <span>{note.type}</span>
            <span>{note.date}</span>
          </div>
          {content ? renderBody(content) : <p>{note.preview}</p>}
        </div>
        <div className="article-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            ← Back
          </button>
          <button className="btn-primary" onClick={() => onGoToArticle(note.id)}>
            Go to article
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArticleModal;
