import React from 'react';

interface UserProfileProps {
  username: string;
  avatarInitial?: string;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  username,
  avatarInitial = username.charAt(0).toUpperCase(),
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-sm ${className}`}>
      <div className="w-5 h-5 rounded-full bg-[#333333] flex items-center justify-center text-[10px] text-on-surface">
        {avatarInitial}
      </div>
      <span className="text-body-sm font-medium text-on-surface">{username}</span>
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
};
