import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, RotateCcw, Volume2, X } from 'lucide-react';
import { Link } from 'wouter';
import { useLearningProgress, useMembership } from '@/hooks/use-learning';
import type { Language } from '@/lib/garden-data';
import { packsForStage, PACK_COUNT } from '@/lib/playground-games';
import { pathTheme, pick, stageLabel, stageNames, tr } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech } from '@/lib/speech';

export function StagePathPlayer({ packIndex, l }: { packIndex: number; l: Language }) {
  const m = useMembership();
  const progress = useLearningProgress(m.uid, m.premium);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const stage = progress.progress?.selectedStage ?? 1;
  useEffect(() => { setIndex(0); setDone(false); }, [packIndex, stage]);
  useEffect(() => () => stopSpeech(), []);
  const script = scriptFor(l);

  const back = <Link href="/home" className="button-secondary back-chip" data-testid="link-back-home"><ArrowLeft size={14} /> {tr(l, 'Back to the garden', '回到樂園', '回到乐园')}</Link>;
  if (packIndex < 1 || packIndex > PACK_COUNT) return <main className="page-shell not-found"><h1>{tr(l, 'That path is not here.', '找不到這條小徑。', '找不到这条小径。')}</h1>{back}</main>;

  if (m.checking || (m.premium && progress.isLoading)) {
    return <main className="page-shell"><div className="lesson-page">{back}<div className="lesson-player" style={{ marginTop: 18 }}><div className="skeleton-line w40" /><div className="skeleton-block" style={{ height: 260, marginTop: 30 }} /></div></div></main>;
  }
  if (!m.premium) {
    return (
      <main className="page-shell"><div className="lesson-page">{back}
        <div className="lesson-player locked-panel" style={{ marginTop: 18 }}>
          <div className="complete-mark"><LockKeyhole size={27} /></div>
          <h1 className="locked-title">{tr(l, 'Membership opens this path', '加入會員即可開啟這條小徑', '加入会员即可开启这条小径')}</h1>
          <p className="section-sub">{tr(l, 'Each path draws 20 words from the stage you choose for your child.', '每條小徑從您為孩子選擇的階段中挑選 20 個詞語。', '每条小径从您为孩子选择的阶段中挑选 20 个词语。')}</p>
          <Link href="/parent" className="button-primary" data-testid="link-path-membership">{tr(l, 'See family membership', '看看家庭會員', '看看家庭会员')} <ArrowRight size={16} /></Link>
        </div>
      </div></main>
    );
  }
  if (progress.isError || !progress.progress) {
    return <main className="page-shell"><div className="lesson-page">{back}<div className="alert" role="alert">{tr(l, 'We could not load your selected stage.', '無法載入所選階段。', '无法加载所选阶段。')} <button className="text-next" onClick={() => void progress.refetch()}><RotateCcw size={12} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div></div></main>;
  }

  const pack = packsForStage(stage)[packIndex - 1];
  const word = pack.words[index];
  const total = pack.words.length;
  const hz = script === 'simp' ? word.simp : word.trad;
  const other = script === 'simp' ? word.trad : word.simp;
  const title = `${stageLabel(l, stage)} · ${pathTheme(l, stage, packIndex)}`;

  return (
    <main className="page-shell"><div className="lesson-page">{back}
      <div className="lesson-player" style={{ marginTop: 18 }} data-testid="stage-path-player">
        <div className="player-head"><span>{title} · {done ? total : index + 1} / {total}</span><Link href="/home" className="icon-button" aria-label={tr(l, 'Close', '關閉', '关闭')}><X size={17} /></Link></div>
        <div className="player-progress"><span style={{ width: `${done ? 100 : ((index + 1) / total) * 100}%` }} /></div>
        {done ? (
          <div className="complete-panel">
            <div className="complete-mark"><Check size={32} /></div>
            <h2>{tr(l, 'Path walked.', '走完這條小徑了。', '走完这条小径了。')}</h2>
            <p className="section-sub">{tr(l, `${total} words from ${pick(l, stageNames[stage - 1])}. Try them in the games next.`, `${total} 個「${pick(l, stageNames[stage - 1])}」詞語，接著去遊戲裡試試看。`, `${total} 个“${pick(l, stageNames[stage - 1])}”词语，接着去游戏里试试看。`)}</p>
            <div className="button-row" style={{ justifyContent: 'center', marginTop: 22 }}>
              <button className="button-secondary" onClick={() => { setIndex(0); setDone(false); }} data-testid="button-path-restart"><RotateCcw size={15} /> {tr(l, 'Walk it again', '再走一次', '再走一次')}</button>
              {packIndex < PACK_COUNT ? <Link href={`/lesson/stage-path-${packIndex + 1}`} className="button-secondary" data-testid="link-next-path">{tr(l, 'Next path', '下一條小徑', '下一条小径')}</Link> : null}
              <Link href="/playground" className="button-primary" data-testid="link-path-games">{tr(l, 'Play the games', '去玩遊戲', '去玩游戏')} <ArrowRight size={15} /></Link>
            </div>
          </div>
        ) : (
          <>
            <div className="word-card">
              <div className="word-meaning">{word.en}</div>
              <div className="word-hanzi" data-testid="text-path-hanzi">{hz}</div>
              <div className="word-pinyin">{word.pinyin}</div>
              {other !== hz ? <div className="word-alt">{script === 'simp' ? '繁體' : '简体'} · {other}</div> : null}
              <button className="audio-button" onClick={() => speakMandarin(hz, script)} data-testid="button-listen"><Volume2 size={15} /> {tr(l, 'Listen', '聽一聽', '听一听')}</button>
            </div>
            <div className="player-actions">
              <button className="button-secondary" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} data-testid="button-prev-word"><ArrowLeft size={15} /> {tr(l, 'Back', '上一個', '上一个')}</button>
              <button className="button-primary" onClick={() => (index < total - 1 ? setIndex((i) => i + 1) : setDone(true))} data-testid="button-next-word">{index === total - 1 ? tr(l, 'Finish this path', '完成這條小徑', '完成这条小径') : tr(l, 'I know it · next word', '學會了，下一個', '学会了，下一个')} <ArrowRight size={15} /></button>
            </div>
          </>
        )}
      </div>
    </div></main>
  );
}
