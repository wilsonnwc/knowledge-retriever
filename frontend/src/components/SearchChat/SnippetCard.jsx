import React from 'react';
import { renderInline, stripInlineBlockquoteMarker } from '../MarkdownLite';

function renderChunkText(text) {
  return renderInline(stripInlineBlockquoteMarker(text));
}

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
        {source.before && <span className="snippet-context">{renderChunkText(source.before)} </span>}
        <em className="snippet-chunk">{renderChunkText(source.chunk)}</em>
        {source.after && <span className="snippet-context"> {renderChunkText(source.after)}</span>}
        "
      </p>
    </div>
  );
}

export default SnippetCard;
