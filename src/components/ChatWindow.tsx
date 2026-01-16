'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import MessageBubble from './MessageBubble';
import { Button, Input, MessageSkeleton } from './ui';
import { getPusherClient, getPrivateChatChannel, PUSHER_EVENTS } from '@/lib/pusher';

interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: number;
    senderUsername?: string;
}

interface ChatWindowProps {
    roomId: string;
    recipientId: string;
    recipientUsername: string;
}

export default function ChatWindow({
    roomId,
    recipientId,
    recipientUsername,
}: ChatWindowProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?roomId=${roomId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [roomId]);

    // Subscribe to real-time updates
    useEffect(() => {
        const pusher = getPusherClient();
        const channel = pusher.subscribe(getPrivateChatChannel(roomId));

        channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: Message & { optimisticId?: string }) => {
            setMessages((prev) => {
                // Check if we have this message already (by real ID)
                if (prev.some((m) => m.id === data.id)) {
                    return prev;
                }

                // Check if we have an optimistic version of this message
                if (data.optimisticId) {
                    const optimisticExists = prev.some((m) => m.id === data.optimisticId);
                    if (optimisticExists) {
                        // Replace the optimistic message with the real one
                        return prev.map((m) =>
                            m.id === data.optimisticId ? { ...data, senderUsername: m.senderUsername } : m
                        );
                    }
                }

                return [...prev, data];
            });
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(getPrivateChatChannel(roomId));
        };
    }, [roomId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !session?.user || isSending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            senderId: session.user.id,
            content: messageContent,
            timestamp: Date.now(),
            senderUsername: session.user.username,
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId,
                    content: messageContent,
                    optimisticId: tempId,
                }),
            });

            if (!res.ok) {
                // Remove optimistic message on failure
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                throw new Error('Failed to send message');
            }

            const data = await res.json();

            // We don't strictly need to do anything here because the Pusher event 
            // will likely handle the replacement, but as a fallback/faster update:
            setMessages((prev) =>
                prev.map((m) => m.id === tempId ? data.message : m)
            );
        } catch (error) {
            console.error('Send message error:', error);
            // Revert on error
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div className="flex-1 p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <MessageSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-dark-card flex items-center justify-center mb-4">
                                <span className="text-2xl">💬</span>
                            </div>
                            <p className="text-slate-muted text-sm">
                                No messages yet. Say hello to <span className="text-cyber-lime">@{recipientUsername}</span>!
                            </p>
                        </motion.div>
                    ) : (
                        messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isOwn={msg.senderId === session?.user?.id}
                                username={msg.senderId === session?.user?.id ? session.user.username : recipientUsername}
                            />
                        ))
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-dark-border bg-dark-surface/50">
                <form onSubmit={handleSend} className="flex gap-3">
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message @${recipientUsername}...`}
                        className="flex-1"
                        maxLength={2000}
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        isLoading={isSending}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                        >
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </Button>
                </form>
            </div>
        </div>
    );
}
