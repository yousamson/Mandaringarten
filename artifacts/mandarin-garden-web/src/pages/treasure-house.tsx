import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, LockKeyhole, Search, Volume2, X } from 'lucide-react';
import { Link } from 'wouter';
import { translateInterface } from '@workspace/learning-content';
import { examTracks, getExamLevel, type ExamLevel, type ExamTrackId, type ExamWord } from '@/lib/exam-resources';
import { speakMandarin, stopSpeech } from '@/lib/speech';
import type { Language } from '@/lib/garden-data';
import { useExamProgress } from '@/hooks/use-exam-progress';

type Props = { language: Language; track?: string; level?: string };
type GameMode = 'meaning' | 'listening' | 'pinyin';
type ActivityId = GameMode | 'sentence' | 'article';

const localCopy: Record<'zh-Hant' | 'zh-Hans', Record<string, string>> = {
  'zh-Hant': {
    'Chinese Treasure House': '中文寶庫',
    'HSK Resource Library': 'HSK 寶庫',
    'PSC Resource Library': 'PSC 寶庫',
    'ACTFL Resource Library': 'ACTFL 寶庫',
    'TOCFL Resource Library': 'TOCFL 寶庫',
    'Graded Practice': '分級練習',
    'Score: 97 to 100. Standard pronunciation, correct vocabulary and grammar, natural intonation, and fluent expression.': '成績 97 至 100 分｜語音標準，詞彙、語法正確，語調自然，表達流暢。',
    'Score: 92 to under 97. Standard pronunciation and natural, fluent speech, with occasional syllable or tone errors.': '成績 92 分以上、未滿 97 分｜語音標準，語調自然、表達流暢，偶有字音或字調失誤。',
    'Score: 87 to under 92. Pronunciation is generally accurate and fluent; a few difficult sounds may be mispronounced.': '成績 87 分以上、未滿 92 分｜聲韻調大致準確，語調自然、表達流暢，少數難點音偶有失誤。',
    'Score: 80 to under 87. Some tones or sounds are inaccurate; difficult sounds often cause errors, and dialect forms may appear.': '成績 80 分以上、未滿 87 分｜部分聲調或聲韻母未到位，難點音失誤較多，可能出現方言詞或語法。',
    'Score: 70 to under 80. Many initials/finals errors and inaccurate tones; regional accent is noticeable, with some vocabulary or grammar errors.': '成績 70 分以上、未滿 80 分｜聲韻母失誤較多、聲調偏誤明顯，方言語調較突出，詞彙或語法亦有失誤。',
    'Score: 60 to under 70. Frequent pronunciation errors, strong regional accent, and frequent vocabulary or grammar errors.': '成績 60 分以上、未滿 70 分｜聲韻調失誤較多、方音特徵突出，詞彙與語法失誤較多。',
    'Structured Chinese vocabulary, games, sentence practice, and readings for all nine HSK levels.': '依 HSK 一至九級提供詞語、遊戲、句子練習與分級閱讀。',
    'Vocabulary, games, sentence practice, and readings across three PSC grades and six bands.': '按普通話水平測試三個等級、六個級別安排詞語、遊戲、句子練習與閱讀。',
    'ACTFL practice across four proficiency bands and ten steps.': 'ACTFL 練習分為初級、中級、高級、卓越級四組，共十個進度級別。',
    'TOCFL practice across four site-designed bands and eight steps.': 'TOCFL 練習採用本平台設計的四組級別，共八個進度級別。',
    'Available': '可開始',
    'Completed': '已完成',
    'Locked': '尚未開放',
    'Level progress': '級別進度',
    'Complete all three games, sentence practice, and the reading to unlock the next level.': '完成三種遊戲、句子練習及文章聆聽，才能解鎖下一級。',
    'Trials can access only the first level. Subscribe to unlock more levels.': '試用期間只可進入最低級；訂閱後完成練習即可逐級解鎖。',
    'Complete the previous level before moving on.': '完成上一級後即可進入下一級。',
    'Continue to membership': '前往會員訂閱',
    'Sign in to view your saved level progress.': '登入即可查看已儲存的級別進度。',
    'Progress could not be loaded. Retry.': '無法載入進度，請重試。',
    'All five activities completed.': '五項練習已全部完成。',
    'Start this level': '開始本級練習',
    'Back to Chinese Treasure House': '返回中文寶庫',
    'No subscription or trial is active.': '目前沒有有效的訂閱或試用期。',
    'Choose a learning path': '選擇學習路徑',
    'Choose HSK, PSC, ACTFL, or TOCFL first, then choose a graded practice level.': '先選擇 HSK、PSC、ACTFL 或 TOCFL 寶庫，再選擇分級練習。',
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
    'Reading and listening': '文章閱讀與聆聽',
    'characters': '字',
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
    'Sentence practice': '句子練習',
    'Complete the sentence': '完成句子',
    'Choose a word to complete the sentence.': '選擇合適詞語填入句子。',
    'Sentence': '句子',
    'Try again': '再試一次',
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
    'ACTFL Resource Library': 'ACTFL 宝库',
    'TOCFL Resource Library': 'TOCFL 宝库',
    'Graded Practice': '分级练习',
    'Score: 97 to 100. Standard pronunciation, correct vocabulary and grammar, natural intonation, and fluent expression.': '成绩 97 至 100 分｜语音标准，词汇、语法正确，语调自然，表达流畅。',
    'Score: 92 to under 97. Standard pronunciation and natural, fluent speech, with occasional syllable or tone errors.': '成绩 92 分以上、未满 97 分｜语音标准，语调自然、表达流畅，偶有字音或字调失误。',
    'Score: 87 to under 92. Pronunciation is generally accurate and fluent; a few difficult sounds may be mispronounced.': '成绩 87 分以上、未满 92 分｜声韵调大致准确，语调自然、表达流畅，少数难点音偶有失误。',
    'Score: 80 to under 87. Some tones or sounds are inaccurate; difficult sounds often cause errors, and dialect forms may appear.': '成绩 80 分以上、未满 87 分｜部分声调或声韵母不到位，难点音失误较多，可能出现方言词或语法。',
    'Score: 70 to under 80. Many initials/finals errors and inaccurate tones; regional accent is noticeable, with some vocabulary or grammar errors.': '成绩 70 分以上、未满 80 分｜声韵母失误较多、声调偏误明显，方言语调较突出，词汇或语法也有失误。',
    'Score: 60 to under 70. Frequent pronunciation errors, strong regional accent, and frequent vocabulary or grammar errors.': '成绩 60 分以上、未满 70 分｜声韵调失误较多、方音特征突出，词汇与语法失误较多。',
    'Structured Chinese vocabulary, games, sentence practice, and readings for all nine HSK levels.': '按 HSK 一至九级提供词语、游戏、句子练习与分级阅读。',
    'Vocabulary, games, sentence practice, and readings across three PSC grades and six bands.': '按普通话水平测试三个等第、六个级别安排词语、游戏、句子练习与阅读。',
    'ACTFL practice across four proficiency bands and ten steps.': 'ACTFL 练习分为初级、中级、高级、卓越级四组，共十个进度级别。',
    'TOCFL practice across four site-designed bands and eight steps.': 'TOCFL 练习采用本平台设计的四组级别，共八个进度级别。',
    'Available': '可开始',
    'Completed': '已完成',
    'Locked': '尚未开放',
    'Level progress': '级别进度',
    'Complete all three games, sentence practice, and the reading to unlock the next level.': '完成三种游戏、句子练习及文章聆听，才能解锁下一级。',
    'Trials can access only the first level. Subscribe to unlock more levels.': '试用期间只能进入最低级；订阅后完成练习即可逐级解锁。',
    'Complete the previous level before moving on.': '完成上一级后即可进入下一级。',
    'Continue to membership': '前往会员订阅',
    'Sign in to view your saved level progress.': '登录即可查看已保存的级别进度。',
    'Progress could not be loaded. Retry.': '无法加载进度，请重试。',
    'All five activities completed.': '五项练习已全部完成。',
    'Start this level': '开始本级练习',
    'Back to Chinese Treasure House': '返回中文宝库',
    'No subscription or trial is active.': '目前没有有效的订阅或试用期。',
    'Choose a learning path': '选择学习路径',
    'Choose HSK, PSC, ACTFL, or TOCFL first, then choose a graded practice level.': '先选择 HSK、PSC、ACTFL 或 TOCFL 宝库，再选择分级练习。',
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
    'Reading and listening': '文章阅读与聆听',
    'characters': '字',
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
    'Sentence practice': '句子练习',
    'Complete the sentence': '完成句子',
    'Choose a word to complete the sentence.': '选择合适词语填入句子。',
    'Sentence': '句子',
    'Try again': '再试一次',
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
  const labels: Record<ExamTrackId, string> = {
    hsk: 'HSK Resource Library',
    psc: 'PSC Resource Library',
    actfl: 'ACTFL Resource Library',
    tocfl: 'TOCFL Resource Library',
  };
  return label(language, labels[trackId]) || defaultName;
}

function trackDescription(language: Language, trackId: ExamTrackId) {
  const descriptions: Record<ExamTrackId, string> = {
    hsk: 'Structured Chinese vocabulary, games, sentence practice, and readings for all nine HSK levels.',
    psc: 'Vocabulary, games, sentence practice, and readings across three PSC grades and six bands.',
    actfl: 'ACTFL practice across four proficiency bands and ten steps.',
    tocfl: 'TOCFL practice across four site-designed bands and eight steps.',
  };
  return label(language, descriptions[trackId]);
}

function levelProgressFor(
  data: ReturnType<typeof useExamProgress>['progress'],
  trackId: ExamTrackId,
  levelId: string,
) {
  return data?.tracks.find((track) => track.trackId === trackId)?.levels.find((level) => level.levelId === levelId);
}

function asTrackId(value?: string): ExamTrackId | null {
  return value === 'hsk' || value === 'psc' || value === 'actfl' || value === 'tocfl' ? value : null;
}

const chineseLevelNames: Record<ExamTrackId, Record<string, [string, string]>> = {
  hsk: {},
  psc: {},
  actfl: {
    'n-low': ['初級低段', '初学低段'], 'n-mid': ['初級中段', '初学中段'], 'n-high': ['初級高段', '初学高段'],
    'i-low': ['中級低段', '中级低段'], 'i-mid': ['中級中段', '中级中段'], 'i-high': ['中級高段', '中级高段'],
    'a-low': ['高級低段', '高级低段'], 'a-mid': ['高級中段', '高级中段'], 'a-high': ['高級高段', '高级高段'],
    superior: ['卓越級', '卓越级'],
  },
  tocfl: {
    '1': ['入門第 1 級', '入门第 1 级'], '2': ['入門第 2 級', '入门第 2 级'],
    '3': ['基礎第 1 級', '基础第 1 级'], '4': ['基礎第 2 級', '基础第 2 级'],
    '5': ['進階第 1 級', '进阶第 1 级'], '6': ['進階第 2 級', '进阶第 2 级'],
    '7': ['高階第 1 級', '高阶第 1 级'], '8': ['高階第 2 級', '高阶第 2 级'],
  },
};

const chineseLevelDescriptions: Record<ExamTrackId, Record<string, [string, string]>> = {
  hsk: {},
  psc: {},
  actfl: {
    'n-low': ['初級組｜辨認熟悉的名稱與基本課堂詞語。', '初学组｜识别熟悉的名称与基本课堂词语。'],
    'n-mid': ['初級組｜以熟悉詞語進行簡短對話。', '初学组｜用熟悉词语进行简短对话。'],
    'n-high': ['初級組｜用簡單句子描述日常生活。', '初学组｜用简单句子描述日常生活。'],
    'i-low': ['中級組｜以連貫句子敘述熟悉事情。', '中级组｜用连贯句子叙述熟悉的事情。'],
    'i-mid': ['中級組｜說明經歷、喜好與原因。', '中级组｜说明经历、喜好和原因。'],
    'i-high': ['中級組｜有細節地敘述並解釋日常事務。', '中级组｜有细节地叙述并解释日常事务。'],
    'a-low': ['高級組｜討論公共議題並以資料支持觀點。', '高级组｜讨论公共议题并用资料支持观点。'],
    'a-mid': ['高級組｜組織論點並比較不同觀點。', '高级组｜组织论点并比较不同观点。'],
    'a-high': ['高級組｜以細緻語言討論複雜議題。', '高级组｜用细致的语言讨论复杂议题。'],
    superior: ['卓越組｜綜合證據、限定主張並回應不同解讀。', '卓越组｜综合证据、限定主张并回应不同解读。'],
  },
  tocfl: {
    '1': ['入門組｜認識個人資料與常見生活詞語。', '入门组｜认识个人资料与常见生活词语。'],
    '2': ['入門組｜交流日常作息、地點與喜好。', '入门组｜交流日常作息、地点与喜好。'],
    '3': ['基礎組｜描述熟悉經歷並說明簡單計畫。', '基础组｜描述熟悉经历并说明简单计划。'],
    '4': ['基礎組｜連結事件並說明原因與結果。', '基础组｜连接事件并说明原因与结果。'],
    '5': ['進階組｜整理資訊並比較熟悉情境中的選擇。', '进阶组｜整理信息并比较熟悉情境中的选择。'],
    '6': ['進階組｜解釋較抽象想法並用例子支持結論。', '进阶组｜解释较抽象的想法并用例子支持结论。'],
    '7': ['高階組｜討論社會議題並分辨主張與證據。', '高阶组｜讨论社会议题并分辨主张与证据。'],
    '8': ['高階組｜評估細緻論點並整合多方資料。', '高阶组｜评估细致论点并整合多方资料。'],
  },
};

function levelName(language: Language, trackId: ExamTrackId, level: ExamLevel) {
  if (language === 'zh-Hant' || language === 'zh-Hans') {
    return chineseLevelNames[trackId][level.id]?.[language === 'zh-Hant' ? 0 : 1] ?? level.label;
  }
  return label(language, level.label);
}

function levelDescription(language: Language, trackId: ExamTrackId, level: ExamLevel) {
  if (language === 'zh-Hant' || language === 'zh-Hans') {
    return chineseLevelDescriptions[trackId][level.id]?.[language === 'zh-Hant' ? 0 : 1] ?? label(language, level.description);
  }
  return label(language, level.description);
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
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [sentenceAnswer, setSentenceAnswer] = useState<string | null>(null);
  const [sentenceCorrect, setSentenceCorrect] = useState<boolean | null>(null);
  const [failedActivity, setFailedActivity] = useState<ActivityId | null>(null);
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
  const saveActivity = async (activity: ActivityId) => {
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
    setSentenceIndex(0);
    setSentenceAnswer(null);
    setSentenceCorrect(null);
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
          {(Object.keys(examTracks) as ExamTrackId[]).map((id, index) => (
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
        <p className="treasure-track-flow-note">{label(language, 'Choose HSK, PSC, ACTFL, or TOCFL first, then choose a graded practice level.')}</p>
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
              <p>{label(language, 'Complete all three games, sentence practice, and the reading to unlock the next level.')}</p>
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
                    <strong>{levelName(language, trackId, item)}</strong>
                    <small>{levelDescription(language, trackId, item)}</small>
                    <span className="treasure-level-progress-label">{label(language, 'Level progress')} · {completedCount}/5</span>
                    <span className="treasure-progress-track"><span style={{ width: `${completedCount * 20}%` }} /></span>
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
  const sentenceItems = activeLevel.sentencePractice ?? [];
  const sentenceTarget = sentenceItems[sentenceIndex % Math.max(sentenceItems.length, 1)];
  const sentenceCorrectWord = sentenceTarget
    ? words.find((word) => word.id === sentenceTarget.answerWordId)
    : undefined;
  const sentenceDistractors = words.filter((word) => word.id !== sentenceCorrectWord?.id);
  const sentenceOffset = sentenceDistractors.length ? (sentenceIndex * 3) % sentenceDistractors.length : 0;
  const rotatedSentenceDistractors = [
    ...sentenceDistractors.slice(sentenceOffset),
    ...sentenceDistractors.slice(0, sentenceOffset),
  ];
  const sentenceChoices = sentenceCorrectWord ? [sentenceCorrectWord, ...rotatedSentenceDistractors.slice(0, 3)] : [];
  const articleText = script === 'simp' ? activeLevel.article.simplified : activeLevel.article.traditional;
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
  const handleSentenceAnswer = (wordId: string) => {
    if (!sentenceTarget || sentenceAnswer !== null) return;
    const isCorrect = wordId === sentenceTarget.answerWordId;
    setSentenceAnswer(wordId);
    setSentenceCorrect(isCorrect);
    if (isCorrect && sentenceIndex === sentenceItems.length - 1) void saveActivity('sentence');
  };
  const advanceSentence = () => {
    if (sentenceCorrect !== true || sentenceItems.length === 0) {
      setSentenceAnswer(null);
      setSentenceCorrect(null);
      return;
    }
    setSentenceIndex((current) => (current + 1) % sentenceItems.length);
    setSentenceAnswer(null);
    setSentenceCorrect(null);
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
        <h1>{levelName(language, trackId, activeLevel)}</h1>
        <p>{levelDescription(language, trackId, activeLevel)}</p>
        <div className="treasure-detail-tags"><span>{words.length} {label(language, 'words')}</span><span>{label(language, 'Original practice material')}</span></div>
        <div className="treasure-level-progress-summary" data-testid="status-level-progress">
          <div><span>{label(language, 'Level progress')}</span><strong>{currentLevelProgress?.completedCount ?? 0}/5</strong></div>
          <span className="treasure-progress-track"><span style={{ width: `${(currentLevelProgress?.completedCount ?? 0) * 20}%` }} /></span>
          <p>{currentLevelProgress?.status === 'completed'
            ? label(language, 'All five activities completed.')
            : label(language, 'Complete all three games, sentence practice, and the reading to unlock the next level.')}</p>
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
            <div className="treasure-reading-top"><span className="treasure-reading-icon"><BookOpen size={19} /></span><span>{label(language, 'Reading and listening')}</span></div>
            <p className="treasure-eyebrow">{label(language, 'Original practice material')}</p>
            <h2 id="treasure-reading-title">{script === 'simp' ? activeLevel.article.titleSimplified ?? activeLevel.article.title : activeLevel.article.title}</h2>
            <p className="treasure-reading-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'}>{articleText}</p>
            <p className="treasure-reading-length">{articleText.length} / 1,000 {label(language, 'characters')}</p>
            <div className="treasure-reading-actions">
              <button type="button" className="treasure-play-button" onClick={() => speak(articleText, () => { void saveActivity('article'); })} data-testid="button-play-reading"><Volume2 size={17} />{speechStatus === 'speaking' ? label(language, 'Replay reading') : label(language, 'Play reading')}</button>
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
          <section className="treasure-game-card treasure-sentence-card" aria-labelledby="treasure-sentence-title">
            <div className="treasure-panel-heading">
              <div><p className="treasure-eyebrow">{label(language, 'Study actions')}</p><h2 id="treasure-sentence-title">{label(language, 'Sentence practice')}</h2></div>
              <span className="treasure-game-mark"><BookOpen size={19} /></span>
            </div>
            {sentenceTarget && sentenceCorrectWord ? (
              <>
                <div className="treasure-question">
                  <span className="treasure-question-count">{label(language, 'Sentence')} {sentenceIndex + 1} {label(language, 'of')} {sentenceItems.length}</span>
                  <p className="treasure-sentence-prompt" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'}>
                    {script === 'simp' ? sentenceTarget.simplified : sentenceTarget.traditional}
                  </p>
                  <p>{label(language, 'Choose a word to complete the sentence.')}</p>
                </div>
                <div className="treasure-answer-options">
                  {sentenceChoices.map((word) => {
                    const isCorrect = word.id === sentenceTarget.answerWordId;
                    const stateClass = sentenceAnswer === null ? '' : isCorrect ? 'is-correct' : sentenceAnswer === word.id ? 'is-wrong' : '';
                    return (
                      <button type="button" key={word.id} className={`treasure-answer-option ${stateClass}`}
                        onClick={() => handleSentenceAnswer(word.id)} disabled={sentenceAnswer !== null}
                        data-testid={`button-sentence-answer-${word.id}`}>
                        {sentenceAnswer === word.id && isCorrect ? <Check size={15} /> : null}{scriptText(word)}
                      </button>
                    );
                  })}
                </div>
                {sentenceAnswer !== null && (
                  <div className={`treasure-answer-feedback ${sentenceCorrect ? 'is-correct' : 'is-wrong'}`} role="status" data-testid="status-sentence-feedback">
                    {sentenceCorrect ? label(language, 'Correct') : `${label(language, 'Not quite. The answer is')} ${scriptText(sentenceCorrectWord)}`}
                  </div>
                )}
                {sentenceAnswer !== null && (
                  <button type="button" className="treasure-next-question" onClick={advanceSentence} data-testid="button-next-sentence">
                    {sentenceCorrect ? sentenceIndex === sentenceItems.length - 1 ? label(language, 'Start another round') : label(language, 'Check another') : label(language, 'Try again')}
                    <ArrowRight size={15} />
                  </button>
                )}
                {completedActivities.includes('sentence') ? <p className="treasure-activity-complete" data-testid="status-sentence-complete"><Check size={14} />{label(language, 'Completed')}</p> : null}
              </>
            ) : (
              <p className="treasure-empty" role="status">{label(language, 'Sentence practice is not available for this level.')}</p>
            )}
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
