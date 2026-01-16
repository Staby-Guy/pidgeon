'use client';

import { motion } from 'framer-motion';
import { Avatar } from './ui';

interface Contact {
    id: string;
    username: string;
    avatar?: string;
    roomId: string;
    latestMessage?: {
        content: string;
        timestamp: number;
        isOwn: boolean;
    } | null;
}

interface ContactCardProps {
    contact: Contact;
    isActive: boolean;
    hasUnread?: boolean;
    onClick: () => void;
}

export default function ContactCard({ contact, isActive, hasUnread = false, onClick }: ContactCardProps) {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.button
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
        w-full flex items-center gap-3 p-3 rounded-lg text-left
        transition-colors duration-150 relative
        ${isActive
                    ? 'bg-cyber-lime/10 border border-cyber-lime/30'
                    : 'hover:bg-white/5 border border-transparent'
                }
      `}
        >
            {hasUnread && (
                <span className="absolute right-3 top-3 w-2.5 h-2.5 rounded-full bg-electric-purple shadow-[0_0_8px_rgba(157,0,255,0.6)] animate-pulse" />
            )}
            <Avatar
                username={contact.username}
                src={contact.avatar}
                size="md"
                showStatus
                isOnline={false} // Could add online status tracking later
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span
                        className={`
              font-medium truncate
              ${isActive ? 'text-cyber-lime' : hasUnread ? 'text-pure-white font-bold' : 'text-slate-gray'}
            `}
                    >
                        @{contact.username}
                    </span>
                    {contact.latestMessage && (
                        <span className="text-[10px] text-slate-muted flex-shrink-0 ml-2">
                            {formatTime(contact.latestMessage.timestamp)}
                        </span>
                    )}
                </div>

                {contact.latestMessage && (
                    <p className="text-xs text-slate-muted truncate mt-0.5">
                        {contact.latestMessage.isOwn && (
                            <span className="text-slate-muted/70">You: </span>
                        )}
                        {contact.latestMessage.content}
                    </p>
                )}
            </div>
        </motion.button>
    );
}
