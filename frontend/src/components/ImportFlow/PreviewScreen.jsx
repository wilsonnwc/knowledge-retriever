import React, { useState } from 'react';
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
            {editedContent.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) {
                return <h1 key={idx}>{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={idx}>{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={idx}>{line.substring(4)}</h3>;
              } else if (line.startsWith('- ')) {
                return <li key={idx}>{line.substring(2)}</li>;
              } else if (line.trim()) {
                return <p key={idx}>{line}</p>;
              }
              return <br key={idx} />;
            })}
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
