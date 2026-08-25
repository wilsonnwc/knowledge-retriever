import React, { useState } from 'react';
import { mockTypes } from '../../mockData/mockData';
import TagPicker from '../TagPicker';
import './ImportFlow.css';

function FrontmatterScreen({ data, topics, tags: availableTags, onUpdate, onNext, onBack }) {
  const [formData, setFormData] = useState({
    title: data.title || '',
    author: data.author || '',
    source: data.source || '',
    date: data.date || new Date().toISOString().split('T')[0],
    type: data.type || 'article',
    topicFolder: data.topicFolder || '',
    tags: data.tags || []
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

  const handleNext = () => {
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.topicFolder) {
      alert('Topic folder is required');
      return;
    }

    onUpdate(formData);
    onNext();
  };

  const isFormValid = formData.title && formData.topicFolder;

  return (
    <div className="screen frontmatter-screen">
      <div className="screen-header">
        <h1>Fill in Details</h1>
        <p>Complete the metadata for your note</p>
      </div>

      <div className="frontmatter-form">
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

        {/* Author or speaker */}
        <div className="form-group">
          <label htmlFor="author">Author or speaker</label>
          <input
            id="author"
            type="text"
            value={formData.author}
            onChange={(e) => handleChange('author', e.target.value)}
            placeholder="e.g., Don Norman"
          />
        </div>

        {/* Source */}
        <div className="form-group">
          <label htmlFor="source">Source (book, podcast, publication, URL or video)</label>
          <input
            id="source"
            type="text"
            value={formData.source}
            onChange={(e) => handleChange('source', e.target.value)}
            placeholder="e.g., Design of Everyday Things, or https://..."
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
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <button
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
            availableTags={availableTags}
          />
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!isFormValid}
        >
          Review & Save →
        </button>
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
              <p>Enter a name for the new topic folder (lowercase, hyphens only)</p>
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

export default FrontmatterScreen;
