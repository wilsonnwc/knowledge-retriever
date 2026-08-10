import React from 'react';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">🧠 Knowledge Retriever</h1>
      </div>
      <div className="nav-menu">
        <a href="#" className="nav-item active">Import</a>
        <a href="#" className="nav-item">Notes</a>
        <a href="#" className="nav-item disabled">Projects</a>
        <a href="#" className="nav-item disabled">Search</a>
        <a href="#" className="nav-item disabled">Goals</a>
      </div>
    </nav>
  );
}

export default Navigation;
