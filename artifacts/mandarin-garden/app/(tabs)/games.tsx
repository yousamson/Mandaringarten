import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { ActionButton, PageTitle, Screen, Surface } from '@/components/LearningUI';
import { useLearning, XP_PER_CORRECT } from '@/context/LearningContext';
import { allWords, lessons } from '@/data/vocabulary';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { localizedSentence, localizedWord, translate } from '@/lib/i18n';
import { curriculumLevels } from '@/data/curriculum';

type GameMode = 'pinyin' | 'meaning';

const QUESTIONS_PER_ROUND = 5;

export default function GamesScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const { isPremium } = useSubscription();
  const learning = useLearning();
  const { level, recordGame, awardCorrectAnswer } = learning;
  const [mode, setMode] = useState<GameMode>('pinyin');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [roundFinished, setRoundFinished] = useState(false);

  const curriculum = curriculumLevels[level - 1] ?? curriculumLevels[0];
  const levelWords = (isPremium
    ? curriculum.themes.flatMap((theme) =>
        theme.items.map((item, index) => ({
          id: `curriculum-${theme.id}-${index}`,
          hanzi: language === 'zh-Hans' ? item.simplified : item.hanzi,
          pinyin: item.pinyin,
          meaning: item.meaning,
          sentence: item.hanzi,
          sentencePinyin: item.pinyin,
          category: theme.id,
          icon: 'book-outline',
        })),
      )
    : []);
  const playableWords = useMemo(
    () =>
      isPremium
        ? levelWords
        : lessons
            .filter((lesson) => !lesson.premium)
            .flatMap((lesson) => lesson.words),
    [isPremium, level, levelWords],
  );

  const question = playableWords[questionIndex % playableWords.length] ?? allWords[0];
  const answerFor = (word: (typeof allWords)[number]) =>
    mode === 'pinyin'
      ? localizedWord(word.id, word.hanzi, language)
      : word.id.startsWith('curriculum-')
        ? word.meaning
        : t(`meaning.${word.id}`);
  const correctAnswer = answerFor(question);
  const options = useMemo(() => {
    const choices = new Set<string>([correctAnswer]);
    const distractors = playableWords.filter((word) => word.id !== question.id);
    const offset = questionIndex % Math.max(1, distractors.length);
    for (let index = 0; index < distractors.length && choices.size < 4; index += 1) {
      const word = distractors[(offset + index) % distractors.length];
      choices.add(answerFor(word));
    }
    return Array.from(choices).sort((a, b) => a.localeCompare(b));
  }, [playableWords, question.id, questionIndex, mode, correctAnswer]);

  const isCorrect = selectedAnswer === correctAnswer;

  if (!learning.hydrated) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const chooseAnswer = (answer: string) => {
    if (selectedAnswer || roundFinished) return;
    setSelectedAnswer(answer);
    if (answer === correctAnswer) {
      setScore((value) => value + 1);
      awardCorrectAnswer(isPremium);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 >= QUESTIONS_PER_ROUND) {
      recordGame();
      setRoundFinished(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
  };

  const restartRound = () => {
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setRoundFinished(false);
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
        eyebrow={t('games.eyebrow')}
        title={t('games.title')}
        subtitle={t('games.subtitle')}
        />

        <View style={styles.modeRow}>
          {([
            ['pinyin', t('games.pinyinMode'), 'text-outline'],
            ['meaning', t('games.meaningMode'), 'book-outline'],
          ] as const).map(([value, label, icon]) => {
            const active = mode === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`game-mode-${value}`}
                onPress={() => {
                  setMode(value);
                  restartRound();
                }}
                style={[
                  styles.mode,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={18}
                  color={active ? colors.primaryForeground : colors.primary}
                />
                <Text
                  style={[
                    styles.modeText,
                    {
                      color: active
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {roundFinished ? (
          <Surface style={styles.resultCard}>
            <View style={[styles.resultIcon, { backgroundColor: colors.accent }]}>
              <Ionicons
                name={score >= 3 ? 'trophy-outline' : 'sparkles-outline'}
                size={31}
                color={colors.accentForeground}
              />
            </View>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>
              {score >= 3 ? t('games.great') : t('games.finished')}
            </Text>
            <Text
              style={[styles.resultCopy, { color: colors.mutedForeground }]}
            >
              {t('games.roundScore', { score, total: QUESTIONS_PER_ROUND })}
            </Text>
              <Text style={[styles.resultCopy, { color: colors.primary }]}>
                {t('games.xpEarned', { xp: score * XP_PER_CORRECT })}
              </Text>
            <ActionButton
              label={t('games.playAgain')}
              onPress={restartRound}
              testID="restart-game"
              icon={
                <Ionicons
                  name="refresh"
                  size={18}
                  color={colors.primaryForeground}
                />
              }
            />
          </Surface>
        ) : (
          <Surface style={styles.questionCard}>
            <View style={styles.questionTop}>
              <Text
                style={[styles.questionLabel, { color: colors.mutedForeground }]}
              >
                {t('games.questionCount', { current: questionIndex + 1, total: QUESTIONS_PER_ROUND })}
              </Text>
              <View style={[styles.scoreChip, { backgroundColor: colors.secondary }]}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={[styles.scoreText, { color: colors.primary }]}>
                  {score * XP_PER_CORRECT} XP
                </Text>
              </View>
            </View>
            <Text style={[styles.prompt, { color: colors.foreground }]}>
              {mode === 'pinyin' ? question.pinyin : localizedWord(question.id, question.hanzi, language)}
            </Text>
            {mode === 'meaning' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('games.playPronunciation')}
                testID="game-speak-question"
                onPress={() => {
                  Speech.stop();
                  Speech.speak(localizedWord(question.id, question.hanzi, language), {
                    language: 'zh-CN',
                    rate: 0.78,
                  });
                }}
                style={styles.listenButton}
              >
                <Ionicons
                  name="volume-high-outline"
                  size={17}
                  color={colors.primary}
                />
                <Text style={[styles.listenText, { color: colors.primary }]}>
                  {t('games.listen')}
                </Text>
              </Pressable>
            ) : null}
            <Text
              style={[styles.promptHint, { color: colors.mutedForeground }]}
            >
              {mode === 'pinyin' ? t('games.chooseCharacter') : t('games.chooseMeaning')}
            </Text>
            <View style={styles.options}>
              {options.map((option) => {
                const selected = selectedAnswer === option;
                const correctChoice = selectedAnswer !== null && option === correctAnswer;
                const wrongChoice = selected && !isCorrect;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    testID={`answer-${option}`}
                    onPress={() => chooseAnswer(option)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: correctChoice
                          ? colors.secondary
                          : wrongChoice
                            ? colors.dangerSurface
                            : colors.background,
                        borderColor: correctChoice
                          ? colors.primary
                          : wrongChoice
                            ? colors.destructive
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: wrongChoice
                            ? colors.destructive
                            : colors.foreground,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    {correctChoice ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {selectedAnswer ? (
              <View
                style={[
                  styles.feedback,
                  {
                    backgroundColor: isCorrect
                      ? colors.secondary
                      : colors.softAccent,
                  },
                ]}
              >
                <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>
                  {isCorrect ? `${t('games.correct')} · +${XP_PER_CORRECT} XP` : t('games.correctAnswer', { answer: correctAnswer })}
                </Text>
                <Text style={[styles.feedbackCopy, { color: colors.mutedForeground }]}>
                  {localizedSentence(question.id, question.sentence, language)}
                </Text>
              </View>
            ) : null}
            {selectedAnswer ? (
              <ActionButton
                label={
                  questionIndex + 1 === QUESTIONS_PER_ROUND
                    ? t('games.seeScore')
                    : t('games.next')
                }
                onPress={nextQuestion}
                testID="next-question"
                icon={
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={colors.primaryForeground}
                  />
                }
              />
            ) : null}
          </Surface>
        )}

        <Surface style={styles.tipCard}>
          <Ionicons
            name="bulb-outline"
            size={20}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: colors.foreground }]}>
              {t('games.tipTitle')}
            </Text>
            <Text style={[styles.tipCopy, { color: colors.mutedForeground }]}>
              {t('games.tipCopy')}
            </Text>
          </View>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 108,
    gap: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 9,
  },
  mode: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 17,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionCard: {
    gap: 13,
  },
  questionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  prompt: {
    minHeight: 76,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 12,
  },
  promptHint: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: -8,
  },
  listenButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  listenText: {
    fontSize: 12,
    fontWeight: '700',
  },
  options: {
    gap: 8,
    marginTop: 5,
  },
  option: {
    minHeight: 53,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedback: {
    borderRadius: 15,
    padding: 13,
    gap: 4,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackCopy: {
    fontSize: 12,
    lineHeight: 17,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  resultIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 23,
    fontWeight: '700',
  },
  resultCopy: {
    fontSize: 14,
    marginBottom: 10,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  tipCopy: {
    fontSize: 12,
    lineHeight: 18,
  },
});
