import React from 'react';
import SnippetCard from './SnippetCard';

function SourcesSection({ sourcesSummary, sourcesElaboration, sources, onOpenArticle }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-section">
      <p className="sources-summary">📌 {sourcesSummary}</p>
      {sourcesElaboration && <p className="sources-elaboration">{sourcesElaboration}</p>}
      {sources.map((source) => (
        <SnippetCard
          key={source.noteId}
          source={source}
          onOpenArticle={onOpenArticle}
        />
      ))}
    </div>
  );
}

export default SourcesSection;
