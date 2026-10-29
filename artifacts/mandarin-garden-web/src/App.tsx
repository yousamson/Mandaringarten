import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { ArrowLeft, ArrowRight, Apple, BookOpen, Check, ChevronRight, Compass, Flower2, Heart, Inbox, Leaf, LogOut, Menu, MessageCircle, ShieldAlert, UserX, PawPrint, Play, RotateCcw, Sparkles, Sprout, Volume2, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
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
import { useLearningProgress, useLegacyProgressMigration, usePendingRoundSync, useMembership, useSelectStage, XP_COMPLETE } from '@/hooks/use-learning';
import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth';
import DisclaimerPage from '@/pages/disclaimer';
import PlaygroundPage from '@/pages/playground';
import PrivacyPage from '@/pages/privacy';
import { categories, categoryNames, copy, GardenLesson, Language, lessons, levels } from '@/lib/garden-data';
import { pick, playgroundName, stageLabel, stageNames, tr } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech } from '@/lib/speech';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
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
  const [age, setAge] = useState(() => localStorage.getItem('mg-age') || '2-4');
  const saveLanguage = (value: Language) => { localStorage.setItem('mg-language', value); setLanguage(value); };
  const saveTheme = (value: ThemeId) => { localStorage.setItem('mg-theme', value); setTheme(value); };
  const saveAge = (value: string) => { localStorage.setItem('mg-age', value); setAge(value); };
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
          <Route path="/sign-in/*?"><AuthPage key="sign-in" mode="sign-in" language={l} /></Route>
          <Route path="/register/*?"><AuthPage key="register" mode="register" language={l} /></Route>
          <Route path="/membership"><AccountConsentBoundary language={l}><MembershipPage l={l} /></AccountConsentBoundary></Route>
          <Route path="/messages"><MessagesPage language={l} /></Route>
          <Route path="/admin/messages"><MessagesPage language={l} admin /></Route>
          <Route path="/account"><AccountPage language={l} /></Route>
          <Route path="/">{guarded(<HomePage language={l} t={t} age={preferences.age} lessonsToShow={filterLessons} category={category} setCategory={setCategory} />)}</Route>
          <Route path="/lesson/:lessonId">{guarded(<LessonPage language={l} t={t} />)}</Route>
          <Route path="/playground">{guarded(<PlaygroundPage language={l} />)}</Route>
          <Route path="/curriculum">{guarded(<PlaygroundPage language={l} />)}</Route>
          <Route path="/parent">{guarded(<ParentPage preferences={preferences} t={t} />)}</Route>
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
      <div className="page-shell">
        <footer className="footer">
          <span>© 漢語樂園 Mandarin Garden</span>
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
function HomePage({ language, t, age, lessonsToShow, category, setCategory }: { language: Language; t: Copy; age: string; lessonsToShow: GardenLesson[]; category: string; setCategory: (value: string) => void }) {
  const recommendedLevel = Math.max(0, ['2-4', '3-5', '6-8', '9-12'].indexOf(age));
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
        <div className="hero-art" aria-label="Illustration of a flower growing in a garden">
          <div className="sun-disc" />
          <div className="garden-illustration">
            <div className="plant-stem" /><div className="leaf l1" /><div className="leaf l2" /><div className="leaf l3" /><div className="leaf l4" />
            <div className="flower" /><div className="soil" />
          </div>
          <div className="sprout-card"><span className="sprout-dot"><Sprout size={17} /></span><span>{t.category}<br /><strong>你好 · nǐ hǎo</strong></span></div>
        </div>
      </section>
      <section id="lessons" className="reveal">
        <div className="section-head">
          <div><div className="eyebrow">{t.category}</div><h2>{t.lessons}</h2><p className="section-sub">{t.lessonsHint}</p></div>
          <span className="status-pill">{t.minutes}</span>
        </div>
        <div className="filter-row" role="group" aria-label="Filter lessons">
          {categories.filter((item) => item === 'all' || lessons.some((lesson) => !lesson.premium && lesson.category === item)).map((item) => <button key={item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} data-testid={`filter-${item}`}>{categoryNames[language][item]}</button>)}
        </div>
        <div className="lesson-grid">
          {lessonsToShow.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} language={language} t={t} />)}
        </div>
      </section>
      <StagePathCards l={language} />
      <PracticeSection language={language} age={age} />
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


function PracticeSection({ language, age }: { language: Language; age: string }) {
  const vocabulary = lessons.filter((lesson) => !lesson.premium).flatMap((lesson) => lesson.words);
  const questions = vocabulary.slice(0, 5);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const current = questions[round];
  const choices = current
    ? [current, ...vocabulary.filter((item) => item.id !== current.id).slice((round * 2) % 8, (round * 2) % 8 + 3)]
    : [];
  const finished = round >= questions.length;
  const reading = age === '9-12'
    ? {
      title: { en: 'A green corner for everyone', 'zh-Hant': '為公園留一片綠地', 'zh-Hans': '为公园留一片绿地' },
      text: { en: 'Some neighbours hoped for more parking. Others wanted to keep the old trees. They gathered ideas and found a thoughtful plan: a park that is easy to visit and still full of green.', 'zh-Hant': '附近公園準備改建時，有人希望增加停車空間，也有人想保留樹木。居民先蒐集資料，再提出兼顧安全與綠地的方案。經過多次討論，大家找到折衷方法，使公園既方便使用，也保有自然環境。', 'zh-Hans': '附近公园准备改建时，有人希望增加停车空间，也有人想保留树木。居民先收集资料，再提出兼顾安全与绿地的方案。经过多次讨论，大家找到折中方法，使公园既方便使用，也保有自然环境。' },
    }
    : {
      title: { en: 'The tiny school garden', 'zh-Hant': '校園小花圃', 'zh-Hans': '校园小花圃' },
      text: { en: 'After class, Ming and a friend watered the little garden. They spotted a bright red flower and smiled. A small act of care helped the whole garden grow.', 'zh-Hant': '下課後，小明和同學到花圃澆水。他們看見一朵紅花，開心得笑了。', 'zh-Hans': '下课后，小明和同学到花圃浇水。他们看见一朵红花，开心得笑了。' },
    };
  const select = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === current?.id) setScore((value) => value + 1);
  };
  const advance = () => { setRound((value) => value + 1); setPicked(null); };
  const restart = () => { setRound(0); setPicked(null); setScore(0); };
  return (
    <section className="practice-grid">
      <div className="practice-card quiz-card">
        <div className="practice-heading"><span className="practice-icon"><Sparkles size={18} /></span><div><div className="eyebrow">{language === 'en' ? 'PLAY & REMEMBER' : language === 'zh-Hant' ? '玩一玩，記得更牢' : '玩一玩，记得更牢'}</div><h2>{language === 'en' ? 'A tiny pinyin match' : language === 'zh-Hant' ? '拼音小配對' : '拼音小配对'}</h2></div></div>
        {finished ? (
          <div className="quiz-result"><div className="quiz-score">{score}<span> / {questions.length}</span></div><p>{language === 'en' ? 'Lovely work. Every try helps a word take root.' : language === 'zh-Hant' ? '做得真好，每一次練習都讓詞語更熟悉。' : '做得真好，每一次练习都让词语更熟悉。'}</p><button className="button-secondary" onClick={restart}><RotateCcw size={14} /> {language === 'en' ? 'Play again' : language === 'zh-Hant' ? '再玩一輪' : '再玩一轮'}</button></div>
        ) : current ? (
          <>
            <div className="quiz-question">
              <span className="question-count">{language === 'en' ? `WORD ${round + 1} OF ${questions.length}` : language === 'zh-Hant' ? `第 ${round + 1} 個詞語 · 共 ${questions.length} 個` : `第 ${round + 1} 个词语 · 共 ${questions.length} 个`}</span>
              <strong>{current.pinyin}</strong>
              <span>{language === 'en' ? 'Find the matching characters' : language === 'zh-Hant' ? '找出相配的漢字' : '找出相配的汉字'}</span>
            </div>
            <div className="quiz-options">
              {choices.map((choice) => <button key={choice.id} className={`quiz-option ${picked === choice.id ? choice.id === current.id ? 'correct' : 'incorrect' : ''} ${picked && choice.id === current.id ? 'correct' : ''}`} onClick={() => select(choice.id)} disabled={Boolean(picked)}>{language === 'zh-Hans' ? choice.simplified : choice.hanzi}</button>)}
            </div>
            {picked ? <div className={`quiz-feedback ${picked === current.id ? 'good' : ''}`}>{picked === current.id ? (language === 'en' ? 'That’s the one.' : language === 'zh-Hant' ? '答對了！' : '答对了！') : (language === 'en' ? `This one is ${current.hanzi}.` : `答案是 ${language === 'zh-Hans' ? current.simplified : current.hanzi}。`)} <button className="text-next" onClick={advance}>{round === questions.length - 1 ? (language === 'en' ? 'See results' : language === 'zh-Hant' ? '看結果' : '看结果') : (language === 'en' ? 'Next word' : language === 'zh-Hant' ? '下一個詞語' : '下一个词语')} <ArrowRight size={13} /></button></div> : null}
          </>
        ) : null}
      </div>
      <article className="practice-card reading-card">
        <div className="practice-heading"><span className="practice-icon reading-icon"><BookOpen size={18} /></span><div><div className="eyebrow">{language === 'en' ? 'A LITTLE READING' : language === 'zh-Hant' ? '讀一小段' : '读一小段'}</div><h2>{reading.title[language]}</h2></div></div>
        <p className="reading-text">{reading.text[language]}</p>
        <div className="reading-meta"><span>{age === '9-12' ? (language === 'en' ? 'Ages 9–12 · Reading' : language === 'zh-Hant' ? '9–12 歲 · 閱讀表達' : '9–12 岁 · 阅读表达') : (language === 'en' ? 'Ages 6–8 · Short story' : language === 'zh-Hant' ? '6–8 歲 · 短篇故事' : '6–8 岁 · 短篇故事')}</span><span>2 min</span></div>
      </article>
    </section>
  );
}

function LessonCard({ lesson, language, t }: { lesson: GardenLesson; language: Language; t: Copy }) {
  const Icon = icons[lesson.icon as keyof typeof icons] || BookOpen;
  return (
    <Link href={`/lesson/${lesson.id}`} className="lesson-card" style={{ '--card-tint': '#e9f0e2' } as CSSProperties} aria-label={`${lesson.title[language]} · ${tr(language, 'Open lesson', '開始學習', '开始学习')}`} data-testid={`card-lesson-${lesson.id}`}>
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
                {['2-4', '3-5', '6-8', '9-12'].map((item, index) => <option key={item} value={item}>{t.levelAges[index]}</option>)}
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
