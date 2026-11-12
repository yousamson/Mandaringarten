import { useEffect, useState } from 'react';
import { recordAppInstallClick } from '@workspace/api-client-react';
import type { Language } from '@/lib/garden-data';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const copy: Record<Language, {
  install: string;
  freeInstall: string;
  ios: string;
  iosInstructions: string;
  manualInstructions: string;
}> = {
  en: {
    install: 'Install app',
    freeInstall: 'Install the app for free',
    ios: 'Add to Home Screen',
    iosInstructions: 'In Safari, tap Share, then Add to Home Screen.',
    manualInstructions: 'On Android, open this page in Chrome, tap ⋮, then choose Install app or Add to Home screen. On iPhone or iPad, use Safari’s Share button and choose Add to Home Screen.',
  },
  'zh-Hant': {
    install: '安裝到手機',
    freeInstall: '免費安裝 App',
    ios: '加入主畫面',
    iosInstructions: '在 Safari 點按「分享」，再選「加入主畫面」。',
    manualInstructions: 'Android：用 Chrome 開啟本頁，點右上角 ⋮，選「安裝應用程式」或「加入主畫面」。iPhone 或 iPad：用 Safari 點「分享」，再選「加入主畫面」。',
  },
  'zh-Hans': {
    install: '安装到手机',
    freeInstall: '免费安装 App',
    ios: '添加到主屏幕',
    iosInstructions: '在 Safari 点按“分享”，再选择“添加到主屏幕”。',
    manualInstructions: 'Android：用 Chrome 打开本页，点右上角 ⋮，选择“安装应用”或“添加到主屏幕”。iPhone 或 iPad：用 Safari 点“分享”，再选择“添加到主屏幕”。',
  },
  es: {
    install: 'Instalar la aplicación',
    freeInstall: 'Instala la app gratis',
    ios: 'Añadir a la pantalla de inicio',
    iosInstructions: 'En Safari, toca Compartir y luego Añadir a la pantalla de inicio.',
    manualInstructions: 'En Android, abre esta página en Chrome, toca ⋮ y elige Instalar aplicación o Añadir a la pantalla de inicio. En iPhone o iPad, usa Safari y elige Añadir a la pantalla de inicio desde Compartir.',
  },
  fr: {
    install: 'Installer l’application',
    freeInstall: 'Installer gratuitement',
    ios: 'Ajouter à l’écran d’accueil',
    iosInstructions: 'Dans Safari, touchez Partager, puis Ajouter à l’écran d’accueil.',
    manualInstructions: 'Sur Android, ouvrez cette page dans Chrome, touchez ⋮, puis Installer l’application ou Ajouter à l’écran d’accueil. Sur iPhone ou iPad, dans Safari, touchez Partager puis Ajouter à l’écran d’accueil.',
  },
  ja: {
    install: 'アプリをインストール',
    freeInstall: '無料でアプリをインストール',
    ios: 'ホーム画面に追加',
    iosInstructions: 'Safariで共有をタップし、「ホーム画面に追加」を選びます。',
    manualInstructions: 'AndroidではChromeでこのページを開き、⋮から「アプリをインストール」または「ホーム画面に追加」を選びます。iPhoneやiPadではSafariの共有メニューから「ホーム画面に追加」を選びます。',
  },
  ko: {
    install: '앱 설치',
    freeInstall: '앱 무료 설치',
    ios: '홈 화면에 추가',
    iosInstructions: 'Safari에서 공유를 누른 다음 홈 화면에 추가를 선택하세요.',
    manualInstructions: 'Android에서는 Chrome으로 이 페이지를 열고 ⋮ 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택하세요. iPhone이나 iPad에서는 Safari의 공유 메뉴에서 홈 화면에 추가를 선택하세요.',
  },
  pt: {
    install: 'Instalar aplicação',
    freeInstall: 'Instalar a app gratuitamente',
    ios: 'Adicionar ao ecrã principal',
    iosInstructions: 'No Safari, toque em Partilhar e depois em Adicionar ao ecrã principal.',
    manualInstructions: 'No Android, abra esta página no Chrome, toque em ⋮ e escolha Instalar aplicação ou Adicionar ao ecrã principal. No iPhone ou iPad, use o Safari e escolha Adicionar ao ecrã principal no menu Partilhar.',
  },
};

export function PwaInstallButton({ language, prominent = false }: { language: Language; prominent?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const text = copy[language];
  const label = prominent ? text.freeInstall : text.install;
  const buttonClass = prominent ? 'button-primary' : 'button-secondary';

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
        className={buttonClass}
        type="button"
        onClick={async () => {
          if (import.meta.env.PROD) {
            void recordAppInstallClick({ skipAuth: true, keepalive: true }).catch(() => {
              // Install-intent analytics must not interrupt the install prompt.
            });
          }
          await promptEvent.prompt();
          await promptEvent.userChoice;
          setPromptEvent(null);
        }}
        data-testid={prominent ? 'button-install-app-home' : 'button-install-app'}
      >
        {label}
      </button>
    );
  }

  if (!prominent && !isIosSafari) return null;
  return (
    <details className="pwa-install-help">
      <summary
        className={buttonClass}
        onClick={(event) => {
          const details = event.currentTarget.parentElement as HTMLDetailsElement | null;
          if (!details?.open && import.meta.env.PROD) {
            void recordAppInstallClick({ skipAuth: true, keepalive: true }).catch(() => {
              // Install-intent analytics must not interrupt the install instructions.
            });
          }
        }}
        data-testid={prominent ? 'button-install-app-home' : 'button-install-app'}
      >
        {prominent ? label : text.ios}
      </summary>
      <p>{isIosSafari ? text.iosInstructions : text.manualInstructions}</p>
    </details>
  );
}
