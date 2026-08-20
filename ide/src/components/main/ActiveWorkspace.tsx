import { useState, useRef, useCallback, useEffect } from 'react';
import { IconButton } from '../ui';
import type { Message } from '../../App';
import { TerminalComponent } from './TerminalComponent';

interface ActiveWorkspaceProps {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  className?: string;
}

export const ActiveWorkspace = ({
  messages,
  onSendMessage,
  className = '',
}: ActiveWorkspaceProps) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'shell' | 'preview'>('shell');
  const [splitPercent, setSplitPercent] = useState(50);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // ── Auto-resize textarea ────────────────────────────────────────────────
  const LINE_HEIGHT = 20;
  const MAX_HEIGHT = LINE_HEIGHT * 10; // 200px = 10 lines

  const adjustChatHeight = useCallback(() => {
    const el = chatTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${capped}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [MAX_HEIGHT]);

  const handleChatChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setTimeout(adjustChatHeight, 0);
  };

  // ── Auto-scroll chat ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage?.(inputText);
      setInputText('');
      setTimeout(() => {
        const el = chatTextareaRef.current;
        if (el) {
          el.style.height = '40px';
          el.style.overflowY = 'hidden';
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Resizable divider ───────────────────────────────────────────────────
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    // Switch off text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Clamp between 20% and 80%
      const pct = Math.max(20, Math.min(80, (x / rect.width) * 100));
      setSplitPercent(pct);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex w-full h-[calc(100vh-64px)] overflow-hidden ${className}`}
    >
      {/* ── Left Panel: Chat ───────────────────────────────────────────── */}
      <div
        className="flex flex-col h-full border-r border-outline-variant bg-background overflow-hidden"
        style={{ width: `${splitPercent}%` }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-md py-sm space-y-md">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-xs max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-sm text-[12px] text-on-surface-variant">
                {msg.role === 'user' ? (
                  <>
                    <span>You</span>
                    <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[10px] text-on-surface">
                      U
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded bg-surface-container-high flex items-center justify-center text-[10px] text-primary">
                      D
                    </div>
                    <span>Devin</span>
                  </>
                )}
              </div>

              {/* Bubble */}
              <div
                className={`px-md py-sm rounded-xl text-body-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                    : 'bg-surface-container-low border border-surface-container-high text-on-surface rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-outline-variant bg-surface-container-lowest px-md py-sm">
          <div className="bg-surface-container-low rounded-[8px] p-3 flex flex-col gap-2 border border-surface-container-high focus-within:border-primary/50 transition-all duration-300">
            <textarea
              ref={chatTextareaRef}
              value={inputText}
              onChange={handleChatChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Devin to continue working..."
              style={{ height: '40px', overflowY: 'hidden' }}
              className="w-full bg-transparent resize-none outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/50 font-body-md"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm text-on-surface-variant">
                <IconButton icon="add" size="sm" />
                <IconButton icon="tune" size="sm" />
              </div>
              <div className="flex items-center gap-sm">
                <IconButton icon="mic" size="sm" />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-[24px] h-[24px] rounded-full bg-secondary-fixed hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center text-on-secondary-fixed disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[14px] font-bold">
                    arrow_upward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Draggable Divider ──────────────────────────────────────────── */}
      <div
        onMouseDown={handleDividerMouseDown}
        className="w-[4px] flex-none bg-outline-variant hover:bg-primary/60 active:bg-primary cursor-col-resize transition-colors duration-150 relative group"
        title="Drag to resize"
      >
        {/* Visual grip dots */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-primary" />
          ))}
        </div>
      </div>

      {/* ── Right Panel: Tabbed Workspace ─────────────────────────────── */}
      <div
        className="flex flex-col h-full bg-surface overflow-hidden"
        style={{ width: `${100 - splitPercent}%` }}
      >
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-outline-variant bg-background px-md h-12 flex-none">
          <div className="flex items-center">
            <button
              onClick={() => setActiveTab('shell')}
              className={`px-md h-12 text-body-sm font-medium border-b-2 transition-all ${
                activeTab === 'shell'
                  ? 'border-primary text-on-surface'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Shell
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-md h-12 text-body-sm font-medium border-b-2 transition-all ${
                activeTab === 'preview'
                  ? 'border-primary text-on-surface'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Preview
            </button>
          </div>
          <div className="flex items-center gap-xs">
            <IconButton icon="refresh" size="sm" />
            <IconButton icon="open_in_new" size="sm" />
          </div>
        </div>

        {/* Viewports */}
        <div className="flex-1 overflow-hidden">

          {/* Shell */}
          {activeTab === 'shell' && (
            <TerminalComponent />
          )}

          {/* Preview */}
          {activeTab === 'preview' && (
            <div className="w-full h-full flex flex-col bg-background">
              {/* Address bar */}
              <div className="flex items-center gap-sm bg-surface-container-low px-md py-sm border-b border-outline-variant flex-none text-body-sm">
                <div className="flex items-center gap-xs text-on-surface-variant">
                  <IconButton icon="arrow_back" size="sm" />
                  <IconButton icon="arrow_forward" size="sm" />
                  <IconButton icon="refresh" size="sm" />
                </div>
                <div className="flex-1 bg-surface-container rounded px-md py-xs text-on-surface-variant select-all border border-outline-variant overflow-hidden truncate">
                  http://localhost:5173/
                </div>
              </div>
              {/* Viewport */}
              <div className="flex-1 bg-surface-container-lowest flex items-center justify-center p-xl overflow-y-auto">
                <div className="bg-surface rounded-2xl border border-outline-variant p-lg max-w-sm w-full shadow-lg flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <svg fill="none" height="28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[18px] text-on-surface">Vite + React App</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    Development server running. Edit{' '}
                    <code className="font-code-md text-primary bg-primary/5 px-1 py-0.5 rounded">
                      src/App.tsx
                    </code>{' '}
                    to test HMR.
                  </p>
                  <button className="px-lg py-sm bg-primary text-on-primary hover:bg-surface-tint font-medium rounded-full text-body-sm transition-colors shadow-sm cursor-pointer">
                    Get started
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
