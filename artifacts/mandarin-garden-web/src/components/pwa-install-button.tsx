import { useEffect, useState } from 'react';
import type { Language } from '@/lib/garden-data';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const copy = {
  en: {
    install: 'Install app',
    ios: 'Add to Home Screen',
    instructions: 'In Safari, tap Share, then Add to Home Screen.',
  },
  'zh-Hant': {
    install: '安裝到手機',
    ios: '加入主畫面',
    instructions: '在 Safari 點按「分享」，再選「加入主畫面」。',
  },
  'zh-Hans': {
    install: '安装到手机',
    ios: '添加到主屏幕',
    instructions: '在 Safari 点按“分享”，再选择“添加到主屏幕”。',
  },
} satisfies Record<Language, { install: string; ios: string; instructions: string }>;

export function PwaInstallButton({ language }: { language: Language }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const text = copy[language];

  useEffect(() => {
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setIsIosSafari(ios);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (promptEvent) {
    return (
      <button
        className="button-secondary"
        type="button"
        onClick={async () => {
          await promptEvent.prompt();
          await promptEvent.userChoice;
          setPromptEvent(null);
        }}
      >
        {text.install}
      </button>
    );
  }

  if (!isIosSafari) return null;
  return (
    <details style={{ maxWidth: 250 }}>
      <summary className="button-secondary" style={{ cursor: 'pointer', listStyle: 'none' }}>
        {text.ios}
      </summary>
      <p style={{ margin: '8px 0', maxWidth: 250 }}>{text.instructions}</p>
    </details>
  );
}
