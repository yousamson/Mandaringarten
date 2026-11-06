import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookHeart, Pause, Play, Volume2 } from 'lucide-react';
import { Link } from 'wouter';
import { ageLabels, ageStages, normalizeAgeStage } from '@/lib/age-stages';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';
import { parentChildBooks } from '@/lib/parent-child-books';
import { scriptFor, speakMandarin, stopSpeech, type Script } from '@/lib/speech';

export function ParentChildBookSection({ language, age }: { language: Language; age: string }) {
  const [selectedId, setSelectedId] = useState(() => normalizeAgeStage(age));
  const [pageIndex, setPageIndex] = useState(0);
  const [script, setScript] = useState<Script>(() => scriptFor(language));
  const [playing, setPlaying] = useState(false);
  const book = parentChildBooks.find((item) => item.id === selectedId) ?? parentChildBooks[0];
  const page = book.pages[pageIndex];
  const storyText = script === 'simp' ? page.simp : page.trad;

  useEffect(() => { setSelectedId(normalizeAgeStage(age)); }, [age]);
  useEffect(() => { setScript(scriptFor(language)); }, [language]);
  useEffect(() => { stopSpeech(); setPlaying(false); }, [selectedId, pageIndex, script]);
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
  const movePage = (direction: -1 | 1) => {
    setPageIndex((current) => Math.max(0, Math.min(book.pages.length - 1, current + direction)));
  };

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
                <strong>{item.title[language]}</strong>
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
          <h3>{book.title[language]}</h3>
          <p className="picture-book-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'} data-testid="picture-book-text">{storyText}</p>
          <p className="picture-book-pinyin">{page.pinyin}</p>
          {language === 'en' && <p className="picture-book-translation">{page.en}</p>}
          <div className="picture-book-prompt">
            <strong>{tr(language, 'Talk together', '親子聊一聊', '亲子聊一聊')}</strong>
            <p>{page.prompt[language]}</p>
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

      <div className="picture-book-membership">
        <span className="picture-book-membership-icon"><BookHeart size={17} /></span>
        <p>{tr(language, 'Members can also explore 40 read-aloud stories across all four stages.', '訂閱會員還可聆聽四個階段共 40 篇故事，並在樂園中重複閱讀。', '订阅会员还可聆听四个阶段共 40 篇故事，并在乐园中重复阅读。')}</p>
        <Link href="/membership" className="picture-book-membership-link">{tr(language, 'Explore membership', '了解會員訂閱', '了解会员订阅')} <ArrowRight size={14} /></Link>
      </div>
    </section>
  );
}
