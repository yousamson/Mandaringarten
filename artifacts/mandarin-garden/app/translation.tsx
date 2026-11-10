import React from 'react';
import { Stack } from 'expo-router';
import LessonsScreen from './(tabs)/lessons';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';

export default function TranslationScreen() {
  const { language } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: language === 'zh-Hant' ? '字詞小幫手' : language === 'zh-Hans' ? '字词小帮手' : translate(language, 'Word finder') }} />
      <LessonsScreen section="translation" />
    </>
  );
}
