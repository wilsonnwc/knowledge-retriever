import React, { useState } from 'react';
import './ImportFlow.css';

function ConfirmScreen({ data, onConfirm, onBack }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleConfirm = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onConfirm();
    } catch (err) {
      setSaveError(err.message || 'Failed to save note');
      setSaving(false);
    }
  };

  return (
    <div className="screen confirm-screen">
      <div className="screen-header">
        <h1>Review & Save</h1>
        <p>Make sure everything looks correct before saving</p>
      </div>

      <div className="confirm-container">
        <div className="confirm-section">
          <h2>Content Preview</h2>
          <div className="confirm-content-preview">
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
              <span className="label">Author/Speaker:</span>
              <span className="value">{data.author || '(none)'}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Source:</span>
              <span className="value">{data.source || '(none)'}</span>
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
          <p>✓ Will be saved under the <strong>{data.topicFolder}</strong> topic</p>
        </div>

        {saveError && <p className="upload-error">{saveError}</p>}
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={onBack} disabled={saving}>
          ← Back
        </button>
        <button className="btn btn-primary btn-large" onClick={handleConfirm} disabled={saving}>
          {saving ? 'Saving…' : '✓ Save Note'}
        </button>
      </div>
    </div>
  );
}

export default ConfirmScreen;
