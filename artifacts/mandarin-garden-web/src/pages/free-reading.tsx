import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Play, Square } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { ageLabels, ageStages, freeReadings, normalizeAgeStage } from '@/lib/age-stages';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';
import { scriptFor, speakMandarin, stopSpeech, type Script } from '@/lib/speech';

export default function FreeReadingPage({ language }: { language: Language }) {
  const [location] = useLocation();
  const age = normalizeAgeStage(location.split('?')[0].split('/').pop() ?? null);
  const reading = freeReadings[age];
  const [script, setScript] = useState<Script>(() => scriptFor(language));
  const [playing, setPlaying] = useState(false);
  const text = script === 'simp' ? reading.text['zh-Hans'] : reading.text['zh-Hant'];

  useEffect(() => { stopSpeech(); setPlaying(false); }, [age, script]);
  useEffect(() => () => stopSpeech(), []);

  const toggleAudio = () => {
    if (playing) {
      stopSpeech();
      setPlaying(false);
      return;
    }
    const started = speakMandarin(text, script, () => setPlaying(false));
    setPlaying(started);
  };

  return (
    <main className="page-shell free-reading-page" data-testid="page-free-reading">
      <Link href="/#free-reading-age" className="reading-back"><ArrowLeft size={15} /> {tr(language, 'Back to the garden', '返回樂園', '返回乐园')}</Link>
      <article className="reading-listen-card">
        <div className="eyebrow"><BookOpen size={14} /> {tr(language, 'FREE READING', '免費短文選讀', '免费短文选读')}</div>
        <h1>{reading.title[language]}</h1>
        <p className="reading-age-label">{ageLabels(language)[ageStages.indexOf(age)]}</p>
        <div className="reading-script-toggle" role="group" aria-label={tr(language, 'Reading script', '閱讀文字', '阅读文字')}>
          <button type="button" className={script === 'trad' ? 'selected' : ''} onClick={() => setScript('trad')} aria-pressed={script === 'trad'}>{tr(language, 'Traditional', '繁體中文', '繁体中文')}</button>
          <button type="button" className={script === 'simp' ? 'selected' : ''} onClick={() => setScript('simp')} aria-pressed={script === 'simp'}>{tr(language, 'Simplified', '簡體中文', '简体中文')}</button>
        </div>
        <p className="reading-listen-text" lang={script === 'simp' ? 'zh-Hans' : 'zh-Hant'} data-testid="reading-content">{text}</p>
        <div className="reading-listen-actions">
          <button type="button" className="button-primary" onClick={toggleAudio} data-testid="button-reading-audio">
            {playing ? <Square size={15} /> : <Play size={16} />}
            {playing ? tr(language, 'Stop listening', '停止聆聽', '停止聆听') : tr(language, 'Listen to the story', '聆聽短文', '聆听短文')}
          </button>
          <span>{reading.minutes} {tr(language, 'min', '分鐘', '分钟')}</span>
        </div>
      </article>
    </main>
  );
}
