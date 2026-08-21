import { Sidebar } from '../sidebar';
import { MainContent } from '../main';
import type { Message } from '../../App';

interface MainLayoutProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

export const MainLayout = ({
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
