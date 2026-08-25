import React, { useState } from 'react';
import './NotesView.css';

const RETENTION_DAYS = 7;

function daysRemaining(trashedAt) {
  const trashedDate = new Date(trashedAt);
  if (Number.isNaN(trashedDate.getTime())) return null;
  const purgeDate = new Date(trashedDate.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const msLeft = purgeDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

function TrashView({ trash, loading, error, onRestore, onBack }) {
  const [restoringId, setRestoringId] = useState(null);
  const [restoreError, setRestoreError] = useState(null);

  const handleRestore = async (noteId) => {
    setRestoringId(noteId);
    setRestoreError(null);
    try {
      await onRestore(noteId);
    } catch (err) {
      setRestoreError(err.message || 'Failed to restore note');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="notes-view">
      <div className="notes-list-area">
        <div className="notes-header">
          <h1>Trash</h1>
          <button className="btn btn-secondary" onClick={onBack}>← Back to Notes</button>
        </div>

        <div className="notes-table-container">
          {loading && (
            <div className="empty-state">
              <p>Loading trash…</p>
            </div>
          )}

          {error && !loading && (
            <div className="empty-state">
              <p>Couldn't load trash: {error}</p>
            </div>
          )}

          {restoreError && (
            <div className="empty-state">
              <p>Couldn't restore: {restoreError}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <table className="notes-table">
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Source</th>
                    <th>Topic</th>
                    <th>Trashed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {trash.map(note => {
                    const remaining = daysRemaining(note.trashed_at);
                    return (
                      <tr key={note.id} className="note-row">
                        <td className="title-cell" title={note.title}>{note.title}</td>
                        <td className="source-cell" title={note.source}>{note.source}</td>
                        <td className="topic-cell">
                          <span className="topic-badge">{note.topic}</span>
                        </td>
                        <td className="date-cell">
                          {remaining === null ? '' : remaining === 0 ? 'purging soon' : `${remaining}d left`}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => handleRestore(note.id)}
                            disabled={restoringId === note.id}
                          >
                            {restoringId === note.id ? 'Restoring…' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {trash.length === 0 && (
                <div className="empty-state">
                  <p>Trash is empty</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrashView;
