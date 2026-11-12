import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

export function PscScene() {
  return (
    <SceneFrame tone="green" className="psc-scene">
      <motion.div className="psc-head" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.45 }}>
        <span className="micro-label">READING THAT GROWS · 逐步深入</span>
        <h2>Read. Listen.<br /><em>Grow.</em></h2>
        <p lang="zh-Hant">閱讀、聆聽，逐步深入。</p>
      </motion.div>
      <div className="article-scroll">
        <motion.div className="article-lines" initial={{ scaleX: .12 }} animate={{ scaleX: 1 }} transition={{ delay: .4, duration: 2.1, ease: [0.2, .8, .2, 1] }}>
          {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ width: `${48 + (i * 17) % 48}%` }} />)}
        </motion.div>
        <motion.div className="article-count" initial={{ scale: .55, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, type: 'spring', stiffness: 280 }}>1,000<span>字</span></motion.div>
      </div>
      <motion.p className="psc-cap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.15, duration: 0.4 }}>
        Progressively longer listening articles · 聆聽文章逐級加長
      </motion.p>
      <motion.div className="psc-disclaimer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.7 }}>
        Practice materials, not official exam syllabi. · 獨立練習材料，非官方考試大綱。<br />
        TOCFL: 8 locally designed steps, not official levels. · TOCFL：八個本地設計步驟，並非官方級別。
      </motion.div>
    </SceneFrame>
  );
}
