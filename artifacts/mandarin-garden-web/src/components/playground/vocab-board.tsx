import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import { getStageContent } from '@/lib/playground-content';
import { tr } from '@/lib/playground-copy';
import { scriptFor, speakMandarin } from '@/lib/speech';

const PAGE = 40;

export function VocabBoard({ stage, l }: { stage: number; l: Language }) {
  const words = getStageContent(stage).words;
  const script = scriptFor(l);
  const [page, setPage] = useState(0);
  const [term, setTerm] = useState('');
  useEffect(() => { setPage(0); setTerm(''); }, [stage]);
  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return words;
    return words.filter((w) => w.trad.includes(t) || w.simp.includes(t) || w.en.toLowerCase().includes(t) || w.pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  }, [words, term]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <section className="panel vocab-board" data-testid="vocab-board">
      <div className="vocab-head">
        <div><h2>{tr(l, 'Word bank', '詞語庫', '词语库')}</h2><p className="panel-desc">{tr(l, `${words.length} words in this stage · tap to hear`, `本階段共 ${words.length} 個詞語 · 點一下聽發音`, `本阶段共 ${words.length} 个词语 · 点一下听发音`)}</p></div>
        <label className="vocab-search"><Search size={14} /><input value={term} onChange={(e) => { setTerm(e.target.value); setPage(0); }} placeholder={tr(l, 'Search', '搜尋', '搜索')} data-testid="input-vocab-search" /></label>
      </div>
      {shown.length ? (
        <div className="vocab-list">
          {shown.map((w) => (
            <button key={w.id} className="vocab-chip" onClick={() => speakMandarin(script === 'simp' ? w.simp : w.trad, script)} data-testid={`button-vocab-${w.id}`}>
              <b>{script === 'simp' ? w.simp : w.trad}</b><span>{w.pinyin}</span><small>{w.en}</small>
            </button>
          ))}
        </div>
      ) : <p className="empty-note">{tr(l, 'No words match that search.', '找不到相符的詞語。', '找不到相符的词语。')}</p>}
      {pages > 1 ? (
        <div className="pager" role="group">
          {Array.from({ length: pages }, (_, i) => <button key={i} className={`pager-dot ${i === page ? 'on' : ''}`} onClick={() => setPage(i)} aria-label={`${i + 1}`} data-testid={`button-vocab-page-${i + 1}`}>{i + 1}</button>)}
        </div>
      ) : null}
    </section>
  );
}
