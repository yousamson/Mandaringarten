import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CloudOff, RotateCcw, Undo2, Volume2 } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import { buildRound, newRoundId, type Question } from '@/lib/playground-games';
import { modeCopy, pick, tr, type GameMode } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech } from '@/lib/speech';
import { useRecordRound, XP_PER_CORRECT } from '@/hooks/use-learning';
import { questionAwardId } from '@/lib/progress-outbox';
import type { LearningRoundInput } from '@workspace/api-client-react';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function GameRound({ stage, mode, l, uid }: { stage: number; mode: GameMode; l: Language; uid: string }) {
  const script = scriptFor(l);
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildRound(stage, mode, script), [stage, mode, script, seed]);
  const roundId = useMemo(() => newRoundId(), [stage, mode, seed]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState(0);
  const [failedAnswers, setFailedAnswers] = useState<LearningRoundInput[]>([]);
  const { replay } = useRecordRound(uid);
  const replayRef = useRef(replay);
  replayRef.current = replay;
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const savingIds = useRef(new Set<string>());
  const activeRoundId = useRef(roundId);
  activeRoundId.current = roundId;

  const q: Question | undefined = questions[idx];
  const done = idx >= questions.length;
  const save: SaveState = pendingSaves > 0 ? 'saving' : failedAnswers.length ? 'error' : savedAnswers > 0 ? 'saved' : 'idle';

  const saveAnswer = (input: LearningRoundInput, ownerRoundId: string) => {
    if (savingIds.current.has(input.roundId)) return;
    savingIds.current.add(input.roundId);
    setPendingSaves((count) => count + 1);
    const request = saveQueue.current.then(async () => { await replayRef.current(input); });
    saveQueue.current = request.then(() => undefined, () => undefined);
    const finish = () => {
      savingIds.current.delete(input.roundId);
      setPendingSaves((count) => Math.max(0, count - 1));
    };
    void request.then(
      () => {
        if (activeRoundId.current === ownerRoundId) setSavedAnswers((count) => count + 1);
        setFailedAnswers((items) => items.filter((item) => item.roundId !== input.roundId));
        finish();
      },
      () => {
        if (activeRoundId.current === ownerRoundId) {
          setFailedAnswers((items) => items.some((item) => item.roundId === input.roundId) ? items : [...items, input]);
        }
        finish();
      },
    );
  };
  const retryFailedAnswers = () => {
    for (const input of failedAnswers) saveAnswer(input, activeRoundId.current);
  };

  // Listen mode plays each new word once; replay is always available.
  useEffect(() => {
    if (q && q.kind === 'choice' && q.mode === 'listen') speakMandarin(q.speakText, script);
  }, [q, script]);
  useEffect(() => () => stopSpeech(), []);

  const answer = (value: string) => {
    if (picked || !q) return;
    setPicked(value);
    if (value === q.answer) {
      setCorrect((c) => c + 1);
      saveAnswer({
        stage,
        mode,
        roundId: questionAwardId(roundId, idx),
        correctCount: 1,
      }, roundId);
    }
  };
  const next = () => { setIdx((i) => i + 1); setPicked(null); setBuilt([]); };
  const restart = () => { setSeed((s) => s + 1); setIdx(0); setPicked(null); setBuilt([]); setCorrect(0); setSavedAnswers(0); };

  if (questions.length === 0) {
    return <div className="game-card"><p className="panel-desc">{tr(l, 'No questions available for this stage yet.', '此階段暫時沒有題目。', '此阶段暂时没有题目。')}</p></div>;
  }

  return (
    <section className="game-card" data-testid={`game-${mode}`}>
      <div className="game-head">
        <div>
          <div className="eyebrow">{pick(l, modeCopy[mode].name)}</div>
          <p className="game-hint">{pick(l, modeCopy[mode].hint)}</p>
        </div>
        <div className="game-pips" aria-label={`${Math.min(idx + 1, questions.length)} / ${questions.length}`}>
          {questions.map((_, i) => <span key={i} className={i < idx ? 'done' : i === idx && !done ? 'now' : ''} />)}
        </div>
      </div>

      {done ? (
        <div className="round-result" data-testid="round-result">
          <div className="quiz-score">{correct}<span> / {questions.length}</span></div>
          <p className="round-xp">+{correct * XP_PER_CORRECT} XP</p>
          <div className={`save-state ${save}`} role="status" data-testid="status-round-save">
            {save === 'saving' ? tr(l, 'Saving XP to your account…', '正在把 XP 儲存到帳戶…', '正在把 XP 保存到账户…')
              : save === 'saved' ? <><Check size={13} /> {tr(l, 'XP saved to this stage', 'XP 已儲存到此階段', 'XP 已保存到此阶段')}</>
              : save === 'error' ? <><CloudOff size={13} /> {tr(l, 'Some XP could not be saved.', '部分 XP 未能儲存。', '部分 XP 未能保存。')} <button className="text-next" onClick={retryFailedAnswers} data-testid="button-retry-round">{tr(l, 'Retry', '重試', '重试')}</button></>
              : null}
          </div>
          <button className="button-secondary" onClick={restart} disabled={save === 'saving'} data-testid="button-new-round"><RotateCcw size={14} /> {tr(l, 'New round', '新的一輪', '新的一轮')}</button>
        </div>
      ) : q && q.kind === 'choice' ? (
        <>
          <div className="game-prompt">
            <span className="question-count">{idx + 1} / {questions.length}</span>
            {q.mode === 'listen' ? (
              <button className="listen-orb" onClick={() => speakMandarin(q.speakText, script)} aria-label={tr(l, 'Play the word', '播放詞語', '播放词语')} data-testid="button-play-prompt"><Volume2 size={30} /></button>
            ) : (
              <strong className={q.mode === 'pinyin' ? 'prompt-hanzi' : 'prompt-meaning'}>{q.prompt}</strong>
            )}
          </div>
          <div className={`quiz-options ${q.mode === 'pinyin' ? 'pinyin-options' : ''}`}>
            {q.options.map((o, i) => (
              <button key={o} className={`quiz-option ${picked && o === q.answer ? 'correct' : picked === o ? 'incorrect' : ''}`} disabled={Boolean(picked)} onClick={() => answer(o)} data-testid={`button-option-${i}`}>{o}</button>
            ))}
          </div>
          {picked ? (
            <div className={`quiz-feedback ${picked === q.answer ? 'good' : ''}`}>
              <span>{picked === q.answer ? `+${XP_PER_CORRECT} XP · ` : `${tr(l, 'Answer', '答案', '答案')}: `}<b className="hz">{q.speakText}</b> · {q.word.pinyin} · {q.word.en}</span>
              <button className="text-next" onClick={next} data-testid="button-next-question">{idx === questions.length - 1 ? tr(l, 'Finish', '完成', '完成') : tr(l, 'Next', '下一題', '下一题')} <ArrowRight size={13} /></button>
            </div>
          ) : null}
        </>
      ) : q && q.kind === 'order' ? (
        <>
          <div className="game-prompt">
            <span className="question-count">{idx + 1} / {questions.length}</span>
            <span className="order-clue">{q.clue}</span>
            <button className="audio-button" style={{ margin: '6px auto 0' }} onClick={() => speakMandarin(q.speakText, script)} data-testid="button-hear-answer"><Volume2 size={14} /> {tr(l, 'Hear it', '聽一聽', '听一听')}</button>
          </div>
          <div className={`answer-line ${picked ? (picked === q.answer ? 'good' : 'bad') : ''}`} data-testid="text-built">{built.map((i) => q.chunks[i]).join('') || '\u00a0'}</div>
          <div className="chunk-row">
            {q.chunks.map((c, i) => (
              <button key={i} className={`quiz-option chunk ${q.mode === 'word-order' ? 'char' : ''}`} disabled={Boolean(picked) || built.includes(i)} onClick={() => {
                const nb = [...built, i];
                setBuilt(nb);
                if (nb.length === q.chunks.length) answer(nb.map((j) => q.chunks[j]).join(''));
              }} data-testid={`button-chunk-${i}`}>{c}</button>
            ))}
          </div>
          {!picked && built.length ? (
            <div className="order-tools">
              <button className="text-next" onClick={() => setBuilt((b) => b.slice(0, -1))} data-testid="button-undo-chunk"><Undo2 size={12} /> {tr(l, 'Undo', '退一步', '退一步')}</button>
              <button className="text-next" onClick={() => setBuilt([])} data-testid="button-clear-chunks"><RotateCcw size={12} /> {tr(l, 'Clear', '重來', '重来')}</button>
            </div>
          ) : null}
          {picked ? (
            <div className={`quiz-feedback ${picked === q.answer ? 'good' : ''}`}>
              <span>{picked === q.answer ? `+${XP_PER_CORRECT} XP` : <>{tr(l, 'Answer', '答案', '答案')}: <b className="hz">{q.answer}</b></>}</span>
              <button className="text-next" onClick={next} data-testid="button-next-question">{idx === questions.length - 1 ? tr(l, 'Finish', '完成', '完成') : tr(l, 'Next', '下一題', '下一题')} <ArrowRight size={13} /></button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
