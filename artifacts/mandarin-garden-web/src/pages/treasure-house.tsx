import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, LockKeyhole, Search, Volume2, X } from 'lucide-react';
import { Link } from 'wouter';
import { translateInterface } from '@workspace/learning-content';
import { examTracks, getExamLevel, type ExamTrackId, type ExamWord } from '@/lib/exam-resources';
import { speakMandarin, stopSpeech } from '@/lib/speech';
import type { Language } from '@/lib/garden-data';
import { useExamProgress } from '@/hooks/use-exam-progress';

type Props = { language: Language; track?: string; level?: string };
type GameMode = 'meaning' | 'listening' | 'pinyin';

const localCopy: Record<'zh-Hant' | 'zh-Hans', Record<string, string>> = {
  'zh-Hant': {
    'Chinese Treasure House': '中文寶庫',
    'HSK Resource Library': 'HSK 寶庫',
    'PSC Resource Library': 'PSC 寶庫',
    'Graded Practice': '分級練習',
    'Score: 97 to 100. Standard pronunciation, correct vocabulary and grammar, natural intonation, and fluent expression.': '成績 97 至 100 分｜語音標準，詞彙、語法正確，語調自然，表達流暢。',
    'Score: 92 to under 97. Standard pronunciation and natural, fluent speech, with occasional syllable or tone errors.': '成績 92 分以上、未滿 97 分｜語音標準，語調自然、表達流暢，偶有字音或字調失誤。',
    'Score: 87 to under 92. Pronunciation is generally accurate and fluent; a few difficult sounds may be mispronounced.': '成績 87 分以上、未滿 92 分｜聲韻調大致準確，語調自然、表達流暢，少數難點音偶有失誤。',
    'Score: 80 to under 87. Some tones or sounds are inaccurate; difficult sounds often cause errors, and dialect forms may appear.': '成績 80 分以上、未滿 87 分｜部分聲調或聲韻母未到位，難點音失誤較多，可能出現方言詞或語法。',
    'Score: 70 to under 80. Many initials/finals errors and inaccurate tones; regional accent is noticeable, with some vocabulary or grammar errors.': '成績 70 分以上、未滿 80 分｜聲韻母失誤較多、聲調偏誤明顯，方言語調較突出，詞彙或語法亦有失誤。',
    'Score: 60 to under 70. Frequent pronunciation errors, strong regional accent, and frequent vocabulary or grammar errors.': '成績 60 分以上、未滿 70 分｜聲韻調失誤較多、方音特徵突出，詞彙與語法失誤較多。',
    'Structured Chinese vocabulary, games, and listening for all nine HSK levels.': '依 HSK 一至九級分級的詞語、遊戲練習與聆聽短文。',
    'Vocabulary, games, and listening across three PSC grades and six bands.': '按普通話水平測試三個等級、六個級別安排詞語、遊戲與朗讀練習。',
    'Available': '可開始',
    'Completed': '已完成',
    'Locked': '尚未開放',
    'Level progress': '級別進度',
    'Complete all three games and listen to the article to unlock the next level.': '完成三種遊戲各一輪並聽完短文，才能解鎖下一級。',
    'Trials can access only the first level. Subscribe to unlock more levels.': '試用期間只可進入最低級；訂閱後完成練習即可逐級解鎖。',
    'Complete the previous level before moving on.': '完成上一級後即可進入下一級。',
    'Continue to membership': '前往會員訂閱',
    'Sign in to view your saved level progress.': '登入即可查看已儲存的級別進度。',
    'Progress could not be loaded. Retry.': '無法載入進度，請重試。',
    'All four activities completed.': '四項練習已全部完成。',
    'Start this level': '開始本級練習',
    'Back to Chinese Treasure House': '返回中文寶庫',
    'No subscription or trial is active.': '目前沒有有效的訂閱或試用期。',
    'Choose a learning path': '選擇學習路徑',
    'Choose HSK or PSC first. The next page lets you choose a graded practice level.': '先選擇 HSK 或 PSC 寶庫，再選擇分級練習。',
    'A practical study room for curious learners. Choose a clear level, listen closely, and practise with original materials.': '為中文學習者準備的實用學習空間。先選擇分級，再聆聽原創短文並開始練習。',
    'Loading saved progress…': '正在載入已儲存的進度…',
    'Start another round': '再練習一輪',
    'Could not save progress. Retry.': '無法儲存進度，請重試。',
    'words': '個詞語',
    'levels': '級',
    'A quiet place to grow your Chinese': '讓中文慢慢長進心裡',
    'Browse all levels': '瀏覽所有級別',
    'Pick a path': '選擇路徑',
    'A clear place to begin': '從清楚的級別開始',
    'Every level is open to explore. Start with the one that feels right today.': '每個級別都可以自由探索，從今天最適合你的地方開始。',
    'Explore levels': '探索級別',
    'Words to know': '詞語練習',
    'Short reading': '短文聆聽',
    'Study actions': '開始練習',
    'Search this word bank': '搜尋本級詞語',
    'Search by character, pinyin, or meaning': '以漢字、拼音或意思搜尋',
    'No matching words': '找不到相符詞語',
    'Try another character, sound, or meaning.': '試試其他漢字、拼音或意思。',
    'Listen': '聆聽',
    'Original practice material': '原創練習材料',
    'Play reading': '播放短文',
    'Replay reading': '重新播放',
    'Stop audio': '停止播放',
    'Choose how to practise': '選擇練習方式',
    'Meaning match': '詞義選擇',
    'Listening choice': '聆聽辨詞',
    'Pinyin recognition': '拼音辨認',
    'Which meaning fits this word?': '這個詞語是什麼意思？',
    'Which word did you hear?': '你聽到的是哪個詞語？',
    'Choose the matching pinyin': '選出相符的拼音',
    'Play the sound': '播放發音',
    'Check another': '再試一題',
    'Correct': '答對了',
    'Not quite. The answer is': '再想一想，正確答案是',
    'Question': '題目',
    'of': '／',
    'Script': '字體',
    'Simplified': '簡體',
    'Traditional': '繁體',
    'Back to paths': '返回路徑',
    'Study this level': '開始本級練習',
    'Level not found': '找不到這個級別',
    'We could not find that track and level. Choose a path below to continue.': '找不到這個路徑和級別。請從下方選擇學習路徑。',
    'Speech is unavailable in this browser. You can still read and browse the material.': '此瀏覽器無法使用語音播放，你仍可閱讀和瀏覽練習內容。',
    'Ready to listen': '準備聆聽',
    'Speaking…': '播放中…',
    'Audio stopped': '已停止播放',
    'Independent practice materials': '獨立練習材料',
    'The words and reading are practice materials, not a complete official list or official test passage.': '詞語與短文為練習材料，並非完整官方詞表或官方測試篇章。',
    'Putonghua Proficiency Test (PSC)': '普通話水平測試（PSC）',
  },
  'zh-Hans': {
    'Chinese Treasure House': '中文宝库',
    'HSK Resource Library': 'HSK 宝库',
    'PSC Resource Library': 'PSC 宝库',
    'Graded Practice': '分级练习',
    'Score: 97 to 100. Standard pronunciation, correct vocabulary and grammar, natural intonation, and fluent expression.': '成绩 97 至 100 分｜语音标准，词汇、语法正确，语调自然，表达流畅。',
    'Score: 92 to under 97. Standard pronunciation and natural, fluent speech, with occasional syllable or tone errors.': '成绩 92 分以上、未满 97 分｜语音标准，语调自然、表达流畅，偶有字音或字调失误。',
    'Score: 87 to under 92. Pronunciation is generally accurate and fluent; a few difficult sounds may be mispronounced.': '成绩 87 分以上、未满 92 分｜声韵调大致准确，语调自然、表达流畅，少数难点音偶有失误。',
    'Score: 80 to under 87. Some tones or sounds are inaccurate; difficult sounds often cause errors, and dialect forms may appear.': '成绩 80 分以上、未满 87 分｜部分声调或声韵母不到位，难点音失误较多，可能出现方言词或语法。',
    'Score: 70 to under 80. Many initials/finals errors and inaccurate tones; regional accent is noticeable, with some vocabulary or grammar errors.': '成绩 70 分以上、未满 80 分｜声韵母失误较多、声调偏误明显，方言语调较突出，词汇或语法也有失误。',
    'Score: 60 to under 70. Frequent pronunciation errors, strong regional accent, and frequent vocabulary or grammar errors.': '成绩 60 分以上、未满 70 分｜声韵调失误较多、方音特征突出，词汇与语法失误较多。',
    'Structured Chinese vocabulary, games, and listening for all nine HSK levels.': '按 HSK 一至九级分级的词语、游戏练习与聆听短文。',
    'Vocabulary, games, and listening across three PSC grades and six bands.': '按普通话水平测试三个等第、六个级别安排词语、游戏与朗读练习。',
    'Available': '可开始',
    'Completed': '已完成',
    'Locked': '尚未开放',
    'Level progress': '级别进度',
    'Complete all three games and listen to the article to unlock the next level.': '完成三种游戏各一轮并听完短文，才能解锁下一级。',
    'Trials can access only the first level. Subscribe to unlock more levels.': '试用期间只能进入最低级；订阅后完成练习即可逐级解锁。',
    'Complete the previous level before moving on.': '完成上一级后即可进入下一级。',
    'Continue to membership': '前往会员订阅',
    'Sign in to view your saved level progress.': '登录即可查看已保存的级别进度。',
    'Progress could not be loaded. Retry.': '无法加载进度，请重试。',
    'All four activities completed.': '四项练习已全部完成。',
    'Start this level': '开始本级练习',
    'Back to Chinese Treasure House': '返回中文宝库',
    'No subscription or trial is active.': '目前没有有效的订阅或试用期。',
    'Choose a learning path': '选择学习路径',
    'Choose HSK or PSC first. The next page lets you choose a graded practice level.': '先选择 HSK 或 PSC 宝库，再选择分级练习。',
    'A practical study room for curious learners. Choose a clear level, listen closely, and practise with original materials.': '为中文学习者准备的实用学习空间。先选择分级，再聆听原创短文并开始练习。',
    'Loading saved progress…': '正在加载已保存的进度…',
    'Start another round': '再练习一轮',
    'Could not save progress. Retry.': '无法保存进度，请重试。',
    'words': '个词语',
    'levels': '级',
    'A quiet place to grow your Chinese': '让中文慢慢长进心里',
    'Browse all levels': '浏览所有级别',
    'Pick a path': '选择路径',
    'A clear place to begin': '从清楚的级别开始',
    'Every level is open to explore. Start with the one that feels right today.': '每个级别都可以自由探索，从今天最适合你的地方开始。',
    'Explore levels': '探索级别',
    'Words to know': '词语练习',
    'Short reading': '短文聆听',
    'Study actions': '开始练习',
    'Search this word bank': '搜索本级词语',
    'Search by character, pinyin, or meaning': '按汉字、拼音或意思搜索',
    'No matching words': '找不到匹配词语',
    'Try another character, sound, or meaning.': '试试其他汉字、拼音或意思。',
    'Listen': '聆听',
    'Original practice material': '原创练习材料',
    'Play reading': '播放短文',
    'Replay reading': '重新播放',
    'Stop audio': '停止播放',
    'Choose how to practise': '选择练习方式',
    'Meaning match': '词义选择',
    'Listening choice': '聆听辨词',
    'Pinyin recognition': '拼音辨认',
    'Which meaning fits this word?': '这个词语是什么意思？',
    'Which word did you hear?': '你听到的是哪个词语？',
    'Choose the matching pinyin': '选出匹配的拼音',
    'Play the sound': '播放发音',
    'Check another': '再试一题',
    'Correct': '答对了',
    'Not quite. The answer is': '再想一想，正确答案是',
    'Question': '题目',
    'of': '／',
    'Script': '字体',
    'Simplified': '简体',
    'Traditional': '繁体',
    'Back to paths': '返回路径',
    'Study this level': '开始本级练习',
    'Level not found': '找不到这个级别',
    'We could not find that track and level. Choose a path below to continue.': '找不到这个路径和级别。请从下方选择学习路径。',
    'Speech is unavailable in this browser. You can still read and browse the material.': '此浏览器无法使用语音播放，你仍可阅读和浏览练习内容。',
    'Ready to listen': '准备聆听',
    'Speaking…': '播放中…',
    'Audio stopped': '已停止播放',
    'Independent practice materials': '独立练习材料',
    'The words and reading are practice materials, not a complete official list or official test passage.': '词语与短文为练习材料，并非完整官方词表或官方测试篇章。',
    'Putonghua Proficiency Test (PSC)': '普通话水平测试（PSC）',
  },
};

function label(language: Language, english: string) {
  if (language === 'zh-Hant' || language === 'zh-Hans') return localCopy[language][english] ?? translateInterface(language, english);
  return language === 'en' ? english : translateInterface(language, english);
}

function trackName(language: Language, trackId: ExamTrackId, defaultName: string) {
  return label(language, trackId === 'hsk' ? 'HSK Resource Library' : 'PSC Resource Library') || defaultName;
}

function trackDescription(language: Language, trackId: ExamTrackId) {
  return label(language, trackId === 'hsk'
    ? 'Structured Chinese vocabulary, games, and listening for all nine HSK levels.'
    : 'Vocabulary, games, and listening across three PSC grades and six bands.');
}

function levelProgressFor(
  data: ReturnType<typeof useExamProgress>['progress'],
  trackId: ExamTrackId,
  levelId: string,
) {
  return data?.tracks.find((track) => track.trackId === trackId)?.levels.find((level) => level.levelId === levelId);
}

function asTrackId(value?: string): ExamTrackId | null {
  return value === 'hsk' || value === 'psc' ? value : null;
}

export function TreasureHousePage({ language, track: routeTrack, level: routeLevel }: Props) {
  const { isLoaded, isSignedIn, user } = useUser();
  const memberProgress = useExamProgress(user?.id ?? null, Boolean(isSignedIn));
  const [script, setScript] = useState<'simp' | 'trad'>(language === 'zh-Hant' ? 'trad' : 'simp');
  const [speechStatus, setSpeechStatus] = useState<'ready' | 'speaking' | 'stopped' | 'unavailable'>('ready');
  const [search, setSearch] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('meaning');
  const [questionIndexByMode, setQuestionIndexByMode] = useState<Record<GameMode, number>>({ meaning: 0, listening: 0, pinyin: 0 });
  const [answer, setAnswer] = useState<string | null>(null);
  const [failedActivity, setFailedActivity] = useState<GameMode | 'article' | null>(null);
  useEffect(() => {
    setScript(language === 'zh-Hant' ? 'trad' : 'simp');
  }, [language]);
  useEffect(() => () => stopSpeech(), []);

  const trackId = asTrackId(routeTrack);
  const selected = trackId && routeLevel ? getExamLevel(trackId, routeLevel) : null;
  const isDetailRoute = Boolean(routeTrack || routeLevel);
  const activeTrack = selected?.track ?? (trackId ? examTracks[trackId] : null);
  const activeLevel = selected?.level ?? null;
  const scriptText = (word: ExamWord) => script === 'simp' ? word.simplified : word.traditional;
  const tier = memberProgress.progress?.membershipTier ?? 'none';
  const currentLevelProgress = trackId && routeLevel ? levelProgressFor(memberProgress.progress, trackId, routeLevel) : undefined;
  const canOpenLevel = currentLevelProgress?.status === 'available' || currentLevelProgress?.status === 'completed';
  const speak = (text: string, onEnd?: () => void) => {
    const started = speakMandarin(text, script, () => { setSpeechStatus('ready'); onEnd?.(); }, () => setSpeechStatus('unavailable'));
    setSpeechStatus(started ? 'speaking' : 'unavailable');
  };
  const saveActivity = async (activity: GameMode | 'article') => {
    if (!trackId || !routeLevel) return false;
    setFailedActivity(null);
    try {
      await memberProgress.recordActivity({ trackId, levelId: routeLevel, activity });
      return true;
    } catch {
      setFailedActivity(activity);
      return false;
    }
  };
  const stop = () => {
    stopSpeech();
    setSpeechStatus('stopped');
  };
  const filteredWords = useMemo(() => {
    if (!activeLevel) return [];
    const query = search.trim().toLocaleLowerCase();
    return query ? activeLevel.words.filter((word) =>
      `${word.simplified} ${word.traditional} ${word.pinyin} ${word.meaning}`.toLocaleLowerCase().includes(query),
    ) : activeLevel.words;
  }, [activeLevel, search]);

  const questionIndex = questionIndexByMode[gameMode];
  useEffect(() => {
    setSearch('');
    setAnswer(null);
    setQuestionIndexByMode({ meaning: 0, listening: 0, pinyin: 0 });
    setFailedActivity(null);
  }, [routeTrack, routeLevel]);

  if (isDetailRoute && routeLevel && !selected) {
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <section className="treasure-not-found" role="alert" data-testid="status-level-not-found">
          <span className="treasure-kicker">{label(language, 'Chinese Treasure House')}</span>
          <h1>{label(language, 'Level not found')}</h1>
          <p>{label(language, 'We could not find that track and level. Choose a path below to continue.')}</p>
          <Link href="/treasure-house" className="treasure-action" data-testid="link-treasure-recovery"><ArrowLeft size={16} />{label(language, 'Back to paths')}</Link>
        </section>
      </main>
    );
  }

  if (!routeTrack) {
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <section className="treasure-hero">
          <div className="treasure-hero-copy">
            <p className="treasure-eyebrow">{label(language, 'Choose a learning path')}</p>
            <h1>{label(language, 'Chinese Treasure House')}</h1>
            <p>{label(language, 'A practical study room for curious learners. Choose a clear level, listen closely, and practise with original materials.')}</p>
          </div>
          <div className="treasure-hero-mark" aria-hidden="true">
            <span className="treasure-orbit orbit-a" /><span className="treasure-orbit orbit-b" />
            <span className="treasure-seal"><BookOpen size={36} strokeWidth={1.4} /></span>
            <span className="treasure-seal-caption">{label(language, 'Chinese Treasure House')}</span>
          </div>
        </section>
        <section className="treasure-path-grid" aria-label={label(language, 'Pick a path')}>
          {(['hsk', 'psc'] as ExamTrackId[]).map((id, index) => (
            <Link key={id} href={`/treasure-house/${id}`} className="treasure-path-tab treasure-path-card" data-testid={`link-track-${id}`}>
              <span className="treasure-tab-index">0{index + 1}</span>
              <span>
                <strong>{trackName(language, id, examTracks[id].name)}</strong>
                <small>{trackDescription(language, id)}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </section>
        <p className="treasure-track-flow-note">{label(language, 'Choose HSK or PSC first. The next page lets you choose a graded practice level.')}</p>
      </main>
    );
  }

  if (!trackId || !activeTrack) {
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <section className="treasure-not-found" role="alert">
          <h1>{label(language, 'Level not found')}</h1>
          <Link href="/treasure-house" className="treasure-action"><ArrowLeft size={16} />{label(language, 'Back to Chinese Treasure House')}</Link>
        </section>
      </main>
    );
  }

  if (!routeLevel) {
    const trackProgress = memberProgress.progress?.tracks.find((item) => item.trackId === trackId);
    const loading = !isLoaded || (Boolean(isSignedIn) && memberProgress.isLoading);
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <div className="treasure-detail-top">
          <Link href="/treasure-house" className="treasure-back-link" data-testid="link-back-to-tracks"><ArrowLeft size={16} />{label(language, 'Back to Chinese Treasure House')}</Link>
        </div>
        <section className="treasure-track-heading">
          <p className="treasure-eyebrow">{label(language, 'Chinese Treasure House')}</p>
          <h1>{trackName(language, trackId, activeTrack.name)}</h1>
          <p>{trackDescription(language, trackId)}</p>
        </section>
        <section className="treasure-level-section" aria-labelledby="treasure-level-heading">
          <div className="treasure-section-head">
            <div>
              <p className="treasure-eyebrow">{label(language, 'Graded Practice')}</p>
              <h2 id="treasure-level-heading">{label(language, 'Graded Practice')}</h2>
              <p>{label(language, 'Complete all three games and listen to the article to unlock the next level.')}</p>
            </div>
            <span className="treasure-count">{activeTrack.levels.length} <small>{label(language, 'levels')}</small></span>
          </div>
          {loading ? <p className="treasure-progress-message" role="status">{label(language, 'Loading saved progress…')}</p> : null}
          {memberProgress.isError && isSignedIn ? (
            <div className="treasure-gate-message" role="alert">
              <p>{label(language, 'Progress could not be loaded. Retry.')}</p>
              <button className="treasure-action" onClick={() => void memberProgress.refetch()} data-testid="button-retry-exam-progress">{label(language, 'Try again')}</button>
            </div>
          ) : null}
          <div className={`treasure-level-list ${trackId === 'psc' ? 'psc-level-list' : ''}`} data-testid="list-graded-practice">
            {activeTrack.levels.map((item, index) => {
              const itemProgress = levelProgressFor(memberProgress.progress, trackId, item.id);
              const status = itemProgress?.status ?? 'locked';
              const completedCount = itemProgress?.completedCount ?? 0;
              return (
                <Link key={item.id} href={`/treasure-house/${trackId}/${item.id}`} className={`treasure-level-card treasure-level-card-${status}`} data-testid={`link-level-${trackId}-${item.id}`}>
                  <span className="treasure-level-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="treasure-level-copy">
                    <strong>{item.label}</strong>
                    <small>{label(language, item.description)}</small>
                    <span className="treasure-level-progress-label">{label(language, 'Level progress')} · {completedCount}/4</span>
                    <span className="treasure-progress-track"><span style={{ width: `${completedCount * 25}%` }} /></span>
                  </span>
                  <span className={`treasure-level-status status-${status}`}>
                    {status === 'completed' ? <Check size={13} /> : status === 'locked' ? <LockKeyhole size={13} /> : null}
                    {label(language, status === 'completed' ? 'Completed' : status === 'available' ? 'Available' : 'Locked')}
                  </span>
                  <ArrowRight className="treasure-level-arrow" size={18} />
                </Link>
              );
            })}
          </div>
          {memberProgress.progress?.membershipTier === 'trial' ? (
            <div className="treasure-notice" role="note" data-testid="status-trial-limit">
              <span className="treasure-notice-mark">i</span>
              <p>{label(language, 'Trials can access only the first level. Subscribe to unlock more levels.')}</p>
              <Link href="/membership" className="treasure-action" data-testid="link-trial-membership">{label(language, 'Continue to membership')}<ArrowRight size={14} /></Link>
            </div>
          ) : memberProgress.progress?.membershipTier === 'none' ? (
            <div className="treasure-gate-message" role="note" data-testid="status-membership-required">
              <p>{isSignedIn ? label(language, 'No subscription or trial is active.') : label(language, 'Sign in to view your saved level progress.')}</p>
              <div className="button-row">
                {isSignedIn
                  ? <Link href="/membership" className="treasure-action" data-testid="link-exam-membership">{label(language, 'Continue to membership')}<ArrowRight size={15} /></Link>
                  : <><Link href="/sign-in" className="treasure-action" data-testid="link-exam-sign-in">{label(language, 'Sign in')}</Link><Link href="/register" className="button-secondary" data-testid="link-exam-register">{label(language, 'Create an account')}</Link></>}
              </div>
            </div>
          ) : null}
          <div className="treasure-notice" role="note" data-testid="status-track-notice">
            <span className="treasure-notice-mark">i</span>
            <p>{label(language, activeTrack.notice)}</p>
            <a href={activeTrack.sourceUrl} target="_blank" rel="noreferrer" data-testid={`link-source-${trackId}`}>{label(language, activeTrack.sourceLabel)}<ArrowRight size={14} /></a>
          </div>
        </section>
      </main>
    );
  }

  if (!activeLevel) return null;
  if (!isLoaded || (isSignedIn && memberProgress.isLoading)) {
    return <main className="page-shell treasure-page" data-testid="treasure-house"><p role="status">{label(language, 'Loading saved progress…')}</p></main>;
  }
  if (memberProgress.isError && isSignedIn) {
    return <main className="page-shell treasure-page" data-testid="treasure-house"><div className="treasure-gate-message" role="alert"><p>{label(language, 'Progress could not be loaded. Retry.')}</p><button className="treasure-action" onClick={() => void memberProgress.refetch()} data-testid="button-retry-exam-progress">{label(language, 'Try again')}</button></div></main>;
  }
  if (!canOpenLevel) {
    const gateText = tier === 'trial'
      ? label(language, 'Trials can access only the first level. Subscribe to unlock more levels.')
      : tier === 'subscribed'
        ? label(language, 'Complete the previous level before moving on.')
        : isSignedIn
          ? label(language, 'No subscription or trial is active.')
          : label(language, 'Sign in to view your saved level progress.');
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <section className="treasure-gate" data-testid="panel-level-locked">
          <span className="treasure-gate-icon"><LockKeyhole size={22} /></span>
          <p className="treasure-eyebrow">{label(language, 'Graded Practice')}</p>
          <h1>{label(language, 'Locked')}</h1>
          <p>{gateText}</p>
          <Link href={`/treasure-house/${trackId}`} className="treasure-back-link" data-testid="link-locked-levels"><ArrowLeft size={16} />{label(language, 'Graded Practice')}</Link>
          <div className="button-row">
            {isSignedIn
              ? (tier === 'none' || tier === 'trial') && <Link href="/membership" className="treasure-action" data-testid="link-locked-membership">{label(language, 'Continue to membership')}<ArrowRight size={15} /></Link>
              : <><Link href="/sign-in" className="treasure-action" data-testid="link-locked-sign-in">{label(language, 'Sign in')}</Link><Link href="/register" className="button-secondary">{label(language, 'Create an account')}</Link></>}
          </div>
        </section>
      </main>
    );
  }

  const words = activeLevel.words;
  const targetIndex = questionIndex % words.length;
  const target = words[targetIndex];
  const distractors = words.filter((word) => word.id !== target.id);
  const rotatedDistractors = distractors.length
    ? [...distractors.slice(questionIndex % distractors.length), ...distractors.slice(0, questionIndex % distractors.length)]
    : [];
  const answerChoices = [target, ...rotatedDistractors.slice(0, 3)];
  const choiceOffset = (targetIndex + questionIndex + 1) % answerChoices.length;
  const choices = [...answerChoices.slice(choiceOffset), ...answerChoices.slice(0, choiceOffset)];
  const correctValue = gameMode === 'meaning' ? target.meaning : gameMode === 'pinyin' ? target.pinyin : target.id;
  const gamePrompt = gameMode === 'meaning'
    ? label(language, 'Which meaning fits this word?')
    : gameMode === 'listening' ? label(language, 'Which word did you hear?') : label(language, 'Choose the matching pinyin');
  const completedActivities = currentLevelProgress?.completedActivities ?? [];
  const completeRound = () => {
    setQuestionIndexByMode((current) => ({
      ...current,
      [gameMode]: targetIndex === words.length - 1 ? 0 : targetIndex + 1,
    }));
    setAnswer(null);
  };
  const handleAnswer = (value: string) => {
    if (answer !== null) return;
    setAnswer(value);
    if (targetIndex === words.length - 1) void saveActivity(gameMode);
  };

  return (
    <main className="page-shell treasure-page treasure-detail" data-testid="treasure-house">
      <div className="treasure-detail-top">
        <Link href={`/treasure-house/${trackId}`} className="treasure-back-link" data-testid="link-back-to-tracks"><ArrowLeft size={16} />{label(language, 'Graded Practice')}</Link>
        <div className="treasure-script-toggle" role="group" aria-label={label(language, 'Script')}>
          <span>{label(language, 'Script')}</span>
          <button type="button" onClick={() => setScript('simp')} aria-pressed={script === 'simp'} data-testid="button-script-simplified">{label(language, 'Simplified')}</button>
          <button type="button" onClick={() => setScript('trad')} aria-pressed={script === 'trad'} data-testid="button-script-traditional">{label(language, 'Traditional')}</button>
        </div>
      </div>
      <header className="treasure-detail-heading">
        <p className="treasure-eyebrow">{trackName(language, trackId, activeTrack.name)} <span>/</span> {label(language, 'Graded Practice')}</p>
        <h1>{activeLevel.label}</h1>
        <p>{label(language, activeLevel.description)}</p>
        <div className="treasure-detail-tags"><span>{words.length} {label(language, 'words')}</span><span>{label(language, 'Original practice material')}</span></div>
        <div className="treasure-level-progress-summary" data-testid="status-level-progress">
          <div><span>{label(language, 'Level progress')}</span><strong>{currentLevelProgress?.completedCount ?? 0}/4</strong></div>
          <span className="treasure-progress-track"><span style={{ width: `${(currentLevelProgress?.completedCount ?? 0) * 25}%` }} /></span>
          <p>{currentLevelProgress?.status === 'completed'
            ? label(language, 'All four activities completed.')
            : label(language, 'Complete all three games and listen to the article to unlock the next level.')}</p>
        </div>
      </header>
      <div className="treasure-content-grid">
        <section className="treasure-panel treasure-words-panel" aria-labelledby="treasure-words-title">
          <div className="treasure-panel-heading">
            <div><p className="treasure-eyebrow">{label(language, 'Study actions')}</p><h2 id="treasure-words-title">{label(language, 'Words to know')}</h2></div>
            <span className="treasure-panel-count">{filteredWords.length} / {words.length}</span>
          </div>
          <label className="treasure-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">{label(language, 'Search this word bank')}</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={label(language, 'Search by character, pinyin, or meaning')} data-testid="input-word-search" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label={label(language, 'Clear search')} data-testid="button-clear-search"><X size={15} /></button>}
          </label>
          <div className="treasure-word-list" data-testid="list-word-bank">
            {filteredWords.length ? filteredWords.map((word) => (
              <article className="treasure-word-row" key={word.id} data-testid={`word-row-${word.id}`}>
                <div className="treasure-word-main"><strong lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'}>{scriptText(word)}</strong><span>{word.pinyin}</span></div>
                <p>{word.meaning}</p>
                <button type="button" className="treasure-audio-button" aria-label={`${label(language, 'Listen')}: ${scriptText(word)}`} onClick={() => speak(word.simplified)} data-testid={`button-word-audio-${word.id}`}><Volume2 size={17} /><span>{label(language, 'Listen')}</span></button>
              </article>
            )) : <div className="treasure-empty" data-testid="status-no-words"><strong>{label(language, 'No matching words')}</strong><p>{label(language, 'Try another character, sound, or meaning.')}</p></div>}
          </div>
        </section>

        <div className="treasure-side-column">
          <section className="treasure-reading-card" aria-labelledby="treasure-reading-title">
            <div className="treasure-reading-top"><span className="treasure-reading-icon"><BookOpen size={19} /></span><span>{label(language, 'Short reading')}</span></div>
            <p className="treasure-eyebrow">{label(language, 'Original practice material')}</p>
            <h2 id="treasure-reading-title">{script === 'simp' ? activeLevel.article.titleSimplified ?? activeLevel.article.title : activeLevel.article.title}</h2>
            <p className="treasure-reading-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'}>{script === 'simp' ? activeLevel.article.simplified : activeLevel.article.traditional}</p>
            <div className="treasure-reading-actions">
              <button type="button" className="treasure-play-button" onClick={() => speak(activeLevel.article.simplified, () => { void saveActivity('article'); })} data-testid="button-play-reading"><Volume2 size={17} />{speechStatus === 'speaking' ? label(language, 'Replay reading') : label(language, 'Play reading')}</button>
              <button type="button" className="treasure-stop-button" onClick={stop} data-testid="button-stop-reading"><X size={15} />{label(language, 'Stop audio')}</button>
            </div>
            <p className={`treasure-speech-status ${speechStatus === 'unavailable' ? 'is-error' : ''}`} role={speechStatus === 'unavailable' ? 'alert' : 'status'} data-testid="status-speech">{speechStatus === 'unavailable' ? label(language, 'Speech is unavailable in this browser. You can still read and browse the material.') : label(language, speechStatus === 'speaking' ? 'Speaking…' : speechStatus === 'stopped' ? 'Audio stopped' : 'Ready to listen')}</p>
            {completedActivities.includes('article') ? <p className="treasure-activity-complete" data-testid="status-article-complete"><Check size={14} />{label(language, 'Completed')}</p> : null}
          </section>
          <section className="treasure-game-card" aria-labelledby="treasure-game-title">
            <div className="treasure-panel-heading">
              <div><p className="treasure-eyebrow">{label(language, 'Study actions')}</p><h2 id="treasure-game-title">{label(language, 'Choose how to practise')}</h2></div>
              <span className="treasure-game-mark"><Headphones size={19} /></span>
            </div>
            <div className="treasure-game-tabs" role="group" aria-label={label(language, 'Choose how to practise')}>
              {(['meaning', 'listening', 'pinyin'] as GameMode[]).map((mode) => (
                <button type="button" key={mode} aria-pressed={gameMode === mode} className={gameMode === mode ? 'is-selected' : ''} onClick={() => { setGameMode(mode); setAnswer(null); }} data-testid={`button-game-mode-${mode}`}>{label(language, mode === 'meaning' ? 'Meaning match' : mode === 'listening' ? 'Listening choice' : 'Pinyin recognition')}{completedActivities.includes(mode) ? <Check size={12} /> : null}</button>
              ))}
            </div>
            <div className="treasure-question" aria-live="polite">
              <span className="treasure-question-count">{label(language, 'Question')} {questionIndex + 1} {label(language, 'of')} {words.length}</span>
              {gameMode === 'listening' ? (
                <button type="button" className="treasure-listen-prompt" onClick={() => speak(target.simplified)} data-testid="button-game-listen"><Volume2 size={21} /><span>{label(language, 'Play the sound')}</span></button>
              ) : <strong className="treasure-question-word" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'}>{scriptText(target)}</strong>}
              <p>{gamePrompt}</p>
            </div>
            <div className="treasure-answer-options">
              {choices.map((word) => {
                const value = gameMode === 'meaning' ? word.meaning : gameMode === 'pinyin' ? word.pinyin : word.id;
                const visible = gameMode === 'meaning' ? word.meaning : gameMode === 'pinyin' ? word.pinyin : scriptText(word);
                const isCorrect = value === correctValue;
                const stateClass = answer === null ? '' : isCorrect ? 'is-correct' : answer === value ? 'is-wrong' : '';
                return <button type="button" key={word.id} className={`treasure-answer-option ${stateClass}`} onClick={() => handleAnswer(value)} disabled={answer !== null} data-testid={`button-answer-${word.id}`}>
                  {answer === value && isCorrect ? <Check size={15} /> : null}{visible}
                </button>;
              })}
            </div>
            {answer !== null && <div className={`treasure-answer-feedback ${answer === correctValue ? 'is-correct' : 'is-wrong'}`} role="status" data-testid="status-game-feedback">
              {answer === correctValue ? label(language, 'Correct') : `${label(language, 'Not quite. The answer is')} ${gameMode === 'meaning' ? target.meaning : gameMode === 'pinyin' ? target.pinyin : scriptText(target)}`}
            </div>}
            {answer !== null && <button type="button" className="treasure-next-question" onClick={completeRound} data-testid="button-next-question">{targetIndex === words.length - 1 ? label(language, 'Start another round') : label(language, 'Check another')}<ArrowRight size={15} /></button>}
            {failedActivity ? <div className="treasure-activity-error" role="alert" data-testid="status-activity-save-error"><span>{label(language, 'Could not save progress. Retry.')}</span><button type="button" onClick={() => void saveActivity(failedActivity)} data-testid="button-retry-activity">{label(language, 'Try again')}</button></div> : null}
          </section>
        </div>
      </div>
      <aside className="treasure-source-note" role="note" data-testid="status-detail-notice">
        <span className="treasure-notice-mark">i</span><p>{label(language, activeTrack.notice)}</p>
        <a href={activeTrack.sourceUrl} target="_blank" rel="noreferrer" data-testid="link-detail-source">{label(language, activeTrack.sourceLabel)}<ArrowRight size={14} /></a>
      </aside>
    </main>
  );
}

export default TreasureHousePage;
