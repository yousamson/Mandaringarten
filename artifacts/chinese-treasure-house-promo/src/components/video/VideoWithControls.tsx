import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_TITLES = ['Opening', 'Two paths', 'HSK 1-9', 'PSC bands', 'Treasure House'];
const SCENE_FILES = [
  'src/components/video/scenes/OpeningScene.tsx',
  'src/components/video/scenes/PathsScene.tsx',
  'src/components/video/scenes/HskScene.tsx',
  'src/components/video/scenes/PscScene.tsx',
  'src/components/video/scenes/FinaleScene.tsx',
];

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const controls = useSceneControls(SCENE_DURATIONS);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!controls.paused) return;
    const frozen = document.getAnimations().filter((animation) => animation.playState === 'running');
    frozen.forEach((animation) => animation.pause());
    return () => frozen.forEach((animation) => animation.play());
  }, [controls.paused]);
  const handlePointerEnter = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(true);
  }, []);
  const handlePointerLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(false);
  }, []);
  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && collapsed) setTapPinned(true);
  }, [collapsed]);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      if (!value) {
        setHovering(false);
        setTapPinned(false);
      }
      return !value;
    });
  }, []);
  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const handleOutside = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== 'mouse' && sensorRef.current && !sensorRef.current.contains(event.target as Node)) setTapPinned(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [collapsed, tapPinned]);

  if (!isIframed) return <VideoTemplate />;
  const visible = !collapsed || hovering || tapPinned;
  const handleJumpTo = useCallback((index: number) => {
    controls.jumpTo(index);
    window.parent.postMessage({
      type: 'REPLIT_VIDEO_SCENE_SELECTED',
      payload: {
        sceneIndex: index,
        sceneCount: controls.sceneKeys.length,
        sceneTitle: SCENE_TITLES[index],
        filePath: SCENE_FILES[index],
        lineNumber: 1,
      },
    }, '*');
  }, [controls.jumpTo, controls.sceneKeys.length]);
  return (
    <div className="video-control-host">
      <VideoTemplate
        key={controls.mountKey}
        durations={controls.durations}
        loop
        paused={controls.paused}
        muted={muted}
        onSceneChange={controls.onSceneChange}
      />
      <div
        ref={sensorRef}
        className="control-sensor"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        <div className="control-hover-space" aria-hidden="true" />
        <div className={`video-control-bar ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
          <button className="control-icon" onClick={controls.togglePause} aria-label={controls.paused ? 'Play' : 'Pause'} title={controls.paused ? 'Play' : 'Pause'}>
            {controls.paused ? <Play /> : <Pause />}
          </button>
          <button className={`control-icon ${controls.locked ? 'is-active' : ''}`} onClick={controls.toggleLock} aria-label={controls.locked ? 'Unlock scene loop' : 'Loop current scene'} aria-pressed={controls.locked} title="Loop current scene">
            <Repeat />
          </button>
          <button className="control-icon" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute audio' : 'Mute audio'} title={muted ? 'Unmute audio' : 'Mute audio'}>
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <div className="control-divider" />
          <PlaybackStatus
            sceneKeys={controls.sceneKeys}
            activeIndex={controls.activeIndex}
            activeDuration={controls.activeDuration}
            activeStartTime={controls.activeStartTime}
            totalDuration={controls.totalDuration}
            tick={controls.tick}
            paused={controls.paused}
            onJumpTo={handleJumpTo}
          />
          <button className="control-icon control-collapse" onClick={toggleCollapsed} aria-label={collapsed ? 'Show controls' : 'Hide controls'} aria-expanded={!collapsed}>
            {collapsed ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaybackStatus({
  sceneKeys,
  activeIndex,
  activeDuration,
  activeStartTime,
  totalDuration,
  tick,
  paused,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedBaseRef = useRef(0);
  useEffect(() => {
    setElapsed(0);
    elapsedBaseRef.current = 0;
  }, [tick]);
  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed(elapsedBaseRef.current + performance.now() - startedAt), 60);
    return () => {
      window.clearInterval(timer);
      elapsedBaseRef.current += performance.now() - startedAt;
    };
  }, [tick, paused]);
  const totalElapsed = Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration));
  const format = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  return (
    <>
      <div className="control-progress">
        {sceneKeys.map((key, index) => (
          <button
            key={key}
            className="control-segment"
            aria-label={`Jump to ${SCENE_TITLES[index] ?? key}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => onJumpTo(index)}
          >
            <span style={{ width: `${index < activeIndex ? 100 : index === activeIndex ? Math.min(100, elapsed / activeDuration * 100) : 0}%` }} />
          </button>
        ))}
      </div>
      <span className="control-scene-count">{activeIndex + 1}/{sceneKeys.length}</span>
      <span className="control-time" role="timer">{format(totalElapsed)} / {format(totalDuration)}</span>
    </>
  );
}
