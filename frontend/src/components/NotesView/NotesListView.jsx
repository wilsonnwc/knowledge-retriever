import React, { useState, useEffect } from 'react';
import NotesDetailPanel from './NotesDetailPanel';
import * as api from '../../api/client';
import './NotesView.css';

function NotesListView({ notes, loading, error, initialProjectFilter, onImportClick, onEditNote }) {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedContentLoading, setSelectedContentLoading] = useState(false);
  const [selectedContentError, setSelectedContentError] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterTag, setFilterTag] = useState('');
  // Initial value only — set once from the "View Notes" link on a Projects
  // row. This component remounts each time the Notes view is (re-)opened
  // (it's conditionally rendered, not just hidden), so a fresh initial
  // value from a new navigation is picked up correctly without needing to
  // lift this state up to App.jsx.
  const [filterProject, setFilterProject] = useState(initialProjectFilter || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch full content for whichever note is selected — the list only
  // carries a short truncated preview, not the full body.
  useEffect(() => {
    if (!selectedNoteId) {
      setSelectedContent(null);
      return;
    }
    setSelectedContentLoading(true);
    setSelectedContentError(null);
    api
      .fetchNote(selectedNoteId)
      .then((note) => setSelectedContent(note.content))
      .catch((err) => setSelectedContentError(err.message))
      .finally(() => setSelectedContentLoading(false));
  }, [selectedNoteId]);

  // Get unique topics, tags, and projects for filters
  const allTopics = [...new Set(notes.map(n => n.topic))];
  const allTags = [...new Set(notes.flatMap(n => n.tags))];
  const allProjects = [...new Set(notes.flatMap(n => n.projects || []))];

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !filterTopic || note.topic === filterTopic;
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    const matchesProject = !filterProject || (note.projects || []).includes(filterProject);
    return matchesSearch && matchesTopic && matchesTag && matchesProject;
  });

  const selectedNoteSummary = notes.find(n => n.id === selectedNoteId);
  const selectedNote = selectedNoteSummary && selectedContent !== null
    ? { ...selectedNoteSummary, content: selectedContent }
    : selectedNoteSummary;

  return (
    <div className="notes-view">
      {/* Main content area with list */}
      <div className="notes-list-area">
        <div className="notes-header">
          <h1>Notes</h1>
          <button className="btn btn-primary" onClick={onImportClick}>+ Import New</button>
        </div>

        {/* Filters and search */}
        <div className="notes-filters">
          <input
            type="text"
            placeholder="Search by title or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <div className="filter-group">
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="filter-select"
            >
              <option value="">All Topics</option>
              {allTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="filter-select"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="filter-select"
            >
              <option value="">All Projects</option>
              {allProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes table */}
        <div className="notes-table-container">
          {loading && (
            <div className="empty-state">
              <p>Loading notes…</p>
            </div>
          )}

          {error && !loading && (
            <div className="empty-state">
              <p>Couldn't load notes: {error}</p>
              <p>Make sure the backend is running (<code>python3 backend/app.py</code>).</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <table className="notes-table">
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '23%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author/Speaker</th>
                    <th>Source</th>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.map(note => (
                    <tr
                      key={note.id}
                      className={`note-row ${selectedNoteId === note.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setSelectedContent(null);
                      }}
                    >
                      <td className="title-cell" title={note.title} data-label="Title">{note.title}</td>
                      <td className="author-cell" title={note.author} data-label="Author">{note.author}</td>
                      <td className="source-cell" title={note.source} data-label="Source">{note.source}</td>
                      <td className="date-cell" data-label="Date">{note.date}</td>
                      <td className="topic-cell" data-label="Topic">
                        <span className="topic-badge">{note.topic}</span>
                      </td>
                      <td className="tags-cell" data-label="Tags">
                        <div className="tags-list">
                          {note.tags.map(tag => (
                            <span key={tag} className="tag-mini">{tag}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredNotes.length === 0 && (
                <div className="empty-state">
                  <p>No notes found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side-panel detail view */}
      {selectedNote && (
        <NotesDetailPanel
          note={selectedNote}
          contentLoading={selectedContentLoading}
          contentError={selectedContentError}
          onClose={() => setSelectedNoteId(null)}
          onEdit={onEditNote}
        />
      )}
    </div>
  );
}

export default NotesListView;
