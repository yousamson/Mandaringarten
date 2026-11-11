import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const CARDS = [
  { n: '01', zh: 'HSK 寶庫', en: 'HSK Resource Library', meta: 'Levels 1–9 · 一至九級', tone: 'jade' },
  { n: '02', zh: 'PSC 寶庫', en: 'PSC Resource Library', meta: '3 grades · 6 bands · 三級六等', tone: 'persimmon' },
];
const CHIPS = ['Words 詞語', 'Games 遊戲', 'Listening 聆聽'];

export function PathsScene() {
  return (
    <SceneFrame tone="cream" className="pa-scene">
      <motion.div className="pa-head" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <span className="micro-label">CHOOSE A LEARNING PATH · 選擇學習路徑</span>
        <h2>Two paths. <em>One treasure house.</em></h2>
      </motion.div>
      <motion.svg className="pa-path" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
        <motion.path d="M5 10 C 30 -4, 70 24, 95 10" fill="none" stroke="#efbf58" strokeWidth="0.8" strokeDasharray="2 1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.0, duration: 1 }} />
      </motion.svg>
      <div className="pa-cards">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.n}
            className={`pa-card pa-${c.tone}`}
            initial={{ y: 260, rotate: i ? 8 : -8, opacity: 0 }}
            animate={i === 0 ? { y: [260, 0, 0, -30], rotate: [-8, -2, -2, 0], opacity: 1, scale: [1, 1, 1, 1.35] } : { y: [260, 0, 0, 40], rotate: [8, 2, 2, 6], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4.9, times: [0, 0.12, 0.88, 1], delay: 0.05 + i * 0.3, ease: 'easeOut' }}
          >
            <span className="pa-n">{c.n}</span>
            <strong lang="zh-Hant">{c.zh}</strong>
            <span className="pa-en">{c.en}</span>
            <span className="pa-meta">{c.meta}</span>
          </motion.div>
        ))}
      </div>
      <div className="pa-chips">
        {CHIPS.map((c, i) => (
          <motion.span key={c} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 1.6 + i * 0.25 }}>{c}</motion.span>
        ))}
      </div>
    </SceneFrame>
  );
}
