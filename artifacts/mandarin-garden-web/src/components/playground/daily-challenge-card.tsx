import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import { ageStages, normalizeAgeStage } from '@/lib/age-stages';
import { copy } from '@/lib/garden-data';
import { buildDailyChallenge, localDayKey } from '@/lib/daily-challenge';
import { tr } from '@/lib/playground-copy';

type Props = {
  language: Language;
  age: string;
  onAgeChange: (value: string) => void;
};

export function DailyChallengeCard({ language, age, onAgeChange }: Props) {
  const ageStage = normalizeAgeStage(age);
  const stage = ageStages.indexOf(ageStage) + 1;
  const [dayKey, setDayKey] = useState(() => localDayKey());
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const challenge = useMemo(() => buildDailyChallenge(stage, dayKey), [stage, dayKey]);
  const current = challenge.questions[round];

  useEffect(() => {
    const refreshDay = () => {
      const today = localDayKey();
      setDayKey((currentDay) => currentDay === today ? currentDay : today);
    };
    const interval = window.setInterval(refreshDay, 60_000);
    window.addEventListener('focus', refreshDay);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshDay);
    };
  }, []);

  useEffect(() => {
    setRound(0);
    setPicked(null);
    setScore(0);
  }, [stage, dayKey]);

  const select = (choiceId: string) => {
    if (picked || !current) return;
    setPicked(choiceId);
    if (choiceId === current.prompt.id) setScore((value) => value + 1);
  };

  const next = () => {
    setRound((value) => value + 1);
    setPicked(null);
  };

  const replay = () => {
    setRound(0);
    setPicked(null);
    setScore(0);
  };

  return (
    <section className="practice-card quiz-card home-pinyin-card daily-challenge-card" data-testid="daily-challenge-card">
      <div className="practice-heading">
        <span className="practice-icon"><Sparkles size={18} /></span>
        <div>
          <div className="eyebrow">{tr(language, 'DAILY FREE CHALLENGE', '每日免費挑戰', '每日免费挑战')}</div>
          <h2>{tr(language, 'Three little questions', '三道小挑戰', '三道小挑战')}</h2>
        </div>
      </div>

      <div className="daily-challenge-theme">
        <strong>{challenge.theme[language]}</strong>
        <span>{tr(language, 'A new topic every day · No sign-in needed', '每天換一個主題 · 無需登入', '每天换一个主题 · 无需登录')}</span>
      </div>

      <label className="pinyin-stage-picker" htmlFor="daily-challenge-age">
        <span>{tr(language, 'Choose an age stage', '選擇年齡階段', '选择年龄阶段')}</span>
        <select
          id="daily-challenge-age"
          className="select-control"
          value={ageStage}
          onChange={(event) => onAgeChange(event.target.value)}
          data-testid="select-daily-challenge-age"
        >
          {ageStages.map((value, index) => <option key={value} value={value}>{copy[language].levelAges[index]}</option>)}
        </select>
      </label>

      {current ? (
        <>
          <div className="quiz-question daily-challenge-question">
            <span className="question-count">
              {tr(language, `QUESTION ${round + 1} OF ${challenge.questions.length}`, `第 ${round + 1} 題 · 共 ${challenge.questions.length} 題`, `第 ${round + 1} 题 · 共 ${challenge.questions.length} 题`)}
            </span>
            <strong>{language === 'zh-Hans' ? current.prompt.simp : current.prompt.trad}</strong>
            <span>{tr(language, 'Choose the matching pinyin', '選出相配的拼音', '选出相配的拼音')}</span>
          </div>
          <div className="quiz-options daily-challenge-options">
            {current.choices.map((choice) => {
              const isAnswer = choice.id === current.prompt.id;
              const isPicked = picked === choice.id;
              const className = `quiz-option daily-challenge-option${picked && isPicked ? (isAnswer ? ' correct' : ' incorrect') : ''}${picked && isAnswer ? ' correct' : ''}`;
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={className}
                  onClick={() => select(choice.id)}
                  disabled={Boolean(picked)}
                  aria-pressed={isPicked}
                  data-testid={`daily-challenge-answer-${choice.id}`}
                >
                  {choice.pinyin}
                </button>
              );
            })}
          </div>
          {picked ? (
            <div className={`quiz-feedback daily-challenge-feedback ${picked === current.prompt.id ? 'good' : ''}`} role="status" aria-live="polite">
              <span>{picked === current.prompt.id
                ? tr(language, 'That’s right!', '答對了！', '答对了！')
                : tr(language, `The pinyin is ${current.prompt.pinyin}.`, `正確拼音是 ${current.prompt.pinyin}。`, `正确拼音是 ${current.prompt.pinyin}。`)}</span>
              <button className="text-next" type="button" onClick={next} data-testid="button-daily-challenge-next">
                {round === challenge.questions.length - 1
                  ? tr(language, 'See result', '看結果', '看结果')
                  : tr(language, 'Next', '下一題', '下一题')}
                <ArrowRight size={13} />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="quiz-result" data-testid="daily-challenge-result" role="status" aria-live="polite">
          <div className="quiz-score">{score}<span> / {challenge.questions.length}</span></div>
          <p>{tr(language, 'Lovely work. Come back tomorrow for a new topic.', '挑戰完成！明天再來探索新主題。', '挑战完成！明天再来探索新主题。')}</p>
          <button className="button-secondary" type="button" onClick={replay} data-testid="button-daily-challenge-replay">
            <RotateCcw size={14} />
            {tr(language, 'Play today’s challenge again', '再玩今天的挑戰', '再玩今天的挑战')}
          </button>
        </div>
      )}
    </section>
  );
}
