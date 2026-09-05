import React, { useState } from 'react';
import '../SearchChat/SearchChat.css';
import '../ImportFlow/ImportFlow.css';
import './MainChat.css';
import ChatThread from '../SearchChat/ChatThread';
import ChatInput from '../SearchChat/ChatInput';
import NotesDetailPanel from '../NotesView/NotesDetailPanel';
import UploadScreen from '../ImportFlow/UploadScreen';
import PreviewScreen from '../ImportFlow/PreviewScreen';
import FrontmatterScreen from '../ImportFlow/FrontmatterScreen';
import ConfirmScreen from '../ImportFlow/ConfirmScreen';
import SuccessScreen from '../ImportFlow/SuccessScreen';

function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle">
      <button
        className={mode === 'search' ? 'active' : ''}
        onClick={() => onChange('search')}
        type="button"
      >
        Search
      </button>
      <button
        className={mode === 'import' ? 'active' : ''}
        onClick={() => onChange('import')}
        type="button"
      >
        Import
      </button>
    </div>
  );
}

function ProjectFilterSelect({ activeProjects, value, onChange }) {
  if (!activeProjects || activeProjects.length === 0) return null;
  return (
    <select
      className="project-filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Scope search to a project"
    >
      <option value="">All notes</option>
      {activeProjects.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
}

function LandingSearchForm({ onSend }) {
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
    <form className="landing-search-form" onSubmit={handleSubmit}>
      <textarea
        className="landing-search-textarea"
        placeholder="How can I help you today?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        autoFocus
      />
      <button type="submit" className="landing-search-send" disabled={!value.trim()}>
        →
      </button>
    </form>
  );
}

function MainChat({
  mode,
  onModeChange,
  activeConversation,
  onSend,
  openArticleNote,
  openArticleContentLoading,
  openArticleContentError,
  onOpenArticle,
  onCloseArticle,
  onEditArticle,
  importScreen,
  importData,
  importExtracting,
  importExtractError,
  savedNotePath,
  topics,
  tags,
  activeProjects,
  searchProject,
  onSearchProjectChange,
  onFileUpload,
  onContentUpdate,
  onFrontmatterUpdate,
  onConfirm,
  onImportBack,
  onImportNext,
  onGoToNotes
}) {
  const isSearchLanding = mode === 'search' && !activeConversation;
  const isImportLanding = mode === 'import' && importScreen === 'upload' && !importData.content;
  const isLanding = isSearchLanding || isImportLanding;

  return (
    <div className="main-chat">
      {isLanding && (
        <div className="chat-landing">
          <div className={`chat-landing-inner ${mode === 'import' ? 'chat-landing-inner-wide' : ''}`}>
            <ModeToggle mode={mode} onChange={onModeChange} />
            {mode === 'search' ? (
              <>
                <h1 className="chat-landing-title">How can I help you today?</h1>
                <LandingSearchForm onSend={onSend} />
                <div className="chat-landing-project-row">
                  <ProjectFilterSelect
                    activeProjects={activeProjects}
                    value={searchProject}
                    onChange={onSearchProjectChange}
                  />
                </div>
                <p className="chat-input-hint">Searches your saved notes only — not the web.</p>
              </>
            ) : (
              <UploadScreen onUpload={onFileUpload} extracting={importExtracting} extractError={importExtractError} />
            )}
          </div>
        </div>
      )}

      {!isLanding && mode === 'search' && (
        <div className="chat-main">
          <ChatThread messages={activeConversation?.messages ?? []} onOpenArticle={onOpenArticle} />
          <div className="chat-input-area-wrapper">
            <ProjectFilterSelect
              activeProjects={activeProjects}
              value={searchProject}
              onChange={onSearchProjectChange}
            />
            <ChatInput onSend={onSend} />
          </div>
        </div>
      )}

      {!isLanding && mode === 'import' && (
        <div className="chat-import-flow">
          {importScreen === 'preview' && (
            <PreviewScreen
              content={importData.content}
              onUpdate={onContentUpdate}
              onNext={() => onImportNext('frontmatter')}
              onBack={() => onImportBack('upload')}
            />
          )}
          {importScreen === 'frontmatter' && (
            <FrontmatterScreen
              data={importData}
              topics={topics}
              tags={tags}
              activeProjects={activeProjects}
              onUpdate={onFrontmatterUpdate}
              onNext={() => onImportNext('confirm')}
              onBack={() => onImportBack('preview')}
            />
          )}
          {importScreen === 'confirm' && (
            <ConfirmScreen
              data={importData}
              onConfirm={onConfirm}
              onBack={() => onImportBack('frontmatter')}
            />
          )}
          {importScreen === 'success' && (
            <SuccessScreen
              notePath={savedNotePath}
              onNew={() => onModeChange('import', true)}
              onGoToNotes={onGoToNotes}
            />
          )}
        </div>
      )}

      {openArticleNote && (
        <NotesDetailPanel
          note={openArticleNote}
          contentLoading={openArticleContentLoading}
          contentError={openArticleContentError}
          onClose={onCloseArticle}
          onEdit={onEditArticle}
        />
      )}
    </div>
  );
}

export default MainChat;
