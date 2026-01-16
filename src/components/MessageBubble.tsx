'use client';

import { useState } from 'react';
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
    onEdit,
    onDelete,
}: MessageBubbleProps & { onEdit?: (id: string, timestamp: number, newContent: string) => void; onDelete?: (id: string, timestamp: number) => void }) {
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        }
        return format(date, 'MMM d, HH:mm');
    };

    const handleSaveEdit = () => {
        if (editContent.trim() !== message.content) {
            onEdit?.(message.id, message.timestamp, editContent);
        }
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group relative`}
        >
            {showAvatar && !isOwn && (
                <div className="flex-shrink-0 mb-1">
                    <Avatar username={username} size="sm" />
                </div>
            )}

            {/* Actions Toggle & Menu (Only for own messages) */}
            {isOwn && !isEditing && (
                <div className="relative">
                    {/* Toggle Button (Always visible on hover or if menu open) */}
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className={`
                            p-1.5 rounded-full transition-colors 
                            ${showActions ? 'bg-dark-card text-cyber-lime' : 'text-slate-muted/0 group-hover:text-slate-muted hover:bg-white/5'}
                        `}
                        title="Message Options"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                            <path d="M8 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                        </svg>
                    </button>

                    {/* Popover Menu */}
                    <AnimatePresence>
                        {showActions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 flex flex-col bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden z-20 min-w-[120px]"
                            >
                                <button
                                    onClick={() => { setIsEditing(true); setShowActions(false); }}
                                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 text-sm text-slate-200 hover:text-cyber-lime transition-colors text-left"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                                        <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                        <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                    </svg>
                                    Edit
                                </button>
                                <div className="h-[1px] bg-dark-border/50 mx-2" />
                                <button
                                    onClick={() => { onDelete?.(message.id, message.timestamp); setShowActions(false); }}
                                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 text-sm text-slate-200 hover:text-red-500 transition-colors text-left"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                                        <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5a2.25 2.25 0 0 0-2.25 2.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                                    </svg>
                                    Delete
                                </button>
                                <div className="h-[1px] bg-dark-border/50 mx-2" />
                                <button
                                    onClick={() => setShowActions(false)}
                                    className="px-4 py-2 flex items-center justify-center gap-2 hover:bg-white/5 text-xs text-slate-muted hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-white text-black rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black/50 w-full placeholder-slate-400"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                        />
                        <div className="flex justify-end gap-2 text-xs font-medium">
                            <button onClick={() => setIsEditing(false)} className="text-black/60 hover:text-black">Cancel</button>
                            <button onClick={handleSaveEdit} className="text-black hover:underline">Save</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                        {(message as any).isEdited && (
                            <span className="text-[10px] text-slate-400/50 ml-1 italic">(edited)</span>
                        )}
                    </p>
                )}

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
