'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button, Card } from '@/components/ui';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to chat if already logged in
  useEffect(() => {
    if (session) {
      router.push('/chat');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-space">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-cyber-lime/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyber-lime/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-electric-purple/5 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐦</span>
          <span className="text-pure-white font-bold text-xl">Cyber Pidgeon</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-pure-white mb-6">
              Chat at the speed
              <br />
              of{' '}
              <span className="text-cyber-lime neon-text">thought</span>
            </h1>
            <p className="text-slate-muted text-lg md:text-xl max-w-2xl mx-auto mb-10">
              A lightning-fast, secure messaging platform built for students.
              Connect, collaborate, and communicate in real-time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Start Chatting Free
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="secondary" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-32"
        >
          <Card variant="glass" className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-cyber-lime/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-pure-white font-semibold text-lg mb-2">
              Real-Time Messaging
            </h3>
            <p className="text-slate-muted text-sm">
              Messages delivered instantly. No delays, no refreshing.
            </p>
          </Card>

          <Card variant="glass" className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-electric-purple/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-pure-white font-semibold text-lg mb-2">
              Secure by Design
            </h3>
            <p className="text-slate-muted text-sm">
              Your conversations stay private with encrypted connections.
            </p>
          </Card>

          <Card variant="glass" className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-cyber-lime/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-pure-white font-semibold text-lg mb-2">
              Built for Students
            </h3>
            <p className="text-slate-muted text-sm">
              Connect with classmates and collaborate on projects easily.
            </p>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-border py-6">
        <p className="text-center text-slate-muted/50 text-sm">
          © 2026 Cyber Pidgeon • Built with ❤️ for students
        </p>
      </footer>
    </div>
  );
}
