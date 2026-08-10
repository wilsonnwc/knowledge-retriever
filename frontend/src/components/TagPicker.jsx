import React, { useState } from 'react';
import './TagPicker.css';

function TagPicker({ selectedTags, onChange, availableTags }) {
  const [inputValue, setInputValue] = useState('');
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Filter available tags based on input
  const filteredTags = availableTags.filter(
    tag => tag.toLowerCase().includes(inputValue.toLowerCase()) &&
           !selectedTags.includes(tag)
  );

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setInputValue('');
  };

  const handleTagRemove = (tag) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleCreateNewTag = () => {
    if (newTagName.trim() && !availableTags.includes(newTagName)) {
      onChange([...selectedTags, newTagName]);
      setNewTagName('');
      setShowNewTagModal(false);
      setInputValue('');
    }
  };

  const showCreateNewOption = inputValue.trim() &&
                             !filteredTags.some(t => t.toLowerCase() === inputValue.toLowerCase()) &&
                             !selectedTags.includes(inputValue);

  return (
    <div className="tag-picker">
      <div className="tag-input-container">
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

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type to search or create tags..."
          className="tag-search-input"
        />
      </div>

      {/* Dropdown suggestions */}
      {inputValue && (
        <div className="tag-suggestions">
          {filteredTags.length > 0 && (
            <>
              <div className="suggestions-label">Available tags:</div>
              {filteredTags.map(tag => (
                <button
                  key={tag}
                  className="tag-suggestion"
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag}
                </button>
              ))}
            </>
          )}

          {showCreateNewOption && (
            <button
              className="tag-suggestion tag-create-new"
              onClick={() => {
                setNewTagName(inputValue);
                setShowNewTagModal(true);
                setInputValue('');
              }}
            >
              + Create new tag: "{inputValue}"
            </button>
          )}

          {filteredTags.length === 0 && !showCreateNewOption && (
            <div className="no-suggestions">No matching tags</div>
          )}
        </div>
      )}

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
