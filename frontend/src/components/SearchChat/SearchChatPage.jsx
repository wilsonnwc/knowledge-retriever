import React, { useState } from 'react';
import './SearchChat.css';
import ChatSidebar from './ChatSidebar';
import ChatThread from './ChatThread';
import ChatInput from './ChatInput';
import ArticleModal from './ArticleModal';
import { mockConversations } from '../../mockData/mockConversations';

let nextMessageId = 1000;

function mockAssistantReply(userText) {
  // Mock-only stand-in for a real backend call — canned response with fake sources.
  return {
    id: `m${nextMessageId++}`,
    role: 'assistant',
    text: `Here's what your notes say about "${userText}" — this is a mocked response while the UI is being built; real answers will come from your embedded notes once the backend is wired up.`,
    sourcesSummary: '2 relevant articles found from your database.',
    sourcesElaboration:
      "Both notes touch on evaluating decisions by how easily they can be undone — one from an AI-product angle, one from a design-principles angle.",
    sources: [
      {
        noteId: 1,
        title: 'Building production AI agents',
        path: 'notes/ai-products/building-production-ai-agents-linear.md',
        before: 'The team obsesses over speed to signal, not perfection.',
        chunk: 'Every agent workflow decision is treated as a reversible bet.',
        after: 'Ship the smallest version, measure, and only invest further once the signal is real.'
      },
      {
        noteId: 2,
        title: 'The Design of Everyday Things',
        path: 'notes/design/design-of-everyday-things.md',
        chunk:
          'Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.'
      }
    ]
  };
}

function SearchChatPage({ onGoToArticle }) {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState(mockConversations[0]?.id ?? null);
  const [openArticleId, setOpenArticleId] = useState(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleNewChat = () => {
    const newConv = {
      id: `conv-${Date.now()}`,
      title: 'New chat',
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
  };

  const handleSend = (text) => {
    const userMessage = { id: `m${nextMessageId++}`, role: 'user', text };
    const assistantMessage = mockAssistantReply(text);

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConversationId) return conv;
        const isFirstMessage = conv.messages.length === 0;
        return {
          ...conv,
          title: isFirstMessage ? text : conv.title,
          messages: [...conv.messages, userMessage, assistantMessage]
        };
      })
    );
  };

  // If there's no active conversation (e.g. right after load with none selected), start one on send.
  const handleSendSafe = (text) => {
    if (!activeConversationId) {
      handleNewChat();
    }
    handleSend(text);
  };

  return (
    <div className="search-chat-page">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
      />
      <div className="chat-main">
        <ChatThread
          messages={activeConversation?.messages ?? []}
          onOpenArticle={setOpenArticleId}
        />
        <ChatInput onSend={handleSendSafe} />
      </div>
      {openArticleId && (
        <ArticleModal
          noteId={openArticleId}
          onClose={() => setOpenArticleId(null)}
          onGoToArticle={(noteId) => {
            setOpenArticleId(null);
            onGoToArticle(noteId);
          }}
        />
      )}
    </div>
  );
}

export default SearchChatPage;
