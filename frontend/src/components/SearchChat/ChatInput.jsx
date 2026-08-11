import React, { useState } from 'react';

function ChatInput({ onSend }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-area">
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input-textarea"
          placeholder="Ask a follow-up, or start a new question..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button type="submit" className="chat-send-btn" disabled={!value.trim()}>
          Send
        </button>
      </form>
      <p className="chat-input-hint">Searches your saved notes only — not the web.</p>
    </div>
  );
}

export default ChatInput;
