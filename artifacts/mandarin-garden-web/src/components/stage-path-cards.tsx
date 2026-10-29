import { ArrowRight, LockKeyhole, RotateCcw, Sprout } from 'lucide-react';
import { Link } from 'wouter';
import { useLearningProgress, useMembership } from '@/hooks/use-learning';
import type { Language } from '@/lib/garden-data';
import { packsForStage } from '@/lib/playground-games';
import { pick, playgroundName, stageLabel, stageNames, tr } from '@/lib/playground-copy';
import { scriptFor } from '@/lib/speech';

/** Premium word paths, generated from the parent-selected stage's 200-word bank. */
export function StagePathCards({ l }: { l: Language }) {
  const m = useMembership();
  const progress = useLearningProgress(m.uid, m.premium);
  const loading = m.checking || (m.premium && progress.isLoading);
  const script = scriptFor(l);

  if (loading) {
    return <section className="stage-paths"><div className="skeleton-line w40" /><div className="lesson-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton-block" style={{ height: 173 }} />)}</div></section>;
  }
  if (m.premium && (progress.isError || !progress.progress)) {
    return <section className="stage-paths"><div className="alert" role="alert">{tr(l, 'We could not load your selected stage.', '無法載入所選階段。', '无法加载所选阶段。')} <button className="text-next" onClick={() => void progress.refetch()} data-testid="button-retry-paths"><RotateCcw size={12} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div></section>;
  }
  const stage = m.premium && progress.progress ? progress.progress.selectedStage : 1;
  const packs = packsForStage(stage);
  const locked = !m.premium;

  return (
    <section className="stage-paths" data-testid="section-stage-paths">
      <div className="section-head">
        <div>
          <div className="eyebrow">{playgroundName[l]} · {stageLabel(l, stage)}</div>
          <h2>{pick(l, stageNames[stage - 1])}</h2>
          <p className="section-sub">{locked
            ? tr(l, 'Membership opens ten word paths for whichever stage you choose. Previewing stage 1.', '加入會員後，可為所選階段開啟十條詞語小徑。目前預覽第 1 階段。', '加入会员后，可为所选阶段开启十条词语小径。目前预览第 1 阶段。')
            : tr(l, 'Ten paths from your selected stage. Change the stage anytime in For parents.', '來自所選階段的十條小徑，可隨時在家長專區更換階段。', '来自所选阶段的十条小径，可随时在家长专区更换阶段。')}</p>
        </div>
        <Link href={locked ? '/parent' : '/playground'} className="status-pill" data-testid="link-stage-paths-more">{locked ? tr(l, 'See membership', '看看會員', '看看会员') : playgroundName[l]}</Link>
      </div>
      <div className="lesson-grid">
        {packs.map((p) => (
          <Link key={p.index} href={`/lesson/stage-path-${p.index}`} className={`lesson-card path-card stage-tone-${stage}`} data-testid={`card-stage-path-${p.index}`}>
            <div className="lesson-top"><span className="lesson-icon"><Sprout size={20} strokeWidth={1.7} /></span><span className="premium-label">{locked ? <><LockKeyhole size={11} /> {tr(l, 'Members', '會員', '会员')}</> : `${p.start}–${p.start + p.words.length - 1}`}</span></div>
            <h3 className="lesson-title">{tr(l, `Path ${p.index}`, `第 ${p.index} 條小徑`, `第 ${p.index} 条小径`)}</h3>
            <p className="lesson-description path-preview">{p.words.slice(0, 4).map((w) => (script === 'simp' ? w.simp : w.trad)).join(' · ')}</p>
            <div className="lesson-bottom"><span>{p.words.length} {tr(l, 'words', '個詞語', '个词语')}</span><strong>{locked ? tr(l, 'Locked', '未開啟', '未开启') : tr(l, 'Start', '開始', '开始')} <ArrowRight size={12} /></strong></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
