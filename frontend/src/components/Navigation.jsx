import React from 'react';
import './Navigation.css';

function Navigation({ currentPage, onNavigate }) {
  const handleClick = (e, page) => {
    e.preventDefault();
    onNavigate(page);
  };

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">🧠 Knowledge Retriever</h1>
      </div>
      <div className="nav-menu">
        <button
          className={`nav-item ${currentPage === 'notes' ? 'active' : ''}`}
          onClick={(e) => handleClick(e, 'notes')}
        >
          Notes
        </button>
        <button
          className={`nav-item ${currentPage === 'import' ? 'active' : ''}`}
          onClick={(e) => handleClick(e, 'import')}
        >
          Import
        </button>
        <button className="nav-item disabled" disabled>
          Projects
        </button>
        <button
          className={`nav-item ${currentPage === 'search' ? 'active' : ''}`}
          onClick={(e) => handleClick(e, 'search')}
        >
          Search
        </button>
        <button className="nav-item disabled" disabled>
          Goals
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
