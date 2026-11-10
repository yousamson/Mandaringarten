import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { PageTitle, ProgressBar, Screen, Surface } from '@/components/LearningUI';
import { GardenIllustration } from '@/components/GardenIllustration';
import { useLearning } from '@/context/LearningContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/subscriptions';
import { translate } from '@/lib/i18n';
import type { PlaygroundLanguage, GardenCareType } from '@workspace/learning-content';

function tr(language: PlaygroundLanguage, en: string, hant: string, hans: string) {
  return language === 'en'
    ? en
    : language === 'zh-Hant'
      ? hant
      : language === 'zh-Hans'
        ? hans
        : translate(language, en);
}

function gardenReminderText(language: PlaygroundLanguage, caredToday: boolean, daysSinceCare: number | null) {
  if (caredToday) return tr(language, 'Today’s care is done. Come back tomorrow.', '今天已照料花園，明天再來。', '今天已照料花园，明天再来。');
  if (daysSinceCare !== null && daysSinceCare >= 30) return tr(language, 'After 30 days away, the garden is a seed again. Start fresh today.', '30 天沒有照料，花園已回到種子。今天重新開始吧。', '30 天没有照料，花园已回到种子。今天重新开始吧。');
  if (daysSinceCare !== null && daysSinceCare >= 5) {
    return tr(language, 'Your flower is shrinking after {days} days without care.', `花朵已 ${daysSinceCare} 天沒有照料，正逐漸減少。`, `花朵已 ${daysSinceCare} 天没有照料，正逐渐减少。`).replace('{days}', String(daysSinceCare));
  }
  if (daysSinceCare === null) return tr(language, 'Earn 20 XP in this stage to begin growing your garden.', '在所選階段累積 20 XP，就能開始培育花園。', '在所选阶段积累 20 XP，就能开始培育花园。');
  return tr(language, 'A little care today helps your garden keep growing.', '今天照料一點點，花園就能繼續成長。', '今天照料一点点，花园就能继续成长。');
}

export default function GardenScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();
  const l = language as PlaygroundLanguage;
  const learning = useLearning();
  const subscription = useSubscription();
  const [careError, setCareError] = useState(false);
  const t = (key: string) => translate(language, key);

  return (
    <Screen>
      <Stack.Screen options={{ title: tr(l, 'My garden', '我的花園', '我的花园') }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle
          eyebrow={tr(l, 'MY LEARNING GARDEN', '我的學習花園', '我的学习花园')}
          title={tr(l, 'Growing, day by day', '每天一點點，慢慢長大', '每天一点点，慢慢长大')}
          subtitle={tr(l, 'Care for a flower as you keep practising.', '持續練習，也別忘了照料自己的花。', '持续练习，也别忘了照料自己的花。')}
        />
        <Surface style={styles.card}>
          <View style={styles.heading}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>{tr(l, 'YOUR LITTLE GARDEN', '你的小花園', '你的小花园')}</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>{tr(l, 'Care for your flower', '一起照料花朵', '一起照料花朵')}</Text>
            </View>
            {subscription.isPremium && learning.garden ? (
              <Text style={[styles.days, { color: colors.primary }]}>
                {learning.garden.growthDays}<Text style={[styles.daysTotal, { color: colors.mutedForeground }]}> / 30</Text>
              </Text>
            ) : null}
          </View>
          <GardenIllustration growthDays={subscription.isPremium ? learning.garden?.growthDays ?? 0 : 0} />
          {subscription.isPremium ? learning.garden ? (
            <>
              <Text style={[styles.reminder, { backgroundColor: colors.secondary, color: colors.mutedForeground }]} accessibilityRole="text" testID="status-garden-reminder">
                {gardenReminderText(l, learning.garden.caredToday, learning.garden.daysSinceCare)}
              </Text>
              <View style={styles.xpLine} testID="status-garden-xp">
                <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
                  {tr(l, 'Selected stage XP', '目前階段 XP', '当前阶段 XP')}: <Text style={{ color: colors.primary, fontWeight: '800' }}>{learning.selectedStageXp}</Text>
                </Text>
                <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>{tr(l, 'Care costs 20 XP', '每次照料需 20 XP', '每次照料需 20 XP')}</Text>
              </View>
              <ProgressBar value={Math.min(100, learning.selectedStageXp * 5)} />
              {learning.progressLoading ? <ActivityIndicator color={colors.primary} />
                : learning.garden.caredToday ? <Text style={[styles.done, { color: colors.primary }]}>{tr(l, 'Today’s care is done. Come back tomorrow.', '今天已照料花園，明天再來。', '今天已照料花园，明天再来。')}</Text>
                  : <>
                    {learning.selectedStageXp < 20 ? <Text style={[styles.needXp, { color: colors.mutedForeground }]}>{tr(l, 'Earn 20 XP in this stage to care for your garden.', '在此階段累積 20 XP，便可照料花園。', '在此阶段积累 20 XP，便可照料花园。')}</Text> : null}
                    {careError ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert" testID="status-garden-care-error">{tr(l, 'Care could not be saved. Please try again.', '未能儲存照料紀錄，請再試一次。', '未能保存照料记录，请再试一次。')}</Text> : null}
                    <View style={styles.actions}>
                      {(['water', 'fertilize'] as GardenCareType[]).map((type) => (
                        <Pressable
                          key={type}
                          accessibilityRole="button"
                          testID={`button-garden-${type}`}
                          disabled={!learning.garden?.careAvailable || learning.selectedStageXp < 20}
                          onPress={() => {
                            setCareError(false);
                            void learning.careForGarden(type).catch(() => setCareError(true));
                          }}
                          style={[
                            styles.action,
                            { backgroundColor: type === 'water' ? colors.secondary : colors.softAccent },
                            (!learning.garden?.careAvailable || learning.selectedStageXp < 20) && styles.disabled,
                          ]}
                        >
                          <Ionicons name={type === 'water' ? 'water-outline' : 'leaf-outline'} size={18} color={colors.primary} />
                          <Text style={[styles.actionText, { color: colors.primary }]}>
                            {type === 'water' ? tr(l, 'Water', '澆水', '浇水') : tr(l, 'Fertilize', '施肥', '施肥')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>}
            </>
          ) : learning.progressLoading ? <ActivityIndicator color={colors.primary} />
            : <Text style={[styles.reminder, { color: colors.mutedForeground }]}>{tr(l, 'Sign in with membership to save your garden.', '登入會員即可保存花園成長。', '登录会员即可保存花园成长。')}</Text>
            : <View style={styles.nonMember}>
              <Text style={[styles.reminder, { color: colors.mutedForeground }]}>{tr(l, 'Play and earn XP to grow your own garden.', '答題累積 XP，培育自己的花園。', '答题积累 XP，培育自己的花园。')}</Text>
              <Pressable
                accessibilityRole="button"
                testID="link-garden-membership"
                onPress={() => router.push('/(tabs)/parent')}
                style={[styles.action, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.actionText, { color: colors.primary }]}>{tr(l, 'Grow your garden', '開始培育花園', '开始培育花园')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>}
        </Surface>
        <Pressable accessibilityRole="button" testID="button-garden-back-home" onPress={() => router.replace('/(tabs)')} style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="map-outline" size={17} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>{tr(l, 'Back to the learning map', '返回學習地圖', '返回学习地图')}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42, gap: 16 },
  card: { gap: 12, padding: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 4, fontSize: 19, fontWeight: '800' },
  days: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  daysTotal: { fontSize: 12, fontWeight: '600' },
  reminder: { padding: 11, borderRadius: 12, fontSize: 12, lineHeight: 18 },
  xpLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 },
  xpLabel: { fontSize: 11 },
  done: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  needXp: { fontSize: 11, lineHeight: 16 },
  error: { fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 9 },
  action: { minHeight: 43, flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 13 },
  actionText: { fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  nonMember: { gap: 10 },
  backButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 },
});
