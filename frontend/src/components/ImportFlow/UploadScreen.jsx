import React, { useState } from 'react';
import './ImportFlow.css';

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL yields "data:<mime>;base64,<data>" — the backend only wants the data.
    reader.onload = () => resolve(reader.result.split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function fileTypeFor(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
  return 'text';
}

function UploadScreen({ onUpload, extracting, extractError }) {
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [readError, setReadError] = useState(null);

  const handleFile = async (file) => {
    setReadError(null);
    try {
      const fileType = fileTypeFor(file);
      const content = fileType === 'pdf' ? await readFileAsBase64(file) : await readFileAsText(file);
      onUpload(content, fileType);
    } catch (err) {
      setReadError(`Could not read "${file.name}" — try a different file.`);
    }
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
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
              disabled={extracting}
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
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            disabled={extracting}
          />
          <button
            className="btn btn-primary"
            onClick={() => onUpload(pastedText, 'text')}
            disabled={!pastedText.trim() || extracting}
          >
            {extracting ? 'Extracting…' : 'Continue with Pasted Content'}
          </button>
        </div>

        {(readError || extractError) && (
          <p className="upload-error">{readError || extractError}</p>
        )}
        {extracting && !readError && <p className="upload-status">Extracting content and suggesting details…</p>}
      </div>
    </div>
  );
}

export default UploadScreen;
