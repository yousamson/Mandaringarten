import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import CurriculumPage from '@/pages/curriculum';
import { ClerkProvider, Show, SignInButton, SignUpButton, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { useCreateBillingCheckout, useCreateBillingPortal, useGetBillingStatus, getGetBillingStatusQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Apple, BookOpen, Check, ChevronRight, Compass, Flower2, Heart, Leaf, LockKeyhole, LogOut, Menu, MessageCircle, PawPrint, Play, RotateCcw, Sparkles, Sprout, Volume2, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { categories, categoryNames, copy, GardenLesson, Language, lessons, levels } from '@/lib/garden-data';

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
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl}>{content}</ClerkProvider>;
}

function SignOutControl({ label, className }: { label: string; className: string }) {
  const { signOut } = useClerk();
  return <button type="button" className={className} aria-label={label} title={label} onClick={() => void signOut({ redirectUrl: '/' })}><LogOut size={15} /></button>;
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
  const t = copy[preferences.language];
  const [path, setPath] = useLocation();
  const [category, setCategory] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const filterLessons = useMemo(() => category === 'all' ? lessons : lessons.filter((lesson) => lesson.category === category), [category]);
  const shellClass = `garden-app theme-${preferences.theme}`;

  return (
    <div className={shellClass}>
      <div className="page-shell">
        <header className="topbar">
          <Link href="/" className="brand" data-testid="link-home">
            <span className="brand-mark"><Sprout size={23} strokeWidth={1.9} /></span>
            <span className="brand-text"><span>漢語樂園 Mandarin Garden</span><small className="brand-tagline">{tagline[preferences.language]}</small></span>
          </Link>
          <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>{t.navHome}</Link>
            <a className={`nav-link ${path === '/#lessons' ? 'active' : ''}`} href="/#lessons" onClick={() => setMenuOpen(false)}>{t.navWords}</a>
            <Link href="/curriculum" className={`nav-link ${path === '/curriculum' ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid="link-curriculum">{preferences.language === 'en' ? 'Curriculum' : preferences.language === 'zh-Hant' ? '學習課程' : '学习课程'}</Link>
            <Link href="/parent" className={`nav-link ${path === '/parent' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>{t.navParent}</Link>
          </nav>
          <div className="top-actions">
            <select className="language-select" aria-label="Interface language" value={preferences.language} onChange={(event) => preferences.saveLanguage(event.target.value as Language)} data-testid="select-language">
              {languages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
            <Link href="/parent" className="parent-link"><Leaf size={15} /> <span>{t.navParent}</span></Link>
            <div className="auth-slot"><Show when="signed-in"><SignOutControl label={signOutLabels[preferences.language]} className="avatar-button" /></Show><Show when="signed-out"><SignInButton mode="modal"><button className="avatar-button" aria-label={t.signIn} data-testid="button-sign-in"><ArrowRight size={16} /></button></SignInButton></Show></div>
            <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} data-testid="button-menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </header>
      </div>
      <ErrorBoundary resetKey={path}>
        <Switch>
          <Route path="/">
            <HomePage language={preferences.language} t={t} age={preferences.age} lessonsToShow={filterLessons} category={category} setCategory={setCategory} />
          </Route>
          <Route path="/lesson/:lessonId"><LessonPage language={preferences.language} t={t} /></Route>
          <Route path="/curriculum"><CurriculumPage language={preferences.language} age={preferences.age} /></Route>
          <Route path="/parent"><ParentPage preferences={preferences} t={t} /></Route>
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
      <div className="page-shell">
        <footer className="footer"><span>© 漢語樂園 Mandarin Garden</span><span>{tagline.en} · 讓每天學習漢語更輕鬆 · 让每天学习汉语更轻松</span></footer>
      </div>
    </div>
  );
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
            <a href="#lessons" className="button-secondary">{t.browse}</a>
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
          {categories.map((item) => <button key={item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} data-testid={`filter-${item}`}>{categoryNames[language][item]}</button>)}
        </div>
        <div className="lesson-grid">
          {lessonsToShow.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} language={language} t={t} />)}
        </div>
      </section>
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
        <Link href="/curriculum" className="progress-link">{language === 'en' ? 'Open your learning path' : language === 'zh-Hant' ? '開啟學習進度' : '开启学习进度'} <ChevronRight size={14} /></Link>
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
    <Link href={`/lesson/${lesson.id}`} className="lesson-card" style={{ '--card-tint': lesson.premium ? '#f1e9da' : '#e9f0e2' } as CSSProperties} data-testid={`card-lesson-${lesson.id}`}>
      <div className="lesson-top"><span className="lesson-icon"><Icon size={20} strokeWidth={1.7} /></span><span className="premium-label">{lesson.premium ? <><LockKeyhole size={11} /> {t.premium}</> : t.free}</span></div>
      <h3 className="lesson-title">{lesson.title[language]}</h3>
      <p className="lesson-description">{lesson.subtitle[language]}</p>
      <div className="lesson-bottom"><span>{lesson.words.length} {t.learn}</span><strong>{lesson.premium ? t.locked : t.start} <ArrowRight size={12} /></strong></div>
    </Link>
  );
}

function speak(text: string, language: Language) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'zh-Hans' ? 'zh-CN' : 'zh-TW';
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

function LessonPage({ language, t }: { language: Language; t: Copy }) {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const lesson = lessons.find((item) => item.id === lessonId);
  const userState = useUser();
  const isSignedIn = userState.isSignedIn ?? false;
  const billing = useGetBillingStatus({ query: { enabled: isSignedIn, queryKey: [...getGetBillingStatusQueryKey(), userState.user?.id], retry: false } });
  useEffect(() => { setIndex(0); setDone(false); }, [lessonId]);
  if (!lesson) return <main className="page-shell not-found"><h1>That path is not here.</h1><Link href="/" className="button-primary">{t.back}</Link></main>;
  const locked = lesson.premium && (!isSignedIn || billing.data?.isPremium !== true);
  const word = lesson.words[index];
  const next = () => {
    if (index < lesson.words.length - 1) setIndex((value) => value + 1);
    else setDone(true);
  };
  return (
    <main className="page-shell">
      <div className="lesson-page">
        <Link href="/" className="button-secondary" style={{ minHeight: 40, padding: '0 13px', fontSize: 12 }}><ArrowLeft size={14} /> {t.back}</Link>
        {locked ? (
          <div className="lesson-player" style={{ marginTop: 18, textAlign: 'center' }}>
            <div className="complete-mark"><LockKeyhole size={27} /></div>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>{lesson.title[language]}</div>
            <h1 className="section-head" style={{ justifyContent: 'center', fontFamily: 'var(--app-font-serif)', color: '#314b3a' }}>{t.locked}</h1>
            <p className="section-sub">{lesson.subtitle[language]}</p>
            <Link href="/parent" className="button-primary">{t.join} <ArrowRight size={16} /></Link>
          </div>
        ) : (
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
                  <div className="word-hanzi">{language === 'zh-Hans' ? word.simplified : word.hanzi}</div>
                  <div className="word-pinyin">{word.pinyin}</div>
                  <button className="audio-button" onClick={() => speak(language === 'zh-Hans' ? word.simplified : word.hanzi, language)} data-testid="button-listen"><Volume2 size={15} /> {t.listen}</button>
                </div>
                <div className="sentence-box">
                  <div className="sentence-label">{t.sentence}</div>
                  <div className="sentence-hanzi">{language === 'zh-Hans' ? word.sentenceSimplified : word.sentence}</div>
                  <div className="sentence-pinyin">{word.sentencePinyin}</div>
                  <button className="audio-button" style={{ margin: '12px 0 0', padding: '8px 12px' }} onClick={() => speak(language === 'zh-Hans' ? word.sentenceSimplified : word.sentence, language)}><Play size={12} /> {t.listen}</button>
                </div>
                <div className="player-actions">
                  <span className="section-sub" style={{ margin: 0 }}>{t.word} {index + 1} / {lesson.words.length}</span>
                  <button className="button-primary" onClick={next} data-testid="button-next-word">{index === lesson.words.length - 1 ? t.finish : t.next} <ArrowRight size={15} /></button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ParentPage({ preferences, t }: { preferences: ReturnType<typeof usePreferences>; t: Copy }) {
  const { isSignedIn, user } = useUser();
  const status = useGetBillingStatus({ query: { enabled: isSignedIn ?? false, queryKey: [...getGetBillingStatusQueryKey(), user?.id], retry: false } });
  const checkout = useCreateBillingCheckout();
  const portal = useCreateBillingPortal();
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const active = status.data?.isPremium ?? false;
  const hasSubscription = ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(status.data?.subscriptionStatus ?? "");
  const checking = Boolean(isSignedIn && status.isLoading);
  const busy = checkout.isPending || portal.isPending || working || checking || Boolean(isSignedIn && status.isError);
  const initiateCheckout = () => {
    setError('');
    if (!isSignedIn) return;
    setWorking(true);
    checkout.mutate(
      { data: { successUrl: `${window.location.origin}/parent?checkout=success`, cancelUrl: `${window.location.origin}/parent?checkout=cancelled` } },
      { onSuccess: (result) => { window.location.assign(result.url); }, onError: () => { setError(t.checkoutError); setWorking(false); } },
    );
  };
  const openPortal = () => {
    setError('');
    setWorking(true);
    portal.mutate(
      { data: { returnUrl: `${window.location.origin}/parent` } },
      { onSuccess: (result) => { window.location.assign(result.url); }, onError: () => { setError(t.portalError); setWorking(false); } },
    );
  };
  const date = status.data?.currentPeriodEnd ? new Intl.DateTimeFormat(preferences.language, { dateStyle: 'long' }).format(new Date(status.data.currentPeriodEnd)) : '';
  return (
    <main className="page-shell">
      <section className="page-title">
        <div className="eyebrow">{t.navParent}</div>
        <h1>{t.parentTitle}</h1><p>{t.parentSubtitle}</p>
      </section>
      <div className="parent-grid">
        <div>
          <section className="panel">
            <h2>{t.interface}</h2><p className="panel-desc">{t.interfaceHint}</p>
            <div className="setting-row"><div><div className="setting-name">{t.interface}</div><div className="setting-detail">{preferences.language === 'en' ? 'English' : preferences.language === 'zh-Hant' ? '繁體中文' : '简体中文'}</div></div>
              <select className="select-control" value={preferences.language} onChange={(event) => preferences.saveLanguage(event.target.value as Language)} aria-label={t.interface} data-testid="parent-language">
                {languages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="setting-row"><div><div className="setting-name">{t.age}</div><div className="setting-detail">{t.ageHint}</div></div>
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
              <div className="setting-row"><div><div className="setting-name">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</div><div className="setting-detail">{user?.primaryEmailAddress?.emailAddress}</div></div><SignOutControl label={signOutLabels[preferences.language]} className="button-secondary" /></div>
            </Show>
            <Show when="signed-out">
              <p className="panel-desc">{t.signedOut}</p>
              <div className="button-row"><SignInButton mode="modal"><button className="button-secondary">{t.signIn}</button></SignInButton><SignUpButton mode="modal"><button className="button-primary">{t.signUp}</button></SignUpButton></div>
            </Show>
          </section>
        </div>
        <aside>
          <section className="panel membership-card">
            <h2><Leaf size={18} /> {t.membership}</h2>
            <p className="panel-desc">{checking ? t.loading : status.isError && isSignedIn ? t.failed : active ? t.premiumActive : t.freePlan}</p>
            {status.isLoading && isSignedIn ? <div className="setting-row"><span className="panel-desc">{t.loading}</span><span className="status-pill">•••</span></div> : null}
            {status.isError && isSignedIn ? <div className="alert"><p>{t.failed}</p><button className="button-secondary" onClick={() => status.refetch()}>{t.retry}</button></div> : null}
            {status.data && isSignedIn && active ? <div className="setting-row"><div><div className="setting-name">{status.data.cancelAtPeriodEnd ? t.cancelAt : t.active}</div><div className="setting-detail">{date ? `${t.due}: ${date}` : status.data.subscriptionStatus}</div></div><span className="status-pill">{active ? t.premiumActive : t.freePlan}</span></div> : null}
            <div className="plan-price">{t.price} <small>{t.perMonth}</small></div>
            <ul className="benefit-list">{t.benefits.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul>
            {error ? <div className="alert" role="alert">{error}</div> : null}
            <Show when="signed-in">
              {hasSubscription
                ? <button className={`button-primary ${busy ? 'busy' : ''}`} onClick={openPortal} disabled={busy} data-testid="button-manage-subscription">{busy ? t.loading : t.manage} <ArrowRight size={15} /></button>
                : <button className={`button-primary ${busy ? 'busy' : ''}`} onClick={initiateCheckout} disabled={busy} data-testid="button-upgrade">{busy ? t.loading : t.upgrade} <ArrowRight size={15} /></button>}
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal"><button className="button-primary" data-testid="button-sign-in-to-upgrade">{t.signIn} · {t.upgrade} <ArrowRight size={15} /></button></SignInButton>
            </Show>
            <p className="membership-note">{t.paymentNote}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default App;
