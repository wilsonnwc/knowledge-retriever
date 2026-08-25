import React, { useState } from 'react';
import MarkdownLite from '../MarkdownLite';
import './ImportFlow.css';

function PreviewScreen({ content, onUpdate, onNext, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onUpdate(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="screen preview-screen">
      <div className="screen-header">
        <h1>Preview Content</h1>
        <p>Review the extracted content. You can edit it if needed.</p>
      </div>

      <div className="preview-container">
        <div className="preview-header">
          <h2>Markdown Preview</h2>
          {!isEditing && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              ✎ Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="edit-area">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={15}
            />
            <div className="button-group">
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="preview-content markdown-preview">
            <MarkdownLite content={editedContent} />
          </div>
        )}
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Next: Fill Details →
        </button>
      </div>
    </div>
  );
}

export default PreviewScreen;
