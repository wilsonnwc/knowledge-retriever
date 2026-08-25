import React, { useState, useEffect } from 'react';
import NotesDetailPanel from './NotesDetailPanel';
import * as api from '../../api/client';
import './NotesView.css';

function NotesListView({ notes, loading, error, onImportClick, onEditNote }) {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedContentLoading, setSelectedContentLoading] = useState(false);
  const [selectedContentError, setSelectedContentError] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterTag, setFilterTag] = useState('');
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

  // Get unique topics and tags for filters
  const allTopics = [...new Set(notes.map(n => n.topic))];
  const allTags = [...new Set(notes.flatMap(n => n.tags))];

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !filterTopic || note.topic === filterTopic;
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    return matchesSearch && matchesTopic && matchesTag;
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
                      <td className="title-cell" title={note.title}>{note.title}</td>
                      <td className="author-cell" title={note.author}>{note.author}</td>
                      <td className="source-cell" title={note.source}>{note.source}</td>
                      <td className="date-cell">{note.date}</td>
                      <td className="topic-cell">
                        <span className="topic-badge">{note.topic}</span>
                      </td>
                      <td className="tags-cell">
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
