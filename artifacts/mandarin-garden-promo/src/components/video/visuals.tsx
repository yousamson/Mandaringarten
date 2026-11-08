import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

export const palette = {
  cream: '#f7f0dd',
  green: '#28533d',
  green2: '#467954',
  orange: '#d66e4a',
  gold: '#efbf58',
  blue: '#6b9c9a',
  ink: '#294b39',
};

export function SceneFrame({
  children,
  tone = 'cream',
  className = '',
}: {
  children: ReactNode;
  tone?: 'cream' | 'green' | 'gold';
  className?: string;
}) {
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

export function BrandIcon({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      className={`brand-icon ${className}`}
      style={style}
      src={`${import.meta.env.BASE_URL}mandarin-garden-icon.png`}
      alt=""
      draggable="false"
    />
  );
}

export function Sprout({
  stage,
  label,
  color,
  style,
}: {
  stage: number;
  label: string;
  color: string;
  style?: CSSProperties;
}) {
  const leafCount = stage + 1;
  return (
    <motion.div
      className="sprout"
      style={{ ...style, '--sprout-color': color } as CSSProperties}
      initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 255, damping: 17, delay: stage * 0.2 }}
    >
      <div className="sprout-stem" />
      {Array.from({ length: leafCount }, (_, i) => (
        <motion.i
          key={i}
          className={`sprout-leaf leaf-${i % 2}`}
          style={{ bottom: `${22 + i * 14}%` }}
          initial={{ scale: 0, rotate: i % 2 ? 22 : -22 }}
          animate={{ scale: 1, rotate: i % 2 ? 18 : -18 }}
          transition={{ delay: stage * 0.2 + 0.28 + i * 0.12, type: 'spring', stiffness: 250 }}
        />
      ))}
      <motion.div
        className="sprout-bloom"
        initial={{ scale: 0, rotate: -35 }}
        animate={{ scale: stage === 0 ? 0.55 : stage === 1 ? 0.75 : stage === 2 ? 0.95 : 1.1, rotate: 0 }}
        transition={{ delay: stage * 0.2 + 0.45, type: 'spring', stiffness: 235 }}
      />
      <span className="sprout-label">{label}</span>
    </motion.div>
  );
}

export function FloatingPetal({ delay = 0, x = '50%', y = '50%' }: { delay?: number; x?: string; y?: string }) {
  return (
    <motion.i
      className="floating-petal"
      style={{ left: x, top: y }}
      animate={{ y: [0, -18, 0], rotate: [0, 18, -12, 0], opacity: [0.45, 0.9, 0.5] }}
      transition={{ duration: 3.8, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
