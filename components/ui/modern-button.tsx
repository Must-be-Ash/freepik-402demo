'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'blue';
}

export function ModernButton({
  children,
  onClick,
  disabled = false,
  className,
  variant = 'primary',
}: ModernButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative px-8 py-4 rounded-full font-medium text-white transition-all duration-200 border-0 cursor-pointer',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
        variant === 'primary' && [
          'bg-gradient-to-b from-[#4a4a4a] via-[#3a3a3a] to-[#2a2a2a]',
          'hover:from-[#5a5a5a] hover:via-[#4a4a4a] hover:to-[#3a3a3a]',
          'active:from-[#3a3a3a] active:via-[#2a2a2a] active:to-[#1a1a1a]',
          'hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'active:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]'
        ],
        variant === 'blue' && [
          'bg-gradient-to-b from-[#007AFF] via-[#0056CC] to-[#003D99]',
          'hover:from-[#1A8FFF] hover:via-[#1F6BDC] hover:to-[#1A52A3]',
          'active:from-[#003D99] active:via-[#002E73] active:to-[#001F4D]',
          'hover:shadow-[0_12px_40px_rgba(0,122,255,0.4),0_4px_12px_rgba(0,122,255,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'active:shadow-[0_4px_16px_rgba(0,122,255,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]'
        ],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      style={{
        background: variant === 'primary' 
          ? 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)'
          : variant === 'blue' 
          ? 'linear-gradient(145deg, #007AFF 0%, #0056CC 50%, #003D99 100%)'
          : undefined,
      }}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      
      {/* Subtle inner highlight */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-60 pointer-events-none" />
      
      {/* Bottom shadow accent */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-[90%] h-1 bg-black/20 rounded-full blur-sm" />
    </button>
  );
}