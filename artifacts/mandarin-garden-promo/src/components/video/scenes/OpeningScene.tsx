import { motion } from 'framer-motion';
import { BrandIcon, FloatingPetal, SceneFrame } from '../visuals';

export function OpeningScene() {
  return (
    <SceneFrame tone="green" className="opening-scene">
      <div className="opening-orbit" />
      <div className="opening-orbit orbit-two" />
      <FloatingPetal x="15%" y="22%" delay={0.1} />
      <FloatingPetal x="75%" y="18%" delay={0.7} />
      <motion.div className="opening-mark" initial={{ scale: 0.62, rotate: -9, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 17, delay: 0.18 }}>
        <BrandIcon />
      </motion.div>
      <motion.div className="opening-greeting" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 310, damping: 14, delay: 0.38 }}>你好！</motion.div>
      <motion.div className="opening-copy" initial={{ x: -55, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.48, delay: 0.86 }}>
          <span className="micro-label">A LITTLE LANGUAGE, A BIG WORLD</span>
        <h1>HELLO,<br />MANDARIN.</h1>
        <motion.div className="opening-subtitle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.95, duration: 0.34 }}>
          <span>Learn through play.</span>
          <span lang="zh-Hant">在遊戲中學中文。</span>
        </motion.div>
      </motion.div>
      <motion.div className="opening-page" initial={{ x: '102%' }} animate={{ x: ['102%', '0%', '0%', '-110%'] }} transition={{ duration: 1.25, times: [0, 0.34, 0.72, 1], delay: 2.6, ease: [0.76, 0, 0.24, 1] }}>
        <span />
      </motion.div>
      <motion.div className="opening-kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.35 }}>A PLAYFUL WAY INTO CHINESE <b>✳</b></motion.div>
    </SceneFrame>
  );
}
