import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, LockKeyhole, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'wouter';
import { GameRound } from '@/components/playground/game-round';
import { StagePicker } from '@/components/playground/stage-picker';
import { VocabBoard } from '@/components/playground/vocab-board';
import { useLearningProgress, useMembership, useSelectStage, XP_COMPLETE, XP_PER_CORRECT, type NormalizedProgress } from '@/hooks/use-learning';
import type { Language } from '@/lib/garden-data';
import { GAME_MODES, modeCopy, pick, playgroundName, stageLabel, stageNames, tr } from '@/lib/playground-copy';
import { initialPlaygroundMode, type GameMode } from '@/lib/playground-modes';
import { TOTAL_FOCUS_CARDS } from '@workspace/learning-content/games';

export function PlaygroundSkeleton() {
  return (
    <div className="pg-skeleton" aria-busy="true">
      <div className="stage-picker">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-block" style={{ height: 128 }} />)}</div>
      <div className="cur-grid"><div className="skeleton-block" style={{ height: 380 }} /><div className="skeleton-block" style={{ height: 380 }} /></div>
    </div>
  );
}

export default function PlaygroundPage({ language: l }: { language: Language }) {
  const m = useMembership();
  const progressQuery = useLearningProgress(m.uid, m.premium);

  return (
    <main className="page-shell">
      <section className="page-title">
        <div className="eyebrow">{playgroundName[l]}</div>
        <h1>{tr(l, 'Four stages. Any order. Your call.', '四個階段，任意選擇，由您決定。', '四个阶段，任意选择，由您决定。')}</h1>
        <p>{tr(l, `Choose a stage in For parents. Every correct answer adds ${XP_PER_CORRECT} XP to that stage; ${XP_COMPLETE} XP marks it complete, and you can keep playing as long as you like.`, `在家長專區選擇階段。每答對一題，該階段增加 ${XP_PER_CORRECT} XP；累積 ${XP_COMPLETE} XP 即完成，之後仍可繼續練習。`, `在家长专区选择阶段。每答对一题，该阶段增加 ${XP_PER_CORRECT} XP；累积 ${XP_COMPLETE} XP 即完成，之后仍可继续练习。`)}</p>
      </section>
      {m.checking ? <PlaygroundSkeleton />
        : m.isSignedIn && m.billing.isError ? (
          <div className="alert" role="alert"><p>{tr(l, 'We could not load membership.', '無法載入會員狀態。', '无法加载会员状态。')}</p><button className="button-secondary" onClick={() => void m.billing.refetch()} data-testid="button-retry-billing"><RotateCcw size={14} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div>
        ) : !m.premium || !m.uid ? (
          <LockedPlayground l={l} signedIn={m.isSignedIn} />
        ) : progressQuery.isLoading ? <PlaygroundSkeleton />
        : progressQuery.isError || !progressQuery.progress ? (
          <div className="alert" role="alert"><p>{tr(l, 'We could not load learning progress.', '無法載入學習進度。', '无法加载学习进度。')}</p><button className="button-secondary" onClick={() => void progressQuery.refetch()} data-testid="button-retry-progress"><RotateCcw size={14} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div>
        ) : (
          <PlaygroundBody uid={m.uid} progress={progressQuery.progress} l={l} />
        )}
    </main>
  );
}

export function WordBankPage({ language: l }: { language: Language }) {
  const m = useMembership();
  const progressQuery = useLearningProgress(m.uid, m.premium);
  const progress = progressQuery.progress;
  const stage = progress?.selectedStage;

  return (
    <main className="page-shell">
      <Link href="/playground" className="button-secondary back-chip" data-testid="link-back-playground">
        <ArrowLeft size={14} /> {tr(l, 'Back to the playground', '返回學習樂園', '返回学习乐园')}
      </Link>
      <section className="page-title">
        <div className="eyebrow">{playgroundName[l]}</div>
        <h1>{tr(l, 'Stage word bank', '階段詞語庫', '阶段词语库')}</h1>
        <p>{tr(l, 'Browse the 200 words for the stage selected by a parent.', '瀏覽家長所選階段的 200 個詞語。', '浏览家长所选阶段的 200 个词语。')}</p>
      </section>
      {m.checking ? <PlaygroundSkeleton />
        : !m.premium || !m.uid ? <LockedPlayground l={l} signedIn={m.isSignedIn} />
        : progressQuery.isLoading ? <PlaygroundSkeleton />
        : progressQuery.isError || !stage ? (
          <div className="alert" role="alert">
            <p>{tr(l, 'We could not load the selected stage.', '無法載入所選階段。', '无法加载所选阶段。')}</p>
            <button className="button-secondary" onClick={() => void progressQuery.refetch()} data-testid="button-retry-word-bank">
              <RotateCcw size={14} /> {tr(l, 'Try again', '再試一次', '再试一次')}
            </button>
          </div>
        ) : (
          <>
            <div className={`stage-banner stage-tone-${stage}`}>
              <div>
                <div className="eyebrow">{stageLabel(l, stage)}</div>
                <h2>{pick(l, stageNames[stage - 1])}</h2>
              </div>
              <BookOpen size={22} aria-hidden="true" />
            </div>
            <VocabBoard stage={stage} l={l} />
          </>
        )}
    </main>
  );
}

function LockedPlayground({ l, signedIn }: { l: Language; signedIn: boolean }) {
  return (
    <div className="panel locked-panel" data-testid="playground-locked">
      <div className="complete-mark"><LockKeyhole size={27} /></div>
      <h2>{tr(l, 'The Learning playground is part of family membership', '學習樂園屬於家庭會員內容', '学习乐园属于家庭会员内容')}</h2>
      <p className="panel-desc">{tr(l, '800 words, 40 stories and six games across four stages. Free learning stays open in the garden.', '四個階段共 800 個詞語、40 篇故事和六種遊戲。免費內容仍可在樂園中使用。', '四个阶段共 800 个词语、40 篇故事和六种游戏。免费内容仍可在乐园中使用。')}</p>
      <div className="button-row" style={{ justifyContent: 'center' }}>
        {!signedIn ? <Link href="/sign-in" className="button-secondary" data-testid="link-playground-sign-in">{tr(l, 'Sign in', '登入', '登录')}</Link> : null}
        <Link href="/parent" className="button-primary" data-testid="link-playground-membership">{tr(l, 'See family membership', '看看家庭會員', '看看家庭会员')} <ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}

function PlaygroundBody({ uid, progress, l }: { uid: string; progress: NormalizedProgress; l: Language }) {
  const [mode, setMode] = useState<GameMode>(() => {
    return initialPlaygroundMode(window.location.search);
  });
  const [selectError, setSelectError] = useState(false);
  const stageSelect = useSelectStage(uid);
  const stage = progress.selectedStage;
  const xp = progress.xpByStage[stage - 1];
  const complete = xp >= XP_COMPLETE;
  const choose = (s: number) => { if (s === stage) return; setSelectError(false); stageSelect.select(s, { onError: () => setSelectError(true) }); };

  return (
    <>
      <StagePicker progress={progress} l={l} onSelect={choose} pendingStage={stageSelect.pendingStage} disabled={stageSelect.isPending} showNotes={false} />
      {selectError ? <div className="alert" role="alert">{tr(l, 'The stage could not be changed. Please try again.', '未能切換階段，請再試一次。', '未能切换阶段，请再试一次。')}</div> : null}
      <section className={`stage-banner stage-tone-${stage}`} data-testid="stage-banner">
        <div>
          <div className="eyebrow">{stageLabel(l, stage)}</div>
          <h2>{pick(l, stageNames[stage - 1])}</h2>
          <div className="xp-bar"><span style={{ transform: `scaleX(${Math.min(1, xp / XP_COMPLETE)})` }} /></div>
          <p className="banner-xp" data-testid="text-current-stage-xp">{xp} XP · {complete ? tr(l, 'Stage complete', '本階段已完成', '本阶段已完成') : tr(l, `${XP_COMPLETE - xp} XP to complete`, `距離完成還差 ${XP_COMPLETE - xp} XP`, `距离完成还差 ${XP_COMPLETE - xp} XP`)} · {tr(l, 'Total', '總計', '总计')} {progress.totalXp} XP</p>
        </div>
        {complete ? (
          <div className="banner-cheer"><Trophy size={20} />
            <span>{stage < 4 ? tr(l, `Stage ${stage + 1} is ready whenever you are. Keep playing here as long as you like.`, `準備好時可前往第 ${stage + 1} 階段，也可以繼續在這裡練習。`, `准备好时可前往第 ${stage + 1} 阶段，也可以继续在这里练习。`) : tr(l, 'Every stage is open to revisit. Keep the words growing.', '所有階段都可隨時重溫，讓詞語繼續成長。', '所有阶段都可随时重温，让词语继续成长。')}</span>
            {stage < 4 ? <button className="button-secondary" onClick={() => choose(stage + 1)} disabled={stageSelect.isPending} data-testid="button-next-stage">{tr(l, `Try stage ${stage + 1}`, `試試第 ${stage + 1} 階段`, `试试第 ${stage + 1} 阶段`)} <ArrowRight size={14} /></button> : null}
          </div>
        ) : null}
      </section>
      <div className="mode-tabs" role="tablist">
        {GAME_MODES.map((gm) => (
            <button key={gm} role="tab" aria-selected={gm === mode} className={`mode-tab ${gm === mode ? 'selected' : ''}`} onClick={() => setMode(gm)} data-testid={`tab-mode-${gm}`}>
            <Sparkles size={13} /> {pick(l, modeCopy[gm].name)} {gm === 'focus' ? <span className="mode-tab-count">{TOTAL_FOCUS_CARDS}</span> : null}
          </button>
        ))}
      </div>
       <div className="cur-grid games-only-grid">
         <GameRound key={`${stage}-${mode}-${l}`} stage={stage} mode={mode} l={l} uid={uid} />
       </div>
       <Link href="/stories" className="panel playground-story-link" data-testid="link-playground-stories">
         <div>
           <div className="eyebrow">{tr(l, 'READ & LISTEN', '閱讀與聆聽', '阅读与聆听')}</div>
           <h2 style={{ margin: '5px 0' }}>{tr(l, 'Stories to share', '一起讀故事', '一起读故事')}</h2>
           <p className="panel-desc" style={{ margin: 0 }}>{tr(l, 'Open short stories and picture books in their own reading space.', '前往專屬閱讀區，探索短篇故事和親子繪本。', '前往专属阅读区，探索短篇故事和亲子绘本。')}</p>
         </div>
         <span className="button-secondary">{tr(l, 'Go to stories', '前往故事天地', '前往故事天地')} <ArrowRight size={14} /></span>
       </Link>
      <Link
        href="/playground/words"
        className="panel"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 60, textDecoration: 'none' }}
        data-testid="link-stage-word-bank"
      >
        <div>
          <div className="eyebrow">{tr(l, 'VOCABULARY', '詞語庫', '词语库')}</div>
          <h2 style={{ margin: '5px 0' }}>{tr(l, 'Words for this stage', '本階段詞語', '本阶段词语')}</h2>
          <p className="panel-desc" style={{ margin: 0 }}>{tr(l, 'Open the 200-word bank for this stage.', '點擊查看本階段的 200 個詞語。', '点击查看本阶段的 200 个词语。')}</p>
        </div>
        <span className="button-secondary">{tr(l, 'Open word bank', '開啟詞語庫', '打开词语库')} <ArrowRight size={14} /></span>
      </Link>
    </>
  );
}
