import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ view, onNavigate, onNewChat, historyItems, activeHistoryId, onSelectHistory }) {
  // Only meaningful below the mobile breakpoint (see Sidebar.css) — the
  // toggle button and backdrop are hidden entirely above it, so this
  // state has no visible effect on desktop.
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleSelectHistory = (item) => {
    onSelectHistory(item);
    setIsOpen(false);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(true)} aria-label="Open menu">
        ☰
      </button>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🧠 Knowledge Retriever</span>
          <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <button className="sidebar-new-btn" onClick={handleNewChat}>
          + New
        </button>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${view === 'projects' ? 'active' : ''}`}
            onClick={() => handleNavigate('projects')}
          >
            📁 Projects
          </button>
          <button
            className={`sidebar-nav-item ${view === 'notes' ? 'active' : ''}`}
            onClick={() => handleNavigate('notes')}
          >
            📝 Notes
          </button>
          <button className="sidebar-nav-item disabled" disabled title="Coming soon">
            🎯 Goals
          </button>
        </nav>

        <div className="sidebar-history">
          <p className="sidebar-history-label">History</p>
          <div className="sidebar-history-list">
            {historyItems.length === 0 && (
              <p className="sidebar-history-empty">No conversations yet</p>
            )}
            {historyItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-history-item ${
                  view === 'chat' && item.id === activeHistoryId ? 'active' : ''
                }`}
                onClick={() => handleSelectHistory(item)}
                title={item.title}
              >
                <span className="history-item-icon">{item.type === 'import' ? '📥' : '💬'}</span>
                <span className="history-item-title">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
