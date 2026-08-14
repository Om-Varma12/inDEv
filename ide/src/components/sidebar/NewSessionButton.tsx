interface NewSessionButtonProps {
  onClick?: () => void;
  className?: string;
}

export const NewSessionButton = ({
  onClick,
  className = '',
}: NewSessionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-sm px-md py-sm 
        bg-surface-container-low hover:bg-surface-container-high 
        text-on-surface rounded-[6px] transition-colors
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span className="text-body-sm">New session</span>
    </button>
  );
};
