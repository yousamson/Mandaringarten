import { motion } from 'framer-motion';
import { Orbits, SceneFrame, Seal } from '../visuals';

const TITLE = ['中', '文', '寶', '庫'];

export function OpeningScene() {
  return (
    <SceneFrame tone="green" className="op-scene">
      <div className="op-mark">
        <Orbits exitAt={3.3} />
        <Seal delay={0.3} />
      </div>
      <div className="op-copy">
        <motion.span className="micro-label" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>MANDARIN GARDEN PRESENTS · 漢語樂園</motion.span>
        <h1 className="op-zh" lang="zh-Hant">
          {TITLE.map((c, i) => (
            <motion.span key={c} initial={{ y: '60%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.5 + i * 0.13 }}>{c}</motion.span>
          ))}
        </h1>
        <motion.h2 className="op-en" initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ delay: 1.05, duration: 0.6, ease: [0.7, 0, 0.2, 1] }}>Chinese Treasure House</motion.h2>
        <motion.p className="op-sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.4 }}>
          <span>Four pathways. One place to practise.</span>
          <span lang="zh-Hant">四條學習路徑，一處循序練習。</span>
        </motion.p>
        <motion.div className="op-free" initial={{ opacity: 0, scale: .82, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 1.9, type: 'spring', stiffness: 280, damping: 20 }}>
          <b>FREE APP / PWA DOWNLOAD</b><span lang="zh-Hant">免費下載應用程式／漸進式網頁應用</span>
        </motion.div>
      </div>
    </SceneFrame>
  );
}
