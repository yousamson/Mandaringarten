import { motion } from 'framer-motion';
import { BrandIcon, Orbits, SceneFrame, Seal } from '../visuals';

const up = (delay: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.45 } });

export function FinaleScene() {
  return (
    <SceneFrame tone="cream" className="fi-scene">
      <div className="fi-marks">
        <motion.div className="fi-icon" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}>
          <BrandIcon />
        </motion.div>
        <div className="fi-seal"><Orbits /><Seal delay={0.5} /></div>
      </div>
      <div className="fi-copy">
        <motion.h1 lang="zh-Hant" {...up(0.7)}>中文寶庫</motion.h1>
        <motion.h2 {...up(1.1)}>Chinese Treasure House</motion.h2>
        <motion.div className="fi-chips" {...up(1.8)}>
          <span>HSK 1–9 · 一至九級</span>
          <span lang="zh-Hant">PSC 三級乙等 → 一級甲等</span>
        </motion.div>
        <motion.div className="fi-url" {...up(2.6)}>漢語樂園 Mandarin Garden · mandaringarden.asia</motion.div>
        <motion.p className="fi-note" {...up(3.2)}>Independent practice materials, not official syllabi. <span lang="zh-Hant">獨立練習材料，非官方詞表。</span></motion.p>
      </div>
    </SceneFrame>
  );
}
