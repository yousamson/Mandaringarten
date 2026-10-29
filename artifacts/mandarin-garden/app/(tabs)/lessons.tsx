import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { ActionButton, PageTitle, Screen, Surface } from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { ageBands, lessons, type Lesson, type Word } from '@/data/vocabulary';
import { curriculumLevels } from '@/data/curriculum';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { localizedSentence, localizedWord, translate } from '@/lib/i18n';

const filters = ['all', 'daily', 'food', 'family', 'world', 'leisure'];

export default function LessonsScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const router = useRouter();
  const { ageBand, completedLessonIds, learnedWordIds, markWordLearned, completeLesson } =
    useLearning();
  const { isPremium } = useSubscription();
  const [filter, setFilter] = useState('all');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [wordIndex, setWordIndex] = useState(0);

  const visibleLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) => filter === 'all' || lesson.category === filter,
      ),
    [filter],
  );
  const curriculum = curriculumLevels.find((item) => item.age === ageBand) ?? curriculumLevels[1];
  const curriculumUnlocked = isPremium && curriculum.level === 1;
  const ageLabel = ageBands.find((band) => band.value === ageBand)?.labelKey ?? 'age.3-5.label';

  const openLesson = (lesson: Lesson) => {
    if (lesson.premium && !isPremium) {
      router.push('/(tabs)/parent');
      return;
    }
    setActiveLesson(lesson);
    setWordIndex(0);
  };

  const currentWord = activeLesson?.words[wordIndex];
  const playWord = (word: Word) => {
    Speech.stop();
    Speech.speak(localizedWord(word.id, word.hanzi, language), { language: 'zh-CN', rate: 0.78 });
  };

  const advanceWord = () => {
    if (!activeLesson || !currentWord) return;
    markWordLearned(currentWord.id);
    if (wordIndex < activeLesson.words.length - 1) {
      setWordIndex((index) => index + 1);
      return;
    }
    completeLesson(activeLesson.id);
    setActiveLesson(null);
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          eyebrow={t('lessons.eyebrow')}
          title={t('lessons.title')}
          subtitle={t('lessons.subtitle')}
        />
        <Surface style={styles.curriculumCard}>
          <Text style={[styles.curriculumTitle, { color: colors.foreground }]}>
            {t('curriculum.levelLabel', { level: curriculum.level, age: t(ageLabel) })}
          </Text>
          <Text style={[styles.curriculumDescription, { color: colors.mutedForeground }]}>
            {t(curriculum.formatKey)}
          </Text>
          {!curriculumUnlocked ? (
            <Text style={[styles.curriculumLocked, { color: colors.primary }]}>
              {curriculum.level === 1 ? t('lessons.locked') : t('curriculum.locked')}
            </Text>
          ) : (
            <>
              {curriculum.themes.map((theme) => (
                <View key={theme.id} style={styles.curriculumTheme}>
                  <Text style={[styles.curriculumThemeTitle, { color: colors.primary }]}>
                    {t(`category.${theme.id}`)}
                  </Text>
                  <Text style={[styles.curriculumItems, { color: colors.foreground }]}>
                    {theme.items.map((item) => language === 'zh-Hans' ? item.simplified : item.hanzi).join('　')}
                  </Text>
                  <Text style={[styles.curriculumItems, { color: colors.mutedForeground }]}>
                    {theme.items.map((item) => `${item.pinyin} · ${item.meaning}`).join('   ')}
                  </Text>
                </View>
              ))}
              <Text style={[styles.curriculumThemeTitle, { color: colors.primary }]}>
                {t(`curriculum.games${curriculum.level}`)}
              </Text>
            </>
          )}
          {curriculum.readings ? (
            <View style={styles.readings}>
              <Text style={[styles.curriculumThemeTitle, { color: colors.primary }]}>
                {t('curriculum.reading')}
              </Text>
              {curriculumUnlocked ? curriculum.readings.map((reading) => (
                  <View key={reading.difficulty} style={[styles.readingCard, { borderTopColor: colors.border }]}>
                  <Text style={[styles.readingTitle, { color: colors.foreground }]}>
                    {reading.title} · {t(`curriculum.${reading.difficulty}`)}
                  </Text>
                  <Text style={[styles.curriculumItems, { color: colors.mutedForeground }]}>
                    {reading.text}
                  </Text>
                </View>
              )) : null}
            </View>
          ) : null}
        </Surface>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => {
            const selected = filter === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`filter-${item}`}
                onPress={() => setFilter(item)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: selected
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {t(`category.${item}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.lessonList}>
          {visibleLessons.map((lesson, index) => {
            const locked = lesson.premium && !isPremium;
            const learned = lesson.words.filter((word) =>
              learnedWordIds.includes(word.id),
            ).length;
            const done = completedLessonIds.includes(lesson.id);
            return (
              <Pressable
                key={lesson.id}
                accessibilityRole="button"
                testID={`lesson-${lesson.id}`}
                onPress={() => openLesson(lesson)}
                style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
              >
                <Surface style={styles.lessonCard}>
                  <View
                    style={[
                      styles.lessonIcon,
                      {
                        backgroundColor:
                          index % 2 === 0
                            ? colors.secondary
                            : colors.softAccent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={lesson.icon as keyof typeof Ionicons.glyphMap}
                      size={23}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.lessonCopy}>
                    <View style={styles.lessonTitleRow}>
                      <Text
                        style={[
                          styles.lessonTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {t(`lesson.${lesson.id}.title`)}
                      </Text>
                      {locked ? (
                        <Ionicons
                          name="lock-closed"
                          size={15}
                          color={colors.mutedForeground}
                        />
                      ) : done ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.lessonSubtitle,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {locked
                        ? t('lessons.locked')
                        : t('lessons.wordProgress', {
                            subtitle: t(`lesson.${lesson.id}.subtitle`),
                            learned,
                            total: lesson.words.length,
                          })}
                    </Text>
                    <View
                      style={[
                        styles.lessonProgressTrack,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <View
                        style={[
                          styles.lessonProgressFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${(learned / lesson.words.length) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Surface>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        visible={activeLesson !== null}
        transparent
        onRequestClose={() => setActiveLesson(null)}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.wordSheet,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.sheetTop}>
              <Text style={[styles.sheetLabel, { color: colors.primary }]}>
                {activeLesson ? t(`lesson.${activeLesson.id}.title`) : t('lessons.sheetTitle')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('lessons.closeLesson')}
                testID="close-word-sheet"
                onPress={() => setActiveLesson(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            {currentWord ? (
              <>
                <View style={styles.wordCard}>
                  <View
                    style={[
                      styles.wordIcon,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Ionicons
                      name={currentWord.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.hanzi, { color: colors.foreground }]}>
                    {localizedWord(currentWord.id, currentWord.hanzi, language)}
                  </Text>
                  <Text style={[styles.pinyin, { color: colors.primary }]}>
                    {currentWord.pinyin}
                  </Text>
                  <Text
                    style={[
                      styles.meaning,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {t(`meaning.${currentWord.id}`)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('lessons.playPronunciation')}
                    testID="play-pronunciation"
                    onPress={() => playWord(currentWord)}
                    style={[
                      styles.speakButton,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Ionicons
                      name="volume-high"
                      size={20}
                      color={colors.accentForeground}
                    />
                    <Text
                      style={[
                        styles.speakText,
                        { color: colors.accentForeground },
                      ]}
                    >
                      {t('lessons.listen')}
                    </Text>
                  </Pressable>
                </View>
                <Surface style={styles.sentenceBox}>
                  <Text
                    style={[
                      styles.sentenceLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {t('lessons.sentenceLabel')}
                  </Text>
                  <Text
                    style={[styles.sentence, { color: colors.foreground }]}
                  >
                    {localizedSentence(currentWord.id, currentWord.sentence, language)}
                  </Text>
                  <Text
                    style={[styles.sentencePinyin, { color: colors.primary }]}
                  >
                    {currentWord.sentencePinyin}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('lessons.playSentence')}
                    onPress={() => {
                      Speech.stop();
                      Speech.speak(localizedSentence(currentWord.id, currentWord.sentence, language), {
                        language: 'zh-CN',
                        rate: 0.72,
                      });
                    }}
                    style={styles.sentenceAudio}
                  >
                    <Ionicons
                      name="volume-high-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </Pressable>
                </Surface>
                <Text
                  style={[
                    styles.wordCount,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t('lessons.wordCount', { current: wordIndex + 1, total: activeLesson?.words.length ?? 0 })}
                </Text>
                <ActionButton
                  label={
                    wordIndex === (activeLesson?.words.length ?? 1) - 1
                      ? t('lessons.finish')
                      : t('lessons.nextWord')
                  }
                  onPress={advanceWord}
                  testID="next-word"
                  icon={
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={colors.primaryForeground}
                    />
                  }
                />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  curriculumCard: {
    gap: 10,
    marginBottom: 14,
  },
  curriculumTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  curriculumDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  curriculumLocked: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  curriculumTheme: {
    gap: 3,
    paddingTop: 7,
  },
  curriculumThemeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  curriculumItems: {
    fontSize: 12,
    lineHeight: 19,
  },
  readings: {
    gap: 8,
    paddingTop: 8,
  },
  readingCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 4,
  },
  readingTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 108,
  },
  filters: {
    gap: 8,
    paddingBottom: 16,
  },
  filter: {
    minHeight: 40,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lessonList: {
    gap: 10,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCopy: {
    flex: 1,
    gap: 5,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  lessonSubtitle: {
    fontSize: 12,
  },
  lessonProgressTrack: {
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  wordSheet: {
    minHeight: '84%',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordCard: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  wordIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  hanzi: {
    fontSize: 54,
    fontWeight: '700',
    lineHeight: 66,
  },
  pinyin: {
    fontSize: 21,
    fontWeight: '600',
  },
  meaning: {
    fontSize: 14,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginTop: 8,
  },
  speakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sentenceBox: {
    position: 'relative',
    gap: 7,
    paddingRight: 46,
  },
  sentenceLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  sentence: {
    fontSize: 18,
    fontWeight: '700',
  },
  sentencePinyin: {
    fontSize: 13,
  },
  sentenceAudio: {
    position: 'absolute',
    right: 14,
    top: 18,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordCount: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 14,
  },
});
