import React, { useState } from 'react';
import '../NotesView/NotesView.css';

function ProjectsListView({ projects, loading, error, onCreate, onRename, onArchive, onViewNotes }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [renamingName, setRenamingName] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [busyName, setBusyName] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setActionError(null);
    try {
      await onCreate(trimmed);
      setNewName('');
    } catch (err) {
      setActionError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const startRename = (name) => {
    setRenamingName(name);
    setRenameValue(name);
    setActionError(null);
  };

  const cancelRename = () => {
    setRenamingName(null);
    setRenameValue('');
  };

  const submitRename = async (oldName) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === oldName) {
      cancelRename();
      return;
    }
    setBusyName(oldName);
    setActionError(null);
    try {
      await onRename(oldName, trimmed);
      cancelRename();
    } catch (err) {
      setActionError(err.message || 'Failed to rename project');
    } finally {
      setBusyName(null);
    }
  };

  const handleArchive = async (name) => {
    setBusyName(name);
    setActionError(null);
    try {
      await onArchive(name);
    } catch (err) {
      setActionError(err.message || 'Failed to archive project');
    } finally {
      setBusyName(null);
    }
  };

  const renderRow = (project) => {
    const isRenaming = renamingName === project.name;
    const isBusy = busyName === project.name;
    return (
      <tr key={project.name} className="note-row">
        <td className="title-cell" data-label="Name">
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename(project.name);
                if (e.key === 'Escape') cancelRename();
              }}
              autoFocus
            />
          ) : (
            project.name
          )}
        </td>
        <td className="topic-cell" data-label="Status">
          <span className="topic-badge">{project.status}</span>
        </td>
        <td data-label="Notes">{project.noteCount}</td>
        <td data-label="Action">
          {isRenaming ? (
            <>
              <button
                className="btn btn-primary btn-small"
                onClick={() => submitRename(project.name)}
                disabled={isBusy}
              >
                Save
              </button>{' '}
              <button className="btn btn-secondary btn-small" onClick={cancelRename} disabled={isBusy}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => onViewNotes(project.name)}
                disabled={isBusy}
              >
                View Notes →
              </button>{' '}
              <button
                className="btn btn-secondary btn-small"
                onClick={() => startRename(project.name)}
                disabled={isBusy}
              >
                Rename
              </button>{' '}
              {project.status === 'active' && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => handleArchive(project.name)}
                  disabled={isBusy}
                >
                  {isBusy ? 'Archiving…' : 'Archive'}
                </button>
              )}
            </>
          )}
        </td>
      </tr>
    );
  };

  const activeProjects = projects.filter((p) => p.status === 'active');
  const archivedProjects = projects.filter((p) => p.status !== 'active');

  return (
    <div className="notes-view">
      <div className="notes-list-area">
        <div className="notes-header">
          <h1>Projects</h1>
        </div>

        <form className="form-group" onSubmit={handleCreate}>
          <label htmlFor="new-project-name">New project</label>
          <div className="topic-selector">
            <input
              id="new-project-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., LeapSpace Interview Prep"
            />
            <button type="submit" className="btn btn-primary btn-small" disabled={!newName.trim() || creating}>
              {creating ? 'Creating…' : '+ New Project'}
            </button>
          </div>
        </form>

        <div className="notes-table-container">
          {loading && (
            <div className="empty-state">
              <p>Loading projects…</p>
            </div>
          )}

          {error && !loading && (
            <div className="empty-state">
              <p>Couldn't load projects: {error}</p>
            </div>
          )}

          {actionError && (
            <div className="empty-state">
              <p>{actionError}</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="empty-state">
              <p>No projects yet — create one above.</p>
            </div>
          )}

          {!loading && !error && activeProjects.length > 0 && (
            <>
              <h3 className="projects-group-heading">Active</h3>
              <table className="notes-table">
                <colgroup>
                  <col style={{ width: '34%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '38%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{activeProjects.map(renderRow)}</tbody>
              </table>
            </>
          )}

          {!loading && !error && archivedProjects.length > 0 && (
            <>
              <h3 className="projects-group-heading">Archived</h3>
              <table className="notes-table">
                <colgroup>
                  <col style={{ width: '34%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '38%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{archivedProjects.map(renderRow)}</tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectsListView;
