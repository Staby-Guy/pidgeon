'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button, Avatar, Card } from './ui';

interface SearchResult {
    id: string;
    username: string;
    avatar?: string;
}

interface SearchUsersProps {
    onAddContact: (user: SearchResult) => Promise<void>;
}

export default function SearchUsers({ onAddContact }: SearchUsersProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');
        setSuccess('');
        setResults([]);

        try {
            const res = await fetch(`/api/users/search?username=${encodeURIComponent(query.trim())}`);
            const data = await res.json();

            if (res.ok) {
                setResults(data.users);
                if (data.users.length === 0) {
                    setError('No user found with that username');
                }
            } else {
                setError(data.error || 'Search failed');
            }
        } catch {
            setError('Failed to search. Try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAdd = async (user: SearchResult) => {
        setIsAdding(user.id);
        setError('');

        try {
            await onAddContact(user);
            setResults([]);
            setQuery('');
            setSuccess(`Added @${user.username} to contacts!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add contact');
        } finally {
            setIsAdding(null);
        }
    };

    return (
        <div className="space-y-3">
            <form
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                className="flex gap-2"
            >
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search username..."
                    className="flex-1"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                        </svg>
                    }
                />
                <Button
                    type="submit"
                    variant="secondary"
                    isLoading={isSearching}
                    disabled={!query.trim()}
                >
                    Search
                </Button>
            </form>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-electric-purple text-xs"
                    >
                        {error}
                    </motion.p>
                )}

                {success && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-cyber-lime text-xs"
                    >
                        {success}
                    </motion.p>
                )}

                {results.map((user) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card variant="solid" className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <Avatar username={user.username} src={user.avatar} size="md" />
                                <span className="text-slate-gray font-medium">@{user.username}</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleAdd(user)}
                                isLoading={isAdding === user.id}
                                disabled={isAdding !== null}
                            >
                                Add
                            </Button>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
