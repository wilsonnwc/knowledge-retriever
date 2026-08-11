import React from 'react';
import SourcesSection from './SourcesSection';

function ChatMessage({ message, onOpenArticle }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className="chat-bubble">{message.text}</div>
      {!isUser && (
        <SourcesSection
          sourcesSummary={message.sourcesSummary}
          sourcesElaboration={message.sourcesElaboration}
          sources={message.sources}
          onOpenArticle={onOpenArticle}
        />
      )}
    </div>
  );
}

export default ChatMessage;
