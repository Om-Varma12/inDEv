import { useState } from 'react';
import { MainLayout } from './components/layout';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = (messageText: string) => {
    console.log('Sending message:', messageText);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Mock agent response
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `I've received your request: "${messageText}". I am analyzing the workspace and running some tests...`,
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 1000);
  };

  const handlePromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  return (
    <MainLayout
      isSidebarCollapsed={isSidebarCollapsed}
      onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      messages={messages}
      onSendMessage={handleSendMessage}
      onPromptClick={handlePromptClick}
      isFirstMsg={messages.length === 0}
      projectName="my-react-app"
    />
  );
}

export default App;
