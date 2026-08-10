import React from 'react';
import './ImportFlow.css';

function SuccessScreen({ notePath, onNew }) {
  return (
    <div className="screen success-screen">
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h1>Note Saved Successfully!</h1>
        <p>Your note has been added to your knowledge base</p>

        <div className="success-details">
          <p>Saved to:</p>
          <code className="file-path">{notePath}</code>
        </div>

        <div className="next-steps">
          <h3>What's next?</h3>
          <ul>
            <li>View your notes in the <strong>Notes</strong> section</li>
            <li>Search across your knowledge base</li>
            <li>Create projects and set goals</li>
            <li>Tag and organize your notes</li>
          </ul>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary">
          ← Go to Notes
        </button>
        <button className="btn btn-primary" onClick={onNew}>
          + Import Another Note
        </button>
      </div>
    </div>
  );
}

export default SuccessScreen;
