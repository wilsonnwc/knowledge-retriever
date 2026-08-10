import React from 'react';
import './NotesView.css';

function NotesDetailPanel({ note, onClose, onEdit }) {

  return (
    <div className="detail-panel-overlay">
      <div className="detail-panel">
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
            {note.url && (
              <div className="metadata-row">
                <span className="metadata-label">Source:</span>
                <a href={note.url} target="_blank" rel="noopener noreferrer" className="metadata-link">
                  {note.url}
                </a>
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
