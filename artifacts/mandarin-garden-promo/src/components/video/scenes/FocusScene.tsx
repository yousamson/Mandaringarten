import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const miniCards = Array.from({ length: 18 }, (_, i) => i);

export function FocusScene() {
  return (
    <SceneFrame tone="gold" className="focus-scene">
      <motion.div className="focus-fan" initial={{ scale: 0.35, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
        {miniCards.map((i) => (
          <motion.i key={i} className={`mini-card mini-${i % 4}`} style={{ '--card-i': i } as CSSProperties} initial={{ scale: 0, rotate: (i - 9) * 3 }} animate={{ scale: 1, rotate: (i - 9) * 2.1 }} transition={{ delay: 0.12 + i * 0.032, type: 'spring', stiffness: 260, damping: 19 }}>
            {i % 5 === 0 ? '花' : '✳'}
          </motion.i>
        ))}
      </motion.div>
      <div className="focus-copy">
        <motion.span className="micro-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>FIND THE PAIR</motion.span>
        <motion.h2 initial={{ opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.42 }}><b>60</b><span>CARDS</span></motion.h2>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.75, duration: 0.42 }}>A focus game for<br />curious minds.</motion.p>
        <motion.p className="focus-chinese" lang="zh-Hant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.15 }}>60 張專注力卡牌</motion.p>
      </div>
      <motion.div className="focus-match match-one" initial={{ rotateY: 180, scale: 0.65, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }} transition={{ delay: 1.3, duration: 0.55, type: 'spring' }}>花</motion.div>
      <motion.div className="focus-match match-two" initial={{ rotateY: 180, scale: 0.65, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }} transition={{ delay: 1.67, duration: 0.55, type: 'spring' }}>花</motion.div>
      <motion.div className="focus-flower" initial={{ scale: 0, rotate: -40 }} animate={{ scale: [0, 1, 1, 9], rotate: [ -40, 0, 0, 0] }} transition={{ duration: 1.0, times: [0, 0.24, 0.62, 1], delay: 4.36, ease: [0.65, 0, 0.35, 1] }}><i>✳</i></motion.div>
      <div className="focus-counter"><span>PAIR FOUND</span><b>01 <small>/ 30</small></b></div>
    </SceneFrame>
  );
}
