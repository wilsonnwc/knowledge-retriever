import React, { useState } from 'react';
import TagPicker from '../TagPicker';
import { mockTopics, mockTypes, mockTags } from '../../mockData/mockData';
import './NotesView.css';

function EditNoteModal({ note, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: note.title || '',
    source: note.source || '',
    url: note.url || '',
    date: note.date || new Date().toISOString().split('T')[0],
    type: note.type || 'article',
    topicFolder: note.topic || '',
    tags: note.tags || [],
    content: note.preview || ''
  });

  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (newTags) => {
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const handleCreateNewTopic = () => {
    if (newTopicName.trim()) {
      handleChange('topicFolder', newTopicName);
      setShowNewTopicModal(false);
      setNewTopicName('');
    }
  };

  const handleSave = () => {
    // Mock save - in real app, would call API
    console.log('Saving note:', formData);
    onSave(formData);
  };

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal">
        {/* Header */}
        <div className="edit-modal-header">
          <h1>Edit Note</h1>
          <button
            className="close-button"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="edit-modal-content">
          <form className="edit-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter title"
              />
            </div>

            {/* Source */}
            <div className="form-group">
              <label htmlFor="source">
                Source <span className="required">*</span>
              </label>
              <input
                id="source"
                type="text"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder="e.g., Author, Publication"
              />
            </div>

            {/* URL */}
            <div className="form-group">
              <label htmlFor="url">URL</label>
              <input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="form-group">
              <label htmlFor="type">
                Type <span className="required">*</span>
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="">Select type</option>
                {mockTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Topic Folder */}
            <div className="form-group">
              <label htmlFor="topic">
                Topic Folder <span className="required">*</span>
              </label>
              <div className="topic-selector">
                <select
                  id="topic"
                  value={formData.topicFolder}
                  onChange={(e) => handleChange('topicFolder', e.target.value)}
                >
                  <option value="">Select a topic</option>
                  {mockTopics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowNewTopicModal(true)}
                >
                  + New Folder
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label>Tags</label>
              <TagPicker
                selectedTags={formData.tags}
                onChange={handleTagsChange}
                availableTags={mockTags}
              />
            </div>

            {/* Content */}
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Enter note content (markdown)"
                rows={12}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="edit-modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Topic Folder</h2>
              <button
                className="close-button"
                onClick={() => setShowNewTopicModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Enter a name for the new topic folder</p>
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g., new-topic"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewTopicModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateNewTopic}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditNoteModal;
