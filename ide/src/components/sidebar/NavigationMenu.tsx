import React, { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavigationMenuProps {
  className?: string;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

const defaultNavItems: NavItem[] = [
  { path: 'automations', label: 'Automations', icon: 'schedule' },
  { path: 'security', label: 'Security', icon: 'shield' },
  { path: 'review', label: 'Review', icon: 'fitbit_jumping_jacks' },
  { path: 'wiki', label: 'Wiki', icon: 'book' },
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  className = '',
  activePath = 'automations',
  onNavigate,
}) => {
  const [currentPath, setCurrentPath] = useState(activePath);

  const handleNavClick = (path: string) => {
    setCurrentPath(path);
    onNavigate?.(path);
  };

  return (
    <nav className={`px-sm space-y-xs flex-none ${className}`}>
      {defaultNavItems.map((item) => (
        <a
          key={item.path}
          onClick={() => handleNavClick(item.path)}
          className={`
            flex items-center gap-md px-md py-sm rounded-[6px] transition-all
            ${
              currentPath === item.path
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }
          `}
          href="#"
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="text-body-sm">{item.label}</span>
        </a>
      ))}
    </nav>
  );
};
