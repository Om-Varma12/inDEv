import React from 'react';
import { Sidebar } from '../sidebar';
import { MainContent } from '../main';

interface MainLayoutProps {
  username?: string;
  onSendMessage?: (message: string) => void;
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  username = 'Om-Varma12',
  onSendMessage,
  onPromptClick,
  className = '',
}) => {
  return (
    <div className={`bg-background font-body-md text-on-surface ${className}`}>
      <Sidebar username={username} />
      <MainContent 
        onSendMessage={onSendMessage}
        onPromptClick={onPromptClick}
      />
    </div>
  );
};
