import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { PageTitle, ProgressBar, Screen } from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { ageBands } from '@/data/vocabulary';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import { stageAges, stageNames, type PlaygroundLanguage } from '@workspace/learning-content';

type Destination = {
  href: Href;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  note: string;
  testId: string;
};

function tr(language: PlaygroundLanguage, en: string, hant: string, hans: string) {
  return language === 'en'
    ? en
    : language === 'zh-Hant'
      ? hant
      : language === 'zh-Hans'
        ? hans
        : translate(language, en);
}

export default function HomeScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const l = language as PlaygroundLanguage;
  const t = (key: string) => translate(language, key);
  const router = useRouter();
  const learning = useLearning();
  const subscription = useSubscription();
  const stage = subscription.isPremium ? learning.selectedStage : 1;
  const stageTitle = stageNames[stage - 1];
  const ageLabel = t(ageBands.find((band) => band.value === learning.ageBand)?.labelKey ?? 'age.2-3.label');

  const destinations: Destination[] = [
    {
      href: '/challenge',
      icon: 'sparkles-outline',
      title: tr(l, 'Daily challenge', '每日挑戰', '每日挑战'),
      note: tr(l, 'Try a few free questions', '免費玩幾道小題', '免费玩几道小题'),
      testId: 'link-map-challenge',
    },
    {
      href: '/(tabs)/lessons',
      icon: 'leaf-outline',
      title: tr(l, 'Word paths', '詞語小徑', '词语小径'),
      note: tr(l, 'Explore words by theme', '按主題探索詞語', '按主题探索词语'),
      testId: 'link-map-words',
    },
    {
      href: '/(tabs)/games',
      icon: 'game-controller-outline',
      title: tr(l, 'Games', '遊戲樂園', '游戏乐园'),
      note: tr(l, 'Play and practise', '邊玩邊練習', '边玩边练习'),
      testId: 'link-map-games',
    },
    {
      href: '/stories',
      icon: 'book-outline',
      title: tr(l, 'Stories', '故事天地', '故事天地'),
      note: tr(l, 'Read and listen together', '一起閱讀與聆聽', '一起阅读与聆听'),
      testId: 'link-map-stories',
    },
    {
      href: '/translation',
      icon: 'language-outline',
      title: tr(l, 'Word finder', '字詞小幫手', '字词小帮手'),
      note: tr(l, 'Look up a word or phrase', '查找字詞和短句', '查找字词和短句'),
      testId: 'link-map-translation',
    },
    {
      href: '/garden',
      icon: 'flower-outline',
      title: tr(l, 'My garden', '我的花園', '我的花园'),
      note: tr(l, 'Care for a growing flower', '照料逐漸長大的花', '照料逐渐长大的花'),
      testId: 'link-map-garden',
    },
    {
      href: '/(tabs)/parent',
      icon: 'person-circle-outline',
      title: tr(l, 'For parents', '家長專區', '家长专区'),
      note: tr(l, 'Choose a stage and manage access', '選擇學習階段與管理會員', '选择学习阶段与管理会员'),
      testId: 'link-map-parent',
    },
  ];

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
            accessibilityLabel={tr(l, 'Open parent area', '前往家長專區', '前往家长专区')}
            testID="button-home-parent"
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
            {tr(l, 'Choose a place to explore', '挑選一個地方開始探索', '挑选一个地方开始探索')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {tr(l, stageTitle[0], stageTitle[1], stageTitle[2])} · {ageLabel}
          </Text>
          {subscription.isPremium ? (
            <View style={styles.xpCard} testID="status-home-stage-xp">
              <View style={styles.xpHeader}>
                <Text style={[styles.xpLabel, { color: colors.foreground }]}>
                  {tr(l, 'Selected stage progress', '所選階段進度', '所选阶段进度')}
                </Text>
                <Text style={[styles.xpValue, { color: colors.primary }]}>{learning.selectedStageXp}/100 XP</Text>
              </View>
              <ProgressBar value={Math.min(100, learning.selectedStageXp)} />
              <Text style={[styles.xpHint, { color: colors.mutedForeground }]}>
                {learning.selectedStageXp >= 100
                  ? tr(l, 'Stage complete · choose a higher challenge anytime.', '已完成此階段 · 可隨時挑戰更高階段。', '已完成此阶段 · 可随时挑战更高阶段。')
                  : tr(l, 'Earn 100 XP to complete this stage.', '累積 100 XP 即完成此階段。', '累计 100 XP 即完成此阶段。')}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.mapHeading}>
          <View>
            <Text style={[styles.mapEyebrow, { color: colors.primary }]}>
              {tr(l, 'PICK A PLACE', '挑選一個地方', '挑选一个地方')}
            </Text>
            <Text style={[styles.mapTitle, { color: colors.foreground }]}>
              {tr(l, 'Where shall we go?', '今天想去哪裡？', '今天想去哪里？')}
            </Text>
          </View>
          <View style={[styles.mapBadge, { backgroundColor: colors.secondary }]}>
            <Ionicons name="map-outline" size={17} color={colors.primary} />
            <Text style={[styles.mapBadgeText, { color: colors.primary }]}>
              {tr(l, 'Explore', '探索', '探索')}
            </Text>
          </View>
        </View>

        <View style={styles.mapDecor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.mapDecorLine, { backgroundColor: colors.border }]} />
          <View style={[styles.mapDecorCenter, { backgroundColor: colors.secondary, borderColor: colors.card }]}>
            <Ionicons name="flower" size={29} color={colors.primary} />
          </View>
          <View style={[styles.mapDecorNode, styles.mapNodeOne, { backgroundColor: colors.softAccent, borderColor: colors.card }]} />
          <View style={[styles.mapDecorNode, styles.mapNodeTwo, { backgroundColor: colors.accent, borderColor: colors.card }]} />
          <View style={[styles.mapDecorNode, styles.mapNodeThree, { backgroundColor: colors.secondary, borderColor: colors.card }]} />
        </View>

        <View style={styles.mapGrid} accessibilityRole="list" accessibilityLabel={tr(l, 'Learning garden destinations', '學習樂園入口', '学习乐园入口')}>
          {destinations.map((destination) => (
            <Pressable
              key={destination.testId}
              accessibilityRole="button"
              accessibilityLabel={`${destination.title}. ${destination.note}`}
              testID={destination.testId}
              onPress={() => router.push(destination.href)}
              style={({ pressed }) => [
                styles.mapCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.mapCardPressed,
              ]}
            >
              <View style={[styles.mapCardIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={destination.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.mapCardCopy}>
                <Text style={[styles.mapCardTitle, { color: colors.foreground }]}>{destination.title}</Text>
                <Text style={[styles.mapCardNote, { color: colors.mutedForeground }]}>{destination.note}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          {tr(l, 'A learning playground that grows with your child.', '陪孩子一起長大的學習樂園。', '陪孩子一起长大的学习乐园。')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 112, gap: 17 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: '800' },
  brandCaption: { fontSize: 10, marginTop: 2 },
  profileButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden', borderRadius: 24, padding: 20, gap: 9, minHeight: 166 },
  heroDecoration: { position: 'absolute', right: -28, top: -35, width: 140, height: 140, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 31, fontWeight: '800', maxWidth: '90%' },
  heroSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12 },
  xpCard: { marginTop: 7, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 15, gap: 8 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: 12, fontWeight: '700' },
  xpValue: { fontSize: 12, fontWeight: '800' },
  xpHint: { fontSize: 10, lineHeight: 15 },
  mapHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  mapEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  mapTitle: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  mapBadge: { minHeight: 34, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapBadgeText: { fontSize: 10, fontWeight: '800' },
  mapDecor: { height: 50, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  mapDecorLine: { position: 'absolute', height: 3, width: '76%', borderRadius: 2, transform: [{ rotate: '-6deg' }] },
  mapDecorCenter: { width: 48, height: 48, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  mapDecorNode: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3 },
  mapNodeOne: { left: '8%', top: 8 },
  mapNodeTwo: { left: '28%', bottom: 2 },
  mapNodeThree: { right: '10%', top: 4 },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mapCard: { width: '48%', minHeight: 105, borderWidth: 1, borderRadius: 18, padding: 12, gap: 9 },
  mapCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  mapCardIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mapCardCopy: { flex: 1, gap: 4 },
  mapCardTitle: { fontSize: 13, fontWeight: '800' },
  mapCardNote: { fontSize: 10, lineHeight: 14 },
  footer: { textAlign: 'center', fontSize: 11, lineHeight: 17, paddingVertical: 8 },
});
