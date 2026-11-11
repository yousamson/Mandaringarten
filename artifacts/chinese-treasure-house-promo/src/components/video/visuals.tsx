import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function SceneFrame({ children, tone = 'cream', className = '' }: { children: ReactNode; tone?: 'cream' | 'green' | 'gold'; className?: string }) {
  return (
    <motion.section
      className={`scene-frame tone-${tone} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="paper-grain" aria-hidden="true" />
      {children}
    </motion.section>
  );
}

export function BrandIcon({ className = '' }: { className?: string }) {
  return <img className={`brand-icon ${className}`} src={`${import.meta.env.BASE_URL}mandarin-garden-icon.png`} alt="" draggable="false" />;
}

export function Seal({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div className="th-seal" initial={{ scale: 1.7, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 13c6-2 11-1 16 3 5-4 10-5 16-3v22c-6-2-11-1-16 3-5-4-10-5-16-3z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M24 16v22" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    </motion.div>
  );
}

export function Orbits({ exitAt }: { exitAt?: number }) {
  return (
    <motion.div
      className="th-orbits"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={exitAt ? { scale: [0.6, 1, 1, 4], opacity: [0, 1, 1, 0] } : { scale: 1, opacity: 1 }}
      transition={exitAt ? { duration: exitAt + 0.7, times: [0, 0.8 / (exitAt + 0.7), exitAt / (exitAt + 0.7), 1], ease: 'easeInOut' } : { duration: 0.9 }}
    >
      <motion.i animate={{ rotate: [28, 40] }} transition={{ duration: 6, ease: 'linear' }} />
      <motion.i animate={{ rotate: [-28, -42] }} transition={{ duration: 6, ease: 'linear' }} />
    </motion.div>
  );
}
