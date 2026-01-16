'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-gray mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full bg-dark-surface border border-dark-border rounded-lg
              px-4 py-2.5 text-slate-gray font-mono text-sm
              placeholder:text-slate-muted
              focus:outline-none focus:border-cyber-lime focus:ring-2 focus:ring-cyber-lime/20
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-electric-purple focus:border-electric-purple focus:ring-electric-purple/20' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-electric-purple text-xs mt-1.5 animate-pulse">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
