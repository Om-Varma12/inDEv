import { TopHeader } from './TopHeader';
import { PageHeader } from './PageHeader';
import { InputArea } from './InputArea';
import { ExamplePrompts } from './ExamplePrompts';
import { ActiveWorkspace } from './ActiveWorkspace';
import type { Message } from '../../App';

interface MainContentProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

export const MainContent = ({
  isSidebarCollapsed,
  onToggleSidebar,
  messages,
  onSendMessage,
  onPromptClick,
  className = '',
}: MainContentProps) => {
  const isInitialState = messages.length === 0;

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'pl-0' : 'pl-[300px]'}
        ${className}
      `}
    >
      <TopHeader 
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
      />
      <main className={`relative pt-16 bg-background ${isInitialState ? 'min-h-screen' : 'overflow-hidden'}`}>
        {isInitialState ? (
          <div className="flex flex-col w-full min-h-[calc(100vh-64px)] items-center justify-center">
            <div className="w-full max-w-[686px] flex flex-col gap-6 p-4">
              <PageHeader />
              <InputArea onSendMessage={onSendMessage} />
              <ExamplePrompts onPromptClick={onPromptClick} />
            </div>
          </div>
        ) : (
          <ActiveWorkspace
            messages={messages}
            onSendMessage={onSendMessage}
          />
        )}
      </main>
    </div>
  );
};
