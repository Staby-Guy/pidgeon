'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, Button, Card, ChatListSkeleton } from './ui';
import SearchUsers from './SearchUsers';
import ContactCard from './ContactCard';
import { getPusherClient, getUserChannel, PUSHER_EVENTS } from '@/lib/pusher';

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

interface SidebarProps {
    contacts: Contact[];
    isLoading: boolean;
    onContactsChange: () => void;
}

export default function Sidebar({ contacts, isLoading, onContactsChange }: SidebarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [showSearch, setShowSearch] = useState(false);
    const [copied, setCopied] = useState(false);

    const activeRoomId = pathname.startsWith('/chat/')
        ? pathname.split('/chat/')[1]
        : null;

    const handleCopyUsername = useCallback(() => {
        if (session?.user?.username) {
            navigator.clipboard.writeText(session.user.username);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [session?.user?.username]);

    const handleAddContact = async (user: { id: string; username: string; avatar?: string }) => {
        const res = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactId: user.id }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to add contact');
        }

        onContactsChange();
        setShowSearch(false);
    };

    const handleContactClick = (roomId: string) => {
        setUnreadRooms(prev => {
            const next = new Set(prev);
            next.delete(roomId);
            return next;
        });
        router.push(`/chat/${roomId}`);
    };

    // Global real-time updates for sidebar
    const [localContacts, setLocalContacts] = useState<Contact[]>(contacts);
    const [unreadRooms, setUnreadRooms] = useState<Set<string>>(new Set());

    // Sync local contacts with props when they change
    useEffect(() => {
        setLocalContacts(contacts);
    }, [contacts]);

    useEffect(() => {
        if (!session?.user?.id) return;

        const pusher = getPusherClient();
        const channel = pusher.subscribe(getUserChannel(session.user.id));

        channel.bind(PUSHER_EVENTS.INCOMING_MESSAGE, (data: {
            roomId: string;
            senderId: string;
            username: string;
            content: string;
            timestamp: number;
        }) => {
            // Update local contacts
            setLocalContacts(prev => {
                const contactIndex = prev.findIndex(c => c.roomId === data.roomId);

                // If contact doesn't exist yet, we should reload contacts
                // But for now, let's assume they exist
                if (contactIndex === -1) {
                    onContactsChange();
                    return prev;
                }

                const contact = prev[contactIndex];
                const updatedContact: Contact = {
                    ...contact,
                    latestMessage: {
                        content: data.content,
                        timestamp: data.timestamp,
                        isOwn: false,
                    }
                };

                // Move to top
                const newContacts = [...prev];
                newContacts.splice(contactIndex, 1);
                return [updatedContact, ...newContacts];
            });

            // Mark as unread if we are NOT in this room
            if (activeRoomId !== data.roomId) {
                setUnreadRooms(prev => new Set(prev).add(data.roomId));
            }
        });

        return () => {
            // Don't unbind all here if other components use this channel (ChatPage uses it too)
            // But ChatPage handles CONTACT_ADDED. This handles INCOMING_MESSAGE.
            // It's safer to keep it mounted or move logic to parent.
            // For now, let's just unbind this specific event.
            channel.unbind(PUSHER_EVENTS.INCOMING_MESSAGE);
            // We don't unsubscribe because ChatPage might be using it too.
        };
    }, [session?.user?.id, activeRoomId, onContactsChange]);

    return (
        <aside
            className={`
                flex flex-col border-r border-dark-border bg-dark-surface/50 h-screen
                ${activeRoomId ? 'hidden md:flex w-[320px]' : 'w-full md:w-[320px]'}
            `}
        >
            {/* Profile Section */}
            <div className="p-4 border-b border-dark-border">
                <Card variant="glass" className="p-4">
                    <div className="flex items-center gap-3">
                        <Avatar
                            username={session?.user?.username || 'User'}
                            size="lg"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-pure-white font-semibold truncate">
                                @{session?.user?.username}
                            </h2>
                            <button
                                onClick={handleCopyUsername}
                                className="text-xs text-slate-muted hover:text-cyber-lime transition-colors flex items-center gap-1"
                            >
                                {copied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-cyber-lime">
                                            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                            <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V8.621a3 3 0 0 0-.879-2.121L9 4.379A3 3 0 0 0 6.879 3.5H5.5Z" />
                                            <path d="M4 5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 14h5a1.5 1.5 0 0 0 1.5-1.5V8.621a1.5 1.5 0 0 0-.44-1.06L7.94 5.439A1.5 1.5 0 0 0 6.878 5H4Z" />
                                        </svg>
                                        Copy username
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => signOut({ callbackUrl: '/' })}
                    >
                        Sign Out
                    </Button>
                </Card>
            </div>

            {/* Search Section */}
            <div className="p-4 border-b border-dark-border">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-muted">
                        {showSearch ? 'Find Users' : 'Contacts'}
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSearch(!showSearch)}
                    >
                        {showSearch ? 'Cancel' : '+ Add'}
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    {showSearch && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <SearchUsers onAddContact={handleAddContact} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <ChatListSkeleton count={5} />
                ) : localContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-dark-card flex items-center justify-center mb-3">
                            <span className="text-xl">👥</span>
                        </div>
                        <p className="text-slate-muted text-sm">No contacts yet</p>
                        <p className="text-slate-muted/70 text-xs mt-1">
                            Click &quot;+ Add&quot; to find users
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {localContacts.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                isActive={activeRoomId === contact.roomId}
                                hasUnread={unreadRooms.has(contact.roomId)}
                                onClick={() => handleContactClick(contact.roomId)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-border">
                <div className="flex items-center justify-center gap-2 mb-1 opacity-50">
                    <img src="/logo.png" alt="" className="w-4 h-4 object-contain" />
                    <span className="text-[10px] font-bold tracking-wider">CYBER PIDGEON</span>
                </div>
            </div>
        </aside>
    );
}
