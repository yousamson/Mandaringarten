import { useEffect, useMemo, useState } from 'react';
import { Show, SignInButton, useUser } from '@clerk/react';
import { useGetBillingStatus, getGetBillingStatusQueryKey } from '@workspace/api-client-react';
import { ArrowRight, BookOpen, Check, LockKeyhole, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { Link } from 'wouter';
import { curriculumLevels, type CurriculumItem, type Reading } from '@/lib/curriculum';
import type { Language } from '@/lib/garden-data';

const XP_PER_LEVEL = 100;
const XP_PER_CORRECT = 5;
const MAX_LEVEL = curriculumLevels.length;
type Progress = { xp: number; awardedRounds: string[] };
const tr = (l: Language, en: string, hant: string, hans: string) => (l === 'en' ? en : l === 'zh-Hant' ? hant : hans);
const storageKey = (uid: string) => `mg-curriculum-progress:${uid}`;

function loadProgress(uid: string): Progress {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return { xp: 0, awardedRounds: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { xp: 0, awardedRounds: [] };
    const p = parsed as Record<string, unknown>;
    const xp = typeof p.xp === 'number' && Number.isFinite(p.xp) && p.xp >= 0 ? Math.min(Math.floor(p.xp), XP_PER_LEVEL * MAX_LEVEL) : 0;
    const awardedRounds = Array.isArray(p.awardedRounds) ? p.awardedRounds.filter((r): r is string => typeof r === 'string').slice(-200) : [];
    return { xp, awardedRounds };
  } catch {
    return { xp: 0, awardedRounds: [] };
  }
}
function saveProgress(uid: string, p: Progress) {
  try { localStorage.setItem(storageKey(uid), JSON.stringify(p)); return true; } catch { return false; }
}
const earnedLevel = (xp: number) => Math.min(MAX_LEVEL, 1 + Math.floor(xp / XP_PER_LEVEL));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function speak(text: string, language: Language) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = language === 'zh-Hans' ? 'zh-CN' : 'zh-TW';
  u.rate = 0.78;
  window.speechSynthesis.speak(u);
}

type Question =
  | { kind: 'choice'; prompt: string; listen?: string; answer: string; options: string[] }
  | { kind: 'order'; answer: string; chunks: string[] };

const hz = (i: CurriculumItem, l: Language) => (l === 'zh-Hans' ? i.simplified : i.hanzi);

function buildRound(level: number, l: Language): Question[] {
  const def = curriculumLevels[level - 1];
  const items = def.themes.flatMap((t) => t.items);
  const choice = (item: CurriculumItem, prompt: string, listen?: string): Question => ({
    kind: 'choice', prompt, listen, answer: hz(item, l),
    options: shuffle([hz(item, l), ...shuffle(items.filter((x) => x !== item)).slice(0, 3).map((x) => hz(x, l))]),
  });
  if (level === 1) return shuffle(items).slice(0, 5).map((it, i) => (i % 2 ? choice(it, '', hz(it, l)) : choice(it, it.meaning)));
  if (level === 2) return shuffle(items).slice(0, 5).map((it) => choice(it, it.pinyin));
  const idioms = shuffle(items).slice(0, level === 3 ? 4 : 3).map((it) => choice(it, it.meaning));
  const sentences = (def.sentences ?? []).slice(0, level === 3 ? 1 : 2).map((s): Question => {
    const text = l === 'zh-Hans' ? s.simplified : s.traditional;
    const chunks = text.split(/(?<=[，。])/).flatMap((c) => (c.length > 6 ? [c.slice(0, Math.ceil(c.length / 2)), c.slice(Math.ceil(c.length / 2))] : [c]));
    let sh = shuffle(chunks);
    if (sh.join('') === text) sh = [...sh].reverse();
    return { kind: 'order', answer: text, chunks: sh };
  });
  return shuffle([...idioms, ...sentences]);
}

const gameNames: Record<string, [string, string, string]> = {
  'curriculum.game.pictureMatch': ['Meaning match', '詞義配對', '词义配对'],
  'curriculum.game.listenPoint': ['Listen and point', '聽音指認', '听音指认'],
  'curriculum.game.pinyinMatch': ['Pinyin match', '拼音配對', '拼音配对'],
  'curriculum.game.phraseBuilder': ['Phrase builder', '詞組搭建', '词组搭建'],
  'curriculum.game.idiomMatch': ['Idiom match', '成語配對', '成语配对'],
  'curriculum.game.sentenceOrder': ['Sentence order', '句子排序', '句子排序'],
};
const themeNames: Record<string, [string, string, string]> = {
  daily: ['Everyday', '日常生活', '日常生活'], family: ['Family', '家人朋友', '家人朋友'], food: ['Food & drink', '吃喝', '吃喝'],
  leisure: ['Play & make', '休閒活動', '休闲活动'], world: ['Around me', '身邊世界', '身边世界'],
};
const levelNames: [string, string, string][] = [['Seedling', '小芽學徒', '小芽学徒'], ['Word explorer', '詞語探險家', '词语探险家'], ['Sentence builder', '短句小能手', '短句小能手'], ['Little reader', '漢語小讀者', '汉语小读者']];
const diffNames: Record<Reading['difficulty'], [string, string, string]> = { easy: ['Easy', '初階', '初阶'], intermediate: ['Intermediate', '中階', '中阶'], hard: ['Hard', '進階', '进阶'] };
const pick = (l: Language, v: [string, string, string]) => tr(l, ...v);

export default function CurriculumPage({ language: l, age }: { language: Language; age: string }) {
  const { isSignedIn, isLoaded, user } = useUser();
  const billing = useGetBillingStatus({ query: { enabled: isSignedIn ?? false, queryKey: [...getGetBillingStatusQueryKey(), user?.id], retry: false } });
  const premium = Boolean(isSignedIn && billing.data?.isPremium === true);

  return (
    <main className="page-shell">
      <section className="page-title">
        <div className="eyebrow">{tr(l, 'Curriculum', '學習課程', '学习课程')}</div>
        <h1>{tr(l, 'Four levels, earned one round at a time.', '四個階段，一輪一輪慢慢解鎖。', '四个阶段，一轮一轮慢慢解锁。')}</h1>
        <p>{tr(l, `Every correct answer earns ${XP_PER_CORRECT} XP. ${XP_PER_LEVEL} XP opens the next level.`, `每答對一題得 ${XP_PER_CORRECT} XP，累積 ${XP_PER_LEVEL} XP 開啟下一階段。`, `每答对一题得 ${XP_PER_CORRECT} XP，累积 ${XP_PER_LEVEL} XP 开启下一阶段。`)}</p>
      </section>
      {!isLoaded || (isSignedIn && billing.isLoading) ? (
        <div className="panel"><p className="panel-desc">{tr(l, 'Checking membership…', '正在查看會員狀態…', '正在查看会员状态…')}</p></div>
      ) : isSignedIn && billing.isError ? (
        <div className="alert"><p>{tr(l, 'We could not load membership.', '無法載入會員狀態。', '无法加载会员状态。')}</p><button className="button-secondary" onClick={() => billing.refetch()}><RotateCcw size={14} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div>
      ) : premium && user ? (
        <CurriculumBody key={user.id} uid={user.id} l={l} age={age} />
      ) : (
        <div className="panel" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="complete-mark"><LockKeyhole size={27} /></div>
          <h2>{tr(l, 'The curriculum is part of family membership', '學習課程屬於家庭會員內容', '学习课程属于家庭会员内容')}</h2>
          <p className="panel-desc">{tr(l, 'Free lessons stay open in the garden.', '免費課程仍可在樂園中使用。', '免费课程仍可在乐园中使用。')}</p>
          <div className="button-row" style={{ justifyContent: 'center' }}>
            <Show when="signed-out"><SignInButton mode="modal"><button className="button-secondary">{tr(l, 'Sign in', '登入', '登录')}</button></SignInButton></Show>
            <Link href="/parent" className="button-primary">{tr(l, 'See family membership', '看看家庭會員', '看看家庭会员')} <ArrowRight size={15} /></Link>
          </div>
        </div>
      )}
    </main>
  );
}

function CurriculumBody({ uid, l, age }: { uid: string; l: Language; age: string }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(uid));
  const [storageError, setStorageError] = useState(false);
  useEffect(() => { setStorageError(!saveProgress(uid, progress)); }, [uid, progress]);
  const unlocked = earnedLevel(progress.xp);
  const ageLevel = Math.max(1, ['2-4', '3-5', '6-8', '9-12'].indexOf(age) + 1);
  const [selected, setSelected] = useState(() => Math.min(ageLevel, unlocked));
  useEffect(() => { setSelected((s) => Math.min(s, unlocked)); }, [unlocked]);
  const level = Math.min(selected, unlocked);
  const def = curriculumLevels[level - 1];
  const levelXp = level < unlocked ? XP_PER_LEVEL : progress.xp - (level - 1) * XP_PER_LEVEL;

  const award = (roundId: string, correct: number) => {
    setProgress((prev) => {
      if (prev.awardedRounds.includes(roundId)) return prev;
      const next = { xp: Math.min(XP_PER_LEVEL * MAX_LEVEL, prev.xp + correct * XP_PER_CORRECT), awardedRounds: [...prev.awardedRounds, roundId].slice(-200) };
      return next;
    });
  };

  return (
    <>
      {storageError ? <div className="alert" role="alert">{tr(l, 'Progress cannot be saved in this browser. Enable browser storage before closing this page.', '此瀏覽器無法儲存進度，請在關閉頁面前啟用瀏覽器儲存空間。', '此浏览器无法保存进度，请在关闭页面前启用浏览器存储空间。')}</div> : null}
      <div className="cur-levels" role="group" aria-label="Levels">
        {curriculumLevels.map((lv) => {
          const locked = lv.level > unlocked;
          return (
            <button key={lv.level} className={`cur-level ${lv.level === level ? 'selected' : ''}`} disabled={locked} onClick={() => setSelected(lv.level)} data-testid={`level-${lv.level}`}>
              <span>{locked ? <LockKeyhole size={11} /> : lv.level < unlocked ? <Check size={11} /> : null} {tr(l, `Level ${lv.level}`, `第 ${lv.level} 階`, `第 ${lv.level} 阶`)} · {lv.age}</span>
              <strong>{pick(l, levelNames[lv.level - 1])}</strong>
            </button>
          );
        })}
      </div>
      {ageLevel > unlocked ? <p className="section-sub" style={{ marginTop: -12, marginBottom: 18 }}>{tr(l, `The selected age suggests level ${ageLevel}; it opens once earned through XP.`, `所選年齡建議第 ${ageLevel} 階，需累積 XP 才能開啟。`, `所选年龄建议第 ${ageLevel} 阶，需累积 XP 才能开启。`)}</p> : null}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="setting-name">{tr(l, 'Level progress', '階段進度', '阶段进度')} · {Math.max(0, levelXp)} / {XP_PER_LEVEL} XP · {tr(l, 'Total', '總計', '总计')} {progress.xp} XP</div>
        <div className="xp-bar"><span style={{ transform: `scaleX(${Math.max(0, levelXp) / XP_PER_LEVEL})` }} /></div>
      </div>
      <div className="cur-grid">
        <Game key={`${level}-${l}`} level={level} l={l} onSubmit={award} />
        <div>
          <section className="panel">
            <h2>{tr(l, 'Vocabulary', '詞彙', '词汇')}</h2>
            {def.themes.map((th) => (
              <div className="vocab-theme" key={th.id}>
                <h3>{pick(l, themeNames[th.id])}</h3>
                <div className="vocab-list">{th.items.map((it) => <button key={it.hanzi} className="vocab-chip" onClick={() => speak(hz(it, l), l)}><b>{hz(it, l)}</b>{it.pinyin} · {it.meaning}</button>)}</div>
              </div>
            ))}
            {def.sentences?.length ? <div className="vocab-theme"><h3>{tr(l, 'Sentences', '句子', '句子')}</h3>{def.sentences.map((s) => <p key={s.traditional} className="sentence-hanzi">{l === 'zh-Hans' ? s.simplified : s.traditional}</p>)}</div> : null}
          </section>
          {def.readings?.length ? <Readings readings={def.readings} l={l} /> : null}
        </div>
      </div>
    </>
  );
}

function Readings({ readings, l }: { readings: Reading[]; l: Language }) {
  const [diff, setDiff] = useState<Reading['difficulty']>('easy');
  const r = readings.find((x) => x.difficulty === diff) ?? readings[0];
  return (
    <article className="panel reading-card">
      <h2><BookOpen size={17} /> {r.title}</h2>
      <div className="diff-tabs">{readings.map((x) => <button key={x.difficulty} className={`filter-chip ${x.difficulty === diff ? 'selected' : ''}`} onClick={() => setDiff(x.difficulty)}>{pick(l, diffNames[x.difficulty])}</button>)}</div>
      <p className="reading-text">{r.text}</p>
      <button className="audio-button" style={{ margin: 0 }} onClick={() => speak(r.text, l)}><Volume2 size={14} /> {tr(l, 'Listen', '聽一聽', '听一听')}</button>
    </article>
  );
}

function Game({ level, l, onSubmit }: { level: number; l: Language; onSubmit: (roundId: string, correct: number) => void }) {
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildRound(level, l), [level, l, seed]);
  const roundId = useMemo(() => `${level}-${Date.now()}-${Math.random().toString(36).slice(2)}`, [level, seed]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const def = curriculumLevels[level - 1];
  const q = questions[idx];
  const done = idx >= questions.length;

  const reset = () => { setSeed((s) => s + 1); setIdx(0); setPicked(null); setBuilt([]); setCorrect(0); setSubmitted(false); };
  const answer = (value: string) => { if (picked || !q) return; setPicked(value); if (value === q.answer) setCorrect((c) => c + 1); };
  const next = () => { setIdx((i) => i + 1); setPicked(null); setBuilt([]); };
  const submit = () => { if (submitted) return; setSubmitted(true); onSubmit(roundId, correct); };

  return (
    <section className="practice-card quiz-card">
      <div className="practice-heading"><span className="practice-icon"><Sparkles size={18} /></span><div><div className="eyebrow">{def.gameKeys.map((k) => pick(l, gameNames[k])).join(' · ')}</div><h2>{pick(l, levelNames[level - 1])}</h2></div></div>
      {done ? (
        <div className="quiz-result">
          <div className="quiz-score">{correct}<span> / {questions.length}</span></div>
          <p>+{correct * XP_PER_CORRECT} XP</p>
          <div className="button-row" style={{ justifyContent: 'center' }}>
            {!submitted ? <button className="button-primary" onClick={submit} data-testid="button-submit-round">{tr(l, 'Submit round', '提交這一輪', '提交这一轮')} <Check size={14} /></button>
              : <button className="button-secondary" onClick={reset}><RotateCcw size={14} /> {tr(l, 'New round', '新的一輪', '新的一轮')}</button>}
          </div>
        </div>
      ) : q.kind === 'choice' ? (
        <>
          <div className="quiz-question">
            <span className="question-count">{idx + 1} / {questions.length}</span>
            {q.listen ? <button className="audio-button" style={{ margin: 0 }} onClick={() => speak(q.listen!, l)}><Volume2 size={15} /> {tr(l, 'Listen, then point', '聽一聽，再指出來', '听一听，再指出来')}</button> : <strong>{q.prompt}</strong>}
          </div>
          <div className="quiz-options">{q.options.map((o) => <button key={o} className={`quiz-option ${picked && o === q.answer ? 'correct' : picked === o ? 'incorrect' : ''}`} disabled={Boolean(picked)} onClick={() => answer(o)}>{o}</button>)}</div>
        </>
      ) : (
        <>
          <div className="quiz-question"><span className="question-count">{idx + 1} / {questions.length}</span><span>{tr(l, 'Tap the pieces in order', '依序點選句子片段', '依序点选句子片段')}</span></div>
          <div className="answer-line">{built.map((i) => q.chunks[i]).join('')}</div>
          <div className="chunk-row">{q.chunks.map((c, i) => <button key={i} className="quiz-option" style={{ fontSize: 16, padding: '0 10px' }} disabled={Boolean(picked) || built.includes(i)} onClick={() => {
            const nb = [...built, i]; setBuilt(nb);
            if (nb.length === q.chunks.length) answer(nb.map((j) => q.chunks[j]).join(''));
          }}>{c}</button>)}</div>
          {!picked && built.length ? <button className="text-next" style={{ margin: '0 auto' }} onClick={() => setBuilt([])}><RotateCcw size={12} /> {tr(l, 'Clear', '重來', '重来')}</button> : null}
        </>
      )}
      {!done && picked ? <div className={`quiz-feedback ${picked === q.answer ? 'good' : ''}`}>{picked === q.answer ? `+${XP_PER_CORRECT} XP` : `${tr(l, 'Answer', '答案', '答案')}: ${q.answer}`}<button className="text-next" onClick={next}>{tr(l, 'Next', '下一題', '下一题')} <ArrowRight size={13} /></button></div> : null}
    </section>
  );
}
