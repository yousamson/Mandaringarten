import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function HskScene() {
  return (
    <SceneFrame tone="gold" className="hsk-scene">
      <motion.div className="hsk-head" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <span className="micro-label">HSK 3.0 · 漢語水平考試</span>
        <h2>Levels <b>1–9</b></h2>
        <p lang="zh-Hant">一至九級，逐級練習</p>
      </motion.div>
      <div className="hsk-stairs">
        {ZH.map((z, i) => (
          <motion.div
            key={z}
            className="hsk-tile"
            style={{ left: `${i * 10.4}%`, bottom: `${i * 7.2}%` }}
            initial={{ y: 120, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 17, delay: 0.3 + i * 0.17 }}
          >
            <b>{i + 1}</b>
            <span lang="zh-Hant">{z}級</span>
          </motion.div>
        ))}
        <motion.i
          className="hsk-marker"
          initial={{ left: '0%', bottom: '14%' }}
          animate={{ left: ['2%', '85.5%'], bottom: ['14%', '71.6%'] }}
          transition={{ delay: 0.5, duration: 1.7, ease: 'easeInOut' }}
        />
      </div>
      <motion.p className="hsk-cap" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.3, duration: 0.4 }}>
        Structured words, games and listening for every level.<br />
        <span lang="zh-Hant">每一級都有詞語、遊戲與聆聽短文。</span>
      </motion.p>
    </SceneFrame>
  );
}
