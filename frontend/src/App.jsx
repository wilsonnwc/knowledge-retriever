import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import MainChat from './components/MainChat/MainChat';
import NotesListView from './components/NotesView/NotesListView';
import EditNoteModal from './components/NotesView/EditNoteModal';
import TrashView from './components/NotesView/TrashView';
import ProjectsListView from './components/ProjectsView/ProjectsListView';
import * as api from './api/client';

let nextMessageId = 1000;
let nextImportId = 1;

const blankImportData = () => ({
  content: '',
  fileType: '',
  title: '',
  author: '',
  source: '',
  date: new Date().toISOString().split('T')[0],
  type: 'article',
  topicFolder: '',
  tags: [],
  projects: []
});

function App() {
  const [view, setView] = useState('chat'); // chat, notes, trash, projects
  const [mode, setMode] = useState('search'); // search, import

  // Search/chat state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchProject, setSearchProject] = useState('');
  const [openArticleId, setOpenArticleId] = useState(null);
  const [openArticleContent, setOpenArticleContent] = useState(null);
  const [openArticleContentLoading, setOpenArticleContentLoading] = useState(false);
  const [openArticleContentError, setOpenArticleContentError] = useState(null);

  // Import state
  const [importScreen, setImportScreen] = useState('upload');
  const [importData, setImportData] = useState(blankImportData());
  const [completedImports, setCompletedImports] = useState([]);
  const [importExtracting, setImportExtracting] = useState(false);
  const [importExtractError, setImportExtractError] = useState(null);
  const [savedNotePath, setSavedNotePath] = useState('');

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

  // Trash state — fetched lazily, only when the Trash view is opened
  const [trash, setTrash] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState(null);

  // Projects state — fetched eagerly (not lazily like trash) since the
  // Edit modal, Import wizard, and Search's project selector all need the
  // active project list too, not just the dedicated Projects view.
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const activeProjectNames = projects.filter((p) => p.status === 'active').map((p) => p.name);

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

    setProjectsLoading(true);
    api
      .fetchProjects()
      .then((data) => {
        setProjects(data);
        setProjectsError(null);
      })
      .catch((err) => setProjectsError(err.message))
      .finally(() => setProjectsLoading(false));
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Fetch full content for whichever article a chat source's "Go to
  // article" was clicked on — same pattern NotesListView uses for its own
  // detail panel, since this reuses that same real Read view (Session 19
  // Q1: no separate mock renderer for chat-triggered article views).
  useEffect(() => {
    if (!openArticleId) {
      setOpenArticleContent(null);
      setOpenArticleContentError(null);
      return;
    }
    setOpenArticleContentLoading(true);
    api
      .fetchNote(openArticleId)
      .then((fullNote) => {
        setOpenArticleContent(fullNote.content);
        setOpenArticleContentError(null);
      })
      .catch((err) => setOpenArticleContentError(err.message))
      .finally(() => setOpenArticleContentLoading(false));
  }, [openArticleId]);

  const openArticleSummary = notes.find((n) => n.id === openArticleId);
  const openArticleNote = openArticleSummary && openArticleContent !== null
    ? { ...openArticleSummary, content: openArticleContent }
    : openArticleSummary;

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
    const assistantMessageId = `m${nextMessageId++}`;
    const placeholderMessage = { id: assistantMessageId, role: 'assistant', text: 'Thinking…', loading: true };

    if (!convId) {
      convId = `conv-${Date.now()}`;
      const newConv = {
        id: convId,
        title: text,
        updatedAt: new Date().toISOString(),
        messages: [userMessage, placeholderMessage]
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(convId);
    } else {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? { ...conv, messages: [...conv.messages, userMessage, placeholderMessage], updatedAt: new Date().toISOString() }
            : conv
        )
      );
    }

    // Merges fields into the assistant placeholder in place (never a full
    // replace) so onDelta's accumulated text and onDone's sources data
    // don't clobber each other regardless of arrival order.
    const patchAssistantMessage = (fields) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? {
                ...conv,
                messages: conv.messages.map((m) => (m.id === assistantMessageId ? { ...m, ...fields } : m))
              }
            : conv
        )
      );
    };

    let accumulatedText = '';

    api.searchStream(text, {
      project: searchProject,
      onDelta: (delta) => {
        accumulatedText += delta;
        // streaming:true (not just loading:false) marks the first token's
        // arrival distinctly from later chunks, so ChatThread can scroll
        // to the top of this answer exactly once, not on every delta.
        patchAssistantMessage({ text: accumulatedText, loading: false, streaming: true });
      },
      onDone: (data) => {
        patchAssistantMessage({
          streaming: false,
          sourcesSummary: data.sourcesSummary,
          sourcesElaboration: data.sourcesElaboration,
          sources: data.sources
        });
      },
      onError: (message) => {
        patchAssistantMessage({ text: `Sorry, something went wrong: ${message}`, loading: false, streaming: false });
      }
    });
  };

  const handleGoToArticleFromChat = (noteId) => {
    setOpenArticleId(null);
    setView('notes');
    setEditingNoteId(noteId);
  };

  // --- Import handlers ---
  const handleFileUpload = (content, fileType) => {
    setImportExtracting(true);
    setImportExtractError(null);
    api
      .importExtract(fileType, content)
      .then((response) => {
        const suggestions = {};
        (response.frontmatter_prompts || []).forEach((p) => {
          suggestions[p.field] = p.value;
        });
        setImportData((prev) => ({
          ...prev,
          content: response.preview,
          fileType,
          title: suggestions.title || prev.title,
          source: suggestions.source || prev.source,
          type: suggestions.type || prev.type
        }));
        setImportScreen('preview');
      })
      .catch((err) => setImportExtractError(err.message))
      .finally(() => setImportExtracting(false));
  };

  const handleContentUpdate = (content) => {
    setImportData((prev) => ({ ...prev, content }));
  };

  const handleFrontmatterUpdate = (frontmatter) => {
    setImportData((prev) => ({ ...prev, ...frontmatter }));
  };

  const handleImportConfirm = () => {
    return api
      .importConfirm({
        content: importData.content,
        frontmatterUpdates: {
          title: importData.title,
          author: importData.author,
          source: importData.source,
          date: importData.date,
          type: importData.type
        },
        topicFolder: importData.topicFolder,
        tags: importData.tags,
        projects: importData.projects
      })
      .then((response) => {
        if (response.warning) {
          // eslint-disable-next-line no-alert
          alert(response.warning);
        }
        const noteId = response.note_path.replace(/^notes\//, '');
        return api.fetchNote(noteId).then((fullNote) => {
          setNotes((prev) => [fullNote, ...prev]);
          setSavedNotePath(response.note_path);
          setImportScreen('success');
          setCompletedImports((prev) => [
            { id: `import-${nextImportId++}`, title: importData.title, data: importData, updatedAt: new Date().toISOString() },
            ...prev
          ]);
        });
      });
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

  const handleGoToNotes = () => {
    setView('notes');
    setMode('search');
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
      projects: formData.projects,
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

  const handleDeleteNote = () => {
    return api.deleteNote(editingNoteId).then(() => {
      setNotes((prev) => prev.filter((n) => n.id !== editingNoteId));
      setEditingNoteId(null);
      setEditingNoteDetail(null);
    });
  };

  // --- Trash handlers ---
  const handleTrashClick = () => {
    setView('trash');
    setTrashLoading(true);
    setTrashError(null);
    api
      .fetchTrash()
      .then(setTrash)
      .catch((err) => setTrashError(err.message))
      .finally(() => setTrashLoading(false));
  };

  const handleBackFromTrash = () => setView('notes');

  const handleRestoreNote = (trashId) => {
    return api.restoreNote(trashId).then((restoredNote) => {
      if (restoredNote.warning) {
        // eslint-disable-next-line no-alert
        alert(restoredNote.warning);
      }
      setTrash((prev) => prev.filter((n) => n.id !== trashId));
      setNotes((prev) => [...prev, restoredNote]);
    });
  };

  // --- Projects handlers ---
  // Refetch the full list after every mutation rather than patching local
  // state in place — simplest correct option, and the only one that
  // doesn't need special-casing for rename (which changes the list's own
  // key). Errors propagate to the caller (ProjectsListView shows them).
  const refreshProjects = () => api.fetchProjects().then(setProjects);

  const handleCreateProject = (name) => api.createProject(name).then(refreshProjects);

  const handleRenameProject = (oldName, newName) =>
    api.renameProject(oldName, newName).then(refreshProjects);

  const handleArchiveProject = (name) => api.archiveProject(name).then(refreshProjects);

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
            openArticleNote={openArticleNote}
            openArticleContentLoading={openArticleContentLoading}
            openArticleContentError={openArticleContentError}
            onOpenArticle={setOpenArticleId}
            onCloseArticle={() => setOpenArticleId(null)}
            onEditArticle={handleGoToArticleFromChat}
            importScreen={importScreen}
            importData={importData}
            importExtracting={importExtracting}
            importExtractError={importExtractError}
            savedNotePath={savedNotePath}
            topics={topics}
            tags={tags}
            activeProjects={activeProjectNames}
            searchProject={searchProject}
            onSearchProjectChange={setSearchProject}
            onFileUpload={handleFileUpload}
            onContentUpdate={handleContentUpdate}
            onFrontmatterUpdate={handleFrontmatterUpdate}
            onConfirm={handleImportConfirm}
            onImportBack={setImportScreen}
            onImportNext={setImportScreen}
            onGoToNotes={handleGoToNotes}
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
            <button className="btn-trash-fab" onClick={handleTrashClick}>🗑️ Trash</button>
          </div>
        )}

        {view === 'projects' && (
          <div className="page-scroll">
            <ProjectsListView
              projects={projects}
              loading={projectsLoading}
              error={projectsError}
              onCreate={handleCreateProject}
              onRename={handleRenameProject}
              onArchive={handleArchiveProject}
            />
          </div>
        )}

        {view === 'trash' && (
          <div className="page-scroll">
            <TrashView
              trash={trash}
              loading={trashLoading}
              error={trashError}
              onRestore={handleRestoreNote}
              onBack={handleBackFromTrash}
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
            activeProjects={activeProjectNames}
            onSave={handleSaveEditedNote}
            onDelete={handleDeleteNote}
            onCancel={handleCancelEditNote}
          />
        )}
      </div>
    </div>
  );
}

export default App;
