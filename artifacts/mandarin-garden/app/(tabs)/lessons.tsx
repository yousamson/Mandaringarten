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
import { lessons, type Lesson, type Word } from '@/data/vocabulary';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';

const filters = ['全部', '日常生活', '吃喝', '家人朋友', '身邊世界'];

export default function LessonsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { completedLessonIds, learnedWordIds, markWordLearned, completeLesson } =
    useLearning();
  const { isPremium } = useSubscription();
  const [filter, setFilter] = useState('全部');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [wordIndex, setWordIndex] = useState(0);

  const visibleLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) => filter === '全部' || lesson.category === filter,
      ),
    [filter],
  );

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
    Speech.speak(word.hanzi, { language: 'zh-CN', rate: 0.78 });
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          eyebrow="詞語圖書館"
          title="今天想學什麼？"
          subtitle="從生活裡常見的詞語開始，一起聽、一起說。"
        />
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
                  {item}
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
                        {lesson.title}
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
                        ? '高級會員完整課程'
                        : `${lesson.subtitle} · ${learned}/${lesson.words.length} 個詞語`}
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
                {activeLesson?.title ?? '詞語練習'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="關閉課程"
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
                    {currentWord.hanzi}
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
                    {currentWord.meaning}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="播放國語發音"
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
                      聽一聽
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
                    放進短句裡
                  </Text>
                  <Text
                    style={[styles.sentence, { color: colors.foreground }]}
                  >
                    {currentWord.sentence}
                  </Text>
                  <Text
                    style={[styles.sentencePinyin, { color: colors.primary }]}
                  >
                    {currentWord.sentencePinyin}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="播放短句"
                    onPress={() => {
                      Speech.stop();
                      Speech.speak(currentWord.sentence, {
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
                  {wordIndex + 1} / {activeLesson?.words.length ?? 0}
                </Text>
                <ActionButton
                  label={
                    wordIndex === (activeLesson?.words.length ?? 1) - 1
                      ? '完成這堂課'
                      : '學會了，下一個'
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
