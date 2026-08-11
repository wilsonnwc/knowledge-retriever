import React from 'react';

function SnippetCard({ source, onOpenArticle }) {
  return (
    <div className="snippet-card">
      <button
        className="snippet-card-title"
        onClick={() => onOpenArticle(source.noteId)}
      >
        📄 {source.title}
      </button>
      <p className="snippet-card-text">
        "
        {source.before && <span className="snippet-context">{source.before} </span>}
        <em className="snippet-chunk">{source.chunk}</em>
        {source.after && <span className="snippet-context"> {source.after}</span>}
        "
      </p>
    </div>
  );
}

export default SnippetCard;
