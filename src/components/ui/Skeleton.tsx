'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
}: SkeletonProps) {
    const variants = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style = {
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '1rem' : '100px'),
    };

    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`skeleton ${variants[variant]} ${className}`}
            style={style}
        />
    );
}

// Pre-built skeleton components for common use cases
export function MessageSkeleton() {
    return (
        <div className="flex items-start gap-3 p-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton width="30%" height={12} />
                <Skeleton width="80%" height={16} />
                <Skeleton width="60%" height={16} />
            </div>
        </div>
    );
}

export function ContactSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3">
            <Skeleton variant="circular" width={44} height={44} />
            <div className="flex-1 space-y-2">
                <Skeleton width="50%" height={14} />
                <Skeleton width="70%" height={12} />
            </div>
        </div>
    );
}

export function ChatListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-1">
            {Array.from({ length: count }).map((_, i) => (
                <ContactSkeleton key={i} />
            ))}
        </div>
    );
}
