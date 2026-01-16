'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components';
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

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/contacts');
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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

            {/* Main Content - Empty State */}
            <main className="flex-1 hidden md:flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 rounded-2xl bg-dark-card flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(204,255,0,0.1)]">
                        <img src="/logo.png" alt="Cyber Pidgeon" className="w-14 h-14 object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-pure-white mb-2">
                        Welcome to Cyber Pidgeon
                    </h2>
                    <p className="text-slate-muted max-w-md">
                        Select a contact to start chatting, or search for users to add to your network.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
