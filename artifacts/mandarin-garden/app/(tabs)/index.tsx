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
import {
  PageTitle,
  ProgressBar,
  Screen,
  Surface,
} from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { ageBands, lessons } from '@/data/vocabulary';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';

export default function HomeScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const router = useRouter();
  const learning = useLearning();
  const { isPremium } = useSubscription();
  const ageLabel =
    ageBands.find((band) => band.value === learning.ageBand)?.labelKey ?? 'age.3-5.label';
  const progress = Math.min(
    100,
    (learning.xp / Math.max(1, learning.nextLevelXp)) * 100,
  );
  const nextLesson =
    lessons.find(
      (lesson) =>
        (!lesson.premium || isPremium) &&
        !learning.completedLessonIds.includes(lesson.id),
    ) ?? lessons[0];

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View
              style={[
                styles.brandMark,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Ionicons name="leaf" size={21} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>
                字字樂園
              </Text>
              <Text
                style={[
                  styles.brandCaption,
                  { color: colors.mutedForeground },
                ]}
              >
                {t('home.brandTagline')}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.parent')}
            testID="open-parent"
            onPress={() => router.push('/(tabs)/parent')}
            style={[
              styles.profileButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={25}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <LinearGradient
          colors={[colors.primary, colors.primaryShade]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View
            style={[styles.heroDecorOne, { backgroundColor: colors.glass }]}
          />
          <View
            style={[styles.heroDecorTwo, { backgroundColor: colors.glass }]}
          />
          <View style={styles.heroCopy}>
            <View style={[styles.heroPill, { backgroundColor: colors.glass }]}>
              <Ionicons
                name="sunny-outline"
                size={14}
                color={colors.accent}
              />
              <Text
                style={[
                  styles.heroPillText,
                  { color: colors.primaryForeground },
                ]}
              >
                {t('home.dailyTime')}
              </Text>
            </View>
            <Text
              style={[
                styles.heroTitle,
                { color: colors.primaryForeground },
              ]}
            >
              {t('home.heroTitle')}
            </Text>
            <Text
              style={[
                styles.heroDescription,
                { color: colors.heroMuted },
              ]}
            >
              {t('home.heroDescription')}
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="start-daily-lesson"
              onPress={() => router.push('/(tabs)/lessons')}
              style={({ pressed }) => [
                styles.heroButton,
                {
                  backgroundColor: colors.background,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.heroButtonText, { color: colors.primary }]}>
                {t('home.startLesson')}
              </Text>
              <Ionicons name="arrow-forward" size={17} color={colors.primary} />
            </Pressable>
          </View>
          <View style={[styles.heroSeal, { backgroundColor: colors.glass }]}>
            <Ionicons
              name="book-outline"
              size={35}
              color={colors.accent}
            />
            <View style={[styles.sealDot, { backgroundColor: colors.accent }]} />
          </View>
        </LinearGradient>

        <Surface style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text
                style={[styles.progressEyebrow, { color: colors.primary }]}
              >
                {t('home.progressEyebrow')}
              </Text>
              <Text
                style={[styles.progressTitle, { color: colors.foreground }]}
              >
                {t('home.levelTitle', { level: learning.level })}
              </Text>
            </View>
            <View
              style={[styles.xpPill, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="star" size={14} color={colors.accentForeground} />
              <Text style={[styles.xpText, { color: colors.accentForeground }]}>
                {learning.xp} XP
              </Text>
            </View>
          </View>
          <ProgressBar value={progress} />
          <View style={styles.progressBottom}>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              {t('home.wordsLearned', { count: learning.learnedWordIds.length })}
            </Text>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              {t('home.streak', { count: learning.streak })}
            </Text>
          </View>
        </Surface>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('home.courses')}
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              {t('home.ageLine', { age: t(ageLabel) })}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="see-all-lessons"
            onPress={() => router.push('/(tabs)/lessons')}
            style={styles.moreButton}
          >
            <Text style={[styles.moreText, { color: colors.primary }]}>
              {t('common.all')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          testID={`continue-${nextLesson.id}`}
          onPress={() => router.push('/(tabs)/lessons')}
          style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
        >
          <Surface style={styles.nextCard}>
            <View
              style={[styles.nextIcon, { backgroundColor: colors.secondary }]}
            >
              <Ionicons
                name={nextLesson.icon as keyof typeof Ionicons.glyphMap}
                size={23}
                color={colors.primary}
              />
            </View>
            <View style={styles.nextCopy}>
              <Text style={[styles.nextLabel, { color: colors.primary }]}>
                {learning.completedLessonIds.length === 0
                  ? t('home.firstLesson')
                  : t('home.continue')}
              </Text>
              <Text style={[styles.nextTitle, { color: colors.foreground }]}>
                {t(`lesson.${nextLesson.id}.title`)}
              </Text>
              <Text
                style={[
                  styles.nextSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                {t(`lesson.${nextLesson.id}.subtitle`)}
              </Text>
            </View>
            <View
              style={[styles.playCircle, { backgroundColor: colors.accent }]}
            >
              <Ionicons
                name="play"
                size={18}
                color={colors.accentForeground}
              />
            </View>
          </Surface>
        </Pressable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('home.playHeading')}
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              {t('home.playDescription')}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          testID="open-game"
          onPress={() => router.push('/(tabs)/games')}
          style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
        >
          <Surface style={styles.gameCard}>
            <View style={[styles.gameIcon, { backgroundColor: colors.softAccent }]}>
              <Ionicons
                name="extension-puzzle-outline"
                size={25}
                color={colors.warmInk}
              />
            </View>
            <View style={styles.gameCopy}>
              <Text style={[styles.gameTitle, { color: colors.foreground }]}>
                {t('home.gameTitle')}
              </Text>
              <Text
                style={[
                  styles.gameSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                {t('home.gameDescription')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.mutedForeground}
            />
          </Surface>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 108,
    gap: 15,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandCaption: {
    fontSize: 10,
    marginTop: 2,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    minHeight: 228,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 27,
    padding: 20,
  },
  heroDecorOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    top: -68,
    right: -40,
    borderRadius: 80,
  },
  heroDecorTwo: {
    position: 'absolute',
    width: 95,
    height: 95,
    bottom: -50,
    right: 48,
    borderRadius: 48,
  },
  heroCopy: {
    maxWidth: '76%',
    zIndex: 2,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 13,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
  },
  heroDescription: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  heroButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  heroButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroSeal: {
    position: 'absolute',
    right: 17,
    bottom: 19,
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  sealDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    top: 9,
    right: 9,
  },
  progressCard: {
    gap: 10,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helper: {
    fontSize: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  moreButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
  },
  nextIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: {
    flex: 1,
    gap: 2,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  nextSubtitle: {
    fontSize: 11,
  },
  playCircle: {
    width: 37,
    height: 37,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCopy: {
    flex: 1,
    gap: 3,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  gameSubtitle: {
    fontSize: 11,
  },
});
