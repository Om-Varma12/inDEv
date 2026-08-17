import { IconButton } from '../ui';

interface TopHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  className?: string;
}

export const TopHeader = ({
  isSidebarCollapsed,
  onToggleSidebar,
  className = '',
}: TopHeaderProps) => {
  return (
    <header
      className={`
        fixed top-0 right-0 h-16 bg-background/80 
        backdrop-blur-xl z-40 flex items-center justify-between px-md
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'left-0' : 'left-[300px]'}
        ${className}
      `}
    >
      <div className="flex items-center">
        {isSidebarCollapsed && (
          <IconButton 
            icon="side_navigation" 
            onClick={onToggleSidebar}
            className="text-on-surface-variant hover:text-on-surface"
          />
        )}
      </div>
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <span className="material-symbols-outlined text-on-primary text-[18px]">
          person
        </span>
      </div>
    </header>
  );
};
