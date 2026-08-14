import React from 'react';

interface TopHeaderProps {
  className?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ className = '' }) => {
  return (
    <header
      className={`
        fixed top-0 left-[300px] right-0 h-16 bg-background/80 
        backdrop-blur-xl z-40 flex items-center justify-end px-md
        ${className}
      `}
    >
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <span className="material-symbols-outlined text-on-primary text-[18px]">
          person
        </span>
      </div>
    </header>
  );
};
