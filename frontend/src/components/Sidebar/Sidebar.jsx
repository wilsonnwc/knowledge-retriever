import React from 'react';
import './Sidebar.css';

function Sidebar({ view, onNavigate, onNewChat, historyItems, activeHistoryId, onSelectHistory }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🧠 Knowledge Retriever</span>
      </div>

      <button className="sidebar-new-btn" onClick={onNewChat}>
        + New
      </button>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${view === 'projects' ? 'active' : ''}`}
          onClick={() => onNavigate('projects')}
        >
          📁 Projects
        </button>
        <button
          className={`sidebar-nav-item ${view === 'notes' ? 'active' : ''}`}
          onClick={() => onNavigate('notes')}
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
              onClick={() => onSelectHistory(item)}
              title={item.title}
            >
              <span className="history-item-icon">{item.type === 'import' ? '📥' : '💬'}</span>
              <span className="history-item-title">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
