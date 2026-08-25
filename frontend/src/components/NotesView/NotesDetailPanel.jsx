import React from 'react';
import MarkdownLite from '../MarkdownLite';
import './NotesView.css';

const URL_PATTERN = /https?:\/\/\S+/;

// Source can now be a plain citation, a bare URL, or a citation with a URL
// appended (e.g. "Google PAIR Guidebook — https://..."). Linkify just the
// URL portion when one is present, rather than requiring a separate field.
function renderSource(source) {
  const match = source.match(URL_PATTERN);
  if (!match) return source;

  // \S+ is greedy — for "(https://...)" it swallows the trailing ")" into
  // the match since there's no whitespace before it. Strip trailing
  // punctuation that's almost certainly not part of the URL itself.
  let url = match[0];
  const trailingPunctuation = url.match(/[).,;:!?]+$/);
  if (trailingPunctuation) {
    url = url.slice(0, -trailingPunctuation[0].length);
  }

  let linkStart = match.index;
  let linkEnd = match.index + url.length;
  // If the URL is wrapped in parentheses, include them in the same
  // colored/clickable span so the brackets match the link's color instead
  // of looking like plain surrounding text.
  if (source[linkStart - 1] === '(' && source[linkEnd] === ')') {
    linkStart -= 1;
    linkEnd += 1;
  }

  const before = source.slice(0, linkStart);
  const linkText = source.slice(linkStart, linkEnd);
  const after = source.slice(linkEnd);
  return (
    <>
      {before}
      <a href={url} target="_blank" rel="noopener noreferrer" className="metadata-link">{linkText}</a>
      {after}
    </>
  );
}

function NotesDetailPanel({ note, contentLoading, contentError, onClose, onEdit }) {

  return (
    <div className="detail-panel-overlay">
      <div className="detail-panel">
        {/* Panel header */}
        <div className="panel-header">
          <div className="panel-title">
            <h2>{note.title}</h2>
            {note.author && <p className="panel-subtitle">{note.author}</p>}
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Panel content */}
        <div className="panel-content">
          {/* Metadata section */}
          <div className="metadata-section">
            <div className="metadata-row">
              <span className="metadata-label">Type:</span>
              <span className="metadata-value">{note.type}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Date:</span>
              <span className="metadata-value">{note.date}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Topic:</span>
              <span className="metadata-value">{note.topic}</span>
            </div>
            {note.author && (
              <div className="metadata-row">
                <span className="metadata-label">Author/Speaker:</span>
                <span className="metadata-value">{note.author}</span>
              </div>
            )}
            {note.source && (
              <div className="metadata-row">
                <span className="metadata-label">Source:</span>
                <span className="metadata-value">{renderSource(note.source)}</span>
              </div>
            )}
          </div>

          {/* Tags section */}
          <div className="tags-section">
            <h3>Tags</h3>
            <div className="tags-display">
              {note.tags && note.tags.length > 0 ? (
                note.tags.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))
              ) : (
                <p className="no-tags">No tags</p>
              )}
            </div>
          </div>

          {/* Full content */}
          <div className="content-section">
            {contentLoading && <p className="content-status">Loading content…</p>}
            {contentError && !contentLoading && (
              <p className="content-status content-error">Couldn't load content: {contentError}</p>
            )}
            {!contentLoading && !contentError && (
              <div className="content-preview markdown-preview">
                <MarkdownLite content={note.content ?? note.preview} />
              </div>
            )}
          </div>
        </div>

        {/* Panel footer with edit button */}
        <div className="panel-footer">
          <button
            className="btn btn-primary"
            onClick={() => onEdit(note.id)}
          >
            ✎ Edit Note
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotesDetailPanel;
