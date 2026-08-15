import { Sidebar } from '../sidebar';
import { MainContent } from '../main';
import { Message } from '../../App';

interface MainLayoutProps {
  username?: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

export const MainLayout = ({
  username = 'Om-Varma12',
  isSidebarCollapsed,
  onToggleSidebar,
  messages,
  onSendMessage,
  onPromptClick,
  className = '',
}: MainLayoutProps) => {
  return (
    <div className={`bg-background font-body-md text-on-surface ${className}`}>
      <Sidebar 
        username={username} 
        isCollapsed={isSidebarCollapsed}
        onToggle={onToggleSidebar}
      />
      <MainContent 
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        messages={messages}
        onSendMessage={onSendMessage}
        onPromptClick={onPromptClick}
      />
    </div>
  );
};
