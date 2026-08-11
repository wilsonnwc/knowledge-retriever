import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

function ChatThread({ messages, onOpenArticle }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-empty-state">
        <h2>Ask your knowledge base a question</h2>
        <p>Search across your saved articles, notes, and reading — this searches your own notes, not the web.</p>
      </div>
    );
  }

  return (
    <div className="chat-thread">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} onOpenArticle={onOpenArticle} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatThread;
