'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar, ChatWindow } from '@/components';
import { Avatar } from '@/components/ui';
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

interface ChatRoomPageProps {
    params: Promise<{ roomId: string }>;
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
    const resolvedParams = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeContact, setActiveContact] = useState<Contact | null>(null);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/contacts');
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts);

                // Find active contact from roomId
                const contact = data.contacts.find(
                    (c: Contact) => c.roomId === resolvedParams.roomId
                );
                setActiveContact(contact || null);
            }
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [resolvedParams.roomId]);

    // Auth check
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Fetch contacts on mount
    useEffect(() => {
        if (session?.user) {
            fetchContacts();
        }
    }, [session, fetchContacts]);

    // Subscribe to contact updates
    useEffect(() => {
        if (!session?.user?.id) return;

        const pusher = getPusherClient();
        const channel = pusher.subscribe(getUserChannel(session.user.id));

        channel.bind(PUSHER_EVENTS.CONTACT_ADDED, () => {
            fetchContacts();
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(getUserChannel(session.user.id));
        };
    }, [session?.user?.id, fetchContacts]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-deep-space">
                <div className="animate-pulse-glow w-16 h-16 rounded-full bg-cyber-lime/20" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="h-screen flex bg-deep-space">
            <Sidebar
                contacts={contacts}
                isLoading={isLoading}
                onContactsChange={fetchContacts}
            />

            {/* Chat Area */}
            <main className="flex-1 flex flex-col">
                {activeContact ? (
                    <>
                        {/* Chat Header */}
                        <motion.header
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 border-b border-dark-border bg-dark-surface/50"
                        >
                            <Avatar
                                username={activeContact.username}
                                src={activeContact.avatar}
                                size="md"
                            />
                            <div>
                                <h2 className="text-pure-white font-semibold">
                                    @{activeContact.username}
                                </h2>
                                <p className="text-xs text-slate-muted">Direct Message</p>
                            </div>
                        </motion.header>

                        {/* Chat Window */}
                        <ChatWindow
                            roomId={resolvedParams.roomId}
                            recipientId={activeContact.id}
                            recipientUsername={activeContact.username}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-muted">
                            {isLoading ? 'Loading...' : 'Contact not found'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
