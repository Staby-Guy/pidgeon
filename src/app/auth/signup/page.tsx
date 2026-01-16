'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
            newErrors.username = '3-20 chars, alphanumeric and underscores only';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors({ submit: data.error || 'Registration failed' });
                return;
            }

            // Auto sign in after successful registration
            const signInResult = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (signInResult?.ok) {
                router.push('/chat');
                router.refresh();
            } else {
                router.push('/auth/signin');
            }
        } catch {
            setErrors({ submit: 'Something went wrong. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-deep-space">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyber-lime/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card variant="glass" className="p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-electric-purple/10 mb-4"
                        >
                            <span className="text-3xl">🐦</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-pure-white neon-text">
                            Join Cyber Pidgeon
                        </h1>
                        <p className="text-slate-muted text-sm mt-1">
                            Create your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange('email')}
                            placeholder="you@example.com"
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange('username')}
                            placeholder="cyber_user"
                            error={errors.username}
                            required
                        />
                        <p className="text-[10px] text-slate-muted -mt-2">
                            This is how others will find you
                        </p>

                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange('password')}
                            placeholder="••••••••"
                            error={errors.password}
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            placeholder="••••••••"
                            error={errors.confirmPassword}
                            required
                        />

                        {errors.submit && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-electric-purple text-sm text-center"
                            >
                                {errors.submit}
                            </motion.p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <p className="text-center text-slate-muted text-sm mt-6">
                        Already have an account?{' '}
                        <Link
                            href="/auth/signin"
                            className="text-cyber-lime hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
