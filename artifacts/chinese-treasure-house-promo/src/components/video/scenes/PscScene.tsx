import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const BANDS = [
  { zh: '三級乙等', code: '3B' },
  { zh: '三級甲等', code: '3A' },
  { zh: '二級乙等', code: '2B' },
  { zh: '二級甲等', code: '2A' },
  { zh: '一級乙等', code: '1B' },
  { zh: '一級甲等', code: '1A' },
];
const GRADES = ['三級 Grade 3', '二級 Grade 2', '一級 Grade 1'];

export function PscScene() {
  return (
    <SceneFrame tone="green" className="psc-scene">
      <motion.div className="psc-head" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.45 }}>
        <span className="micro-label">PSC · PUTONGHUA PROFICIENCY TEST</span>
        <h2 lang="zh-Hant">普通話水平測試</h2>
        <p>3 grades · 6 bands</p>
      </motion.div>
      <div className="psc-bars">
        {BANDS.map((b, i) => (
          <div key={b.code} className="psc-col">
            <motion.div
              className={`psc-bar ${i === 5 ? 'is-top' : ''}`}
              style={{ height: `${26 + i * 13}%` }}
              initial={{ scaleY: 0 }}
              animate={i === 5 ? { scaleY: 1, scale: [1, 1, 1.08] } : { scaleY: 1 }}
              transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 170, damping: 18 }}
            >
              <motion.b initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.2 }}>{b.code}</motion.b>
            </motion.div>
            <motion.span lang="zh-Hant" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.2 }}>{b.zh}</motion.span>
          </div>
        ))}
      </div>
      <div className="psc-grades">
        {GRADES.map((g, i) => (
          <motion.span key={g} lang="zh-Hant" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 1.8 + i * 0.15, duration: 0.4 }}>{g}</motion.span>
        ))}
      </div>
      <motion.p className="psc-cap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 0.4 }}>
        From the first band to the highest. <span lang="zh-Hant">由低至高，循序練習。</span>
      </motion.p>
    </SceneFrame>
  );
}
