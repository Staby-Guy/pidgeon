'use client';

import { motion } from 'framer-motion';

interface AvatarProps {
    username: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showStatus?: boolean;
    isOnline?: boolean;
}

export default function Avatar({
    username,
    src,
    size = 'md',
    showStatus = false,
    isOnline = false,
}: AvatarProps) {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    const statusSizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4',
    };

    // Generate consistent color based on username
    const getAvatarColor = (name: string) => {
        const colors = [
            'from-cyber-lime/80 to-cyber-lime-dim/80',
            'from-electric-purple/80 to-electric-purple-dim/80',
            'from-cyan-500/80 to-blue-500/80',
            'from-pink-500/80 to-rose-500/80',
            'from-amber-500/80 to-orange-500/80',
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    const initials = username.slice(0, 2).toUpperCase();
    const gradientClass = getAvatarColor(username);

    return (
        <div className="relative inline-block">
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={`
          ${sizes[size]} 
          rounded-full 
          flex items-center justify-center 
          font-mono font-bold
          text-deep-space
          bg-gradient-to-br ${gradientClass}
          border border-white/10
          shadow-lg
          overflow-hidden
        `}
            >
                {src ? (
                    <img
                        src={src}
                        alt={username}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    initials
                )}
            </motion.div>

            {showStatus && (
                <span
                    className={`
            absolute bottom-0 right-0 
            ${statusSizes[size]}
            rounded-full 
            border-2 border-deep-space
            ${isOnline ? 'bg-cyber-lime' : 'bg-slate-muted'}
          `}
                />
            )}
        </div>
    );
}
