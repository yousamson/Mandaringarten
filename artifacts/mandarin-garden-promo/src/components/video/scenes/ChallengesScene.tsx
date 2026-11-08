import { motion } from 'framer-motion';
import { SceneFrame } from '../visuals';

const cards = [
  { hanzi: '山', pinyin: 'shān', meaning: 'mountain', color: 'coral', delay: 0.82, art: 'ridge' },
  { hanzi: '水', pinyin: 'shuǐ', meaning: 'water', color: 'blue', delay: 1.38, art: 'wave' },
  { hanzi: '花', pinyin: 'huā', meaning: 'flower', color: 'gold', delay: 1.94, art: 'petal' },
];

export function ChallengesScene() {
  return (
    <SceneFrame className="challenges-scene">
      <div className="board-grid" aria-hidden="true" />
      <motion.div className="challenge-heading" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.48 }}>
        <span className="micro-label">OPEN THE GARDEN</span>
        <h2>FREE learning<br />challenges</h2>
      </motion.div>
      <div className="challenge-cards">
        {cards.map((card) => (
          <motion.article
            key={card.hanzi}
            className={`challenge-card card-${card.color}`}
            initial={{ opacity: 0, rotateY: 88, y: 70, scale: 0.8 }}
            animate={{ opacity: 1, rotateY: 0, y: 0, scale: 1 }}
            transition={{ delay: card.delay, duration: 0.55, type: 'spring', stiffness: 120, damping: 15 }}
          >
            <div className={`card-illustration art-${card.art}`}>
              {card.art === 'ridge' ? <><i /><b /><em /></> : card.art === 'wave' ? <><i /><b /><em /></> : <><i /><b /><em /><strong /></>}
            </div>
            <div className="card-word">
              <b lang="zh-Hans">{card.hanzi}</b>
              <span>{card.pinyin}</span>
              <small>{card.meaning}</small>
            </div>
            <div className="card-index">GARDEN GAME <i>✳</i></div>
          </motion.article>
        ))}
      </div>
      <motion.div className="challenge-footer" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5, duration: 0.38 }}>
        <span>Try. Match. Remember.</span><span lang="zh-Hant">免費學習挑戰</span>
      </motion.div>
      <motion.div className="challenge-token" initial={{ scale: 0, x: '30vw', y: '20vh', rotate: -90 }} animate={{ scale: [0, 1, 1, 12], x: ['30vw', '0vw', '0vw', '0vw'], y: ['20vh', '0vh', '0vh', '0vh'], rotate: [-90, 0, 0, 0] }} transition={{ duration: 1.08, times: [0, 0.25, 0.65, 1], delay: 3.3, ease: [0.65, 0, 0.35, 1] }}>花</motion.div>
    </SceneFrame>
  );
}
