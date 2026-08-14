import React from 'react';
import { MainLayout } from './components/layout';

function App() {
  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    // TODO: Connect to backend API
  };

  const handlePromptClick = (prompt: string) => {
    console.log('Prompt clicked:', prompt);
    // TODO: Handle prompt selection
  };

  return (
    <MainLayout
      onSendMessage={handleSendMessage}
      onPromptClick={handlePromptClick}
    />
  );
}

export default App;
