import { ArrowRight, BookOpen, Sprout } from 'lucide-react';
import { Link } from 'wouter';
import type { Language } from '@/lib/garden-data';
import { PwaInstallButton } from '@/components/pwa-install-button';

type PortalCopy = {
  eyebrow: string;
  heading: string;
  intro: string;
  gardenTitle: string;
  gardenDescription: string;
  gardenAction: string;
  treasureTitle: string;
  treasureDescription: string;
  treasureAction: string;
};

const copy: Record<Language, PortalCopy> = {
  en: {
    eyebrow: 'WELCOME',
    heading: 'Choose your Mandarin learning space',
    intro: 'Select the place that fits you best.',
    gardenTitle: 'Mandarin Garden',
    gardenDescription: 'A family learning playground with the existing activities and parent area.',
    gardenAction: 'Enter Mandarin Garden',
    treasureTitle: '中文寶庫',
    treasureDescription: 'A new space for Chinese learners. Its learning content is still being planned.',
    treasureAction: 'Enter Chinese Treasure House',
  },
  'zh-Hant': {
    eyebrow: '歡迎來到',
    heading: '選擇你的中文學習入口',
    intro: '請選擇適合你的學習空間。',
    gardenTitle: '漢語樂園',
    gardenDescription: '為家庭而設，保留現有學習內容和家長專區。',
    gardenAction: '進入漢語樂園',
    treasureTitle: '中文寶庫',
    treasureDescription: '為中文學習者準備的新空間，學習內容仍在規劃中。',
    treasureAction: '進入中文寶庫',
  },
  'zh-Hans': {
    eyebrow: '欢迎来到',
    heading: '选择你的中文学习入口',
    intro: '请选择适合你的学习空间。',
    gardenTitle: '汉语乐园',
    gardenDescription: '为家庭而设，保留现有学习内容和家长专区。',
    gardenAction: '进入汉语乐园',
    treasureTitle: '中文宝库',
    treasureDescription: '为中文学习者准备的新空间，学习内容仍在规划中。',
    treasureAction: '进入中文宝库',
  },
  es: {
    eyebrow: 'TE DAMOS LA BIENVENIDA',
    heading: 'Elige tu espacio para aprender chino',
    intro: 'Selecciona el espacio más adecuado para ti.',
    gardenTitle: 'Mandarin Garden',
    gardenDescription: 'Un espacio de aprendizaje familiar con las actividades actuales y el área para padres.',
    gardenAction: 'Entrar en Mandarin Garden',
    treasureTitle: '中文寶庫',
    treasureDescription: 'Un nuevo espacio para estudiantes de chino. El contenido aún está en planificación.',
    treasureAction: 'Entrar en Chinese Treasure House',
  },
  fr: {
    eyebrow: 'BIENVENUE',
    heading: 'Choisissez votre espace d’apprentissage du chinois',
    intro: 'Sélectionnez l’espace qui vous convient.',
    gardenTitle: 'Mandarin Garden',
    gardenDescription: 'Un espace familial avec les activités existantes et l’espace parents.',
    gardenAction: 'Entrer dans Mandarin Garden',
    treasureTitle: '中文寶庫',
    treasureDescription: 'Un nouvel espace pour les apprenants de chinois. Le contenu est en préparation.',
    treasureAction: 'Entrer dans Chinese Treasure House',
  },
  ja: {
    eyebrow: 'ようこそ',
    heading: '中国語学習の場所を選んでください',
    intro: '自分に合った学習スペースを選びましょう。',
    gardenTitle: '漢語楽園',
    gardenDescription: '現在の学習コンテンツと保護者向けページがある、家族のための学習スペースです。',
    gardenAction: '漢語楽園に入る',
    treasureTitle: '中文寶庫',
    treasureDescription: '中国語学習者向けの新しい場所です。内容は準備中です。',
    treasureAction: '中文寶庫に入る',
  },
  ko: {
    eyebrow: '환영합니다',
    heading: '중국어 학습 공간을 선택하세요',
    intro: '나에게 맞는 학습 공간을 골라 보세요.',
    gardenTitle: '漢語樂園',
    gardenDescription: '기존 학습 활동과 학부모 공간을 제공하는 가족 학습 공간입니다.',
    gardenAction: '漢語樂園 입장하기',
    treasureTitle: '中文寶庫',
    treasureDescription: '중국어 학습자를 위한 새 공간입니다. 콘텐츠를 준비하고 있습니다.',
    treasureAction: '中文寶庫 입장하기',
  },
  pt: {
    eyebrow: 'BEM-VINDO',
    heading: 'Escolha o seu espaço de aprendizagem de chinês',
    intro: 'Selecione o espaço mais adequado para si.',
    gardenTitle: 'Mandarin Garden',
    gardenDescription: 'Um espaço de aprendizagem para famílias com as atividades atuais e a área dos pais.',
    gardenAction: 'Entrar no Mandarin Garden',
    treasureTitle: '中文寶庫',
    treasureDescription: 'Um novo espaço para estudantes de chinês. O conteúdo ainda está a ser planeado.',
    treasureAction: 'Entrar no Chinese Treasure House',
  },
};

export default function EntryPortalPage({ language }: { language: Language }) {
  const text = copy[language];

  return (
    <main className="page-shell entry-portal-page" data-testid="entry-portal">
      <header className="entry-portal-heading">
        <span className="entry-portal-icon"><Sprout size={31} strokeWidth={1.7} /></span>
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.heading}</h1>
        <p>{text.intro}</p>
      </header>
      <div className="entry-install-action">
        <PwaInstallButton language={language} prominent />
      </div>
      <section className="entry-choice-grid" aria-label={text.heading}>
        <Link href="/home" className="entry-choice-card garden-choice" data-testid="link-entry-garden">
          <span className="entry-choice-icon"><Sprout size={28} /></span>
          <span className="entry-choice-copy">
            <strong>{text.gardenTitle}</strong>
            <small>{text.gardenDescription}</small>
            <span className="entry-choice-action">{text.gardenAction} <ArrowRight size={17} /></span>
          </span>
        </Link>
        <Link href="/treasure-house" className="entry-choice-card treasure-choice" data-testid="link-entry-treasure">
          <span className="entry-choice-icon"><BookOpen size={27} /></span>
          <span className="entry-choice-copy">
            <strong>{text.treasureTitle}</strong>
            <small>{text.treasureDescription}</small>
            <span className="entry-choice-action">{text.treasureAction} <ArrowRight size={17} /></span>
          </span>
        </Link>
      </section>
    </main>
  );
}
