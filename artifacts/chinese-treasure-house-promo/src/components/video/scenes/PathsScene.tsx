import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const CARDS = [
  { n: '01', zh: 'HSK', en: 'Levels 1–9 · 一至九級', tone: 'jade' },
  { n: '02', zh: 'PSC', en: '3B → 1A · 三級乙等至一級甲等', tone: 'persimmon' },
  { n: '03', zh: 'ACTFL', en: '10 steps · 十步', tone: 'teal' },
  { n: '04', zh: 'TOCFL', en: '8 locally designed steps · 八個本地設計步驟', tone: 'gold' },
];

export function PathsScene() {
  return (
    <SceneFrame tone="cream" className="pa-scene">
      <motion.div className="pa-head" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <span className="micro-label">CHOOSE A LEARNING PATH · 選擇學習路徑</span>
        <h2>Four routes. <em>One treasure house.</em></h2>
      </motion.div>
      <motion.svg className="pa-path" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
        <motion.path d="M0 25 C 18 25, 17 5, 36 5 L100 5 M18 25 C 25 25, 27 18, 36 18 L100 18 M18 25 C 25 25, 27 32, 36 32 L100 32 M0 25 C 18 25, 17 45, 36 45 L100 45" fill="none" stroke="#efbf58" strokeWidth="1" strokeDasharray="2 1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 1.4 }} />
      </motion.svg>
      <div className="pa-cards">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.n}
            className={`pa-card pa-${c.tone}`}
            style={{ top: `${i * 20}%` }}
            initial={{ x: -80, opacity: 0, scale: .88 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.35 + i * 0.36 }}
          >
            <span className="pa-n">{c.n}</span>
            <strong>{c.zh}</strong>
            <span className="pa-en">{c.en}</span>
          </motion.div>
        ))}
      </div>
      <motion.p className="pa-disclaimer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.9 }}>
        TOCFL steps are locally designed, not official. <span lang="zh-Hant">TOCFL 步驟為本地設計，並非官方級別。</span>
      </motion.p>
    </SceneFrame>
  );
}
