import { useState } from 'react';
import { ArrowRight, Languages, LoaderCircle, Search } from 'lucide-react';
import { useLookupTranslation } from '@workspace/api-client-react';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

const languageName = (code: string, language: Language) => {
  if (code === 'en') return 'English';
  return code === 'zh-CN'
    ? tr(language, 'Simplified Chinese', '簡體中文', '简体中文')
    : tr(language, 'Traditional Chinese', '繁體中文', '繁体中文');
};

export function TranslationLookup({ language }: { language: Language }) {
  const [text, setText] = useState('');
  const lookup = useLookupTranslation();
  const input = text.trim();
  const script = language === 'zh-Hans' ? 'zh-Hans' : 'zh-Hant';
  const errorStatus = (lookup.error as { status?: number } | null)?.status;

  const submit = () => {
    if (!input || lookup.isPending) return;
    lookup.mutate({ data: { text: input, script } });
  };

  return (
    <section className="translation-lookup" aria-labelledby="translation-lookup-title" data-testid="translation-lookup">
      <div className="translation-lookup-heading">
        <span className="translation-lookup-icon"><Languages size={19} /></span>
        <div>
          <div className="eyebrow">{tr(language, 'WORD FINDER', '字詞查找', '字词查找')}</div>
          <h2 id="translation-lookup-title">{tr(language, 'Look up a word', '查找字詞翻譯', '查找字词翻译')}</h2>
          <p>{tr(language, 'Translate a word or short phrase between English and Chinese.', '查找中英文單字或短句的翻譯。', '查找中英文单词或短句的翻译。')}</p>
        </div>
      </div>

      <div className="translation-lookup-controls" role="search">
        <label className="translation-search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={text}
            maxLength={100}
            placeholder={tr(language, 'Type a word or short phrase', '輸入字詞或短句', '输入字词或短句')}
            aria-label={tr(language, 'Word to translate', '要翻譯的字詞', '要翻译的字词')}
            data-testid="input-translation-word"
            onChange={(event) => {
              setText(event.target.value);
              lookup.reset();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>
        <button
          type="button"
          className="button-primary translation-submit"
          onClick={submit}
          disabled={!input || lookup.isPending}
          data-testid="button-translate-word"
        >
          {lookup.isPending ? <LoaderCircle size={16} className="translation-spinner" /> : <ArrowRight size={16} />}
          {lookup.isPending
            ? tr(language, 'Translating…', '翻譯中…', '翻译中…')
            : tr(language, 'Translate', '查找翻譯', '查找翻译')}
        </button>
      </div>

      {lookup.data && lookup.data.text === input && (
        <div className="translation-result" role="status" data-testid="text-translation-result">
          <div className="translation-pair">
            <span>{lookup.data.text}</span>
            <ArrowRight size={16} aria-hidden="true" />
            <strong>{lookup.data.translatedText}</strong>
          </div>
          <small>{languageName(lookup.data.sourceLanguage, language)} → {languageName(lookup.data.targetLanguage, language)} · MyMemory</small>
        </div>
      )}

      {lookup.isError && (
        <p className="translation-error" role="alert" data-testid="text-translation-error">
          {errorStatus === 429
            ? tr(language, 'The free shared daily limit has been reached. Please try tomorrow.', '免費共用每日額度已用完，請明天再試。', '免费共用每日额度已用完，请明天再试。')
            : tr(language, 'Translation is unavailable right now. Please try again.', '目前無法取得翻譯，請稍後再試。', '目前无法取得翻译，请稍后再试。')}
        </p>
      )}

      <p className="translation-privacy-note">
        {tr(language,
          'Free shared limit: about 5,000 characters per day. Your text and selected Chinese script are sent to MyMemory, which may store submissions long term and share them with partners. Do not enter personal or sensitive information.',
          '免費服務由所有使用者共用，每日約 5,000 字元。輸入文字及所選中文版本會傳送至 MyMemory；其可能長期保存內容並與合作夥伴分享。請勿輸入個人或敏感資料。',
          '免费服务由所有用户共用，每日约 5,000 字符。输入文字及所选中文版本会发送至 MyMemory；其可能长期保存内容并与合作伙伴分享。请勿输入个人或敏感信息。')}
      </p>
    </section>
  );
}
