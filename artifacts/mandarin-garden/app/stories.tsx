import React from 'react';
import { Stack } from 'expo-router';
import LessonsScreen from './(tabs)/lessons';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';

export default function StoriesScreen() {
  const { language } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: language === 'zh-Hant' ? '故事天地' : language === 'zh-Hans' ? '故事天地' : translate(language, 'Stories') }} />
      <LessonsScreen section="stories" />
    </>
  );
}
