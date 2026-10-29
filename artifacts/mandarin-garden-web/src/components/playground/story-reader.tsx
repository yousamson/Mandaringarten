import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Play, RotateCcw, Square } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import { getStageContent } from '@/lib/playground-content';
import { tr } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech, type Script } from '@/lib/speech';

const splitSentences = (text: string) => text.match(/[^。！？]+[。！？]?[」”]?/g) ?? [text];

export function StoryReader({ stage, l }: { stage: number; l: Language }) {
  const stories = getStageContent(stage).stories;
  const [index, setIndex] = useState(0);
  const [script, setScript] = useState<Script>(scriptFor(l));
  const [playing, setPlaying] = useState<'all' | number | null>(null);
  const story = stories[Math.min(index, stories.length - 1)];
  const text = script === 'simp' ? story.simp : story.trad;
  const sentences = useMemo(() => splitSentences(text), [text]);

  // Stop narration whenever the story, script or stage changes, and on leaving.
  useEffect(() => { stopSpeech(); setPlaying(null); }, [index, script, stage]);
  useEffect(() => { setIndex(0); }, [stage]);
  useEffect(() => () => stopSpeech(), []);

  const play = (what: 'all' | number) => {
    const ok = speakMandarin(what === 'all' ? text : sentences[what], script, () => setPlaying((p) => (p === what ? null : p)));
    setPlaying(ok ? what : null);
  };
  const stop = () => { stopSpeech(); setPlaying(null); };

  return (
    <section className="story-card" data-testid="story-reader">
      <div className="practice-heading"><span className="practice-icon reading-icon"><BookOpen size={18} /></span>
        <div><div className="eyebrow">{tr(l, `Story ${index + 1} of ${stories.length}`, `第 ${index + 1} 篇 · 共 ${stories.length} 篇`, `第 ${index + 1} 篇 · 共 ${stories.length} 篇`)}</div>
          <h2 className="story-title" data-testid="text-story-title">{story.title.trad}<span>{story.title.simp}</span></h2>
          <p className="story-en">{story.title.en}</p></div>
      </div>
      <div className="story-picker" role="listbox" aria-label={tr(l, 'Choose a story', '選擇故事', '选择故事')}>
        {stories.map((s, i) => (
          <button key={s.id} role="option" aria-selected={i === index} className={`story-chip ${i === index ? 'selected' : ''}`} onClick={() => setIndex(i)} title={s.title.en} data-testid={`button-story-${i + 1}`}>
            <span>{i + 1}</span>{script === 'simp' ? s.title.simp : s.title.trad}
          </button>
        ))}
      </div>
      <div className="story-tools">
        <div className="script-toggle" role="group" aria-label="Script">
          <button className={script === 'trad' ? 'on' : ''} onClick={() => setScript('trad')} aria-pressed={script === 'trad'} data-testid="button-script-trad">繁體</button>
          <button className={script === 'simp' ? 'on' : ''} onClick={() => setScript('simp')} aria-pressed={script === 'simp'} data-testid="button-script-simp">简体</button>
        </div>
        <div className="story-audio">
          <button className="audio-button" style={{ margin: 0 }} onClick={() => play('all')} data-testid="button-story-play">
            {playing === 'all' ? <RotateCcw size={14} /> : <Play size={14} />} {playing === 'all' ? tr(l, 'Replay', '重播', '重播') : tr(l, 'Read aloud', '朗讀', '朗读')}
          </button>
          <button className="icon-button" onClick={stop} disabled={playing === null} aria-label={tr(l, 'Stop', '停止', '停止')} data-testid="button-story-stop"><Square size={14} /></button>
        </div>
      </div>
      <p className="story-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'} data-testid="text-story-body">
        {sentences.map((s, i) => (
          <button key={`${i}-${s.slice(0, 4)}`} className={`story-sentence ${playing === i ? 'speaking' : ''}`} onClick={() => play(i)}>{s}</button>
        ))}
      </p>
      <p className="story-tip">{tr(l, 'Tap any sentence to hear just that line.', '點一下任何句子，只聽那一句。', '点一下任何句子，只听那一句。')}</p>
    </section>
  );
}
