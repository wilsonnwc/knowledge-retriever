import React from 'react';
import './TagPicker.css';

// Like TagPicker, but selects only from projects that already exist in
// the registry — no "+ New Project" inline creation. Unlike a tag, a
// project has a real registry entry (status, note count) the Projects
// view manages; creating one here would let a project exist informally
// on a note without ever being registered. Create it in the Projects
// view first, then it becomes selectable everywhere.
function ProjectPicker({ selectedProjects, onChange, availableProjects }) {
  const unselected = availableProjects.filter((p) => !selectedProjects.includes(p));

  const handleSelect = (name) => {
    if (!selectedProjects.includes(name)) {
      onChange([...selectedProjects, name]);
    }
  };

  const handleRemove = (name) => {
    onChange(selectedProjects.filter((p) => p !== name));
  };

  return (
    <div className="tag-picker">
      {selectedProjects.length > 0 && (
        <div className="selected-tags">
          {selectedProjects.map((name) => (
            <span key={name} className="tag-badge">
              {name}
              <button className="tag-remove" onClick={() => handleRemove(name)} aria-label="Remove project">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="tag-input-container">
        <select
          className="tag-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              handleSelect(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="">
            {unselected.length === 0 ? 'No more active projects' : 'Add to a project'}
          </option>
          {unselected.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ProjectPicker;
