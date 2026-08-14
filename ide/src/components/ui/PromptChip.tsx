import React from 'react';

interface PromptChipProps {
  icon: string;
  label: string;
  onClick?: () => void;
  className?: string;
}

export const PromptChip: React.FC<PromptChipProps> = ({
  icon,
  label,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg 
        bg-surface-container-lowest border border-surface-container 
        text-body-sm text-on-surface-variant 
        cursor-pointer hover:bg-surface-container 
        transition-colors shadow-sm
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      <span>{label}</span>
    </div>
  );
};
