import React, { useState } from 'react';
import TagPicker from '../TagPicker';
import { mockTags } from '../../mockData/mockData';
import './NotesView.css';

function NotesDetailPanel({ note, onClose }) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tags, setTags] = useState(note.tags);

  const handleSaveTags = () => {
    // Mock save - in real app, would call API
    console.log('Saving tags:', tags);
    setIsEditingTags(false);
  };

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
                  Read original
                </a>
              </div>
            )}
          </div>

          {/* Tags section */}
          <div className="tags-section">
            <div className="tags-header">
              <h3>Tags</h3>
              {!isEditingTags && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setIsEditingTags(true)}
                >
                  ✎ Edit
                </button>
              )}
            </div>

            {isEditingTags ? (
              <div className="tags-edit">
                <TagPicker
                  selectedTags={tags}
                  onChange={setTags}
                  availableTags={mockTags}
                />
                <div className="button-group">
                  <button className="btn btn-secondary" onClick={() => setIsEditingTags(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveTags}>
                    Save Tags
                  </button>
                </div>
              </div>
            ) : (
              <div className="tags-display">
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <span key={tag} className="tag-badge">{tag}</span>
                  ))
                ) : (
                  <p className="no-tags">No tags</p>
                )}
              </div>
            )}
          </div>

          {/* Content preview */}
          <div className="content-section">
            <h3>Preview</h3>
            <div className="content-preview">
              {note.preview}
            </div>
          </div>

          {/* Actions */}
          <div className="panel-actions">
            <button className="btn btn-secondary">📋 Copy Link</button>
            <button className="btn btn-secondary">🔗 Open Original</button>
            <button className="btn btn-danger">🗑 Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesDetailPanel;
