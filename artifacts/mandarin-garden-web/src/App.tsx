import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { ArrowLeft, ArrowRight, Apple, BookOpen, Check, ChevronRight, Compass, Flower2, Heart, Inbox, Languages, Leaf, LogOut, Menu, MessageCircle, ShieldAlert, UserX, PawPrint, Play, RotateCcw, Sparkles, Sprout, Volume2, X, Droplets, Shovel, Map, Gamepad2, BookHeart } from 'lucide-react';
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
import AdminPage from '@/pages/admin';
import { StagePicker } from '@/components/playground/stage-picker';
import { StagePathCards } from '@/components/stage-path-cards';
import { StagePathPlayer } from '@/components/stage-path-player';
import { DailyChallengeCard } from '@/components/playground/daily-challenge-card';
import { ParentChildBookSection } from '@/components/parent-child-book-section';
import { TranslationLookup } from '@/components/translation-lookup';
import { useLearningProgress, useLegacyProgressMigration, usePendingRoundSync, useMembership, useIssueLearningRound, useRecordRound, useSelectStage, useGardenCare, XP_COMPLETE, XP_PER_CORRECT } from '@/hooks/use-learning';
import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth';
import FreeReadingPage from '@/pages/free-reading';
import DisclaimerPage from '@/pages/disclaimer';
import EntryPortalPage from '@/pages/entry-portal';
import TreasureHousePage from '@/pages/treasure-house';
import PlaygroundPage, { WordBankPage } from '@/pages/playground';
import PrivacyPage from '@/pages/privacy';
import { categories, categoryNames, copy, GardenLesson, Language, lessons, levels } from '@/lib/garden-data';
import { interfaceLanguageOptions, translateInterface } from '@workspace/learning-content';
import { recordSitePageView, type LearningQuestion, type LearningRoundInput } from '@workspace/api-client-react';
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
const languages = interfaceLanguageOptions;
const signOutLabels: Record<Language, string> = {
  en: 'Sign out',
  'zh-Hant': '登出',
  'zh-Hans': '退出登录',
  es: 'Cerrar sesión',
  fr: 'Se déconnecter',
  ja: 'ログアウト',
  ko: '로그아웃',
  pt: 'Terminar sessão',
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

function wordCounter(language: Language, current: number, total: number) {
  const number = current + 1;
  if (language === 'en') return `WORD ${number} OF ${total}`;
  if (language === 'zh-Hant') return `第 ${number} 個詞語 · 共 ${total} 個`;
  if (language === 'zh-Hans') return `第 ${number} 个词语 · 共 ${total} 个`;
  if (language === 'es') return `PALABRA ${number} DE ${total}`;
  if (language === 'fr') return `MOT ${number} SUR ${total}`;
  if (language === 'ja') return `単語 ${number} / ${total}`;
  if (language === 'ko') return `단어 ${number} / ${total}`;
  return `PALAVRA ${number} DE ${total}`;
}

function usePreferences() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('mg-language') as Language) || 'en');
  const [theme, setTheme] = useState<ThemeId>(() => (localStorage.getItem('mg-theme') as ThemeId) || 'meadow');
  const [age, setAge] = useState(() => normalizeAgeStage(localStorage.getItem('mg-age')));
  useEffect(() => { localStorage.setItem('mg-age', age); }, [age]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
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
  es: 'Aprende mandarín con más facilidad cada día',
  fr: 'Apprenez le mandarin plus facilement chaque jour',
  ja: '毎日の中国語学習をもっと楽しく',
  ko: '매일 중국어를 더 쉽게 배워요',
  pt: 'Aprenda mandarim com mais facilidade todos os dias',
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
  const isEntryArea = path === '/' || path.startsWith('/treasure-house');
  const freeLessons = useMemo(() => lessons.filter((lesson) => !lesson.premium), []);
  const filterLessons = useMemo(() => category === 'all' ? freeLessons : freeLessons.filter((lesson) => lesson.category === category), [category, freeLessons]);
  const shellClass = `garden-app theme-${preferences.theme}`;
  const close = () => setMenuOpen(false);
  const guarded = (node: ReactNode) => <AccountConsentBoundary language={l}><MemberGate l={l}><LegacySync l={l} />{node}</MemberGate></AccountConsentBoundary>;
  const access = useAccountAccess();

  useEffect(() => {
    if (!import.meta.env.PROD || path.startsWith('/admin')) return;
    void recordSitePageView({ skipAuth: true, keepalive: true }).catch(() => {
      // Visit totals are non-essential and must never interrupt site navigation.
    });
  }, [path]);

  return (
    <div className={shellClass} lang={l}>
      <div className="page-shell">
        <header className="topbar">
          <Link href="/" className="brand" data-testid="link-home">
            <span className="brand-mark"><Sprout size={23} strokeWidth={1.9} /></span>
            <span className="brand-text"><span>漢語樂園 Mandarin Garden</span><small className="brand-tagline">{tagline[l]}</small></span>
          </Link>
          <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            {isEntryArea ? <>
              <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} onClick={close}>{homeText(l, 'Choose a destination', '選擇入口', '选择入口')}</Link>
              <Link href="/home" className="nav-link" onClick={close}>{homeText(l, 'Mandarin Garden', '漢語樂園', '汉语乐园')}</Link>
              <Link href="/treasure-house" className={`nav-link ${path === '/treasure-house' ? 'active' : ''}`} onClick={close}>{homeText(l, 'Chinese Treasure House', '中文寶庫', '中文宝库')}</Link>
            </> : <>
              <Link href="/home" className={`nav-link ${path === '/home' ? 'active' : ''}`} onClick={close}>{t.navHome}</Link>
              <Link href="/learn" className={`nav-link ${path === '/learn' ? 'active' : ''}`} onClick={close}>{t.navWords}</Link>
              <Link href="/playground" className={`nav-link ${path === '/playground' || path === '/curriculum' ? 'active' : ''}`} onClick={close} data-testid="link-playground">{playgroundName[l]}</Link>
              <Link href="/stories" className={`nav-link ${path === '/stories' ? 'active' : ''}`} onClick={close}>{homeText(l, 'Stories', '故事天地', '故事天地')}</Link>
              <Link href="/parent" className={`nav-link ${path === '/parent' ? 'active' : ''}`} onClick={close}>{t.navParent}</Link>
              <Link href="/" className="nav-link" onClick={close}>{homeText(l, 'Choose a destination', '選擇入口', '选择入口')}</Link>
              {access.isSignedIn ? <Link href="/messages" className={`nav-link ${path === '/messages' ? 'active' : ''}`} onClick={close} data-testid="link-nav-messages">{tr(l, 'Messages', '訊息', '消息')}</Link> : null}
              {access.isAdmin ? <Link href="/admin/messages" className={`nav-link ${path === '/admin/messages' ? 'active' : ''}`} onClick={close} data-testid="link-nav-admin">{tr(l, 'Team inbox', '團隊收件匣', '团队收件箱')}</Link> : null}
              {access.isAdmin ? <Link href="/admin" className={`nav-link ${path === '/admin' ? 'active' : ''}`} onClick={close} data-testid="link-nav-admin-dashboard">{tr(l, 'Admin overview', '管理總覽', '管理总览')}</Link> : null}
            </>}
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
          <Route path="/treasure-house/:track/:level"><TreasureHouseRoute language={l} /></Route>
          <Route path="/treasure-house/:track"><TreasureHouseTrackRoute language={l} /></Route>
          <Route path="/treasure-house"><TreasureHousePage language={l} /></Route>
          <Route path="/"><EntryPortalPage language={l} /></Route>
          <Route path="/learn">{guarded(<LearningPage language={l} t={t} lessonsToShow={filterLessons} category={category} setCategory={setCategory} />)}</Route>
          <Route path="/challenge">{guarded(<ChallengePage language={l} age={preferences.age} onAgeChange={preferences.saveAge} />)}</Route>
          <Route path="/stories">{guarded(<StoriesPage language={l} age={preferences.age} onAgeChange={preferences.saveAge} />)}</Route>
          <Route path="/translation">{guarded(<TranslationPage language={l} />)}</Route>
          <Route path="/garden">{guarded(<GardenPage language={l} />)}</Route>
          <Route path="/sign-in/*?"><AuthPage key="sign-in" mode="sign-in" language={l} /></Route>
          <Route path="/register/*?"><AuthPage key="register" mode="register" language={l} /></Route>
          <Route path="/membership"><AccountConsentBoundary language={l}><MembershipPage l={l} /></AccountConsentBoundary></Route>
          <Route path="/messages"><MessagesPage language={l} /></Route>
          <Route path="/admin"><AdminPage language={l} /></Route>
          <Route path="/admin/messages"><MessagesPage language={l} admin /></Route>
          <Route path="/account"><AccountPage language={l} /></Route>
          <Route path="/home">{guarded(<HomePage language={l} t={t} age={preferences.age} />)}</Route>
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

function TreasureHouseRoute({ language }: { language: Language }) {
  const params = useParams<{ track: string; level: string }>();
  return <TreasureHousePage language={language} track={params.track} level={params.level} />;
}

function TreasureHouseTrackRoute({ language }: { language: Language }) {
  const params = useParams<{ track: string }>();
  return <TreasureHousePage language={language} track={params.track} />;
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
function HomePage({ language, t, age }: { language: Language; t: Copy; age: string }) {
  const recommendedLevel = ageStages.indexOf(normalizeAgeStage(age));
  const destinations = [
    { href: '/challenge', icon: Sparkles, title: homeText(language, 'Daily challenge', '每日挑戰', '每日挑战'), description: homeText(language, 'Try a few free questions', '免費玩幾道小題', '免费玩几道小题'), tone: 'map-tone-sun' },
    { href: '/learn', icon: Compass, title: homeText(language, 'Word paths', '詞語小徑', '词语小径'), description: homeText(language, 'Explore words by theme', '按主題探索詞語', '按主题探索词语'), tone: 'map-tone-leaf' },
    { href: '/playground', icon: Gamepad2, title: homeText(language, 'Games', '遊戲樂園', '游戏乐园'), description: homeText(language, 'Play and practise', '邊玩邊練習', '边玩边练习'), tone: 'map-tone-lake' },
    { href: '/stories', icon: BookHeart, title: homeText(language, 'Stories', '故事天地', '故事天地'), description: homeText(language, 'Read and listen together', '一起閱讀與聆聽', '一起阅读与聆听'), tone: 'map-tone-peach' },
    { href: '/translation', icon: Languages, title: homeText(language, 'Word finder', '字詞小幫手', '字词小帮手'), description: homeText(language, 'Look up a word or phrase', '查找字詞和短句', '查找字词和短句'), tone: 'map-tone-lilac' },
    { href: '/garden', icon: Flower2, title: homeText(language, 'My garden', '我的花園', '我的花园'), description: homeText(language, 'Care for a growing flower', '照料逐漸長大的花', '照料逐渐长大的花'), tone: 'map-tone-garden' },
  ];
  return (
    <main className="page-shell garden-home">
      <section className="hero garden-map-hero">
        <div className="reveal">
          <div className="eyebrow"><Map size={14} /> {homeText(language, 'YOUR LEARNING GARDEN', '歡迎來到學習樂園', '欢迎来到学习乐园')}</div>
          <h1>{t.headline}</h1>
          <p className="hero-copy">{t.intro}</p>
          <div className="button-row">
            <Link href="/learn" className="button-primary" data-testid="link-map-first-step">{t.start} <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-note"><Sparkles size={14} /> {homeText(language, 'Choose a place to begin exploring.', '選一個地方，開始探索吧。', '选一个地方，开始探索吧。')}</div>
        </div>
        <div className="hero-art garden-map-art" aria-hidden="true">
          <div className="garden-map-sun" />
          <div className="garden-map-island"><Sprout size={76} strokeWidth={1.15} /></div>
          <span className="garden-map-path path-one" />
          <span className="garden-map-path path-two" />
          <span className="garden-map-path path-three" />
          <span className="garden-map-dot dot-one" />
          <span className="garden-map-dot dot-two" />
          <span className="garden-map-dot dot-three" />
        </div>
      </section>
      <section className="garden-map" aria-labelledby="garden-map-title" data-testid="garden-map">
        <div className="section-head">
          <div>
            <div className="eyebrow"><Map size={13} /> {homeText(language, 'PICK A PLACE', '挑選一個地方', '挑选一个地方')}</div>
            <h2 id="garden-map-title">{homeText(language, 'Where shall we go?', '今天想去哪裡？', '今天想去哪里？')}</h2>
            <p className="section-sub">{homeText(language, 'Tap a place on the map to explore.', '點選地圖上的地方，開始探索。', '点击地图上的地方，开始探索。')}</p>
          </div>
          <span className="status-pill">{t.levelAges[recommendedLevel]}</span>
        </div>
        <div className="garden-map-grid">
          {destinations.map(({ href, icon: Icon, title, description, tone }) => (
            <Link key={href} href={href} className={`garden-map-card ${tone}`} data-testid={`link-map-${href.replaceAll('/', '').replaceAll('-', '')}`}>
              <span className="garden-map-card-icon"><Icon size={22} strokeWidth={1.8} /></span>
              <span className="garden-map-card-copy"><strong>{title}</strong><small>{description}</small></span>
              <ArrowRight className="garden-map-arrow" size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <div className="garden-map-parent-link">
        <span>{homeText(language, 'Grown-ups can visit the parent area for settings and progress.', '大人可前往家長專區管理設定與進度。', '大人可前往家长专区管理设置与进度。')}</span>
        <Link href="/parent" className="button-secondary" data-testid="link-map-parent">{t.navParent} <ArrowRight size={14} /></Link>
      </div>
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

function LearningPage({ language, t, lessonsToShow, category, setCategory }: { language: Language; t: Copy; lessonsToShow: GardenLesson[]; category: string; setCategory: (value: string) => void }) {
  return (
    <main className="page-shell" data-testid="learning-page">
      <section className="page-title"><div className="eyebrow">{t.category}</div><h1>{t.lessons}</h1><p>{t.lessonsHint}</p></section>
      <div className="filter-row" role="group" aria-label={tr(language, 'Filter learning activities', '篩選學習內容', '筛选学习内容')}>
        {categories.filter((item) => item === 'all' || lessons.some((lesson) => !lesson.premium && lesson.category === item)).map((item) => <button key={item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} data-testid={`filter-${item}`}>{categoryNames[language][item]}</button>)}
      </div>
      <div className="lesson-grid">
        {lessonsToShow.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} language={language} t={t} />)}
      </div>
      <div className="home-pinyin-placement"><StagePathCards l={language} showGames={false} /></div>
    </main>
  );
}

function ChallengePage({ language, age, onAgeChange }: { language: Language; age: string; onAgeChange: (value: string) => void }) {
  return <main className="page-shell" data-testid="challenge-page"><section className="page-title"><div className="eyebrow">{homeText(language, 'A LITTLE DAILY PRACTICE', '每日小挑戰', '每日小挑战')}</div><h1>{homeText(language, 'A little challenge, every day', '每天一個小挑戰', '每天一个小挑战')}</h1><p>{homeText(language, 'Try a few playful questions made for the age you choose.', '依所選年齡，玩幾道輕鬆的小題目。', '按所选年龄，玩几道轻松的小题目。')}</p></section><PinyinMatchCard language={language} age={age} onAgeChange={onAgeChange} /></main>;
}

function StoriesPage({ language, age, onAgeChange }: { language: Language; age: string; onAgeChange: (value: string) => void }) {
  return <main className="page-shell" data-testid="stories-page"><section className="page-title"><div className="eyebrow">{homeText(language, 'READ & LISTEN', '閱讀與聆聽', '阅读与聆听')}</div><h1>{homeText(language, 'Stories to share', '一起讀故事', '一起读故事')}</h1><p>{homeText(language, 'Choose a short story or settle in with a picture book.', '挑選一篇短文，或和家人一起讀繪本。', '挑选一篇短文，或和家人一起读绘本。')}</p></section><PracticeSection language={language} age={age} onAgeChange={onAgeChange} /><ParentChildBookSection language={language} age={age} /></main>;
}

function TranslationPage({ language }: { language: Language }) {
  return <main className="page-shell" data-testid="translation-page"><section className="page-title"><div className="eyebrow">{homeText(language, 'WORD FINDER', '字詞查找', '字词查找')}</div><h1>{homeText(language, 'Look up a word', '查找字詞翻譯', '查找字词翻译')}</h1><p>{homeText(language, 'Translate a word or short phrase between English and Chinese.', '查找中英文單字或短句的翻譯。', '查找中英文单词或短句的翻译。')}</p></section><TranslationLookup language={language} /></main>;
}

function GardenPage({ language }: { language: Language }) {
  const membership = useMembership();
  const progressQuery = useLearningProgress(membership.uid, membership.premium);
  const gardenCare = useGardenCare(membership.uid);
  const progress = progressQuery.progress;
  const selectedXp = progress ? progress.xpByStage[progress.selectedStage - 1] ?? 0 : 0;
  return (
    <main className="page-shell" data-testid="garden-page">
      <section className="page-title"><div className="eyebrow"><Flower2 size={14} /> {homeText(language, 'YOUR LITTLE GARDEN', '你的小花園', '你的小花园')}</div><h1>{homeText(language, 'Growing, day by day', '每天一點點，慢慢長大', '每天一点点，慢慢长大')}</h1><p>{homeText(language, 'Care for a flower as you keep practising.', '持續練習，也別忘了照料自己的花。', '持续练习，也别忘了照料自己的花。')}</p></section>
      <div className="garden-page-content">
        <GardenArtwork growthDays={membership.premium ? progress?.garden.growthDays ?? 0 : 0} daysSinceCare={progress?.garden.daysSinceCare ?? null} language={language} />
        <section className="garden-care-card" aria-label={homeText(language, 'Garden care', '花園照料', '花园照料')} data-testid="section-garden-care">
          <div className="garden-care-heading"><div><div className="eyebrow">{homeText(language, 'YOUR LITTLE GARDEN', '你的小花園', '你的小花园')}</div><h2>{homeText(language, 'Growing, day by day', '每天一點點，慢慢長大', '每天一点点，慢慢长大')}</h2></div>{membership.premium && progress ? <span className="garden-day-count" data-testid="status-garden-days">{progress.garden.growthDays}<small> / 30 {homeText(language, 'days', '天', '天')}</small></span> : null}</div>
          {membership.checking || (membership.premium && progressQuery.isLoading && !progress) ? <div className="garden-care-skeleton" role="status" data-testid="status-garden-loading"><span /><span /></div>
            : membership.premium && progressQuery.isError && !progress ? <div className="garden-care-error" role="alert" data-testid="status-garden-error"><p>{homeText(language, 'Your garden could not load just now.', '花園暫時無法載入。', '花园暂时无法加载。')}</p><button type="button" className="text-next" onClick={() => void progressQuery.refetch()} data-testid="button-retry-garden">{homeText(language, 'Try again', '再試一次', '再试一次')}</button></div>
              : membership.premium && progress ? <>
                <div className="garden-reminder" role="status" data-testid="status-garden-reminder"><span className="garden-reminder-mark"><Sprout size={16} /></span><p>{gardenReminder(language, progress.garden.caredToday, progress.garden.daysSinceCare)}</p></div>
                <div className="garden-xp-row" data-testid="status-garden-xp"><span>{homeText(language, 'Selected stage XP', '目前階段 XP', '当前阶段 XP')} <strong>{selectedXp}</strong></span><span>{homeText(language, 'Care costs', '照料需要', '照料需要')} <strong>20 XP</strong></span></div>
                <div className="garden-xp-track" aria-hidden="true"><span style={{ transform: `scaleX(${Math.min(1, selectedXp / 20)})` }} /></div>
                {gardenCare.error ? <p className="garden-action-error" role="alert" data-testid="status-garden-care-error">{homeText(language, 'Care could not be saved. Please try again.', '未能儲存照料紀錄，請再試一次。', '未能保存照料记录，请再试一次。')}</p> : null}
                {progress.garden.caredToday ? <p className="garden-done" role="status" data-testid="status-garden-cared">{homeText(language, 'You cared for the garden today. Come back tomorrow to help it grow.', '今天已照料花園。明天再來，陪它繼續成長。', '今天已照料花园。明天再来，陪它继续成长。')}</p> : <>
                  {selectedXp < 20 ? <p className="garden-need-xp" data-testid="status-garden-xp-needed">{homeText(language, 'Earn a little more XP to care for your garden.', '再累積一點 XP，就能照料花園。', '再积累一点 XP，就能照料花园。')}</p> : null}
                  <div className="garden-care-actions">
                    <button type="button" className="garden-care-button water" disabled={selectedXp < 20 || !progress.garden.careAvailable || gardenCare.isPending} onClick={() => { gardenCare.reset(); void gardenCare.care('water').catch(() => undefined); }} data-testid="button-garden-water"><Droplets size={16} /> {gardenCare.isPending ? homeText(language, 'Saving…', '儲存中…', '保存中…') : homeText(language, 'Water', '澆水', '浇水')}</button>
                    <button type="button" className="garden-care-button feed" disabled={selectedXp < 20 || !progress.garden.careAvailable || gardenCare.isPending} onClick={() => { gardenCare.reset(); void gardenCare.care('fertilize').catch(() => undefined); }} data-testid="button-garden-fertilize"><Shovel size={16} /> {homeText(language, 'Fertilize', '施肥', '施肥')}</button>
                  </div>
                </>}
              </> : <><p className="garden-member-copy" data-testid="status-garden-membership">{homeText(language, 'Join the garden to nurture a flower with your daily practice.', '加入花園，用每天的練習照料一朵小花。', '加入花园，用每天的练习照料一朵小花。')}</p><Link href="/membership" className="garden-member-link" data-testid="link-garden-membership">{homeText(language, 'Grow your garden', '開始種下花園', '开始种下花园')} <ArrowRight size={15} /></Link></>}
        </section>
      </div>
    </main>
  );
}

function homeText(language: Language, english: string, traditional: string, simplified: string) {
  if (language === 'zh-Hant') return traditional;
  if (language === 'zh-Hans') return simplified;
  return language === 'en' ? english : translateInterface(language, english);
}

function gardenReminder(language: Language, caredToday: boolean, daysSinceCare: number | null) {
  if (caredToday) return homeText(language, 'A lovely day to learn together. Your garden is cared for.', '今天適合一起學習。花園已經照料好了。', '今天适合一起学习。花园已经照料好了。');
  if (daysSinceCare !== null && daysSinceCare >= 5) {
    return homeText(language, 'Your garden is waiting. It has been {days} days since its last care.', `花園正在等你。距離上次照料已 ${daysSinceCare} 天。`, `花园正在等你。距离上次照料已 ${daysSinceCare} 天。`).replace('{days}', String(daysSinceCare));
  }
  return homeText(language, 'A little care today helps your garden keep growing.', '今天照料一點點，花園就能繼續成長。', '今天照料一点点，花园就能继续成长。');
}

function GardenArtwork({ growthDays, daysSinceCare, language }: { growthDays: number; daysSinceCare: number | null; language: Language }) {
  const days = Math.max(0, Math.min(30, Math.floor(growthDays)));
  const imageName = days >= 30
    ? 'garden-full-bloom-wide.jpg'
    : days >= 20
      ? 'garden-growing-wide.jpg'
      : days >= 10
        ? 'garden-first-bloom-wide.jpg'
        : 'garden-seed-wide.jpg';
  return (
    <div className="garden-artwork" data-growth-days={days} data-testid="art-garden-growth" role="img" aria-label={homeText(language, `${days} days of garden growth`, `花園已成長 ${days} 天`, `花园已成长 ${days} 天`)}>
      <img className="garden-artwork-image" src={`/images/${imageName}`} alt="" aria-hidden="true" />
      <div className="garden-art-caption"><span>{days === 0 ? homeText(language, 'A seed, ready for you', '一顆種子，等你來照料', '一颗种子，等你来照料') : days >= 30 ? homeText(language, 'A garden in full bloom', '花園盛放', '花园盛放') : days >= 10 ? homeText(language, 'The first flowers are here', '第一朵花已盛開', '第一朵花已盛开') : homeText(language, 'A little more each day', '每天都長大一點', '每天都长大一点')}</span><span>{days} / 30</span></div>
    </div>
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
          <div className="practice-heading"><span className="practice-icon reading-icon"><BookOpen size={18} /></span><div><div className="eyebrow">{tr(language, 'A LITTLE READING', '讀一小段', '读一小段')}</div><h2>{reading.title[language]}</h2></div></div>
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
        <div className="practice-heading"><span className="practice-icon"><Sparkles size={18} /></span><div><div className="eyebrow">{tr(language, 'PLAY & REMEMBER', '玩一玩，記得更牢', '玩一玩，记得更牢')}</div><h2>{tr(language, 'A tiny pinyin match', '拼音小配對', '拼音小配对')}</h2></div></div>
        <label className="pinyin-stage-picker" htmlFor="pinyin-age-stage">
          <span>{tr(language, 'Choose an age stage', '選擇年齡階段', '选择年龄阶段')}</span>
          <select id="pinyin-age-stage" className="select-control" value={normalizeAgeStage(age)} onChange={(event) => onAgeChange(event.target.value)}>
            {ageStages.map((stage, index) => <option key={stage} value={stage}>{copy[language].levelAges[index]}</option>)}
          </select>
        </label>
        {membership.premium && !challenge ? (
          <div role="status">{issueFailed
            ? <>{tr(language, 'This round could not start.', '目前無法開始新的一輪。', '目前无法开始新的一轮。')} <button className="text-next" onClick={restart}>{tr(language, 'Retry', '重試', '重试')}</button></>
            : tr(language, 'Preparing your questions…', '正在準備題目…', '正在准备题目…')}</div>
        ) : null}
        {finished ? (
          <div className="quiz-result">
            <div className="quiz-score">{score}<span> / {gameLength}</span></div>
            <p className="round-xp">+{score * XP_PER_CORRECT} XP</p>
            <p>{tr(language, 'Lovely work. Every try helps a word take root.', '做得真好，每一次練習都讓詞語更熟悉。', '做得真好，每一次练习都让词语更熟悉。')}</p>
            {saveState === 'saving' ? <p role="status">{tr(language, 'Saving XP…', '正在儲存 XP…', '正在保存 XP…')}</p> : null}
            {saveState === 'saved' ? <p role="status">{tr(language, 'XP saved to this stage.', 'XP 已儲存到此階段。', 'XP 已保存到此阶段。')}</p> : null}
            {saveState === 'error' ? <p role="alert">{tr(language, 'Some XP could not be saved.', '部分 XP 未能儲存。', '部分 XP 未能保存。')} <button className="text-next" onClick={retryFailedAnswers}>{tr(language, 'Retry', '重試', '重试')}</button></p> : null}
            <button className="button-secondary" onClick={restart}><RotateCcw size={14} /> {tr(language, 'Play again', '再玩一輪', '再玩一轮')}</button>
          </div>
        ) : current ? (
          <>
            <div className="quiz-question">
              <span className="question-count">{wordCounter(language, round, gameLength)}</span>
              <strong>{current.pinyin}</strong>
              <span>{tr(language, 'Find the matching characters', '找出相配的漢字', '找出相配的汉字')}</span>
            </div>
            <div className="quiz-options">
              {choices.map((choice) => <button key={choice.id} className={`quiz-option ${picked === choice.id ? choice.id === (premiumCurrent?.correctOption ?? current.id) ? 'correct' : 'incorrect' : ''} ${picked && choice.id === (premiumCurrent?.correctOption ?? current.id) ? 'correct' : ''}`} onClick={() => select(choice.id)} disabled={Boolean(picked)}>{language === 'zh-Hans' ? choice.simplified : choice.hanzi}</button>)}
            </div>
            {picked ? (
              <div className={`quiz-feedback ${picked === (premiumCurrent?.correctOption ?? current.id) ? 'good' : ''}`}>
                {picked === (premiumCurrent?.correctOption ?? current.id)
                  ? `${tr(language, 'That’s the one.', '答對了！', '答对了！')}${membership.premium ? ` +${XP_PER_CORRECT} XP` : ''}`
                  : language === 'en'
                    ? `This one is ${current.hanzi}.`
                    : `${tr(language, 'Correct answer:', '答案是：', '答案是：')} ${language === 'zh-Hans' ? current.simplified : current.hanzi}`}
                {membership.premium && saveState === 'saving' ? <span role="status"> · {tr(language, 'Saving…', '儲存中…', '保存中…')}</span> : null}
                {' '}
                <button className="text-next" onClick={advance}>
                  {round === gameLength - 1
                    ? tr(language, 'See results', '看結果', '看结果')
                    : tr(language, 'Next word', '下一個詞語', '下一个词语')}
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : null}
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
  if (!lesson) return <main className="page-shell not-found"><h1>{tr(language, 'That path is not here.', '找不到這條小徑。', '找不到这条小径。')}</h1><Link href="/home" className="button-primary">{t.back}</Link></main>;
  if (lesson.premium) {
    return (
      <main className="page-shell"><div className="lesson-page">
        <Link href="/home" className="button-secondary back-chip"><ArrowLeft size={14} /> {t.back}</Link>
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
        <Link href="/home" className="button-secondary back-chip"><ArrowLeft size={14} /> {t.back}</Link>
        <div className="lesson-player" style={{ marginTop: 18 }}>
      <div className="player-head"><span>{lesson.title[language]} · {done ? lesson.words.length : index + 1} / {lesson.words.length}</span><Link href="/home" className="icon-button" aria-label={t.back}><X size={17} /></Link></div>
          <div className="player-progress"><span style={{ width: `${done ? 100 : ((index + 1) / lesson.words.length) * 100}%` }} /></div>
          {done ? (
            <div className="complete-panel">
              <div className="complete-mark"><Check size={32} /></div>
              <h2>{t.complete}</h2><p className="section-sub">{t.completeHint}</p>
              <div className="button-row" style={{ justifyContent: 'center', marginTop: 22 }}>
                <button className="button-secondary" onClick={() => { setIndex(0); setDone(false); }}><RotateCcw size={15} /> {t.minutes}</button>
                <Link href="/home" className="button-primary">{t.return} <ArrowRight size={15} /></Link>
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
              <div><span>{tr(l, 'Stages complete', '已完成階段', '已完成阶段')}</span><strong data-testid="text-stages-complete">{p.xpByStage.filter((x: number) => x >= XP_COMPLETE).length} / 4</strong></div>
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
