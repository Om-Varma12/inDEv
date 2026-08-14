import { IconButton } from '../ui';

interface SidebarFooterProps {
  onUpgradeClick?: () => void;
  onSettingsClick?: () => void;
  onDownloadClick?: () => void;
  onHelpClick?: () => void;
  className?: string;
}

export const SidebarFooter = ({
  onUpgradeClick,
  onSettingsClick,
  onDownloadClick,
  onHelpClick,
  className = '',
}: SidebarFooterProps) => {
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
        <IconButton icon="settings" onClick={onSettingsClick} size="lg" />
        <IconButton icon="download" onClick={onDownloadClick} size="lg" />
        <IconButton icon="help" onClick={onHelpClick} size="lg" />
      </div>
    </div>
  );
};
