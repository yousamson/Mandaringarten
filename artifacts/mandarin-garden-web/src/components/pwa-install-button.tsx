import { useEffect, useState } from 'react';
import type { Language } from '@/lib/garden-data';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const copy: Record<Language, { install: string; ios: string; instructions: string }> = {
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
  es: { install: 'Instalar la aplicación', ios: 'Añadir a la pantalla de inicio', instructions: 'En Safari, toca Compartir y luego Añadir a la pantalla de inicio.' },
  fr: { install: 'Installer l’application', ios: 'Ajouter à l’écran d’accueil', instructions: 'Dans Safari, touchez Partager, puis Ajouter à l’écran d’accueil.' },
  ja: { install: 'アプリをインストール', ios: 'ホーム画面に追加', instructions: 'Safariで共有をタップし、「ホーム画面に追加」を選びます。' },
  ko: { install: '앱 설치', ios: '홈 화면에 추가', instructions: 'Safari에서 공유를 누른 다음 홈 화면에 추가를 선택하세요.' },
  pt: { install: 'Instalar aplicação', ios: 'Adicionar ao ecrã principal', instructions: 'No Safari, toque em Partilhar e depois em Adicionar ao ecrã principal.' },
};

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
