import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PageTitle, ProgressBar, Screen, Surface } from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { ageBands } from '@/data/vocabulary';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import {
  freeReadings,
  getStageContent,
  modeCopy,
  pathTheme,
  stageAges,
  stageNames,
  translateInterface,
  type PlaygroundLanguage,
} from '@workspace/learning-content';
import type { GameMode } from '@workspace/learning-content/games';

function tr(language: PlaygroundLanguage, en: string, hant: string, hans: string) {
  return language === 'en'
    ? en
    : language === 'zh-Hant'
      ? hant
      : language === 'zh-Hans'
        ? hans
        : translateInterface(language, en);
}

export default function HomeScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const l = language as PlaygroundLanguage;
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const router = useRouter();
  const learning = useLearning();
  const subscription = useSubscription();
  const stage = subscription.isPremium ? learning.selectedStage : 1;
  const content = getStageContent(stage);
  const freeReading = freeReadings[learning.ageBand];
  const games: GameMode[] = ['match', 'pinyin', 'listen', 'word-order', 'sentence-order'];
  const visibleGames = subscription.isPremium ? games : ['pinyin' as const];

  const openLesson = (params?: { path?: string; story?: string }) => {
    router.push({
      pathname: '/(tabs)/lessons',
      params: params ?? {},
    });
  };
  const openGame = (mode: GameMode) => {
    router.push({ pathname: '/(tabs)/games', params: { mode } });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: colors.secondary }]}>
              <Ionicons name="leaf" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>{t('app.name')}</Text>
              <Text style={[styles.brandCaption, { color: colors.mutedForeground }]}>
                {tr(l, 'A place to grow with Mandarin', '陪孩子一起長大的學習樂園', '陪孩子一起长大的学习乐园')}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.parent')}
            onPress={() => router.push('/(tabs)/parent')}
            style={[styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="person-circle-outline" size={25} color={colors.primary} />
          </Pressable>
        </View>

        <LinearGradient
          colors={[colors.primary, colors.primaryShade]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroDecoration} />
          <Text style={[styles.heroEyebrow, { color: colors.accent }]}>
            {tr(l, `STAGE ${stage} · AGES ${stageAges[stage - 1]}`, `第 ${stage} 階段 · ${stageAges[stage - 1]} 歲`, `第 ${stage} 阶段 · ${stageAges[stage - 1]} 岁`)}
          </Text>
          <Text style={styles.heroTitle}>
            {tr(l, 'Learn Mandarin through play', '在遊戲中學習漢語', '在游戏中学习汉语')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {tr(l, stageNames[stage - 1][0], stageNames[stage - 1][1], stageNames[stage - 1][2])}
          </Text>
          {subscription.isPremium ? (
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={[styles.xpLabel, { color: colors.foreground }]}>
                  {tr(l, 'Selected stage progress', '所選階段進度', '所选阶段进度')}
                </Text>
                <Text style={[styles.xpValue, { color: colors.primary }]}>
                  {learning.selectedStageXp}/100 XP
                </Text>
              </View>
              <ProgressBar value={Math.min(100, learning.selectedStageXp)} />
              <Text style={[styles.xpHint, { color: colors.mutedForeground }]}>
                {learning.selectedStageXp >= 100
                  ? tr(l, 'Stage complete · choose a higher challenge anytime.', '已完成此階段 · 可隨時挑戰更高階段。', '已完成此阶段 · 可随时挑战更高阶段。')
                  : tr(l, '100 XP completes this stage.', '累積 100 XP 即完成此階段。', '累计 100 XP 即完成此阶段。')}
              </Text>
            </View>
          ) : (
            <Pressable onPress={() => router.push('/(tabs)/parent')} style={styles.heroButton}>
              <Text style={[styles.heroButtonText, { color: colors.primary }]}>
                {tr(l, 'Open parent area', '前往家長專區', '前往家长专区')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </Pressable>
          )}
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {tr(l, 'Free reading', '免費閱讀', '免费阅读')}
          </Text>
          <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
            {tr(l, 'Choose an age range', '選擇年齡階段', '选择年龄阶段')}
          </Text>
        </View>
        <View style={styles.ageRow}>
          {ageBands.map((band) => {
            const selected = learning.ageBand === band.value;
            return (
              <Pressable
                key={band.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`home-age-${band.value}`}
                onPress={() => learning.setAgeBand(band.value)}
                style={[
                  styles.ageChip,
                  { backgroundColor: selected ? colors.secondary : colors.card, borderColor: selected ? colors.primary : colors.border },
                ]}
              >
                <Text style={[styles.ageText, { color: selected ? colors.primary : colors.foreground }]}>
                  {t(band.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => openLesson({ story: 'free' })}
        >
          <Surface style={styles.readingCard}>
            <View style={[styles.readingIcon, { backgroundColor: colors.softAccent }]}>
              <Ionicons name="book-outline" size={21} color={colors.warmInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardEyebrow, { color: colors.primary }]}>
                {tr(l, 'FREE STORY', '免費短篇', '免费短篇')}
              </Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {freeReading.title[language]}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {t(ageBands.find((band) => band.value === learning.ageBand)?.labelKey ?? 'age.2-3.label')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Surface>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {tr(l, 'Choose a word path', '挑一條詞語小徑', '挑一条词语小径')}
          </Text>
          {subscription.isPremium ? (
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
              {content.words.length} {tr(l, 'words', '個詞語', '个词语')}
            </Text>
          ) : null}
        </View>
        {subscription.isPremium ? (
          <View style={styles.pathGrid}>
            {Array.from({ length: Math.min(4, Math.ceil(content.words.length / 20)) }, (_, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => openLesson({ path: String(index + 1) })}
                style={[styles.pathCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.pathNumber, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.pathNumberText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.pathTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {pathTheme(l, stage, index + 1)}
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  20 {tr(l, 'words', '個詞語', '个词语')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Surface style={styles.lockedCard}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.warmInk} />
            <Text style={[styles.cardSub, { color: colors.mutedForeground, flex: 1 }]}>
              {tr(l, 'Members can choose any of four stages, with 200 words in each stage.', '會員可自選四個階段，每階段各有 200 個詞語。', '会员可自选四个阶段，每阶段各有 200 个词语。')}
            </Text>
          </Surface>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {tr(l, 'Play a game', '挑選遊戲', '挑选游戏')}
          </Text>
        </View>
        <View style={styles.gameGrid}>
          {visibleGames.map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              onPress={() => openGame(mode)}
              style={[styles.gameCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
              <Text style={[styles.gameTitle, { color: colors.foreground }]}>
                {tr(l, modeCopy[mode].name[0], modeCopy[mode].name[1], modeCopy[mode].name[2])}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {tr(l, 'Short stories', '短篇故事', '短篇故事')}
          </Text>
          {subscription.isPremium ? (
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
              {content.stories.length} {tr(l, 'to replay', '可重複聆聽', '可重复聆听')}
            </Text>
          ) : null}
        </View>
        {subscription.isPremium ? (
          <View style={styles.storyList}>
            {content.stories.slice(0, 3).map((story) => (
              <Pressable
                key={story.id}
                accessibilityRole="button"
                onPress={() => openLesson({ story: story.id })}
                style={[styles.storyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="headset-outline" size={18} color={colors.primary} />
                <Text style={[styles.storyTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {language === 'en'
                    ? story.title.en
                    : language === 'zh-Hant'
                      ? story.title.trad
                      : language === 'zh-Hans'
                        ? story.title.simp
                        : translateInterface(language, story.title.en)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${freeReading.title[language]} · ${tr(l, 'Open free story', '開啟免費短文', '打开免费短文')}`}
            testID="home-free-story"
            onPress={() => openLesson({ story: 'free' })}
            style={[styles.freeStoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.freeStoryHeading}>
              <Ionicons name="headset-outline" size={19} color={colors.primary} />
              <Text style={[styles.storyTitle, { color: colors.foreground }]}>
                {freeReading.title[language]}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
            <Text
              style={[styles.freeStoryPreview, { color: colors.mutedForeground }]}
              numberOfLines={3}
            >
              {freeReading.text[language]}
            </Text>
            <Text style={[styles.freeStoryAge, { color: colors.primary }]}>
              {t(ageBands.find((band) => band.value === learning.ageBand)?.labelKey ?? 'age.2-3.label')}
              {' · '}
              {tr(l, 'Free story · tap to listen', '免費短篇 · 點擊聆聽', '免费短篇 · 点击聆听')}
            </Text>
          </Pressable>
        )}

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          {tr(l, 'A learning playground that grows with your child.', '陪孩子一起長大的學習樂園。', '陪孩子一起长大的学习乐园。')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 112, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: '800' },
  brandCaption: { fontSize: 10, marginTop: 2 },
  profileButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden', borderRadius: 24, padding: 20, gap: 9, minHeight: 205 },
  heroDecoration: { position: 'absolute', right: -28, top: -35, width: 140, height: 140, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 32, fontWeight: '800', maxWidth: '85%' },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  xpCard: { marginTop: 7, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 15, gap: 8 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: 12, fontWeight: '700' },
  xpValue: { fontSize: 12, fontWeight: '800' },
  xpHint: { fontSize: 10, lineHeight: 15 },
  heroButton: { marginTop: 9, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderRadius: 13, paddingHorizontal: 14, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroButtonText: { fontSize: 12, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionMeta: { fontSize: 11, fontWeight: '600' },
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  ageChip: { borderRadius: 11, borderWidth: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11 },
  ageText: { fontSize: 11, fontWeight: '700' },
  readingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  readingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  cardSub: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  pathGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  pathCard: { width: '48%', minHeight: 116, borderWidth: 1, borderRadius: 16, padding: 12, gap: 6 },
  pathNumber: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pathNumberText: { fontSize: 12, fontWeight: '800' },
  pathTitle: { fontSize: 12, lineHeight: 17, fontWeight: '700', flex: 1 },
  lockedCard: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14 },
  gameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gameCard: { width: '48%', minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  gameTitle: { flex: 1, fontSize: 11, fontWeight: '700' },
  storyList: { gap: 7 },
  storyRow: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyTitle: { flex: 1, fontSize: 12, fontWeight: '700' },
  freeStoryCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 9 },
  freeStoryHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  freeStoryPreview: { fontSize: 12, lineHeight: 18 },
  freeStoryAge: { fontSize: 10, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11, lineHeight: 17, paddingVertical: 8 },
});
