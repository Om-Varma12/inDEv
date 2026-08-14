import React from 'react';
import { IconButton } from '../ui';

interface RecentSessionsProps {
  sessions?: Array<{ id: string; title: string }>;
  className?: string;
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions = [],
  className = '',
}) => {
  return (
    <div className={`mt-xl px-md flex-1 ${className}`}>
      <div className="flex items-center justify-between mb-sm">
        <span className="text-label-caps text-on-surface-variant">RECENT</span>
        <div className="flex gap-xs">
          <IconButton icon="search" size="sm" />
          <IconButton icon="tune" size="sm" />
          <IconButton icon="more_horiz" size="sm" />
        </div>
      </div>
      {sessions.length === 0 ? (
        <div className="py-xl text-center">
          <span className="text-body-sm text-on-surface-variant opacity-50">
            No sessions
          </span>
        </div>
      ) : (
        <div className="space-y-xs">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="px-md py-sm rounded-[6px] hover:bg-surface-container-low cursor-pointer transition-colors"
            >
              <span className="text-body-sm text-on-surface">{session.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
