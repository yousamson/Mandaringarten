import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const PRACTICE = [
  { en: 'VOCABULARY', zh: '詞彙', icon: '文' },
  { en: '3 GAME MODES', zh: '三種遊戲模式', icon: '遊' },
  { en: 'SENTENCE PRACTICE', zh: '句子練習', icon: '句' },
  { en: 'LISTENING', zh: '聆聽', icon: '聽' },
];

export function HskScene() {
  return (
    <SceneFrame tone="gold" className="hsk-scene">
      <motion.div className="hsk-head" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <span className="micro-label">LEVEL BY LEVEL · 每一級都有</span>
        <h2>Practice <b>loop</b></h2>
        <p lang="zh-Hant">詞彙、遊戲、句子、聆聽</p>
      </motion.div>
      <div className="practice-loop">
        {PRACTICE.map((item, i) => (
          <motion.div
            key={item.en}
            className={`practice-tile practice-tile-${i}`}
            initial={{ scale: .4, opacity: 0, rotate: i % 2 ? 8 : -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: .35 + i * .34 }}
          >
            <b lang="zh-Hant">{item.icon}</b>
            <strong>{item.en}</strong>
            <span lang="zh-Hant">{item.zh}</span>
          </motion.div>
        ))}
        <motion.svg className="loop-route" viewBox="0 0 100 100" aria-hidden="true"><motion.path d="M50 10 C78 10 90 26 90 50 C90 75 75 90 50 90 C25 90 10 75 10 50 C10 25 25 10 50 10" fill="none" stroke="#356d50" strokeWidth="1.2" strokeDasharray="3 2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .5, duration: 2.2 }} /></motion.svg>
      </div>
      <motion.p className="hsk-cap" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.7, duration: 0.4 }}>
        PRACTISE → PLAY → USE <span lang="zh-Hant">練詞 → 遊戲 → 活用</span>
      </motion.p>
    </SceneFrame>
  );
}
