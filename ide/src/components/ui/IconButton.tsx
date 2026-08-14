import React from 'react';

interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  className = '',
  size = 'md',
  disabled = false,
}) => {
  const sizeClasses = {
    sm: 'text-[16px]',
    md: 'text-[18px]',
    lg: 'text-[20px]',
  };

  const paddingClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${paddingClasses[size]}
        ${sizeClasses[size]}
        hover:bg-surface-container-high
        rounded-md
        transition-colors
        flex items-center justify-center
        text-on-surface-variant
        hover:text-on-surface
        cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
};
