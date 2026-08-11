import React from 'react';

function ChatSidebar({ conversations, activeConversationId, onSelectConversation, onNewChat }) {
  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          + New Chat
        </button>
      </div>
      <div className="chat-history">
        <p className="chat-history-label">History</p>
        {conversations.map((conv) => (
          <button
            key={conv.id}
            className={`chat-history-item ${conv.id === activeConversationId ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv.id)}
            title={conv.title}
          >
            {conv.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;
