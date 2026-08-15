import { useState } from 'react';
import { ToggleButton } from '../ui';

interface PageHeaderProps {
  className?: string;
}

export const PageHeader = ({ className = '' }: PageHeaderProps) => {
  const [mode, setMode] = useState('Agent');

  const toggleOptions = [
    { label: 'Agent', value: 'Agent' },
    { label: 'Ask', value: 'Ask' },
  ];

  return (
    <header className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface">
          <svg
            className="opacity-80"
            fill="none"
            height="20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path>
          </svg>
        </div>
        <span className="font-headline-sm text-on-surface text-[20px] font-semibold tracking-tight">
          Devin
        </span>
      </div>
      <ToggleButton
        options={toggleOptions}
        selectedValue={mode}
        onChange={setMode}
      />
    </header>
  );
};
