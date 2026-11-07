import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { ArrowLeft, ArrowRight, Apple, BookOpen, Check, ChevronRight, Compass, Flower2, Heart, Inbox, Leaf, LogOut, Menu, MessageCircle, ShieldAlert, UserX, PawPrint, Play, RotateCcw, Sparkles, Sprout, Volume2, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { AccountConsentBoundary } from '@/components/legal/account-consent-boundary';
import { clearAuthConsent } from '@/hooks/use-consent';
import { disclaimerName, privacyName } from '@/components/legal/consent-check';
import { MemberGate, MembershipPage } from '@/components/access-gate';
import { MembershipPanel } from '@/components/membership-panel';
import { useAccountAccess } from '@/hooks/use-account';
import AccountPage from '@/pages/account';
import MessagesPage from '@/pages/messages';
import { StagePicker } from '@/components/playground/stage-picker';
import { StagePathCards } from '@/components/stage-path-cards';
import { StagePathPlayer } from '@/components/stage-path-player';
import { DailyChallengeCard } from '@/components/playground/daily-challenge-card';
import { ParentChildBookSection } from '@/components/parent-child-book-section';
import { TranslationLookup } from '@/components/translation-lookup';
import { useLearningProgress, useLegacyProgressMigration, usePendingRoundSync, useMembership, useIssueLearningRound, useRecordRound, useSelectStage, XP_COMPLETE, XP_PER_CORRECT } from '@/hooks/use-learning';
import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth';
import FreeReadingPage from '@/pages/free-reading';
import DisclaimerPage from '@/pages/disclaimer';
import PlaygroundPage, { WordBankPage } from '@/pages/playground';
import PrivacyPage from '@/pages/privacy';
import { categories, categoryNames, copy, GardenLesson, Language, lessons, levels } from '@/lib/garden-data';
import type { LearningQuestion, LearningRoundInput } from '@workspace/api-client-react';
import { pick, playgroundName, stageLabel, stageNames, tr } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech } from '@/lib/speech';
import { ageStages, freeReadings, normalizeAgeStage } from '@/lib/age-stages';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  (import.meta.env.PROD ? '/api/__clerk' : undefined);
if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the web runtime.');
}
const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'zh-Hans', label: '简体中文' },
];
const signOutLabels: Record<Language, string> = {
  en: 'Sign out',
  'zh-Hant': '登出',
  'zh-Hans': '退出登录',
};
const themes = [
  { id: 'meadow', name: 'Meadow', color: '#5b8a61' },
  { id: 'terracotta', name: 'Terracotta', color: '#bf704f' },
  { id: 'ocean', name: 'Tidepool', color: '#4e8790' },
  { id: 'lavender', name: 'Wisteria', color: '#8873a3' },
  { id: 'sunshine', name: 'Sunlit', color: '#bd9239' },
] as const;
const icons = { message: MessageCircle, apple: Apple, paw: PawPrint, heart: Heart, compass: Compass };
type ThemeId = 'meadow' | 'terracotta' | 'ocean' | 'lavender' | 'sunshine';

function usePreferences() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('mg-language') as Language) || 'en');
  const [theme, setTheme] = useState<ThemeId>(() => (localStorage.getItem('mg-theme') as ThemeId) || 'meadow');
  const [age, setAge] = useState(() => normalizeAgeStage(localStorage.getItem('mg-age')));
  useEffect(() => { localStorage.setItem('mg-age', age); }, [age]);
  const saveLanguage = (value: Language) => { localStorage.setItem('mg-language', value); setLanguage(value); };
  const saveTheme = (value: ThemeId) => { localStorage.setItem('mg-theme', value); setTheme(value); };
  const saveAge = (value: string) => { setAge(normalizeAgeStage(value)); };
  return { language, theme, age, saveLanguage, saveTheme, saveAge };
}

function App() {
  const content = (
    <QueryClientProvider client={queryClient}>
      <Garden />
    </QueryClientProvider>
  );
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} signInUrl="/sign-in" signUpUrl="/register">{content}</ClerkProvider>;
}

function SignOutControl({ label, className }: { label: string; className: string }) {
  const { signOut } = useClerk();
  return <button type="button" className={className} aria-label={label} title={label} onClick={() => { clearAuthConsent(); void signOut({ redirectUrl: '/' }); }}><LogOut size={15} /></button>;
}

export const tagline: Record<Language, string> = {
  en: 'Make learning Mandarin easier every day',
  'zh-Hant': '讓每天學習漢語更輕鬆',
  'zh-Hans': '让每天学习汉语更轻松',
};

function useUserScopedCache() {
  const { user, isLoaded } = useUser();
  const client = useQueryClient();
  const prev = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!isLoaded) return;
    const id = user?.id ?? null;
    if (prev.current !== undefined && prev.current !== id) client.clear();
    prev.current = id;
  }, [isLoaded, user?.id, client]);
}

function Garden() {
  const preferences = usePreferences();
  useUserScopedCache();
  const l = preferences.language;
  useEffect(() => { document.documentElement.lang = l; }, [l]);
  const t = copy[l];
  const [path] = useLocation();
  const [category, setCategory] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const freeLessons = useMemo(() => lessons.filter((lesson) => !lesson.premium), []);
  const filterLessons = useMemo(() => category === 'all' ? freeLessons : freeLessons.filter((lesson) => lesson.category === category), [category, freeLessons]);
  const shellClass = `garden-app theme-${preferences.theme}`;
  const close = () => setMenuOpen(false);
  const guarded = (node: ReactNode) => <AccountConsentBoundary language={l}><MemberGate l={l}><LegacySync l={l} />{node}</MemberGate></AccountConsentBoundary>;
  const access = useAccountAccess();

  return (
    <div className={shellClass} lang={l}>
      <div className="page-shell">
        <header className="topbar">
          <Link href="/" className="brand" data-testid="link-home">
            <span className="brand-mark"><Sprout size={23} strokeWidth={1.9} /></span>
            <span className="brand-text"><span>漢語樂園 Mandarin Garden</span><small className="brand-tagline">{tagline[l]}</small></span>
          </Link>
          <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} onClick={close}>{t.navHome}</Link>
            <a className="nav-link" href="/#lessons" onClick={close}>{t.navWords}</a>
            <Link href="/playground" className={`nav-link ${path === '/playground' || path === '/curriculum' ? 'active' : ''}`} onClick={close} data-testid="link-playground">{playgroundName[l]}</Link>
            <Link href="/parent" className={`nav-link ${path === '/parent' ? 'active' : ''}`} onClick={close}>{t.navParent}</Link>
            {access.isSignedIn ? <Link href="/messages" className={`nav-link ${path === '/messages' ? 'active' : ''}`} onClick={close} data-testid="link-nav-messages">{tr(l, 'Messages', '訊息', '消息')}</Link> : null}
            {access.isAdmin ? <Link href="/admin/messages" className={`nav-link ${path === '/admin/messages' ? 'active' : ''}`} onClick={close} data-testid="link-nav-admin">{tr(l, 'Team inbox', '團隊收件匣', '团队收件箱')}</Link> : null}
          </nav>
          <div className="top-actions">
            <select className="language-select" aria-label="Interface language" value={l} onChange={(event) => preferences.saveLanguage(event.target.value as Language)} data-testid="select-language">
              {languages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
            <div className="auth-slot"><Show when="signed-in"><SignOutControl label={signOutLabels[l]} className="avatar-button" /></Show><Show when="signed-out"><Link href="/sign-in" className="avatar-button" aria-label={t.signIn} title={t.signIn} data-testid="button-sign-in"><ArrowRight size={16} /></Link></Show></div>
            <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} data-testid="button-menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </header>
      </div>
      <ErrorBoundary resetKey={path}>
        <Switch>
          <Route path="/privacy"><PrivacyPage language={l} /></Route>
          <Route path="/disclaimer"><DisclaimerPage language={l} /></Route>
          <Route path="/reading/:age"><FreeReadingPage language={l} /></Route>
          <Route path="/sign-in/*?"><AuthPage key="sign-in" mode="sign-in" language={l} /></Route>
          <Route path="/register/*?"><AuthPage key="register" mode="register" language={l} /></Route>
          <Route path="/membership"><AccountConsentBoundary language={l}><MembershipPage l={l} /></AccountConsentBoundary></Route>
          <Route path="/messages"><MessagesPage language={l} /></Route>
          <Route path="/admin/messages"><MessagesPage language={l} admin /></Route>
          <Route path="/account"><AccountPage language={l} /></Route>
          <Route path="/">{guarded(<HomePage language={l} t={t} age={preferences.age} onAgeChange={preferences.saveAge} lessonsToShow={filterLessons} category={category} setCategory={setCategory} />)}</Route>
          <Route path="/lesson/:lessonId">{guarded(<LessonPage language={l} t={t} />)}</Route>
          <Route path="/playground/words">{guarded(<WordBankPage language={l} />)}</Route>
          <Route path="/playground">{guarded(<PlaygroundPage language={l} />)}</Route>
          <Route path="/curriculum">{guarded(<PlaygroundPage language={l} />)}</Route>
          <Route path="/parent">{guarded(<ParentPage preferences={preferences} t={t} />)}</Route>
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
      <div className="page-shell">
        <footer className="footer">
          <span>© 漢語樂園 Mandarin Garden</span>
          <PwaInstallButton language={l} />
          <nav className="footer-legal" aria-label="Legal">
            <Link href="/privacy" data-testid="link-footer-privacy">{privacyName(l)}</Link>
            <Link href="/disclaimer" data-testid="link-footer-disclaimer">{disclaimerName(l)}</Link>
          </nav>
          <span>{tagline.en} · 讓每天學習漢語更輕鬆 · 让每天学习汉语更轻松</span>
        </footer>
      </div>
    </div>
  );
}

/** Recover account-owned browser progress only after membership and consent checks. */
function LegacySync({ l }: { l: Language }) {
  const m = useMembership();
  const progress = useLearningProgress(m.uid, m.premium);
  const legacy = useLegacyProgressMigration(m.uid, progress.progress, m.premium);
  const rounds = usePendingRoundSync(m.uid, m.premium);
  if (!legacy.error && !rounds.error && !rounds.pending) return null;
  return <div className="page-shell"><div className="alert" role="status" data-testid="status-progress-sync">
    {tr(l, 'Some progress is still stored in this browser. Keep it here until account sync finishes.', '部分進度仍儲存在此瀏覽器。請保留，直至帳戶同步完成。', '部分进度仍保存在此浏览器。请保留，直至账户同步完成。')}
    <button className="text-next" onClick={() => { legacy.retry(); rounds.retry(); }} data-testid="button-retry-progress-sync">{tr(l, 'Sync now', '立即同步', '立即同步')}</button>
  </div></div>;
}


type Copy = typeof copy.en;
function HomePage({ language, t, age, onAgeChange, lessonsToShow, category, setCategory }: { language: Language; t: Copy; age: string; onAgeChange: (value: string) => void; lessonsToShow: GardenLesson[]; category: string; setCategory: (value: string) => void }) {
  const recommendedLevel = ageStages.indexOf(normalizeAgeStage(age));
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="reveal">
          <div className="eyebrow"><Flower2 size={14} /> {t.welcome}</div>
          <h1>{t.headline}</h1>
          <p className="hero-copy">{t.intro}</p>
          <div className="button-row">
            <Link href="/lesson/greetings" className="button-primary">{t.start} <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-note"><Sparkles size={14} /> {t.today}</div>
        </div>
        <div className="hero-art" data-age-stage={normalizeAgeStage(age)}>
          <img className="hero-flower-image" src={`/images/mandarin-cosmos-${normalizeAgeStage(age)}.png`} alt={tr(language, `Cosmos flower growing for ${t.levelAges[recommendedLevel]}`, `${t.levelAges[recommendedLevel]}成長階段的波斯菊`, `${t.levelAges[recommendedLevel]}成长阶段的波斯菊`)} width="480" height="390" fetchPriority="high" />
        </div>
      </section>
      <TranslationLookup language={language} />
      <section id="lessons" className="reveal">
        <div className="section-head">
          <div><div className="eyebrow">{t.category}</div><h2>{t.lessons}</h2><p className="section-sub">{t.lessonsHint}</p></div>
          <span className="status-pill">{t.minutes}</span>
        </div>
        <div className="filter-row" role="group" aria-label={tr(language, 'Filter learning activities', '篩選學習內容', '筛选学习内容')}>
          {categories.filter((item) => item === 'all' || lessons.some((lesson) => !lesson.premium && lesson.category === item)).map((item) => <button key={item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} data-testid={`filter-${item}`}>{categoryNames[language][item]}</button>)}
        </div>
        <div className="lesson-grid">
          {lessonsToShow.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} language={language} t={t} />)}
        </div>
        <div className="home-pinyin-placement">
          <PinyinMatchCard key={normalizeAgeStage(age)} language={language} age={age} onAgeChange={onAgeChange} />
        </div>
      </section>
      <StagePathCards l={language} />
      <PracticeSection language={language} age={age} onAgeChange={onAgeChange} />
      <ParentChildBookSection language={language} age={age} />
      <section className="progress-band">
        <div>
          <div className="eyebrow">{t.path}</div>
          <h2 className="progress-title">{t.path}</h2>
          <p className="progress-desc">{t.pathHint}</p>
        </div>
        <div className="level-track">
          {levels.map((level, index) => (
            <div className="level-item" key={level.age}>
              <div className={`level-node ${index === recommendedLevel ? 'active' : ''}`}>{index + 1}</div>
              <div className="level-caption">{t.levelAges[index]}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


function PracticeSection({ language, age, onAgeChange }: { language: Language; age: string; onAgeChange: (value: string) => void }) {
  const reading = freeReadings[normalizeAgeStage(age)];
  return (
    <section className="practice-grid reading-section">
      <article className="practice-card reading-card" data-testid="free-reading-card">
        <label className="setting-name" htmlFor="free-reading-age">{tr(language, 'Reading age group', '閱讀年齡階段', '阅读年龄阶段')}</label>
        <select id="free-reading-age" className="select-control" value={normalizeAgeStage(age)} onChange={(event) => onAgeChange(event.target.value)} data-testid="select-reading-age">
          {ageStages.map((value, index) => <option key={value} value={value}>{copy[language].levelAges[index]}</option>)}
        </select>
        <Link href={`/reading/${normalizeAgeStage(age)}`} className="free-reading-link" data-testid="link-free-reading">
          <div className="practice-heading"><span className="practice-icon reading-icon"><BookOpen size={18} /></span><div><div className="eyebrow">{language === 'en' ? 'A LITTLE READING' : language === 'zh-Hant' ? '讀一小段' : '读一小段'}</div><h2>{reading.title[language]}</h2></div></div>
          <p className="reading-text">{reading.text[language]}</p>
          <div className="reading-meta"><span>{copy[language].levelAges[ageStages.indexOf(normalizeAgeStage(age))]} · {tr(language, 'Free reading', '免費閱讀', '免费阅读')}</span><span>{reading.minutes} {tr(language, 'min', '分鐘', '分钟')}</span></div>
          <span className="button-secondary free-reading-open">{tr(language, 'Read and listen', '閱讀並聆聽', '阅读并聆听')} <ArrowRight size={14} /></span>
        </Link>
      </article>
    </section>
  );
}

function PinyinMatchCard({ language, age, onAgeChange }: { language: Language; age: string; onAgeChange: (value: string) => void }) {
  const membership = useMembership();
  if (!membership.premium) return <DailyChallengeCard language={language} age={age} onAgeChange={onAgeChange} />;
  return <PremiumPinyinMatchCard language={language} age={age} onAgeChange={onAgeChange} membership={membership} />;
}

function PremiumPinyinMatchCard({ language, age, onAgeChange, membership }: { language: Language; age: string; onAgeChange: (value: string) => void; membership: ReturnType<typeof useMembership> }) {
  const stage = ageStages.indexOf(normalizeAgeStage(age)) + 1;
  const { replay } = useRecordRound(membership.uid);
  const { issue } = useIssueLearningRound(membership.uid);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(0);
  const [challenge, setChallenge] = useState<Awaited<ReturnType<typeof issue>> | null>(null);
  const [issueFailed, setIssueFailed] = useState(false);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState(0);
  const [failedAnswers, setFailedAnswers] = useState<LearningRoundInput[]>([]);
  const replayRef = useRef(replay);
  replayRef.current = replay;
  const issueRef = useRef(issue);
  issueRef.current = issue;
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const savingIds = useRef(new Set<string>());
  const activeRoundId = challenge?.roundId ?? '';
  const activeRoundIdRef = useRef(activeRoundId);
  activeRoundIdRef.current = activeRoundId;
  const saveState = pendingSaves > 0 ? 'saving' : failedAnswers.length ? 'error' : savedAnswers > 0 ? 'saved' : 'idle';
  useEffect(() => {
    setRound(0);
    setPicked(null);
    setScore(0);
    setSavedAnswers(0);
    setChallenge(null);
    setIssueFailed(false);
  }, [stage, seed]);
  useEffect(() => {
    if (!membership.premium || !membership.uid) return;
    let cancelled = false;
    setChallenge(null);
    setIssueFailed(false);
    void issueRef.current({ stage, mode: 'match', script: scriptFor(language) }).then((issued) => {
      if (!cancelled) setChallenge(issued);
    }).catch(() => {
      if (!cancelled) setIssueFailed(true);
    });
    return () => { cancelled = true; };
  }, [stage, seed, membership.premium, membership.uid, language]);
  const issuedQuestion: LearningQuestion | undefined = challenge?.questions[round];
  const premiumCurrent = issuedQuestion?.kind === 'choice' && issuedQuestion.word ? {
    id: issuedQuestion.id,
    hanzi: issuedQuestion.word.trad,
    simplified: issuedQuestion.word.simp,
    pinyin: issuedQuestion.word.pinyin,
    correctOption: scriptFor(language) === 'simp' ? issuedQuestion.word.simp : issuedQuestion.word.trad,
  } : undefined;
  const current = premiumCurrent;
  const choices = issuedQuestion?.options?.map((value) => ({ id: value, hanzi: value, simplified: value })) ?? [];
  const gameLength = challenge?.questions.length ?? 5;
  const finished = Boolean(challenge && round >= challenge.questions.length);
  const saveAnswer = (input: LearningRoundInput, ownerRoundId: string) => {
    if (savingIds.current.has(input.questionId)) return;
    savingIds.current.add(input.questionId);
    setPendingSaves((count) => count + 1);
    const request = saveQueue.current.then(async () => { await replayRef.current(input); });
    saveQueue.current = request.then(() => undefined, () => undefined);
    const finishSave = () => {
      savingIds.current.delete(input.questionId);
      setPendingSaves((count) => Math.max(0, count - 1));
    };
    void request.then(
      () => {
        if (activeRoundIdRef.current === ownerRoundId) setSavedAnswers((count) => count + 1);
        setFailedAnswers((items) => items.filter((item) => item.questionId !== input.questionId));
        finishSave();
      },
      () => {
        if (activeRoundIdRef.current === ownerRoundId) {
          setFailedAnswers((items) => items.some((item) => item.questionId === input.questionId) ? items : [...items, input]);
        }
        finishSave();
      },
    );
  };
  const retryFailedAnswers = () => {
    for (const input of failedAnswers) saveAnswer(input, activeRoundIdRef.current);
  };
  const select = (id: string) => {
    if (picked || !current) return;
    setPicked(id);
    const correctOption = membership.premium && premiumCurrent ? premiumCurrent.correctOption : current.id;
    if (id === correctOption) {
      setScore((value) => value + 1);
      if (membership.premium && membership.uid && challenge && issuedQuestion) {
        saveAnswer({
          roundId: challenge.roundId,
          questionId: issuedQuestion.id,
          answer: id,
        }, activeRoundId);
      }
    }
  };
  const advance = () => { setRound((value) => value + 1); setPicked(null); };
  const restart = () => { setRound(0); setPicked(null); setScore(0); setSavedAnswers(0); setSeed((value) => value + 1); };
  return (
    <section className="practice-card quiz-card home-pinyin-card" data-testid="home-pinyin-match">
        <div className="practice-heading"><span className="practice-icon"><Sparkles size={18} /></span><div><div className="eyebrow">{language === 'en' ? 'PLAY & REMEMBER' : language === 'zh-Hant' ? '玩一玩，記得更牢' : '玩一玩，记得更牢'}</div><h2>{language === 'en' ? 'A tiny pinyin match' : language === 'zh-Hant' ? '拼音小配對' : '拼音小配对'}</h2></div></div>
        <label className="pinyin-stage-picker" htmlFor="pinyin-age-stage">
          <span>{tr(language, 'Choose an age stage', '選擇年齡階段', '选择年龄阶段')}</span>
          <select id="pinyin-age-stage" className="select-control" value={normalizeAgeStage(age)} onChange={(event) => onAgeChange(event.target.value)}>
            {ageStages.map((stage, index) => <option key={stage} value={stage}>{copy[language].levelAges[index]}</option>)}
          </select>
        </label>
        {membership.premium && !challenge ? (
          <div role="status">{issueFailed
            ? <>{tr(language, 'This round could not start.', '目前無法開始新的一輪。', '目前无法开始新的一轮。')} <button className="text-next" onClick={restart}>{language === 'en' ? 'Retry' : language === 'zh-Hant' ? '重試' : '重试'}</button></>
            : tr(language, 'Preparing your questions…', '正在準備題目…', '正在准备题目…')}</div>
        ) : null}
        {finished ? (
          <div className="quiz-result"><div className="quiz-score">{score}<span> / {gameLength}</span></div><p className="round-xp">+{score * XP_PER_CORRECT} XP</p><p>{language === 'en' ? 'Lovely work. Every try helps a word take root.' : language === 'zh-Hant' ? '做得真好，每一次練習都讓詞語更熟悉。' : '做得真好，每一次练习都让词语更熟悉。'}</p>{saveState === 'saving' ? <p role="status">{language === 'en' ? 'Saving XP…' : language === 'zh-Hant' ? '正在儲存 XP…' : '正在保存 XP…'}</p> : null}{saveState === 'saved' ? <p role="status">{language === 'en' ? 'XP saved to this stage.' : language === 'zh-Hant' ? 'XP 已儲存到此階段。' : 'XP 已保存到此阶段。'}</p> : null}{saveState === 'error' ? <p role="alert">{language === 'en' ? 'Some XP could not be saved.' : language === 'zh-Hant' ? '部分 XP 未能儲存。' : '部分 XP 未能保存。'} <button className="text-next" onClick={retryFailedAnswers}>{language === 'en' ? 'Retry' : language === 'zh-Hant' ? '重試' : '重试'}</button></p> : null}<button className="button-secondary" onClick={restart}><RotateCcw size={14} /> {language === 'en' ? 'Play again' : language === 'zh-Hant' ? '再玩一輪' : '再玩一轮'}</button></div>
        ) : current ? (
          <>
            <div className="quiz-question">
              <span className="question-count">{language === 'en' ? `WORD ${round + 1} OF ${gameLength}` : language === 'zh-Hant' ? `第 ${round + 1} 個詞語 · 共 ${gameLength} 個` : `第 ${round + 1} 个词语 · 共 ${gameLength} 个`}</span>
              <strong>{current.pinyin}</strong>
              <span>{language === 'en' ? 'Find the matching characters' : language === 'zh-Hant' ? '找出相配的漢字' : '找出相配的汉字'}</span>
            </div>
            <div className="quiz-options">
              {choices.map((choice) => <button key={choice.id} className={`quiz-option ${picked === choice.id ? choice.id === (premiumCurrent?.correctOption ?? current.id) ? 'correct' : 'incorrect' : ''} ${picked && choice.id === (premiumCurrent?.correctOption ?? current.id) ? 'correct' : ''}`} onClick={() => select(choice.id)} disabled={Boolean(picked)}>{language === 'zh-Hans' ? choice.simplified : choice.hanzi}</button>)}
            </div>
            {picked ? <div className={`quiz-feedback ${picked === (premiumCurrent?.correctOption ?? current.id) ? 'good' : ''}`}>{picked === (premiumCurrent?.correctOption ?? current.id) ? `${language === 'en' ? 'That’s the one.' : language === 'zh-Hant' ? '答對了！' : '答对了！'}${membership.premium ? ` +${XP_PER_CORRECT} XP` : ''}` : (language === 'en' ? `This one is ${current.hanzi}.` : `答案是 ${language === 'zh-Hans' ? current.simplified : current.hanzi}。`)}{membership.premium && saveState === 'saving' ? <span role="status"> · {language === 'en' ? 'Saving…' : language === 'zh-Hant' ? '儲存中…' : '保存中…'}</span> : null} <button className="text-next" onClick={advance}>{round === gameLength - 1 ? (language === 'en' ? 'See results' : language === 'zh-Hant' ? '看結果' : '看结果') : (language === 'en' ? 'Next word' : language === 'zh-Hant' ? '下一個詞語' : '下一个词语')} <ArrowRight size={13} /></button></div> : null}
          </>
        ) : null}
    </section>
  );
}

function LessonCard({ lesson, language, t }: { lesson: GardenLesson; language: Language; t: Copy }) {
  const Icon = icons[lesson.icon as keyof typeof icons] || BookOpen;
  return (
    <Link href={`/lesson/${lesson.id}`} className="lesson-card" style={{ '--card-tint': '#e9f0e2' } as CSSProperties} aria-label={`${lesson.title[language]} · ${tr(language, 'Open learning activity', '開始學習', '开始学习')}`} data-testid={`card-lesson-${lesson.id}`}>
      <div className="lesson-top"><span className="lesson-icon"><Icon size={20} strokeWidth={1.7} /></span><span className="premium-label">{t.free}</span></div>
      <h3 className="lesson-title">{lesson.title[language]}</h3>
      <p className="lesson-description">{lesson.subtitle[language]}</p>
      <div className="lesson-bottom"><span>{lesson.words.length} {t.learn}</span><strong aria-hidden="true"><ArrowRight size={12} /></strong></div>
    </Link>
  );
}

function LessonPage({ language, t }: { language: Language; t: Copy }) {
  const { lessonId } = useParams<{ lessonId: string }>();
  const pathMatch = /^stage-path-(\d+)$/.exec(lessonId ?? '');
  if (pathMatch) return <StagePathPlayer packIndex={Number(pathMatch[1])} l={language} />;
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return <main className="page-shell not-found"><h1>{tr(language, 'That path is not here.', '找不到這條小徑。', '找不到这条小径。')}</h1><Link href="/" className="button-primary">{t.back}</Link></main>;
  if (lesson.premium) {
    return (
      <main className="page-shell"><div className="lesson-page">
        <Link href="/" className="button-secondary back-chip"><ArrowLeft size={14} /> {t.back}</Link>
        <div className="lesson-player locked-panel" style={{ marginTop: 18 }}>
          <div className="complete-mark"><Sprout size={27} /></div>
          <h1 className="locked-title">{tr(language, 'This lesson has moved into the Learning playground', '這堂課已移到學習樂園', '这堂课已移到学习乐园')}</h1>
          <p className="section-sub">{tr(language, 'Member word paths now come from the stage you choose for your child.', '會員詞語小徑現在依您為孩子選擇的階段而定。', '会员词语小径现在依您为孩子选择的阶段而定。')}</p>
          <Link href="/playground" className="button-primary" data-testid="link-moved-playground">{playgroundName[language]} <ArrowRight size={16} /></Link>
        </div>
      </div></main>
    );
  }
  return <FreeLesson key={lesson.id} lesson={lesson} language={language} t={t} />;
}

function FreeLesson({ lesson, language, t }: { lesson: GardenLesson; language: Language; t: Copy }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const script = scriptFor(language);
  useEffect(() => () => stopSpeech(), []);
  const word = lesson.words[index];
  const next = () => { if (index < lesson.words.length - 1) setIndex((value) => value + 1); else setDone(true); };
  return (
    <main className="page-shell">
      <div className="lesson-page">
        <Link href="/" className="button-secondary back-chip"><ArrowLeft size={14} /> {t.back}</Link>
        <div className="lesson-player" style={{ marginTop: 18 }}>
          <div className="player-head"><span>{lesson.title[language]} · {done ? lesson.words.length : index + 1} / {lesson.words.length}</span><Link href="/" className="icon-button" aria-label={t.back}><X size={17} /></Link></div>
          <div className="player-progress"><span style={{ width: `${done ? 100 : ((index + 1) / lesson.words.length) * 100}%` }} /></div>
          {done ? (
            <div className="complete-panel">
              <div className="complete-mark"><Check size={32} /></div>
              <h2>{t.complete}</h2><p className="section-sub">{t.completeHint}</p>
              <div className="button-row" style={{ justifyContent: 'center', marginTop: 22 }}>
                <button className="button-secondary" onClick={() => { setIndex(0); setDone(false); }}><RotateCcw size={15} /> {t.minutes}</button>
                <Link href="/" className="button-primary">{t.return} <ArrowRight size={15} /></Link>
              </div>
            </div>
          ) : (
            <>
              <div className="word-card">
                <div className="word-meaning">{word.meaning[language]}</div>
                <div className="word-hanzi">{script === 'simp' ? word.simplified : word.hanzi}</div>
                <div className="word-pinyin">{word.pinyin}</div>
                <button className="audio-button" onClick={() => speakMandarin(script === 'simp' ? word.simplified : word.hanzi, script)} data-testid="button-listen"><Volume2 size={15} /> {t.listen}</button>
              </div>
              <div className="sentence-box">
                <div className="sentence-label">{t.sentence}</div>
                <div className="sentence-hanzi">{script === 'simp' ? word.sentenceSimplified : word.sentence}</div>
                <div className="sentence-pinyin">{word.sentencePinyin}</div>
                <button className="audio-button" style={{ margin: '12px 0 0', padding: '8px 12px' }} onClick={() => speakMandarin(script === 'simp' ? word.sentenceSimplified : word.sentence, script)}><Play size={12} /> {t.listen}</button>
              </div>
              <div className="player-actions">
                <span className="section-sub" style={{ margin: 0 }}>{t.word} {index + 1} / {lesson.words.length}</span>
                <button className="button-primary" onClick={next} data-testid="button-next-word">{index === lesson.words.length - 1 ? t.finish : t.next} <ArrowRight size={15} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function ParentStagePanel({ l }: { l: Language }) {
  const m = useMembership();
  const progress = useLearningProgress(m.uid, m.isSignedIn);
  const stageSelect = useSelectStage(m.uid);
  const [selectError, setSelectError] = useState(false);
  if (!m.isSignedIn) return null;
  const p = progress.progress;
  return (
    <section className="panel" data-testid="panel-stage">
      <h2>{playgroundName[l]}</h2>
      <p className="panel-desc">{m.premium
        ? tr(l, `Pick any stage, in any order. ${XP_COMPLETE} XP completes a stage; XP keeps growing after that.`, `任選一個階段，不必依序。累積 ${XP_COMPLETE} XP 即完成，之後仍會繼續累積。`, `任选一个阶段，不必依序。累积 ${XP_COMPLETE} XP 即完成，之后仍会继续累积。`)
        : tr(l, 'Saved progress is shown below. Family membership lets you choose stages and keep playing.', '以下是已儲存的進度。加入家庭會員即可選擇階段並繼續練習。', '以下是已保存的进度。加入家庭会员即可选择阶段并继续练习。')}</p>
      {m.checking || progress.isLoading ? <div className="stage-picker">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-block" style={{ height: 120 }} />)}</div>
        : progress.isError || !p ? <div className="alert" role="alert"><p>{tr(l, 'We could not load learning progress.', '無法載入學習進度。', '无法加载学习进度。')}</p><button className="button-secondary" onClick={() => void progress.refetch()} data-testid="button-retry-parent-progress">{tr(l, 'Try again', '再試一次', '再试一次')}</button></div>
        : (
          <>
            <div className="stage-summary">
              <div><span>{tr(l, 'Selected stage', '目前階段', '当前阶段')}</span><strong data-testid="text-selected-stage">{stageLabel(l, p.selectedStage)} · {pick(l, stageNames[p.selectedStage - 1])}</strong></div>
              <div><span>{tr(l, 'Total XP', '總經驗值', '总经验值')}</span><strong data-testid="text-total-xp">{p.totalXp}</strong></div>
              <div><span>{tr(l, 'Stages complete', '已完成階段', '已完成阶段')}</span><strong data-testid="text-stages-complete">{p.xpByStage.filter((x) => x >= XP_COMPLETE).length} / 4</strong></div>
            </div>
            <StagePicker progress={p} l={l} onSelect={m.premium ? (s) => { if (s === p.selectedStage) return; setSelectError(false); stageSelect.select(s, { onError: () => setSelectError(true) }); } : undefined} pendingStage={stageSelect.pendingStage} disabled={!m.premium || stageSelect.isPending} />
            {selectError ? <div className="alert" role="alert">{tr(l, 'The stage could not be changed. Please try again.', '未能切換階段，請再試一次。', '未能切换阶段，请再试一次。')}</div> : null}
            {m.premium ? <Link href="/playground" className="button-secondary" style={{ marginTop: 14 }} data-testid="link-parent-playground">{tr(l, 'Open the playground', '前往學習樂園', '前往学习乐园')} <ArrowRight size={14} /></Link> : null}
          </>
        )}
    </section>
  );
}

function ParentPage({ preferences, t }: { preferences: ReturnType<typeof usePreferences>; t: Copy }) {
  const l = preferences.language;
  const { user } = useUser();
  const access = useAccountAccess();
  return (
    <main className="page-shell">
      <section className="page-title">
        <div className="eyebrow">{t.navParent}</div>
        <h1>{t.parentTitle}</h1><p>{t.parentSubtitle}</p>
      </section>
      <div className="parent-grid">
        <div>
          <ParentStagePanel l={l} />
          <section className="panel">
            <h2>{t.interface}</h2><p className="panel-desc">{t.interfaceHint}</p>
            <div className="setting-row"><div><div className="setting-name">{t.interface}</div><div className="setting-detail">{languages.find((x) => x.value === l)?.label}</div></div>
              <select className="select-control" value={l} onChange={(event) => preferences.saveLanguage(event.target.value as Language)} aria-label={t.interface} data-testid="parent-language">
                {languages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="setting-row"><div><div className="setting-name">{tr(l, 'Child’s age', '孩子年齡', '孩子年龄')}</div><div className="setting-detail">{tr(l, 'Used for the free reading card. Stages are chosen above.', '用於免費閱讀卡片，學習階段請在上方選擇。', '用于免费阅读卡片，学习阶段请在上方选择。')}</div></div>
              <select className="select-control" value={preferences.age} onChange={(event) => preferences.saveAge(event.target.value)} aria-label={t.age} data-testid="parent-age">
                {ageStages.map((item, index) => <option key={item} value={item}>{t.levelAges[index]}</option>)}
              </select>
            </div>
            <div className="setting-row"><div><div className="setting-name">{t.theme}</div><div className="setting-detail">{themes.find((item) => item.id === preferences.theme)?.name}</div></div>
              <div className="theme-picker">{themes.map((item) => <button key={item.id} className={`theme-swatch ${preferences.theme === item.id ? 'selected' : ''}`} style={{ background: item.color }} aria-label={item.name} aria-pressed={preferences.theme === item.id} onClick={() => preferences.saveTheme(item.id)} data-testid={`theme-${item.id}`} />)}</div>
            </div>
          </section>
          <section className="panel">
            <h2>{t.account}</h2>
            <Show when="signed-in">
              <div className="setting-row"><div>
                <div className="setting-name">{access.isAdmin ? tr(l, 'Management account', '管理團隊帳戶', '管理团队账户') : user?.fullName || user?.primaryEmailAddress?.emailAddress}</div>
                {!access.isAdmin ? <div className="setting-detail">{user?.primaryEmailAddress?.emailAddress}</div> : null}
              </div><SignOutControl label={signOutLabels[l]} className="button-secondary" /></div>
            </Show>
            <Show when="signed-out">
              <p className="panel-desc">{t.signedOut}</p>
              <div className="button-row"><Link href="/sign-in" className="button-secondary" data-testid="link-parent-sign-in">{t.signIn}</Link><Link href="/register" className="button-primary" data-testid="link-parent-register">{t.signUp}</Link></div>
            </Show>
          </section>
        </div>
        <aside>
          <MembershipPanel l={l} />
          <Show when="signed-in">
            <section className="panel help-panel" data-testid="panel-parent-help">
              <h2>{tr(l, 'Help and account', '協助與帳戶', '协助与账户')}</h2>
              <p className="panel-desc">{tr(l, 'Write to the team, or manage and delete your account.', '聯絡團隊，或管理、刪除您的帳戶。', '联系团队，或管理、删除您的账户。')}</p>
              <div className="entry-links">
                <Link href="/messages" className="entry-link" data-testid="link-parent-messages"><MessageCircle size={16} /><span>{tr(l, 'Messages with the team', '與團隊的訊息', '与团队的消息')}</span><ChevronRight size={14} /></Link>
                <Link href="/account" className="entry-link" data-testid="link-parent-account"><UserX size={16} /><span>{tr(l, 'Account and deletion', '帳戶與刪除', '账户与删除')}</span><ChevronRight size={14} /></Link>
                {access.isAdmin ? <Link href="/admin/messages" className="entry-link admin" data-testid="link-parent-admin"><ShieldAlert size={16} /><span>{tr(l, 'Team inbox', '團隊收件匣', '团队收件箱')}</span><Inbox size={14} /></Link> : null}
              </div>
            </section>
          </Show>
        </aside>
      </div>
    </main>
  );
}


export default App;
