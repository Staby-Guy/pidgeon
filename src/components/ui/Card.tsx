'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'solid' | 'outline';
    hover?: boolean;
    glow?: boolean;
    children?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({
        children,
        variant = 'glass',
        hover = false,
        glow = false,
        className = '',
        ...props
    }, ref) => {
        const variants = {
            glass: 'bg-[rgba(17,17,17,0.7)] backdrop-blur-xl border border-white/[0.08]',
            solid: 'bg-dark-card border border-dark-border',
            outline: 'bg-transparent border border-dark-border',
        };

        return (
            <div
                ref={ref}
                className={`
          rounded-xl p-4 transition-all duration-200
          ${variants[variant]}
          ${glow ? 'animate-pulse-glow' : ''}
          ${hover ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg' : ''}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
