'use client';

import { forwardRef, ReactNode } from 'react';

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        children,
        variant = 'primary',
        size = 'md',
        isLoading = false,
        className = '',
        disabled,
        type = 'button',
        onClick,
    }, ref) => {
        const baseStyles = 'font-mono font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 active:scale-[0.98]';

        const variants = {
            primary: 'bg-cyber-lime text-deep-space hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:-translate-y-0.5 active:translate-y-0',
            secondary: 'bg-transparent text-cyber-lime border border-cyber-lime hover:bg-cyber-lime/10 hover:shadow-[0_0_10px_rgba(204,255,0,0.2)]',
            ghost: 'bg-transparent text-slate-gray hover:bg-white/5 hover:text-cyber-lime',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
        };

        return (
            <button
                ref={ref}
                type={type}
                onClick={onClick}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || isLoading}
            >
                {isLoading && (
                    <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
