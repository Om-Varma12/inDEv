interface UserProfileProps {
  username?: string;
  avatarInitial?: string;
  className?: string;
}

export const UserProfile = ({
  username = 'User',
  avatarInitial = username.charAt(0).toUpperCase(),
  className = '',
}: UserProfileProps) => {
  return (
    <div className={`flex items-center gap-sm group ${className}`}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[11px] text-primary font-semibold flex-none">
        {avatarInitial}
      </div>
      {/* Username */}
      <span className="text-body-sm font-medium text-on-surface truncate max-w-[130px]">
        {username}
      </span>
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant ml-auto">
        expand_more
      </span>
    </div>
  );
};
