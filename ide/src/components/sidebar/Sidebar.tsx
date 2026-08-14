import { UserProfile } from './UserProfile';
import { NewSessionButton } from './NewSessionButton';
import { NavigationMenu } from './NavigationMenu';
import { RecentSessions } from './RecentSessions';
import { SidebarFooter } from './SidebarFooter';
import { IconButton } from '../ui';

interface SidebarProps {
  username?: string;
  className?: string;
}

export const Sidebar = ({
  username = 'Om-Varma12',
  className = '',
}: SidebarProps) => {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-[300px] bg-background 
        border-r border-outline-variant z-50 flex flex-col
        ${className}
      `}
    >
      <div className="p-md flex items-center justify-between">
        <UserProfile username={username} />
        <div className="flex items-center gap-sm">
          <IconButton icon="search" />
          <IconButton icon="side_navigation" />
        </div>
      </div>
      
      <div className="px-md mb-md">
        <NewSessionButton />
      </div>
      
      <NavigationMenu />
      
      <RecentSessions />
      
      <SidebarFooter />
    </aside>
  );
};
