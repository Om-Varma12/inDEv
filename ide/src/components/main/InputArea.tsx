import { useState, useRef, useCallback } from 'react';
import { IconButton } from '../ui';

interface InputAreaProps {
  placeholder?: string;
  onSendMessage?: (message: string) => void;
  className?: string;
}

export const InputArea = ({
  placeholder = 'Ask Devin to build features, fix bugs, or work on your code',
  onSendMessage,
  className = '',
}: InputAreaProps) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('Normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize: expand up to 10 lines (line-height 24px), then scroll
  const LINE_HEIGHT = 24; // text-body-lg lineHeight
  const MAX_LINES = 10;
  const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES; // 240px

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${capped}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [MAX_HEIGHT]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Height is adjusted in the next microtask after React updates the DOM
    setTimeout(adjustHeight, 0);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage?.(message);
      setMessage('');
      // Reset textarea height after send
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          el.style.height = '64px';
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
    // Shift+Enter: browser default behaviour inserts a newline — no need to handle
  };

  return (
    <div
      className={`
        bg-surface-container-low rounded-[12px] p-4 flex flex-col gap-3 
        shadow-md border border-surface-container-high 
        group focus-within:border-primary/50 focus-within:shadow-lg 
        focus-within:shadow-primary/5 transition-all duration-300
        ${className}
      `}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ height: '64px', overflowY: 'hidden' }}
        className="
          w-full bg-transparent resize-none outline-none 
          text-body-lg text-on-surface placeholder:text-on-surface-variant/50 
          placeholder:font-body-lg scrollbar-thin scrollbar-thumb-outline-variant
        "
      />
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <IconButton icon="add" size="lg" />
          <IconButton icon="tune" size="lg" />
          <button
            onClick={() => setMode(mode === 'Normal' ? 'Advanced' : 'Normal')}
            className="flex items-center gap-1 px-2 py-1 hover:bg-surface-container-high rounded-md transition-colors text-body-sm"
          >
            {mode}
            <span className="material-symbols-outlined text-[16px]">
              expand_more
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <IconButton icon="mic" size="lg" />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="
              w-[26px] h-[26px] rounded-full bg-secondary-fixed 
              hover:bg-secondary-fixed-dim transition-colors 
              flex items-center justify-center text-on-secondary-fixed
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <span className="material-symbols-outlined text-[16px] font-bold">
              arrow_upward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
