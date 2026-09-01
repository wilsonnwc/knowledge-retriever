import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

function ChatThread({ messages, onOpenArticle }) {
  const bottomRef = useRef(null);
  const messageRefs = useRef({});
  const prevCountRef = useRef(0);
  const scrolledToStartRef = useRef(new Set());

  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevCountRef.current = 0;
      return;
    }

    // A new message pair was appended (the user just sent something) —
    // scroll down so it's visible. Content updates to an existing message
    // (streaming deltas, sources arriving later) don't retrigger this,
    // since messages.length doesn't change for those.
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = messages.length;

    // The first token of a new answer just arrived — scroll to the TOP of
    // that message once, so the reader starts where the answer begins
    // instead of landing at the bottom past the source cards. Later deltas
    // for the same message id don't move the viewport again.
    messages.forEach((m) => {
      if (m.streaming && !scrolledToStartRef.current.has(m.id)) {
        scrolledToStartRef.current.add(m.id);
        messageRefs.current[m.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
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
        <div key={message.id} ref={(el) => { messageRefs.current[message.id] = el; }}>
          <ChatMessage message={message} onOpenArticle={onOpenArticle} />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatThread;
