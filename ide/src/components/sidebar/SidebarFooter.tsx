import React from 'react';
import { IconButton } from '../ui';

interface SidebarFooterProps {
  onUpgradeClick?: () => void;
  onSettingsClick?: () => void;
  onDownloadClick?: () => void;
  onHelpClick?: () => void;
  className?: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  onUpgradeClick,
  onSettingsClick,
  onDownloadClick,
  onHelpClick,
  className = '',
}) => {
  return (
    <div
      className={`
        mt-auto p-[12px] border-t border-outline-variant 
        flex items-center justify-between
        ${className}
      `}
    >
      <a
        onClick={onUpgradeClick}
        className="flex items-center gap-xs text-[#3b82f6] text-body-sm font-medium cursor-pointer"
        href="#"
      >
        <span className="material-symbols-outlined text-[18px]">north_east</span>
        Upgrade
      </a>
      <div className="flex items-center gap-md">
        <IconButton icon="settings" onClick={onSettingsClick} />
        <IconButton icon="download" onClick={onDownloadClick} />
        <IconButton icon="help" onClick={onHelpClick} />
      </div>
    </div>
  );
};
