'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import Avatar from './ui/Avatar';

interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: number;
    senderUsername?: string;
}

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    username: string;
}

export default function MessageBubble({
    message,
    isOwn,
    showAvatar = true,
    username,
}: MessageBubbleProps) {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        }
        return format(date, 'MMM d, HH:mm');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {showAvatar && !isOwn && (
                <div className="flex-shrink-0 mb-1">
                    <Avatar username={username} size="sm" />
                </div>
            )}

            <div
                className={`
          max-w-[75%] rounded-2xl px-4 py-2.5
          ${isOwn
                        ? 'message-sender rounded-br-md'
                        : 'message-receiver rounded-bl-md'
                    }
        `}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                </p>
                <p
                    className={`
            text-[10px] mt-1 
            ${isOwn ? 'text-deep-space/60' : 'text-slate-muted'}
          `}
                >
                    {formatTime(message.timestamp)}
                </p>
            </div>

            {isOwn && <div className="w-8" />}
        </motion.div>
    );
}
