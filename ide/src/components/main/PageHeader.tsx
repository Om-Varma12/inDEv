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
          <img
            src="/avatar.png"
            alt="InDev avatar"
            width={20}
            height={20}
            className="opacity-80 rounded-sm object-cover"
          />
        </div>
        <span className="font-headline-sm text-on-surface text-[20px] font-semibold tracking-tight">
          InDev
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
