import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, Search, Volume2, X } from 'lucide-react';
import { Link } from 'wouter';
import { translateInterface } from '@workspace/learning-content';
import { examTracks, getExamLevel, type ExamTrackId, type ExamWord } from '@/lib/exam-resources';
import { speakMandarin, stopSpeech } from '@/lib/speech';
import type { Language } from '@/lib/garden-data';

type Props = { language: Language; track?: string; level?: string };
type GameMode = 'meaning' | 'listening' | 'pinyin';

const localCopy: Record<'zh-Hant' | 'zh-Hans', Record<string, string>> = {
  'zh-Hant': {
    'A quiet place to grow your Chinese': '讓中文慢慢長進心裡',
    'A practical study room for curious learners. Choose a clear level, listen closely, and practise with original materials.': '為中文學習者準備的實用學習空間。選擇清楚的程度，仔細聆聽，用原創練習材料開始練習。',
    'Choose a learning path': '選擇學習路徑',
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
    'A quiet place to grow your Chinese': '让中文慢慢长进心里',
    'A practical study room for curious learners. Choose a clear level, listen closely, and practise with original materials.': '为中文学习者准备的实用学习空间。选择清楚的级别，仔细聆听，用原创练习材料开始练习。',
    'Choose a learning path': '选择学习路径',
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
  return trackId === 'psc' ? label(language, 'Putonghua Proficiency Test (PSC)') : defaultName;
}

function asTrackId(value?: string): ExamTrackId | null {
  return value === 'hsk' || value === 'psc' ? value : null;
}

export function TreasureHousePage({ language, track: routeTrack, level: routeLevel }: Props) {
  const [trackChoice, setTrackChoice] = useState<ExamTrackId>(asTrackId(routeTrack) ?? 'hsk');
  const [script, setScript] = useState<'simp' | 'trad'>(language === 'zh-Hant' ? 'trad' : 'simp');
  const [speechStatus, setSpeechStatus] = useState<'ready' | 'speaking' | 'stopped' | 'unavailable'>('ready');
  const [search, setSearch] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('meaning');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (routeTrack === 'hsk' || routeTrack === 'psc') setTrackChoice(routeTrack);
  }, [routeTrack]);
  useEffect(() => {
    setScript(language === 'zh-Hant' ? 'trad' : 'simp');
  }, [language]);
  useEffect(() => () => stopSpeech(), []);

  const selected = routeTrack && routeLevel ? getExamLevel(routeTrack, routeLevel) : null;
  const isDetailRoute = Boolean(routeTrack || routeLevel);
  const activeTrack = selected?.track ?? examTracks[trackChoice];
  const activeLevel = selected?.level ?? null;
  const scriptText = (word: ExamWord) => script === 'simp' ? word.simplified : word.traditional;
  const speak = (text: string) => {
    const started = speakMandarin(text, 'simp', () => setSpeechStatus('ready'));
    setSpeechStatus(started ? 'speaking' : 'unavailable');
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

  useEffect(() => {
    setSearch('');
    setAnswer(null);
    setQuestionIndex(0);
  }, [routeTrack, routeLevel]);

  if (isDetailRoute && !selected) {
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <section className="treasure-not-found" role="alert" data-testid="status-level-not-found">
          <span className="treasure-kicker">{label(language, 'A quiet place to grow your Chinese')}</span>
          <h1>{label(language, 'Level not found')}</h1>
          <p>{label(language, 'We could not find that track and level. Choose a path below to continue.')}</p>
          <Link href="/treasure-house" className="treasure-action" data-testid="link-treasure-recovery"><ArrowLeft size={16} />{label(language, 'Back to paths')}</Link>
        </section>
      </main>
    );
  }

  if (!activeLevel) {
    return (
      <main className="page-shell treasure-page" data-testid="treasure-house">
        <section className="treasure-hero">
          <div className="treasure-hero-copy">
            <p className="treasure-eyebrow">{label(language, 'Choose a learning path')}</p>
            <h1>{label(language, 'A quiet place to grow your Chinese')}</h1>
            <p>{label(language, 'A practical study room for curious learners. Choose a clear level, listen closely, and practise with original materials.')}</p>
          </div>
          <div className="treasure-hero-mark" aria-hidden="true">
            <span className="treasure-orbit orbit-a" /><span className="treasure-orbit orbit-b" />
            <span className="treasure-seal"><BookOpen size={36} strokeWidth={1.4} /></span>
            <span className="treasure-seal-caption">中文寶庫</span>
          </div>
        </section>

          <div className="treasure-path-tabs" role="group" aria-label={label(language, 'Pick a path')}>
          {(Object.values(examTracks)).map((item) => (
              <button type="button" aria-pressed={trackChoice === item.id} key={item.id}
              className={`treasure-path-tab ${trackChoice === item.id ? 'is-active' : ''}`}
              onClick={() => setTrackChoice(item.id)} data-testid={`tab-track-${item.id}`}>
              <span className="treasure-tab-index">{item.id === 'hsk' ? '01' : '02'}</span>
              <span><strong>{item.shortName}</strong><small>{label(language, item.subtitle)}</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
        <section className="treasure-level-section" aria-labelledby="treasure-level-heading">
          <div className="treasure-section-head">
            <div>
              <p className="treasure-eyebrow">{label(language, 'Browse all levels')}</p>
              <h2 id="treasure-level-heading">{trackName(language, activeTrack.id, activeTrack.name)}</h2>
              <p>{label(language, activeTrack.subtitle)}</p>
            </div>
            <span className="treasure-count">{activeTrack.levels.length} <small>{label(language, 'levels')}</small></span>
          </div>
          <div className={`treasure-level-list ${activeTrack.id === 'psc' ? 'psc-level-list' : ''}`}>
            {activeTrack.levels.map((item, index) => (
              <Link key={item.id} href={`/treasure-house/${activeTrack.id}/${item.id}`} className="treasure-level-card" data-testid={`link-level-${activeTrack.id}-${item.id}`}>
                <span className="treasure-level-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="treasure-level-copy"><strong>{item.label}</strong><small>{label(language, item.description)}</small><span className="treasure-level-meta">{item.words.length} {label(language, 'words')} <i /> {label(language, 'short reading')}</span></span>
                <ArrowRight className="treasure-level-arrow" size={18} />
              </Link>
            ))}
          </div>
          <div className="treasure-notice" role="note" data-testid="status-track-notice">
            <span className="treasure-notice-mark">i</span>
            <p>{label(language, activeTrack.notice)}</p>
            <a href={activeTrack.sourceUrl} target="_blank" rel="noreferrer" data-testid={`link-source-${activeTrack.id}`}>{label(language, activeTrack.sourceLabel)}<ArrowRight size={14} /></a>
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

  return (
    <main className="page-shell treasure-page treasure-detail" data-testid="treasure-house">
      <div className="treasure-detail-top">
        <Link href="/treasure-house" className="treasure-back-link" data-testid="link-back-to-tracks"><ArrowLeft size={16} />{label(language, 'Back to paths')}</Link>
        <div className="treasure-script-toggle" role="group" aria-label={label(language, 'Script')}>
          <span>{label(language, 'Script')}</span>
          <button type="button" onClick={() => setScript('simp')} aria-pressed={script === 'simp'} data-testid="button-script-simplified">{label(language, 'Simplified')}</button>
          <button type="button" onClick={() => setScript('trad')} aria-pressed={script === 'trad'} data-testid="button-script-traditional">{label(language, 'Traditional')}</button>
        </div>
      </div>
      <header className="treasure-detail-heading">
        <p className="treasure-eyebrow">{activeTrack.shortName} <span>/</span> {activeLevel.label}</p>
        <h1>{activeLevel.label}</h1>
        <p>{activeLevel.description}</p>
        <div className="treasure-detail-tags"><span>{words.length} {label(language, 'words')}</span><span>{label(language, 'Original practice material')}</span></div>
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
              <button type="button" className="treasure-play-button" onClick={() => speak(activeLevel.article.simplified)} data-testid="button-play-reading"><Volume2 size={17} />{speechStatus === 'speaking' ? label(language, 'Replay reading') : label(language, 'Play reading')}</button>
              <button type="button" className="treasure-stop-button" onClick={stop} data-testid="button-stop-reading"><X size={15} />{label(language, 'Stop audio')}</button>
            </div>
            <p className={`treasure-speech-status ${speechStatus === 'unavailable' ? 'is-error' : ''}`} role={speechStatus === 'unavailable' ? 'alert' : 'status'} data-testid="status-speech">{speechStatus === 'unavailable' ? label(language, 'Speech is unavailable in this browser. You can still read and browse the material.') : label(language, speechStatus === 'speaking' ? 'Speaking…' : speechStatus === 'stopped' ? 'Audio stopped' : 'Ready to listen')}</p>
          </section>
          <section className="treasure-game-card" aria-labelledby="treasure-game-title">
            <div className="treasure-panel-heading">
              <div><p className="treasure-eyebrow">{label(language, 'Study actions')}</p><h2 id="treasure-game-title">{label(language, 'Choose how to practise')}</h2></div>
              <span className="treasure-game-mark"><Headphones size={19} /></span>
            </div>
            <div className="treasure-game-tabs" role="group" aria-label={label(language, 'Choose how to practise')}>
              {(['meaning', 'listening', 'pinyin'] as GameMode[]).map((mode) => (
                <button type="button" key={mode} className={gameMode === mode ? 'is-selected' : ''} onClick={() => { setGameMode(mode); setAnswer(null); }} data-testid={`button-game-mode-${mode}`}>{label(language, mode === 'meaning' ? 'Meaning match' : mode === 'listening' ? 'Listening choice' : 'Pinyin recognition')}</button>
              ))}
            </div>
            <div className="treasure-question" aria-live="polite">
              <span className="treasure-question-count">{label(language, 'Question')} {targetIndex + 1} {label(language, 'of')} {words.length}</span>
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
                return <button type="button" key={word.id} className={`treasure-answer-option ${stateClass}`} onClick={() => { if (answer === null) setAnswer(value); }} disabled={answer !== null} data-testid={`button-answer-${word.id}`}>
                  {answer === value && isCorrect ? <Check size={15} /> : null}{visible}
                </button>;
              })}
            </div>
            {answer !== null && <div className={`treasure-answer-feedback ${answer === correctValue ? 'is-correct' : 'is-wrong'}`} role="status" data-testid="status-game-feedback">
              {answer === correctValue ? label(language, 'Correct') : `${label(language, 'Not quite. The answer is')} ${gameMode === 'meaning' ? target.meaning : gameMode === 'pinyin' ? target.pinyin : scriptText(target)}`}
            </div>}
            {answer !== null && <button type="button" className="treasure-next-question" onClick={() => { setQuestionIndex((current) => current + 1); setAnswer(null); }} data-testid="button-next-question">{label(language, 'Check another')}<ArrowRight size={15} /></button>}
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
