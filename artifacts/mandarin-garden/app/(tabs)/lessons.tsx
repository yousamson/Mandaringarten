import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { PageTitle, Screen, Surface } from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/subscriptions';
import {
  ageLabels,
  freeReadings,
  getStageContent,
  pathTheme,
  stageAges,
  type StageStory,
  type VocabEntry,
} from '@workspace/learning-content';

const WORDS_PER_PATH = 20;

function localized(
  language: 'en' | 'zh-Hant' | 'zh-Hans',
  values: { en: string; 'zh-Hant': string; 'zh-Hans': string },
) {
  return values[language];
}

function tr(language: 'en' | 'zh-Hant' | 'zh-Hans', en: string, hant: string, hans: string) {
  return language === 'en' ? en : language === 'zh-Hant' ? hant : hans;
}

function WordCard({ word, simplified }: { word: VocabEntry; simplified: boolean }) {
  const colors = useColors();
  const spoken = simplified ? word.simp : word.trad;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => Speech.speak(spoken, { language: simplified ? 'zh-CN' : 'zh-TW' })}
      style={[styles.wordCard, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <View style={styles.wordTop}>
        <Text style={[styles.hanzi, { color: colors.foreground }]}>{spoken}</Text>
        <Ionicons name="volume-high-outline" size={17} color={colors.primary} />
      </View>
      <Text style={[styles.wordPinyin, { color: colors.primary }]}>{word.pinyin}</Text>
      <Text style={[styles.wordMeaning, { color: colors.mutedForeground }]}>{word.en}</Text>
    </Pressable>
  );
}

export default function LessonsScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const t = (key: string) => translate(language, key);
  const learning = useLearning();
  const subscription = useSubscription();
  const params = useLocalSearchParams<{ path?: string; story?: string }>();
  const stage = subscription.isPremium ? learning.selectedStage : 1;
  const content = useMemo(() => getStageContent(stage), [stage]);
  const simplified = language === 'zh-Hans';
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<StageStory | null>(null);
  const [showFreeReading, setShowFreeReading] = useState(false);
  const [speechState, setSpeechState] = useState<'playing' | 'paused' | 'idle'>('idle');
  const freeReading = freeReadings[learning.ageBand];
  const scriptForStory = (story: StageStory) => simplified ? story.simp : story.trad;
  const currentReading = showFreeReading
    ? { title: freeReading.title, text: freeReading.text }
    : selectedStory
      ? {
          title: {
            en: selectedStory.title.en,
            'zh-Hant': selectedStory.title.trad,
            'zh-Hans': selectedStory.title.simp,
          },
          text: {
            en: selectedStory.trad,
            'zh-Hant': selectedStory.trad,
            'zh-Hans': selectedStory.simp,
          },
        }
      : null;

  useEffect(() => {
    const pathNumber = Number(params.path);
    if (Number.isInteger(pathNumber) && pathNumber >= 1 && pathNumber <= 10) {
      setSelectedPath(pathNumber);
    }
    const storyId = Array.isArray(params.story) ? params.story[0] : params.story;
    if (storyId === 'free') {
      setShowFreeReading(true);
    } else if (storyId) {
      setSelectedStory(content.stories.find((story) => story.id === storyId) ?? null);
    }
  }, [params.path, params.story, content.stories]);

  useEffect(() => {
    setSelectedPath(null);
    setSelectedStory(null);
    setSpeechState('idle');
    void Speech.stop();
  }, [stage]);

  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );

  const selectedWords =
    selectedPath === null
      ? []
      : content.words.slice(
          (selectedPath - 1) * WORDS_PER_PATH,
          selectedPath * WORDS_PER_PATH,
        );

  const closeReader = () => {
    void Speech.stop();
    setSpeechState('idle');
    setSelectedStory(null);
    setShowFreeReading(false);
  };

  const playReading = () => {
    if (!currentReading) return;
    const text = currentReading.text[language];
    void Speech.stop();
    Speech.speak(text, {
      language: simplified ? 'zh-CN' : 'zh-TW',
      onDone: () => setSpeechState('idle'),
      onStopped: () => setSpeechState('idle'),
      onError: () => setSpeechState('idle'),
    });
    setSpeechState('playing');
  };

  const togglePause = async () => {
    if (speechState === 'playing') {
      await Speech.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      await Speech.resume();
      setSpeechState('playing');
    }
  };

  const displayStoryTitle = (story: StageStory) =>
    simplified ? story.title.simp : story.title.trad;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle
          eyebrow={tr(language, 'LEARNING PLAYGROUND', '學習樂園', '学习乐园')}
          title={tr(language, 'Word paths & stories', '詞語小徑與短篇故事', '词语小径与短篇故事')}
          subtitle={subscription.isPremium
            ? tr(language, `Stage ${stage} · ages ${stageAges[stage - 1]}`, `第 ${stage} 階段 · ${stageAges[stage - 1]} 歲`, `第 ${stage} 阶段 · ${stageAges[stage - 1]} 岁`)
            : tr(language, 'Free reading is available. Membership opens all stages.', '可免費閱讀；會員可使用全部學習階段。', '可免费阅读；会员可使用全部学习阶段。')}
        />

        <Surface style={styles.freeCard}>
          <View style={styles.freeIcon}><Ionicons name="book-outline" size={21} color={colors.primary} /></View>
          <View style={styles.freeCopy}>
            <Text style={[styles.cardEyebrow, { color: colors.primary }]}>
              {tr(language, 'FREE READING', '免費閱讀', '免费阅读')}
            </Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {localized(language, freeReading.title)}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {ageLabels(language)[['2-3', '4-5', '6-8', '9-12'].indexOf(learning.ageBand)]}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowFreeReading(true)}
            style={[styles.smallButton, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.smallButtonText, { color: colors.primary }]}>
              {tr(language, 'Read', '閱讀', '阅读')}
            </Text>
          </Pressable>
        </Surface>

        {!subscription.isPremium ? (
          <Surface style={styles.lockedCard}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.warmInk} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {tr(language, 'Choose a membership stage', '會員可自選學習階段', '会员可自选学习阶段')}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {tr(language, 'Four stages, 200 themed words and 10 stories in each stage.', '四個階段各有 200 個主題詞語及 10 篇故事。', '四个阶段各有 200 个主题词语及 10 篇故事。')}
              </Text>
            </View>
          </Surface>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {tr(language, 'Choose a word path', '挑一條詞語小徑', '挑一条词语小径')}
          </Text>
          {subscription.isPremium ? (
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
              {content.words.length} {tr(language, 'words', '個詞語', '个词语')}
            </Text>
          ) : null}
        </View>

        {subscription.isPremium ? (
          <View style={styles.pathGrid}>
            {Array.from({ length: Math.ceil(content.words.length / WORDS_PER_PATH) }, (_, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => setSelectedPath(index + 1)}
                style={[
                  styles.pathCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.pathNumber, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.pathNumberText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.pathTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {pathTheme(language, stage, index + 1)}
                </Text>
                <Text style={[styles.pathSub, { color: colors.mutedForeground }]}>
                  {Math.min(WORDS_PER_PATH, content.words.length - index * WORDS_PER_PATH)} {tr(language, 'words', '個詞語', '个词语')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Surface style={styles.emptyCard}>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {tr(language, 'The themed word paths are available to active members.', '主題詞語小徑供有效會員使用。', '主题词语小径供有效会员使用。')}
            </Text>
          </Surface>
        )}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {tr(language, 'Short stories', '短篇故事', '短篇故事')}
          </Text>
          {subscription.isPremium ? (
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
              {content.stories.length} {tr(language, 'stories', '篇', '篇')}
            </Text>
          ) : null}
        </View>

        {subscription.isPremium ? (
          <View style={styles.storyList}>
            {content.stories.map((story, index) => (
              <Pressable
                key={story.id}
                accessibilityRole="button"
                onPress={() => setSelectedStory(story)}
                style={[styles.storyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.storyNumber, { backgroundColor: colors.softAccent }]}>
                  <Text style={[styles.pathNumberText, { color: colors.warmInk }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.storyTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {language === 'en' ? story.title.en : displayStoryTitle(story)}
                </Text>
                <Ionicons name="play-circle-outline" size={22} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={selectedPath !== null} animationType="slide" onRequestClose={() => setSelectedPath(null)}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalEyebrow, { color: colors.primary }]}>
                {selectedPath ? pathTheme(language, stage, selectedPath) : ''}
              </Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tr(language, `Word path ${selectedPath ?? ''}`, `詞語小徑 ${selectedPath ?? ''}`, `词语小径 ${selectedPath ?? ''}`)}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {selectedWords.length} {tr(language, 'words · tap to hear', '個詞語 · 點一下聽發音', '个词语 · 点一下听发音')}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setSelectedPath(null)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.wordGrid} showsVerticalScrollIndicator={false}>
            {selectedWords.map((word) => (
              <WordCard key={word.id} word={word} simplified={simplified} />
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showFreeReading || selectedStory !== null}
        animationType="slide"
        onRequestClose={closeReader}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          {currentReading ? (
            <>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalEyebrow, { color: colors.primary }]}>
                    {showFreeReading
                      ? tr(language, 'FREE READING', '免費閱讀', '免费阅读')
                      : tr(language, `Stage ${stage} · repeat anytime`, `第 ${stage} 階段 · 可重複聆聽`, `第 ${stage} 阶段 · 可重复聆听`)}
                  </Text>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                    {localized(language, currentReading.title)}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" onPress={closeReader} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.readingBody}>
                <Text style={[styles.readingText, { color: colors.foreground }]}>
                  {currentReading.text[language]}
                </Text>
              </ScrollView>
              <View style={styles.audioControls}>
                {speechState === 'idle' ? (
                  <Pressable accessibilityRole="button" onPress={playReading} style={[styles.audioButton, { backgroundColor: colors.primary }]}>
                    <Ionicons name="play" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.audioButtonText, { color: colors.primaryForeground }]}>
                      {tr(language, 'Listen again', '重新聆聽', '重新聆听')}
                    </Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable accessibilityRole="button" onPress={() => void togglePause()} style={[styles.audioButton, { backgroundColor: colors.primary }]}>
                      <Ionicons name={speechState === 'playing' ? 'pause' : 'play'} size={18} color={colors.primaryForeground} />
                      <Text style={[styles.audioButtonText, { color: colors.primaryForeground }]}>
                        {speechState === 'playing'
                          ? tr(language, 'Pause', '暫停', '暂停')
                          : tr(language, 'Continue', '繼續', '继续')}
                      </Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={playReading} style={[styles.audioButton, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="reload" size={18} color={colors.primary} />
                      <Text style={[styles.audioButtonText, { color: colors.primary }]}>
                        {tr(language, 'Replay', '重播', '重播')}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 18 },
  freeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  freeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F1E6' },
  freeCopy: { flex: 1, gap: 3 },
  cardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, lineHeight: 18 },
  smallButton: { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12 },
  smallButtonText: { fontSize: 12, fontWeight: '800' },
  lockedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 19, fontWeight: '800' },
  sectionMeta: { fontSize: 12, fontWeight: '600' },
  pathGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pathCard: { width: '48%', minHeight: 122, borderRadius: 18, borderWidth: 1, padding: 13, gap: 8 },
  pathNumber: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pathNumberText: { fontSize: 13, fontWeight: '800' },
  pathTitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', flex: 1 },
  pathSub: { fontSize: 11 },
  emptyCard: { padding: 16 },
  storyList: { gap: 8 },
  storyRow: { minHeight: 56, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  storyNumber: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  storyTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  modalRoot: { flex: 1, paddingTop: 58, paddingHorizontal: 18, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 16 },
  modalEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, marginBottom: 5 },
  modalTitle: { fontSize: 22, lineHeight: 29, fontWeight: '800' },
  closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingBottom: 32 },
  wordCard: { width: '48%', minHeight: 102, borderRadius: 15, borderWidth: 1, padding: 12, gap: 4 },
  wordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hanzi: { fontSize: 23, fontWeight: '800' },
  wordPinyin: { fontSize: 12, fontWeight: '600' },
  wordMeaning: { fontSize: 11 },
  readingBody: { paddingTop: 16, paddingBottom: 30 },
  readingText: { fontSize: 24, lineHeight: 42, fontWeight: '500' },
  audioControls: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 12 },
  audioButton: { minHeight: 48, borderRadius: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  audioButtonText: { fontSize: 14, fontWeight: '700' },
});
