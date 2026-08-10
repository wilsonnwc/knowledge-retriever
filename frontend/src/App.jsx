import React, { useState } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import UploadScreen from './components/ImportFlow/UploadScreen';
import PreviewScreen from './components/ImportFlow/PreviewScreen';
import FrontmatterScreen from './components/ImportFlow/FrontmatterScreen';
import ConfirmScreen from './components/ImportFlow/ConfirmScreen';
import SuccessScreen from './components/ImportFlow/SuccessScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('upload'); // upload, preview, frontmatter, confirm, success
  const [importData, setImportData] = useState({
    content: '',
    fileType: '',
    title: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    type: 'article',
    topicFolder: '',
    tags: []
  });

  const handleFileUpload = (content, fileType) => {
    setImportData(prev => ({
      ...prev,
      content,
      fileType
    }));
    setCurrentScreen('preview');
  };

  const handleContentUpdate = (content) => {
    setImportData(prev => ({
      ...prev,
      content
    }));
  };

  const handleFrontmatterUpdate = (frontmatter) => {
    setImportData(prev => ({
      ...prev,
      ...frontmatter
    }));
  };

  const handleConfirm = () => {
    // Mock save
    console.log('Saving note:', importData);
    setCurrentScreen('success');
  };

  const handleReset = () => {
    setCurrentScreen('upload');
    setImportData({
      content: '',
      fileType: '',
      title: '',
      source: '',
      date: new Date().toISOString().split('T')[0],
      type: 'article',
      topicFolder: '',
      tags: []
    });
  };

  return (
    <div className="app">
      <Navigation />
      <div className="main-content">
        {currentScreen === 'upload' && (
          <UploadScreen onUpload={handleFileUpload} />
        )}
        {currentScreen === 'preview' && (
          <PreviewScreen
            content={importData.content}
            onUpdate={handleContentUpdate}
            onNext={() => setCurrentScreen('frontmatter')}
            onBack={() => setCurrentScreen('upload')}
          />
        )}
        {currentScreen === 'frontmatter' && (
          <FrontmatterScreen
            data={importData}
            onUpdate={handleFrontmatterUpdate}
            onNext={() => setCurrentScreen('confirm')}
            onBack={() => setCurrentScreen('preview')}
          />
        )}
        {currentScreen === 'confirm' && (
          <ConfirmScreen
            data={importData}
            onConfirm={handleConfirm}
            onBack={() => setCurrentScreen('frontmatter')}
          />
        )}
        {currentScreen === 'success' && (
          <SuccessScreen
            notePath={`notes/${importData.topicFolder}/${importData.title.toLowerCase().replace(/\s+/g, '-')}.md`}
            onNew={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;
