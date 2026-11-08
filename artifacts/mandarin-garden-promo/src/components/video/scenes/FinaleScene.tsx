import { motion } from 'framer-motion';
import { BrandIcon, FloatingPetal, SceneFrame } from '../visuals';

export function FinaleScene() {
  return (
    <SceneFrame className="finale-scene">
      <div className="finale-sun" />
      <div className="finale-garden" />
      <FloatingPetal x="19%" y="30%" delay={0.3} />
      <FloatingPetal x="79%" y="25%" delay={1} />
      <motion.div className="finale-lockup" initial={{ y: 42, opacity: 0, scale: 0.88 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 170, damping: 19, delay: 0.28 }}>
        <BrandIcon className="finale-icon" />
        <h2>Mandarin Garden</h2>
        <div className="finale-zh" lang="zh-Hant">漢語樂園</div>
      </motion.div>
      <motion.p className="finale-audience" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9, duration: 0.42 }}>
        A Chinese-learning playground<br />for ages 2–12 and anyone new to Chinese.
      </motion.p>
      <motion.div className="finale-details" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.7, duration: 0.44 }}>
        <span>Free challenges</span><b>✳</b><span>4 learning stages</span><b>✳</b><span>mandaringarden.asia</span>
      </motion.div>
      <motion.div className="finale-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 2.75, duration: 0.75, ease: 'easeOut' }} />
      <motion.p className="finale-tagline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.8, duration: 0.35 }}>Learn Chinese, one joyful moment at a time.</motion.p>
      <motion.div className="finale-loop" initial={{ scaleY: 0 }} animate={{ scaleY: [0, 1, 1, 0] }} transition={{ duration: 0.9, times: [0, 0.45, 0.85, 1], delay: 4.6, ease: 'easeInOut' }} />
    </SceneFrame>
  );
}
