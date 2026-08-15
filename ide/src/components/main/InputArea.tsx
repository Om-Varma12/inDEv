import { useState } from 'react';
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

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage?.(message);
      setMessage('');
    }
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
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="
          w-full min-h-[64px] bg-transparent resize-none outline-none 
          text-body-lg text-on-surface placeholder:text-on-surface-variant/50 
          placeholder:font-body-lg
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
