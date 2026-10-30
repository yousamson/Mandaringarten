import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CloudOff, RotateCcw, Undo2, Volume2 } from 'lucide-react';
import type { LearningQuestion, LearningRound, LearningRoundInput } from '@workspace/api-client-react';
import type { Language } from '@/lib/garden-data';
import type { Question } from '@/lib/playground-games';
import { modeCopy, pick, tr, type GameMode } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech } from '@/lib/speech';
import { useIssueLearningRound, useRecordRound, XP_PER_CORRECT } from '@/hooks/use-learning';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type DisplayQuestion = Question & { id: string };

function withLocalAnswer(question: LearningQuestion, script: 'trad' | 'simp'): DisplayQuestion {
  if (question.kind === 'choice' && question.word && question.options) {
    const answer = question.mode === 'pinyin'
      ? question.word.pinyin
      : question.mode === 'listen'
        ? question.speakText
        : script === 'simp' ? question.word.simp : question.word.trad;
    return { ...question, answer } as DisplayQuestion;
  }
  return { ...question, answer: question.speakText } as DisplayQuestion;
}

export function GameRound({ stage, mode, l, uid }: { stage: number; mode: GameMode; l: Language; uid: string }) {
  const script = scriptFor(l);
  const [seed, setSeed] = useState(0);
  const [challenge, setChallenge] = useState<LearningRound | null>(null);
  const [issueFailed, setIssueFailed] = useState(false);
  const { issue } = useIssueLearningRound(uid);
  const issueRef = useRef(issue);
  issueRef.current = issue;
  const questions = useMemo(
    () => challenge?.questions.map((question) => withLocalAnswer(question, script)) ?? [],
    [challenge, script],
  );
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
  const activeRoundId = challenge?.roundId ?? null;
  const activeRoundIdRef = useRef(activeRoundId);
  activeRoundIdRef.current = activeRoundId;

  useEffect(() => {
    let cancelled = false;
    setChallenge(null);
    setIssueFailed(false);
    setIdx(0);
    setPicked(null);
    setBuilt([]);
    setCorrect(0);
    setSavedAnswers(0);
    void issueRef.current({ stage, mode, script }).then((round) => {
      if (!cancelled) setChallenge(round);
    }).catch(() => {
      if (!cancelled) setIssueFailed(true);
    });
    return () => { cancelled = true; };
  }, [stage, mode, script, seed, uid]);

  const done = Boolean(challenge && idx >= questions.length);
  const save: SaveState = pendingSaves > 0 ? 'saving' : failedAnswers.length ? 'error' : savedAnswers > 0 ? 'saved' : 'idle';
  const q: DisplayQuestion | undefined = questions[idx];

  const saveAnswer = (input: LearningRoundInput, ownerRoundId: string) => {
    if (savingIds.current.has(input.questionId)) return;
    savingIds.current.add(input.questionId);
    setPendingSaves((count) => count + 1);
    const request = saveQueue.current.then(async () => { await replayRef.current(input); });
    saveQueue.current = request.then(() => undefined, () => undefined);
    const finish = () => {
      savingIds.current.delete(input.questionId);
      setPendingSaves((count) => Math.max(0, count - 1));
    };
    void request.then(
      () => {
        if (activeRoundIdRef.current === ownerRoundId) setSavedAnswers((count) => count + 1);
        setFailedAnswers((items) => items.filter((item) => item.questionId !== input.questionId));
        finish();
      },
      () => {
        setFailedAnswers((items) => items.some((item) => item.questionId === input.questionId) ? items : [...items, input]);
        finish();
      },
    );
  };
  const retryFailedAnswers = () => {
    if (!activeRoundId) return;
    for (const input of failedAnswers) saveAnswer(input, activeRoundId);
  };

  useEffect(() => {
    if (q && q.kind === 'choice' && q.mode === 'listen') speakMandarin(q.speakText, script);
  }, [q, script]);
  useEffect(() => () => stopSpeech(), []);

  const answer = (value: string) => {
    if (picked || !q || !challenge) return;
    setPicked(value);
    if (value === q.answer) {
      setCorrect((count) => count + 1);
      saveAnswer({
        roundId: challenge.roundId,
        questionId: q.id,
        answer: value,
      }, challenge.roundId);
    }
  };
  const next = () => { setIdx((i) => i + 1); setPicked(null); setBuilt([]); };
  const restart = () => { setSeed((value) => value + 1); setIdx(0); setPicked(null); setBuilt([]); setCorrect(0); setSavedAnswers(0); };

  if (!challenge) {
    return (
      <div className="game-card" role="status">
        <p className="panel-desc">{issueFailed
          ? tr(l, 'This round could not start. Please try again.', '目前無法開始新的一輪，請重試。', '目前无法开始新的一轮，请重试。')
          : tr(l, 'Preparing your questions…', '正在準備題目…', '正在准备题目…')}</p>
        {issueFailed ? <button className="button-secondary" onClick={restart} data-testid="button-retry-round-start">{tr(l, 'Retry', '重試', '重试')}</button> : null}
      </div>
    );
  }
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
            {q.options.map((option, i) => (
              <button key={option} className={`quiz-option ${picked && option === q.answer ? 'correct' : picked === option ? 'incorrect' : ''}`} disabled={Boolean(picked)} onClick={() => answer(option)} data-testid={`button-option-${i}`}>{option}</button>
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
            {q.chunks.map((chunk, i) => (
              <button key={i} className={`quiz-option chunk ${q.mode === 'word-order' ? 'char' : ''}`} disabled={Boolean(picked) || built.includes(i)} onClick={() => {
                const nextBuilt = [...built, i];
                setBuilt(nextBuilt);
                if (nextBuilt.length === q.chunks.length) answer(nextBuilt.map((j) => q.chunks[j]).join(''));
              }} data-testid={`button-chunk-${i}`}>{chunk}</button>
            ))}
          </div>
          {!picked && built.length ? (
            <div className="order-tools">
              <button className="text-next" onClick={() => setBuilt((items) => items.slice(0, -1))} data-testid="button-undo-chunk"><Undo2 size={12} /> {tr(l, 'Undo', '退一步', '退一步')}</button>
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
