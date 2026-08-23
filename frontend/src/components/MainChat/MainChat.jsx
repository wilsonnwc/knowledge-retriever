import React, { useState } from 'react';
import '../SearchChat/SearchChat.css';
import '../ImportFlow/ImportFlow.css';
import './MainChat.css';
import ChatThread from '../SearchChat/ChatThread';
import ChatInput from '../SearchChat/ChatInput';
import ArticleModal from '../SearchChat/ArticleModal';
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
  openArticleId,
  onOpenArticle,
  onCloseArticle,
  onGoToArticle,
  importScreen,
  importData,
  onFileUpload,
  onContentUpdate,
  onFrontmatterUpdate,
  onConfirm,
  onImportBack,
  onImportNext
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
                <p className="chat-input-hint">Searches your saved notes only — not the web.</p>
              </>
            ) : (
              <UploadScreen onUpload={onFileUpload} />
            )}
          </div>
        </div>
      )}

      {!isLanding && mode === 'search' && (
        <div className="chat-main">
          <ChatThread messages={activeConversation?.messages ?? []} onOpenArticle={onOpenArticle} />
          <ChatInput onSend={onSend} />
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
              notePath={`notes/${importData.topicFolder}/${importData.title.toLowerCase().replace(/\s+/g, '-')}.md`}
              onNew={() => onModeChange('import', true)}
            />
          )}
        </div>
      )}

      {openArticleId && (
        <ArticleModal
          noteId={openArticleId}
          onClose={onCloseArticle}
          onGoToArticle={onGoToArticle}
        />
      )}
    </div>
  );
}

export default MainChat;
