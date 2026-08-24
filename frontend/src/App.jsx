import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import MainChat from './components/MainChat/MainChat';
import NotesListView from './components/NotesView/NotesListView';
import EditNoteModal from './components/NotesView/EditNoteModal';
import * as api from './api/client';
import { mockConversations } from './mockData/mockConversations';

let nextMessageId = 1000;
let nextImportId = 1;

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

const blankImportData = () => ({
  content: '',
  fileType: '',
  title: '',
  source: '',
  date: new Date().toISOString().split('T')[0],
  type: 'article',
  topicFolder: '',
  tags: []
});

function App() {
  const [view, setView] = useState('chat'); // chat, notes
  const [mode, setMode] = useState('search'); // search, import

  // Search/chat state
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [openArticleId, setOpenArticleId] = useState(null);

  // Import state
  const [importScreen, setImportScreen] = useState('upload');
  const [importData, setImportData] = useState(blankImportData());
  const [completedImports, setCompletedImports] = useState([]);

  // Notes state — real data from the Flask backend
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteDetail, setEditingNoteDetail] = useState(null);
  const [editingNoteLoading, setEditingNoteLoading] = useState(false);
  const [editingNoteError, setEditingNoteError] = useState(null);

  useEffect(() => {
    setNotesLoading(true);
    Promise.all([api.fetchNotes(), api.fetchTopics(), api.fetchTags()])
      .then(([notesData, topicsData, tagsData]) => {
        setNotes(notesData);
        setTopics(topicsData);
        setTags(tagsData);
        setNotesError(null);
      })
      .catch((err) => setNotesError(err.message))
      .finally(() => setNotesLoading(false));
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // --- Sidebar actions ---
  const handleNewChat = () => {
    setView('chat');
    setMode('search');
    setActiveConversationId(null);
    setImportScreen('upload');
    setImportData(blankImportData());
  };

  const handleNavigate = (page) => {
    setView(page);
  };

  const historyItems = [
    ...conversations.map((c) => ({ id: c.id, title: c.title, type: 'search', updatedAt: c.updatedAt })),
    ...(importScreen !== 'upload' || importData.content
      ? [
          {
            id: 'in-progress-import',
            title: importData.title || 'New import',
            type: 'import',
            updatedAt: '9999-12-31T00:00:00Z' // always most recent while active
          }
        ]
      : []),
    ...completedImports.map((imp) => ({ id: imp.id, title: imp.title, type: 'import', updatedAt: imp.updatedAt }))
  ].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const handleSelectHistory = (item) => {
    setView('chat');
    if (item.type === 'search') {
      setMode('search');
      setActiveConversationId(item.id);
    } else if (item.id === 'in-progress-import') {
      setMode('import');
    } else {
      const imp = completedImports.find((i) => i.id === item.id);
      if (imp) {
        setMode('import');
        setImportData(imp.data);
        setImportScreen('success');
      }
    }
  };

  // --- Search/chat handlers ---
  const handleSend = (text) => {
    let convId = activeConversationId;
    const userMessage = { id: `m${nextMessageId++}`, role: 'user', text };
    const assistantMessage = mockAssistantReply(text);

    if (!convId) {
      convId = `conv-${Date.now()}`;
      const newConv = {
        id: convId,
        title: text,
        updatedAt: new Date().toISOString(),
        messages: [userMessage, assistantMessage]
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(convId);
      return;
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === convId
          ? { ...conv, messages: [...conv.messages, userMessage, assistantMessage], updatedAt: new Date().toISOString() }
          : conv
      )
    );
  };

  const handleGoToArticleFromChat = (noteId) => {
    setOpenArticleId(null);
    setView('notes');
    setEditingNoteId(noteId);
  };

  // --- Import handlers ---
  const handleFileUpload = (content, fileType) => {
    setImportData((prev) => ({ ...prev, content, fileType }));
    setImportScreen('preview');
  };

  const handleContentUpdate = (content) => {
    setImportData((prev) => ({ ...prev, content }));
  };

  const handleFrontmatterUpdate = (frontmatter) => {
    setImportData((prev) => ({ ...prev, ...frontmatter }));
  };

  const handleImportConfirm = () => {
    // Mock save
    console.log('Saving note:', importData);
    setImportScreen('success');
    setCompletedImports((prev) => [
      { id: `import-${nextImportId++}`, title: importData.title, data: importData, updatedAt: new Date().toISOString() },
      ...prev
    ]);
  };

  // --- Mode toggle (also handles "start another import" from SuccessScreen) ---
  const handleModeChange = (newMode, resetImport = false) => {
    setMode(newMode);
    if (newMode === 'import' && (resetImport || importScreen === 'success')) {
      setImportScreen('upload');
      setImportData(blankImportData());
    }
  };

  const handleImportClick = () => {
    setView('chat');
    handleModeChange('import', true);
  };

  // --- Notes handlers ---
  const handleEditNote = (noteId) => {
    setEditingNoteId(noteId);
    setEditingNoteDetail(null);
    setEditingNoteError(null);
    setEditingNoteLoading(true);
    api
      .fetchNote(noteId)
      .then((note) => setEditingNoteDetail(note))
      .catch((err) => setEditingNoteError(err.message))
      .finally(() => setEditingNoteLoading(false));
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteDetail(null);
    setEditingNoteError(null);
  };

  const handleSaveEditedNote = (formData) => {
    const updates = {
      title: formData.title,
      author: formData.author,
      source: formData.source,
      date: formData.date,
      type: formData.type,
      topic: formData.topicFolder,
      tags: formData.tags,
      content: formData.content
    };
    return api.updateNote(editingNoteId, updates).then((updatedNote) => {
      if (updatedNote.warning) {
        // eslint-disable-next-line no-alert
        alert(updatedNote.warning);
      }
      setNotes((prev) => prev.map((n) => (n.id === editingNoteId ? { ...n, ...updatedNote } : n)));
      setEditingNoteId(null);
      setEditingNoteDetail(null);
    });
  };

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        onNewChat={handleNewChat}
        historyItems={historyItems}
        activeHistoryId={mode === 'import' ? (importScreen === 'success' ? completedImports[0]?.id : 'in-progress-import') : activeConversationId}
        onSelectHistory={handleSelectHistory}
      />

      <div className="main-content">
        {view === 'chat' && (
          <MainChat
            mode={mode}
            onModeChange={handleModeChange}
            activeConversation={activeConversation}
            onSend={handleSend}
            openArticleId={openArticleId}
            onOpenArticle={setOpenArticleId}
            onCloseArticle={() => setOpenArticleId(null)}
            onGoToArticle={handleGoToArticleFromChat}
            importScreen={importScreen}
            importData={importData}
            onFileUpload={handleFileUpload}
            onContentUpdate={handleContentUpdate}
            onFrontmatterUpdate={handleFrontmatterUpdate}
            onConfirm={handleImportConfirm}
            onImportBack={setImportScreen}
            onImportNext={setImportScreen}
          />
        )}

        {view === 'notes' && (
          <div className="page-scroll">
            <NotesListView
              notes={notes}
              loading={notesLoading}
              error={notesError}
              onImportClick={handleImportClick}
              onEditNote={handleEditNote}
            />
          </div>
        )}

        {editingNoteId && (editingNoteLoading || editingNoteError) && (
          <div className="edit-modal-overlay">
            <div className="edit-modal">
              {editingNoteLoading && <p style={{ padding: 24 }}>Loading note…</p>}
              {editingNoteError && !editingNoteLoading && (
                <div style={{ padding: 24 }}>
                  <p>Couldn't load this note: {editingNoteError}</p>
                  <button className="btn btn-secondary" onClick={handleCancelEditNote}>Close</button>
                </div>
              )}
            </div>
          </div>
        )}

        {editingNoteDetail && (
          <EditNoteModal
            note={editingNoteDetail}
            topics={topics}
            tags={tags}
            onSave={handleSaveEditedNote}
            onCancel={handleCancelEditNote}
          />
        )}
      </div>
    </div>
  );
}

export default App;
