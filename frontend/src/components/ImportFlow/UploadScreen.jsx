import React, { useState } from 'react';
import './ImportFlow.css';

function UploadScreen({ onUpload }) {
  const [dragActive, setDragActive] = useState(false);

  const mockMarkdownContent = `# Building Production AI Agents

Key insights from Linear on building production AI agents.`;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Mock: for prototype, just use mock content
    onUpload(mockMarkdownContent, 'markdown');
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock: just use mock content for prototype
      onUpload(mockMarkdownContent, 'markdown');
    }
  };

  return (
    <div className="screen upload-screen">
      <div className="screen-header">
        <h1>Import Article, Podcast, or Note</h1>
        <p>Upload a file or paste content to add to your knowledge base</p>
      </div>

      <div className="upload-container">
        <div
          className={`upload-area ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📄</div>
          <h2>Drag and drop your file here</h2>
          <p>or</p>
          <label className="upload-button">
            Click to browse
            <input
              type="file"
              onChange={handleFileInputChange}
              accept=".md,.pdf,.txt"
              style={{ display: 'none' }}
            />
          </label>
          <p className="upload-formats">Supported: Markdown, PDF, Text</p>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="paste-section">
          <h3>Paste Content</h3>
          <textarea
            placeholder="Paste markdown, article text, or content here..."
            defaultValue={mockMarkdownContent}
            rows={8}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              onUpload(textarea.value || mockMarkdownContent, 'text');
            }}
          >
            Continue with Pasted Content
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadScreen;
