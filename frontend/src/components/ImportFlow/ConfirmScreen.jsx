import React from 'react';
import './ImportFlow.css';

function ConfirmScreen({ data, onConfirm, onBack }) {
  return (
    <div className="screen confirm-screen">
      <div className="screen-header">
        <h1>Review & Save</h1>
        <p>Make sure everything looks correct before saving</p>
      </div>

      <div className="confirm-container">
        <div className="confirm-section">
          <h2>Content Preview</h2>
          <div className="content-preview">
            {data.content.substring(0, 300)}...
          </div>
        </div>

        <div className="confirm-section">
          <h2>Metadata</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="label">Title:</span>
              <span className="value">{data.title}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Source:</span>
              <span className="value">{data.source}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Date:</span>
              <span className="value">{data.date}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Type:</span>
              <span className="value">{data.type}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Topic Folder:</span>
              <span className="value">{data.topicFolder}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Tags:</span>
              <span className="value">
                {data.tags.length > 0 ? data.tags.join(', ') : '(none)'}
              </span>
            </div>
          </div>
        </div>

        <div className="confirm-info">
          <p>✓ Content is ready to save</p>
          <p>✓ File will be saved to: <code>notes/{data.topicFolder}/{data.title.toLowerCase().replace(/\s+/g, '-')}.md</code></p>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary btn-large" onClick={onConfirm}>
          ✓ Save Note
        </button>
      </div>
    </div>
  );
}

export default ConfirmScreen;
