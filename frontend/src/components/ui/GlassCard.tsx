import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className, gradient, hoverEffect = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverEffect ? { y: -2, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.08)' } : undefined}
      transition={{ duration: 0.25 }}
      className={cn(
        'p-6 rounded-2xl border transition-all duration-300',
        gradient
          ? 'bg-gradient-to-br from-white to-gray-50/80 border-gray-100/80 shadow-lg shadow-gray-100/50'
          : 'bg-white/90 backdrop-blur-sm border-gray-200/60 shadow-sm',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
