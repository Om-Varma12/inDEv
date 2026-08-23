import { useState } from 'react';
import { MainLayout } from './components/layout';
import { AuthModal } from './components/auth';
import { apiPost } from './utils/api';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = async (messageText: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const thinkingMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: '⚙ Building your project sandbox. This may take a moment...',
      };
      setMessages((prev) => [...prev, thinkingMsg]);

      const res = await apiPost('/api/chat', {
        message: messageText,
        projectName: messageText.trim().split(/\s+/).slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'project',
      });

      const data = await res.json();

      setSandboxId(data.sandboxId);

      setMessages((prev) => {
        // Replace the thinking message with the done message
        const without = prev.filter((m) => m.id !== thinkingMsg.id);
        return [
          ...without,
          {
            id: (Date.now() + 2).toString(),
            role: 'agent',
            content: `✅ Project ready! You can now interact with the terminal on the right.`,
          },
        ];
      });
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          role: 'agent',
          content: `❌ Error: ${error.message || 'Something went wrong while building the project.'}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  return (
    <>
      <MainLayout
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        messages={messages}
        onSendMessage={isGenerating ? undefined : handleSendMessage}
        onPromptClick={isGenerating ? undefined : handlePromptClick}
        sandboxId={sandboxId}
      />
      <AuthModal />
    </>
  );
}

export default App;
