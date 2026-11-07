import { useState } from 'react';
import { ArrowUpRight, Film, Music2, Play, X } from 'lucide-react';
import { familyMedia, type FamilyMedia } from '@workspace/learning-content';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

export function MediaGarden({ language }: { language: Language }) {
  const [activeId, setActiveId] = useState<FamilyMedia['id'] | null>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const activeItem = familyMedia.find((item) => item.id === activeId);

  const toggleItem = (item: FamilyMedia) => {
    setPlaybackFailed(false);
    setActiveId((current) => current === item.id ? null : item.id);
  };

  return (
    <section className="media-garden" data-testid="media-garden">
      <div className="section-head media-garden-heading">
        <div>
          <div className="eyebrow">{tr(language, 'OPEN MEDIA', '影音天地', '影音天地')}</div>
          <h2>{tr(language, 'Music and animation for families', '親子音樂與動畫', '亲子音乐与动画')}</h2>
          <p className="section-sub">{tr(language, 'A CC0 nursery song and a public-domain silent cartoon. Choose an item to load its player.', '收錄 CC0 兒歌與公共領域默片動畫；選擇內容後才會載入播放器。', '收录 CC0 儿歌与公共领域默片动画；选择内容后才会加载播放器。')}</p>
        </div>
        <span className="status-pill">{tr(language, 'Openly licensed', '開放授權', '开放授权')}</span>
      </div>

      <div className="media-garden-grid">
        {familyMedia.map((item) => {
          const selected = activeId === item.id;
          const Icon = item.kind === 'audio' ? Music2 : Film;
          return (
            <article className={`media-garden-card${selected ? ' expanded' : ''}`} key={item.id} data-testid={`media-card-${item.id}`}>
              <div className="media-garden-card-top">
                <span className={`media-garden-icon ${item.kind}`}><Icon size={19} /></span>
                <span className="media-garden-duration">{item.duration}</span>
              </div>
              <h3>{item.title[language]}</h3>
              <p className="media-garden-description">{item.description[language]}</p>
              <div className="media-garden-license">{item.license[language]}</div>
              <p className="media-garden-credit">{tr(language, 'Creator', '創作者', '创作者')}: {item.creator}</p>
              <button
                type="button"
                className="button-secondary media-garden-play"
                onClick={() => toggleItem(item)}
                aria-expanded={selected}
                data-testid={`button-media-${item.id}`}
              >
                {selected ? <X size={15} /> : <Play size={15} />}
                {selected
                  ? tr(language, 'Close player', '關閉播放器', '关闭播放器')
                  : item.kind === 'audio'
                    ? tr(language, 'Listen', '播放音樂', '播放音乐')
                    : tr(language, 'Watch', '播放動畫', '播放动画')}
              </button>
              {selected && (
                <div className="media-garden-player" data-testid={`player-${item.id}`}>
                  {item.kind === 'audio' ? (
                    <audio controls preload="none" src={item.mediaUrl} aria-label={item.title[language]} onError={() => setPlaybackFailed(true)} />
                  ) : (
                    <video controls playsInline preload="none" aria-label={item.title[language]} onError={() => setPlaybackFailed(true)}>
                      {item.webMediaUrl && <source src={item.webMediaUrl} type="video/webm; codecs=vp9" />}
                      <source src={item.mediaUrl} type="video/quicktime; codecs=mp4v" />
                    </video>
                  )}
                  {playbackFailed && <p className="media-playback-error" role="status">{tr(language, 'This media could not be loaded. Open the source page to try it there.', '目前無法載入影音，請前往來源頁面收聽或觀看。', '目前无法加载影音，请前往来源页面收听或观看。')}</p>}
                  <div className="media-source-links">
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">{tr(language, `Source: ${item.sourceName}`, `來源：${item.sourceName}`, `来源：${item.sourceName}`)} <ArrowUpRight size={12} /></a>
                    <a href={item.licenseUrl} target="_blank" rel="noreferrer">{tr(language, 'License details', '授權詳情', '授权详情')} <ArrowUpRight size={12} /></a>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="media-garden-note">{tr(language, 'Media is hosted by Wikimedia Commons. Playback may use your device’s standard media controls.', '影音由 Wikimedia Commons 提供；播放時會使用裝置的標準控制功能。', '影音由 Wikimedia Commons 提供；播放时会使用设备的标准控制功能。')}</p>
    </section>
  );
}
