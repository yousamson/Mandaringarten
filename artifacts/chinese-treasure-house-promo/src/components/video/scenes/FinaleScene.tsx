import { motion } from 'framer-motion';
import { BrandIcon, Orbits, SceneFrame, Seal } from '../visuals';

const up = (delay: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4 } });

export function FinaleScene() {
  return (
    <SceneFrame tone="cream" className="fi-scene">
      <div className="fi-marks">
        <motion.div className="fi-icon" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.25 }}>
          <BrandIcon />
        </motion.div>
      </div>
      <motion.div className="fi-loop-orbit" initial={{ scale: 1, opacity: .8 }} animate={{ scale: [1, 1, .58], opacity: [.8, .8, 0] }} transition={{ duration: 6, times: [0, .85, 1], ease: 'easeInOut' }}>
        <Orbits />
      </motion.div>
      <div className="fi-copy">
        <motion.span className="micro-label" {...up(.1)}>YOUR NEXT STEP · 開始探索</motion.span>
        <motion.h1 lang="zh-Hant" {...up(.35)}>中文寶庫</motion.h1>
        <motion.h2 {...up(.55)}>Chinese Treasure House</motion.h2>
        <motion.div className="fi-download" {...up(.8)}>
          <b>FREE APP / PWA DOWNLOAD</b>
          <span lang="zh-Hant">免費下載應用程式／漸進式網頁應用</span>
          <small>Download the app or add the PWA to your home screen.</small>
        </motion.div>
        <motion.div className="fi-trial" {...up(1.35)}>
          <b>3-DAY FREE TRIAL · 三天免費試用</b>
          <span>A payment method is required to start the trial. · 開始試用須提供付款方式。</span>
        </motion.div>
        <motion.div className="fi-terms" {...up(1.8)}>
          <b>After 3 days, subscription renews monthly automatically unless cancelled.</b><br />
          三天試用後將按月自動續訂，除非取消。
        </motion.div>
        <motion.div className="fi-url" {...up(2.35)}>mandaringarden.asia</motion.div>
        <motion.p className="fi-note" {...up(2.65)}>Explore Chinese Treasure House · 探索中文寶庫</motion.p>
      </div>
    </SceneFrame>
  );
}
