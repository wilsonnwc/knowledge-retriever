import React, { useState } from 'react';
import './TagPicker.css';

function TagPicker({ selectedTags, onChange, availableTags }) {
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const unselectedTags = availableTags.filter(tag => !selectedTags.includes(tag));

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tag) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleCreateNewTag = () => {
    if (newTagName.trim() && !availableTags.includes(newTagName) && !selectedTags.includes(newTagName)) {
      onChange([...selectedTags, newTagName]);
      setNewTagName('');
      setShowNewTagModal(false);
    }
  };

  return (
    <div className="tag-picker">
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          {selectedTags.map(tag => (
            <span key={tag} className="tag-badge">
              {tag}
              <button
                className="tag-remove"
                onClick={() => handleTagRemove(tag)}
                aria-label="Remove tag"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="tag-input-container">
        <select
          className="tag-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              handleTagSelect(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="">Select a tag</option>
          {unselectedTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <button
          className="btn btn-secondary btn-small"
          onClick={() => setShowNewTagModal(true)}
        >
          + New Tag
        </button>
      </div>

      {/* New Tag Modal */}
      {showNewTagModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Tag</h2>
              <button
                className="close-button"
                onClick={() => setShowNewTagModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Enter a name for the new tag (lowercase, hyphens or underscores)</p>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., my-new-tag"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewTagModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateNewTag}
              >
                Create Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TagPicker;
