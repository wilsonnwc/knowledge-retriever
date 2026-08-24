import React from 'react';
import './NotesView.css';

const URL_PATTERN = /https?:\/\/\S+/;

// Source can now be a plain citation, a bare URL, or a citation with a URL
// appended (e.g. "Google PAIR Guidebook — https://..."). Linkify just the
// URL portion when one is present, rather than requiring a separate field.
function renderSource(source) {
  const match = source.match(URL_PATTERN);
  if (!match) return source;

  const url = match[0];
  const [before, after] = [source.slice(0, match.index), source.slice(match.index + url.length)];
  return (
    <>
      {before}
      <a href={url} target="_blank" rel="noopener noreferrer" className="metadata-link">{url}</a>
      {after}
    </>
  );
}

function NotesDetailPanel({ note, onClose, onEdit }) {

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Panel header */}
        <div className="panel-header">
          <div className="panel-title">
            <h2>{note.title}</h2>
            <p className="panel-subtitle">{note.source}</p>
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

          {/* Content preview */}
          <div className="content-section">
            <h3>Preview</h3>
            <div className="content-preview">
              {note.preview}
            </div>
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
