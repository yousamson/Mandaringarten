import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookHeart, Pause, Play, Volume2 } from 'lucide-react';
import { Link } from 'wouter';
import { ageLabels, ageStages, normalizeAgeStage } from '@/lib/age-stages';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';
import { parentChildBooks } from '@/lib/parent-child-books';
import { getStageContent } from '@/lib/playground-content';
import { useMembership } from '@/hooks/use-learning';
import { scriptFor, speakMandarin, stopSpeech, type Script } from '@/lib/speech';
import { translateInterface } from '@workspace/learning-content';

export function ParentChildBookSection({ language, age }: { language: Language; age: string }) {
  const membership = useMembership();
  const [selectedId, setSelectedId] = useState(() => normalizeAgeStage(age));
  const [pageIndex, setPageIndex] = useState(0);
  const [script, setScript] = useState<Script>(() => scriptFor(language));
  const [playing, setPlaying] = useState(false);
  const [memberPlaying, setMemberPlaying] = useState(false);
  const [memberAge, setMemberAge] = useState(() => normalizeAgeStage(age));
  const [memberStoryId, setMemberStoryId] = useState<string | null>(null);
  const book = parentChildBooks.find((item) => item.id === selectedId) ?? parentChildBooks[0];
  const page = book.pages[pageIndex];
  const storyText = script === 'simp' ? page.simp : page.trad;
  const memberStage = ageStages.indexOf(memberAge) + 1;
  const memberStories = getStageContent(memberStage).stories;
  const memberStory = memberStories.find((item) => item.id === memberStoryId) ?? memberStories[0];
  const memberStoryText = script === 'simp' ? memberStory.simp : memberStory.trad;
  const memberStoryTitle = (title: { en: string; trad: string; simp: string }) =>
    language === 'en'
      ? title.en
      : language === 'zh-Hans'
        ? title.simp
        : language === 'zh-Hant'
          ? title.trad
          : translateInterface(language, title.en);
  const bookTitle = (title: { en: string; trad: string; simp: string }) =>
    language === 'en'
      ? title.en
      : language === 'zh-Hans'
        ? title.simp
        : language === 'zh-Hant'
          ? title.trad
          : translateInterface(language, title.en);
  const promptText = (prompt: { en: string; 'zh-Hant': string; 'zh-Hans': string }) =>
    language === 'en'
      ? prompt.en
      : language === 'zh-Hant'
        ? prompt['zh-Hant']
        : language === 'zh-Hans'
          ? prompt['zh-Hans']
          : translateInterface(language, prompt.en);
  const membershipError = membership.accountQuery.isError || membership.billing.isError;

  useEffect(() => { setSelectedId(normalizeAgeStage(age)); }, [age]);
  useEffect(() => { setMemberAge(normalizeAgeStage(age)); setMemberStoryId(null); }, [age]);
  useEffect(() => { setScript(scriptFor(language)); }, [language]);
  useEffect(() => { stopSpeech(); setPlaying(false); setMemberPlaying(false); }, [selectedId, pageIndex, script, memberAge, memberStoryId]);
  useEffect(() => () => stopSpeech(), []);

  const selectBook = (id: string) => {
    setSelectedId(normalizeAgeStage(id));
    setPageIndex(0);
  };
  const toggleAudio = () => {
    if (playing) {
      stopSpeech();
      setPlaying(false);
      return;
    }
    setPlaying(speakMandarin(storyText, script, () => setPlaying(false)));
  };
  const toggleMemberAudio = () => {
    if (memberPlaying) {
      stopSpeech();
      setMemberPlaying(false);
      return;
    }
    setMemberPlaying(speakMandarin(memberStoryText, script, () => setMemberPlaying(false)));
  };
  const movePage = (direction: -1 | 1) => {
    setPageIndex((current) => Math.max(0, Math.min(book.pages.length - 1, current + direction)));
  };
  const retryMembership = () => window.location.reload();

  return (
    <section className="parent-books-section" data-testid="parent-child-books">
      <div className="section-head parent-books-heading">
        <div>
          <div className="eyebrow"><BookHeart size={14} /> {tr(language, 'READ TOGETHER', '親子共讀', '亲子共读')}</div>
          <h2>{tr(language, 'Little books, shared moments', '親子共讀繪本', '亲子共读绘本')}</h2>
          <p className="section-sub">{tr(language, 'Choose a story for your child’s age. Read a page, listen together, and talk about it.', '依孩子年齡挑選故事，一起閱讀、聆聽，再聊聊故事裡的發現。', '按孩子年龄挑选故事，一起阅读、聆听，再聊聊故事里的发现。')}</p>
        </div>
        <span className="status-pill">{tr(language, '4 age stages', '四個年齡階段', '四个年龄阶段')}</span>
      </div>

      <div className="picture-book-picker" role="group" aria-label={tr(language, 'Choose a picture book', '選擇繪本', '选择绘本')}>
        {parentChildBooks.map((item) => {
          const active = item.id === book.id;
          const label = ageLabels(language)[ageStages.indexOf(item.id)];
          return (
            <button
              key={item.id}
              type="button"
              className={`picture-book-tile${active ? ' selected' : ''}`}
              aria-pressed={active}
              onClick={() => selectBook(item.id)}
              data-testid={`button-picture-book-${item.id}`}
            >
              <span className={`picture-book-cover picture-book-cover-${item.id}`} aria-hidden="true">{item.cover}</span>
              <span className="picture-book-tile-copy">
                <strong>{bookTitle({ en: item.title.en, trad: item.title['zh-Hant'], simp: item.title['zh-Hans'] })}</strong>
                <small>{label}</small>
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <article className={`picture-book-reader picture-book-reader-${book.id}`} data-testid="picture-book-reader">
        <div className="picture-book-page-art" aria-hidden="true">
          <span className="picture-book-spark picture-book-spark-one">✦</span>
          <span className="picture-book-spark picture-book-spark-two">✧</span>
          <span className="picture-book-art-emoji">{page.art}</span>
          <span className="picture-book-page-count">{pageIndex + 1} / {book.pages.length}</span>
        </div>
        <div className="picture-book-page-copy">
          <div className="picture-book-page-topline">
            <span className="eyebrow">{ageLabels(language)[ageStages.indexOf(book.id)]}</span>
            <span>{tr(language, `Page ${pageIndex + 1}`, `第 ${pageIndex + 1} 頁`, `第 ${pageIndex + 1} 页`)}</span>
          </div>
          <h3>{bookTitle({ en: book.title.en, trad: book.title['zh-Hant'], simp: book.title['zh-Hans'] })}</h3>
          <p className="picture-book-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'} data-testid="picture-book-text">{storyText}</p>
          <p className="picture-book-pinyin">{page.pinyin}</p>
          {language === 'en' && <p className="picture-book-translation">{page.en}</p>}
          <div className="picture-book-prompt">
            <strong>{tr(language, 'Talk together', '親子聊一聊', '亲子聊一聊')}</strong>
            <p>{promptText(page.prompt)}</p>
          </div>
          <div className="picture-book-controls">
            <div className="picture-book-script" role="group" aria-label={tr(language, 'Chinese characters', '中文文字', '中文文字')}>
              <button type="button" className={script === 'trad' ? 'selected' : ''} onClick={() => setScript('trad')} aria-pressed={script === 'trad'}>繁體</button>
              <button type="button" className={script === 'simp' ? 'selected' : ''} onClick={() => setScript('simp')} aria-pressed={script === 'simp'}>简体</button>
            </div>
            <button type="button" className="button-secondary picture-book-listen" onClick={toggleAudio} data-testid="button-picture-book-listen">
              {playing ? <Pause size={15} /> : <Volume2 size={15} />}
              {playing ? tr(language, 'Pause', '停止聆聽', '停止聆听') : tr(language, 'Listen to this page', '聆聽這一頁', '聆听这一页')}
            </button>
          </div>
          <div className="picture-book-pagination">
            <button type="button" className="picture-book-page-button" onClick={() => movePage(-1)} disabled={pageIndex === 0}>
              <ArrowLeft size={15} /> {tr(language, 'Previous', '上一頁', '上一页')}
            </button>
            <div className="picture-book-dots" aria-label={tr(language, `${book.pages.length} pages`, `共 ${book.pages.length} 頁`, `共 ${book.pages.length} 页`)}>
              {book.pages.map((item, index) => <span key={`${item.art}-${index}`} className={index === pageIndex ? 'active' : ''} />)}
            </div>
            <button type="button" className="picture-book-page-button next" onClick={() => movePage(1)} disabled={pageIndex === book.pages.length - 1}>
              {tr(language, 'Next', '下一頁', '下一页')} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </article>

      {membership.checking ? (
        <div className="picture-book-membership" role="status">
          <span className="picture-book-membership-icon"><BookHeart size={17} /></span>
          <p>{tr(language, 'Loading member stories…', '正在載入會員故事…', '正在加载会员故事…')}</p>
          <button type="button" className="picture-book-membership-link" onClick={retryMembership}>
            {tr(language, 'Refresh access', '重新整理權限', '刷新权限')} <ArrowRight size={14} />
          </button>
        </div>
      ) : membershipError && !membership.premium ? (
        <div className="picture-book-membership" role="alert">
          <span className="picture-book-membership-icon"><BookHeart size={17} /></span>
          <p>{tr(language, 'We could not confirm membership. Refresh to try again.', '暫時無法確認會員資格，請重新整理再試。', '暂时无法确认会员资格，请刷新后重试。')}</p>
          <button type="button" className="picture-book-membership-link" onClick={retryMembership}>
            {tr(language, 'Refresh', '重新整理', '刷新')} <ArrowRight size={14} />
          </button>
        </div>
      ) : membership.premium ? (
        <section className="member-story-library" data-testid="member-story-library">
          <div className="member-story-heading">
            <div className="eyebrow"><BookHeart size={14} /> {tr(language, 'MEMBER STORIES', '會員故事', '会员故事')}</div>
            <h3>{tr(language, '40 stories to read together', '40 篇親子共讀故事', '40 篇亲子共读故事')}</h3>
            <p>{tr(language, 'Choose a learning stage to find 10 more stories.', '選擇學習階段，每個階段都有 10 篇故事。', '选择学习阶段，每个阶段都有 10 篇故事。')}</p>
          </div>

          <div className="member-story-stages" role="group" aria-label={tr(language, 'Choose a story age stage', '選擇故事年齡階段', '选择故事年龄阶段')}>
            {ageStages.map((stageId, index) => {
              const active = stageId === memberAge;
              return (
                <button
                  key={stageId}
                  type="button"
                  className={active ? 'selected' : ''}
                  aria-pressed={active}
                  onClick={() => { setMemberAge(stageId); setMemberStoryId(null); }}
                  data-testid={`button-member-story-stage-${stageId}`}
                >
                  {ageLabels(language)[index]}
                </button>
              );
            })}
          </div>

          <div className="member-story-picker" role="group" aria-label={tr(language, 'Choose a member story', '選擇會員故事', '选择会员故事')}>
            {memberStories.map((item, index) => {
              const active = item.id === memberStory.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`member-story-choice${active ? ' selected' : ''}`}
                  aria-pressed={active}
                  onClick={() => setMemberStoryId(item.id)}
                  data-testid={`button-member-story-${item.id}`}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{memberStoryTitle(item.title)}</strong>
                </button>
              );
            })}
          </div>

          <article className="member-story-reader" data-testid="member-story-reader">
            <div className="member-story-reader-heading">
              <div>
                <span className="eyebrow">{ageLabels(language)[ageStages.indexOf(memberAge)]}</span>
                <h4>{memberStoryTitle(memberStory.title)}</h4>
              </div>
              <button type="button" className="button-secondary picture-book-listen" onClick={toggleMemberAudio} data-testid="button-member-story-listen">
                {memberPlaying ? <Pause size={15} /> : <Volume2 size={15} />}
                {memberPlaying ? tr(language, 'Stop listening', '停止聆聽', '停止聆听') : tr(language, 'Read aloud', '聆聽故事', '聆听故事')}
              </button>
            </div>
            <p className="picture-book-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'} data-testid="member-story-text">{memberStoryText}</p>
            <div className="picture-book-script" role="group" aria-label={tr(language, 'Chinese characters', '中文文字', '中文文字')}>
              <button type="button" className={script === 'trad' ? 'selected' : ''} onClick={() => setScript('trad')} aria-pressed={script === 'trad'}>繁體</button>
              <button type="button" className={script === 'simp' ? 'selected' : ''} onClick={() => setScript('simp')} aria-pressed={script === 'simp'}>简体</button>
            </div>
          </article>
        </section>
      ) : (
        <div className="picture-book-membership">
          <span className="picture-book-membership-icon"><BookHeart size={17} /></span>
          <p>{tr(language, 'Members can explore 40 read-aloud stories across all four stages.', '訂閱會員還可閱讀四個階段共 40 篇故事，並重複聆聽。', '订阅会员还可阅读四个阶段共 40 篇故事，并重复聆听。')}</p>
          <Link href="/membership" className="picture-book-membership-link">{tr(language, 'Explore membership', '了解會員訂閱', '了解会员订阅')} <ArrowRight size={14} /></Link>
        </div>
      )}
    </section>
  );
}
