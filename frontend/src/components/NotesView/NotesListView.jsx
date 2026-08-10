import React, { useState } from 'react';
import { mockNotes } from '../../mockData/mockData';
import NotesDetailPanel from './NotesDetailPanel';
import './NotesView.css';

function NotesListView({ onImportClick, onEditNote }) {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique topics and tags for filters
  const allTopics = [...new Set(mockNotes.map(n => n.topic))];
  const allTags = [...new Set(mockNotes.flatMap(n => n.tags))];

  // Filter notes based on search and filters
  const filteredNotes = mockNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !filterTopic || note.topic === filterTopic;
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    return matchesSearch && matchesTopic && matchesTag;
  });

  const selectedNote = mockNotes.find(n => n.id === selectedNoteId);

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
          <table className="notes-table">
            <thead>
              <tr>
                <th>Title</th>
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
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <td className="title-cell">{note.title}</td>
                  <td className="source-cell">{note.source}</td>
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
        </div>
      </div>

      {/* Side-panel detail view */}
      {selectedNote && (
        <NotesDetailPanel
          note={selectedNote}
          onClose={() => setSelectedNoteId(null)}
          onEdit={onEditNote}
        />
      )}
    </div>
  );
}

export default NotesListView;
