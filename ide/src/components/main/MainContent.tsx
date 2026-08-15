import { TopHeader } from './TopHeader';
import { PageHeader } from './PageHeader';
import { InputArea } from './InputArea';
import { ExamplePrompts } from './ExamplePrompts';

interface MainContentProps {
  className?: string;
  onSendMessage?: (message: string) => void;
  onPromptClick?: (prompt: string) => void;
  isFirstMsg?: boolean;
  projectName?: string;
}

export const MainContent = ({
  className = '',
  onSendMessage,
  onPromptClick,
  isFirstMsg = true,
  projectName = 'my-project',
}: MainContentProps) => {
  return (
    <div className={`pl-[300px] ${className}`}>
      <TopHeader />
      <main className="relative pt-16 bg-background min-h-screen">
        <div className="flex flex-col w-full min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="w-full max-w-[686px] flex flex-col gap-6 p-4">
            <PageHeader />
            <InputArea 
              onSendMessage={onSendMessage} 
              isFirstMsg={isFirstMsg}
              projectName={projectName}
            />
            <ExamplePrompts onPromptClick={onPromptClick} />
          </div>
        </div>
      </main>
    </div>
  );
};
