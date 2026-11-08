import { motion } from 'framer-motion';
import { Sprout, SceneFrame } from '../visuals';

const stages = [
  { label: '2–3', color: '#df875c' },
  { label: '4–5', color: '#e5b54f' },
  { label: '6–8', color: '#6f9b6e' },
  { label: '9–12', color: '#70999a' },
];

export function StagesScene() {
  return (
    <SceneFrame className="stages-scene">
      <div className="stage-sun" />
      <motion.div className="stage-heading" initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="micro-label">GROW AT YOUR OWN PACE</span>
        <h2><em>4</em> learning stages</h2>
        <p>Different ages. A joyful place to begin.</p>
      </motion.div>
      <div className="stage-garden">
        <div className="garden-horizon" />
        {stages.map((stage, i) => (
          <Sprout key={stage.label} stage={i} label={stage.label} color={stage.color} style={{ left: `${12 + i * 23}%` }} />
        ))}
      </div>
      <motion.div className="stage-chinese" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.72, duration: 0.4 }} lang="zh-Hant">不同年齡，都有適合的起點。</motion.div>
      <motion.div className="stage-card-transition" initial={{ scale: 0.1, rotate: -16, opacity: 0 }} animate={{ scale: [0.1, 1.08, 1, 8], rotate: [-16, 0, 0, 0], opacity: [0, 1, 1, 1] }} transition={{ duration: 1.16, times: [0, 0.26, 0.65, 1], delay: 3.28, ease: [0.65, 0, 0.35, 1] }}>
        <span>花</span>
      </motion.div>
      <div className="stage-tag">AGES 2–12 <i>·</i> FOUR WAYS TO GROW</div>
    </SceneFrame>
  );
}
