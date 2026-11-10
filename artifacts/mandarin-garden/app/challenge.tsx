import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { PageTitle, Screen, Surface } from '@/components/LearningUI';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useLearning } from '@/context/LearningContext';
import { translate } from '@/lib/i18n';
import { ageBands } from '@/data/vocabulary';
import type { PlaygroundLanguage } from '@workspace/learning-content';

function tr(language: PlaygroundLanguage, en: string, hant: string, hans: string) {
  return language === 'en'
    ? en
    : language === 'zh-Hant'
      ? hant
      : language === 'zh-Hans'
        ? hans
        : translate(language, en);
}

export default function ChallengeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { language } = useLanguage();
  const l = language as PlaygroundLanguage;
  const learning = useLearning();
  const ageLabel = translate(language, ageBands.find((band) => band.value === learning.ageBand)?.labelKey ?? 'age.2-3.label');

  return (
    <Screen>
      <Stack.Screen options={{ title: tr(l, 'Daily challenge', '每日挑戰', '每日挑战') }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle
          eyebrow={tr(l, 'A LITTLE DAILY PRACTICE', '每日小練習', '每日小练习')}
          title={tr(l, 'A little challenge, every day', '每天一個小挑戰', '每天一个小挑战')}
          subtitle={tr(l, 'Try a few playful questions made for the age you choose.', '依孩子的年齡，玩幾道輕鬆的小題目。', '按孩子的年龄，玩几道轻松的小题目。')}
        />
        <Surface style={styles.card}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{tr(l, 'FREE CHALLENGE', '免費挑戰', '免费挑战')}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{ageLabel}</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            {tr(l, 'Start a short pinyin matching round. Correct answers earn XP for members.', '開始一輪拼音配對。會員答對可累積 XP。', '开始一轮拼音配对。会员答对可积累 XP。')}
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="button-start-free-challenge"
            onPress={() => router.push({ pathname: '/(tabs)/games', params: { mode: 'pinyin' } })}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{tr(l, 'Start the challenge', '開始挑戰', '开始挑战')}</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
          </Pressable>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  card: { padding: 20, gap: 12, alignItems: 'flex-start' },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { fontSize: 20, fontWeight: '800' },
  copy: { fontSize: 13, lineHeight: 20 },
  button: { minHeight: 48, width: '100%', paddingHorizontal: 15, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  buttonText: { fontSize: 14, fontWeight: '800' },
});
