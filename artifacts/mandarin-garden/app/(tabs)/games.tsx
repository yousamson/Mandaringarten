import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { Screen, PageTitle, Surface } from '@/components/LearningUI';
import { useLearning, XP_PER_CORRECT } from '@/context/LearningContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/subscriptions';
import { translate } from '@/lib/i18n';
import {
  getGetLearningProgressQueryKey,
  useIssueLearningRound,
  useRecordLearningRound,
  type LearningQuestion,
  type LearningRound,
} from '@workspace/api-client-react';
import { getStageContent, modeCopy, pickText } from '@workspace/learning-content';
import type { GameMode } from '@workspace/learning-content/games';
import { shuffle } from '@workspace/learning-content/games';

type DisplayQuestion = LearningQuestion & { answer: string };

const allModes: GameMode[] = ['match', 'pinyin', 'listen', 'word-order', 'sentence-order'];

function getAnswer(question: LearningQuestion, script: 'trad' | 'simp'): string {
  if (question.kind === 'order') return question.speakText;
  if (!question.word) return '';
  if (question.mode === 'pinyin') return question.word.pinyin;
  if (question.mode === 'listen') return question.speakText;
  return script === 'simp' ? question.word.simp : question.word.trad;
}

function makeFreeQuestions(script: 'trad' | 'simp'): DisplayQuestion[] {
  const words = shuffle(getStageContent(1).words.slice(0, 4));
  return words.map((word, index) => {
    const display = script === 'simp' ? word.simp : word.trad;
    return {
      id: `free-pinyin-${index + 1}`,
      kind: 'choice',
      mode: 'pinyin',
      prompt: display,
      speakText: display,
      word,
      options: shuffle(words.map((item) => item.pinyin)),
      answer: word.pinyin,
    };
  });
}

function displayQuestion(question: LearningQuestion, script: 'trad' | 'simp'): DisplayQuestion {
  return { ...question, answer: getAnswer(question, script) };
}

export default function GamesScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const t = (en: string, hant: string, hans: string) =>
    language === 'en' ? en : language === 'zh-Hant' ? hant : hans;
  const subscription = useSubscription();
  const routeParams = useLocalSearchParams<{ mode?: string }>();
  const learning = useLearning();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const script = language === 'zh-Hans' ? 'simp' : 'trad';
  const stage = subscription.isPremium ? learning.selectedStage : 1;
  const availableModes = subscription.isPremium ? allModes : ['pinyin' as const];
  const [mode, setMode] = useState<GameMode>('pinyin');
  const [round, setRound] = useState<LearningRound | null>(null);
  const [freeQuestions, setFreeQuestions] = useState<DisplayQuestion[]>([]);
  const [roundError, setRoundError] = useState(false);
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [pendingAnswer, setPendingAnswer] = useState<{
    roundId: string;
    questionId: string;
    answer: string;
  } | null>(null);

  const issueRound = useIssueLearningRound();
  const recordAnswer = useRecordLearningRound();
  const questions = useMemo(() => {
    if (subscription.isPremium) {
      return round?.questions.map((question) => displayQuestion(question, script)) ?? [];
    }
    return freeQuestions;
  }, [freeQuestions, round, script, subscription.isPremium]);
  const question = questions[index];
  const finished = questions.length > 0 && index >= questions.length;

  useEffect(() => {
    if (!availableModes.includes(mode)) setMode('pinyin');
  }, [availableModes, mode]);

  useEffect(() => {
    const requested = Array.isArray(routeParams.mode) ? routeParams.mode[0] : routeParams.mode;
    if (requested && allModes.includes(requested as GameMode) && availableModes.includes(requested as GameMode)) {
      setMode(requested as GameMode);
    }
  }, [availableModes, routeParams.mode]);

  useEffect(() => {
    let active = true;
    setRound(null);
    setFreeQuestions([]);
    setRoundError(false);
    setIndex(0);
    setPicked(null);
    setBuilt([]);
    setCorrectCount(0);
    setSavedCount(0);
    setSaveState('idle');
    setPendingAnswer(null);
    if (!subscription.isPremium) {
      setFreeQuestions(makeFreeQuestions(script));
      return () => {
        active = false;
      };
    }
    void issueRound
      .mutateAsync({ data: { stage, mode, script } })
      .then((nextRound) => {
        if (active) setRound(nextRound);
      })
      .catch(() => {
        if (active) setRoundError(true);
      });
    return () => {
      active = false;
    };
  }, [issueRound.mutateAsync, mode, script, seed, stage, subscription.isPremium]);

  useEffect(() => {
    if (question?.kind === 'choice' && question.mode === 'listen') {
      Speech.speak(question.speakText, { language: script === 'simp' ? 'zh-CN' : 'zh-TW' });
    }
    return () => {
      void Speech.stop();
    };
  }, [question, script]);

  const answer = (value: string) => {
    if (!question || picked) return;
    setPicked(value);
    if (value !== question.answer) return;
    setCorrectCount((count) => count + 1);
    if (!round) return;
    const request = { roundId: round.roundId, questionId: question.id, answer: value };
    setPendingAnswer(request);
    setSaveState('saving');
    recordAnswer.mutate(
      { data: request },
      {
        onSuccess: (result) => {
          if (result.correct) {
            setSavedCount((count) => count + 1);
            setSaveState('saved');
            setPendingAnswer(null);
            void queryClient.invalidateQueries({
              queryKey: [...getGetLearningProgressQueryKey(), user?.id ?? 'signed-out'],
            });
          } else {
            setSaveState('failed');
          }
        },
        onError: () => setSaveState('failed'),
      },
    );
  };

  const nextQuestion = () => {
    setIndex((current) => current + 1);
    setPicked(null);
    setBuilt([]);
    setSaveState('idle');
    setPendingAnswer(null);
  };

  const retrySave = () => {
    if (!pendingAnswer) return;
    setSaveState('saving');
    recordAnswer.mutate(
      { data: pendingAnswer },
      {
        onSuccess: (result) => {
          if (result.correct) {
            setSavedCount((count) => count + 1);
            setSaveState('saved');
            setPendingAnswer(null);
            void queryClient.invalidateQueries({
              queryKey: [...getGetLearningProgressQueryKey(), user?.id ?? 'signed-out'],
            });
          } else {
            setSaveState('failed');
          }
        },
        onError: () => setSaveState('failed'),
      },
    );
  };

  const restart = () => {
    setSeed((current) => current + 1);
  };

  const renderChoice = () => {
    if (!question || question.kind !== 'choice') return null;
    return (
      <>
        <View style={styles.promptBox}>
          <Text style={[styles.questionCount, { color: colors.mutedForeground }]}>
            {index + 1} / {questions.length}
          </Text>
          {question.mode === 'listen' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Play the word', '播放詞語', '播放词语')}
              onPress={() => Speech.speak(question.speakText, { language: script === 'simp' ? 'zh-CN' : 'zh-TW' })}
              style={[styles.listenButton, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="volume-high" size={27} color={colors.primary} />
            </Pressable>
          ) : (
            <Text style={[styles.promptText, { color: colors.foreground }]}>
              {question.prompt}
            </Text>
          )}
        </View>
        <View style={styles.optionList}>
          {(question.options ?? []).map((option, optionIndex) => (
            <Pressable
              key={`${option}-${optionIndex}`}
              accessibilityRole="button"
              disabled={picked !== null}
              onPress={() => answer(option)}
              style={[
                styles.option,
                { borderColor: colors.border, backgroundColor: colors.card },
                picked === option && option === question.answer && { borderColor: colors.primary, backgroundColor: colors.secondary },
                picked === option && option !== question.answer && { borderColor: colors.destructive, backgroundColor: colors.dangerSurface },
              ]}
            >
              <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  };

  const renderOrder = () => {
    if (!question || question.kind !== 'order') return null;
    const chunks = question.chunks ?? [];
    const pickedText = built.map((chunkIndex) => chunks[chunkIndex]).join('');
    return (
      <>
        <View style={styles.promptBox}>
          <Text style={[styles.questionCount, { color: colors.mutedForeground }]}>
            {index + 1} / {questions.length}
          </Text>
          <Text style={[styles.orderClue, { color: colors.foreground }]}>{question.clue}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => Speech.speak(question.speakText, { language: script === 'simp' ? 'zh-CN' : 'zh-TW' })}
            style={styles.audioLink}
          >
            <Ionicons name="volume-high-outline" size={17} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('Hear the answer', '聽一聽', '听一听')}
            </Text>
          </Pressable>
        </View>
        <View style={[styles.answerBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.answerText, { color: colors.foreground }]}>{pickedText || ' '}</Text>
        </View>
        <View style={styles.chunkRow}>
          {chunks.map((chunk, chunkIndex) => (
            <Pressable
              key={`${chunk}-${chunkIndex}`}
              disabled={picked !== null || built.includes(chunkIndex)}
              onPress={() => {
                const next = [...built, chunkIndex];
                setBuilt(next);
                if (next.length === chunks.length) {
                  answer(next.map((i) => chunks[i]).join(''));
                }
              }}
              style={[styles.chunk, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={[styles.chunkText, { color: colors.foreground }]}>{chunk}</Text>
            </Pressable>
          ))}
        </View>
        {picked === null && built.length > 0 ? (
          <Pressable onPress={() => setBuilt((current) => current.slice(0, -1))}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('Undo last piece', '退一步', '退一步')}</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle
          eyebrow={t('PLAY & PRACTISE', '遊戲練習', '游戏练习')}
          title={t('Learning games', '學習遊戲', '学习游戏')}
          subtitle={subscription.isPremium
            ? t(`Stage ${stage} · ${learning.selectedStageXp} XP`, `第 ${stage} 階段 · ${learning.selectedStageXp} XP`, `第 ${stage} 阶段 · ${learning.selectedStageXp} XP`)
            : t('Free pinyin practice', '免費拼音練習', '免费拼音练习')}
        />

        <View style={styles.modeGrid}>
          {allModes.map((item) => {
            const copy = modeCopy[item];
            const locked = !availableModes.includes(item);
            const active = mode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: locked }}
                disabled={locked}
                onPress={() => setMode(item)}
                style={[
                  styles.modeCard,
                  { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.secondary : colors.card },
                  locked && styles.dimmed,
                ]}
              >
                <Text style={[styles.modeTitle, { color: colors.foreground }]}>
                  {pickText(language, copy.name)}
                </Text>
                <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
                  {locked ? t('Membership required', '會員專享', '会员专享') : pickText(language, copy.hint)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!subscription.isPremium ? (
          <Surface style={styles.membershipNote}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.warmInk} />
            <Text style={[styles.modeHint, { color: colors.mutedForeground, flex: 1 }]}>
              {t('Members can choose any stage and play all five modes. Correct answers earn 5 XP.', '會員可自選階段及體驗五種遊戲；答對每題可得 5 XP。', '会员可自选阶段及体验五种游戏；答对每题可得 5 XP。')}
            </Text>
          </Surface>
        ) : null}

        <Surface style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.gameEyebrow, { color: colors.primary }]}>
                {pickText(language, modeCopy[mode].name)}
              </Text>
              <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
                {pickText(language, modeCopy[mode].hint)}
              </Text>
            </View>
            <View style={styles.pips}>
              {questions.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pip,
                    { backgroundColor: i < index ? colors.primary : i === index ? colors.accent : colors.border },
                  ]}
                />
              ))}
            </View>
          </View>

          {questions.length === 0 ? (
            <View style={styles.loadingState}>
              {roundError ? (
                <>
                  <Text style={[styles.modeHint, { color: colors.destructive }]}>
                    {t('Could not start this round. Try again.', '暫時未能開始，請重試。', '暂时未能开始，请重试。')}
                  </Text>
                  <Pressable onPress={restart} style={[styles.smallButton, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.smallButtonText, { color: colors.primary }]}>{t('Retry', '重試', '重试')}</Text>
                  </Pressable>
                </>
              ) : (
                <ActivityIndicator color={colors.primary} />
              )}
            </View>
          ) : finished ? (
            <View style={styles.result}>
              <Text style={[styles.resultScore, { color: colors.foreground }]}>
                {correctCount}<Text style={[styles.resultTotal, { color: colors.mutedForeground}]}> / {questions.length}</Text>
              </Text>
              <Text style={[styles.resultXp, { color: colors.primary }]}>
                {subscription.isPremium
                  ? `+${savedCount * XP_PER_CORRECT} XP ${t('saved', '已儲存', '已保存')}`
                  : t('Free practice · XP is saved with membership', '免費練習 · 會員答題 XP 會儲存至帳戶', '免费练习 · 会员答题 XP 会保存到账户')}
              </Text>
              {subscription.isPremium && saveState === 'saving' ? (
                <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
                  {t('Saving progress…', '正在儲存進度…', '正在保存进度…')}
                </Text>
              ) : null}
              <Pressable onPress={restart} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="refresh" size={17} color={colors.primaryForeground} />
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                  {t('Play again', '再玩一輪', '再玩一轮')}
                </Text>
              </Pressable>
            </View>
          ) : question ? (
            <>
              {question.kind === 'choice' ? renderChoice() : renderOrder()}
              {picked !== null ? (
                <View style={styles.feedback}>
                  <Text style={[styles.feedbackText, { color: picked === question.answer ? colors.primary : colors.warmInk }]}>
                    {picked === question.answer
                      ? subscription.isPremium
                        ? saveState === 'saved'
                          ? `+${XP_PER_CORRECT} XP ${t('saved', '已儲存', '已保存')} · `
                          : saveState === 'saving'
                            ? `${t('Saving progress…', '正在儲存進度…', '正在保存进度…')} · `
                            : ''
                        : ''
                      : `${t('Answer', '答案', '答案')}: `}
                    {question.kind === 'choice'
                      ? `${question.speakText} · ${question.word?.pinyin ?? ''}${question.word?.en ? ` · ${question.word.en}` : ''}`
                      : question.answer}
                  </Text>
                  {saveState === 'failed' && subscription.isPremium ? (
                    <Pressable onPress={retrySave} disabled={recordAnswer.isPending} style={styles.nextButton}>
                      <Text style={[styles.linkText, { color: colors.destructive }]}>
                        {recordAnswer.isPending
                          ? t('Saving progress…', '正在儲存進度…', '正在保存进度…')
                          : t('XP not saved · Retry', 'XP 未儲存 · 重試', 'XP 未保存 · 重试')}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={nextQuestion}
                    disabled={saveState === 'failed' || saveState === 'saving'}
                    style={[styles.nextButton, (saveState === 'failed' || saveState === 'saving') && { opacity: 0.45 }]}
                  >
                    <Text style={[styles.linkText, { color: colors.primary }]}>
                      {t('Next', '下一題', '下一题')}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 17 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  modeCard: { width: '48%', minHeight: 88, borderWidth: 1, borderRadius: 15, padding: 12, gap: 5 },
  dimmed: { opacity: 0.54 },
  modeTitle: { fontSize: 13, fontWeight: '800' },
  modeHint: { fontSize: 11, lineHeight: 16 },
  membershipNote: { flexDirection: 'row', gap: 9, alignItems: 'center', padding: 13 },
  gameCard: { padding: 18, gap: 17 },
  gameHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameEyebrow: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { height: 6, width: 6, borderRadius: 4 },
  loadingState: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 12 },
  promptBox: { alignItems: 'center', gap: 11, paddingVertical: 8 },
  questionCount: { fontSize: 11, fontWeight: '700' },
  promptText: { fontSize: 30, lineHeight: 38, fontWeight: '800', textAlign: 'center' },
  listenButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  optionList: { gap: 9 },
  option: { minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  optionText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  orderClue: { fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  audioLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontSize: 13, fontWeight: '700' },
  answerBox: { minHeight: 58, borderWidth: 1, borderRadius: 14, padding: 12, justifyContent: 'center' },
  answerText: { fontSize: 23, fontWeight: '800', textAlign: 'center' },
  chunkRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chunk: { minWidth: 42, minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  chunkText: { fontSize: 18, fontWeight: '700' },
  feedback: { borderTopWidth: 1, borderTopColor: '#E6E6D9', paddingTop: 14, gap: 11 },
  feedbackText: { fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 40 },
  result: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  resultScore: { fontSize: 50, fontWeight: '800' },
  resultTotal: { fontSize: 24, fontWeight: '600' },
  resultXp: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  primaryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 7 },
  primaryButtonText: { fontSize: 14, fontWeight: '800' },
  smallButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { fontSize: 12, fontWeight: '800' },
});
