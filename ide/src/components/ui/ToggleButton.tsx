import React from 'react';

interface ToggleButtonProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  options,
  selectedValue,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center bg-surface p-1 rounded-full 
        border border-surface-container-high shadow-sm
        ${className}
      `}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-1.5 rounded-full text-body-sm font-medium transition-all shadow-sm
            ${
              selectedValue === option.value
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
