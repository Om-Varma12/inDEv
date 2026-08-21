import { IconButton } from '../ui';
import { useAuth } from '../../contexts/AuthContext';

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
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
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
      <div className="flex items-center gap-sm">
        {!isAuthenticated ? (
          <button
            onClick={openAuthModal}
            className="text-body-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Log in
          </button>
        ) : (
          <div className="relative group flex items-center cursor-pointer" onClick={logout} title="Log out">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              {user?.username ? (
                 <span className="text-on-primary font-medium">{user.username.charAt(0).toUpperCase()}</span>
              ) : (
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              )}
            </div>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-surface-container-high text-on-surface py-1 px-3 rounded text-sm shadow-lg whitespace-nowrap">
              Log out
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
