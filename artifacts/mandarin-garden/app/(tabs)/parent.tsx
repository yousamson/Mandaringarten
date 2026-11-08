import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useClerk, useUser } from '@clerk/expo';
import { ActionButton, PageTitle, ProgressBar, Screen, Surface } from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { ageBandNote, ageBands } from '@/data/vocabulary';
import { getWebsiteOrigin, useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { languageOptions, translate, type AppLanguage } from '@/lib/i18n';
import { pickText, stageAges, stageNames, translateInterface } from '@workspace/learning-content';

function uiText(language: AppLanguage, en: string, hant: string, hans: string) {
  return language === 'en'
    ? en
    : language === 'zh-Hant'
      ? hant
      : language === 'zh-Hans'
        ? hans
        : translateInterface(language, en);
}

function stagePrefix(language: AppLanguage, stage: number) {
  if (language === 'en') return `Stage ${stage}`;
  if (language === 'zh-Hant') return `第 ${stage} 階段`;
  if (language === 'zh-Hans') return `第 ${stage} 阶段`;
  if (language === 'es') return `Etapa ${stage}`;
  if (language === 'fr') return `Étape ${stage}`;
  if (language === 'ja') return `${stage}段階`;
  if (language === 'ko') return `${stage}단계`;
  return `Etapa ${stage}`;
}

function ageText(language: AppLanguage, age: string) {
  if (language === 'en') return `ages ${age}`;
  if (language === 'zh-Hant') return `${age} 歲`;
  if (language === 'zh-Hans') return `${age} 岁`;
  if (language === 'es') return `de ${age} años`;
  if (language === 'fr') return `${age} ans`;
  if (language === 'ja') return `${age}歳`;
  if (language === 'ko') return `${age}세`;
  return `${age} anos`;
}

function xpRemaining(language: AppLanguage, count: number) {
  if (language === 'en') return `${count} XP to complete this stage`;
  if (language === 'zh-Hant') return `再得 ${count} XP 即完成此階段`;
  if (language === 'zh-Hans') return `再得 ${count} XP 即完成此阶段`;
  if (language === 'es') return `${count} XP para completar esta etapa`;
  if (language === 'fr') return `${count} XP pour terminer cette étape`;
  if (language === 'ja') return `あと${count} XPでこの段階を完了`;
  if (language === 'ko') return `이 단계를 완료하려면 ${count} XP 더 필요해요`;
  return `${count} XP para concluir esta etapa`;
}

export default function ParentScreen() {
  const colors = useColors();
  const { language, setLanguage } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const learning = useLearning();
  const subscription = useSubscription();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [notice, setNotice] = useState<string | null>(null);
  const [openingWebsite, setOpeningWebsite] = useState(false);
  const manageSubscription = async () => {
    setNotice(null);
    try {
      await subscription.manageSubscription();
    } catch {
      setNotice(t('parent.manageSubscriptionFailed'));
    }
  };

  const openWebsiteMembership = async () => {
    setNotice(null);
    setOpeningWebsite(true);
    try {
      await WebBrowser.openBrowserAsync(`${getWebsiteOrigin()}/membership`);
      await subscription.refresh();
    } catch {
      setNotice(
        uiText(
          language,
          'Could not open the website membership page.',
          '未能開啟網站會員頁面。',
          '未能打开网站会员页面。',
        ),
      );
    } finally {
      setOpeningWebsite(false);
    }
  };

  const progressPercent = Math.min(
    100,
    learning.selectedStageXp,
  );
  const levelName = pickText(language, stageNames[learning.selectedStage - 1]);
  const currentPeriodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const currentPeriodEndLabel =
    currentPeriodEnd && !Number.isNaN(currentPeriodEnd.getTime())
      ? new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(
          currentPeriodEnd,
        )
      : null;
  const membershipLabel = subscription.isPremium
    ? t('parent.subscribed')
    : subscription.isMembershipKnown
      ? t('parent.notSubscribed')
      : '';

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          eyebrow={t('parent.eyebrow')}
          title={t('parent.title')}
          subtitle={t('parent.subtitle')}
        />

        <Surface style={styles.accountCard}>
          <View style={styles.accountIdentity}>
            <Ionicons name="person-circle-outline" size={27} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountTitle, { color: colors.foreground }]}>
                {t('auth.account')}
              </Text>
              <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>
                {subscription.isAdmin
                  ? t('parent.managementAccount')
                  : subscription.isAccountAccessKnown
                    ? user?.primaryEmailAddress?.emailAddress ?? user?.username ?? ''
                    : ''}
              </Text>
            </View>
          </View>
          <ActionButton
            label={t('auth.signOut')}
            tone="outline"
            onPress={() => void signOut()}
            testID="sign-out"
          />
        </Surface>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('parent.membership')}
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {membershipLabel}
          </Text>
        </View>
        <Surface style={styles.purchaseCard}>
          <View style={styles.purchaseSummary}>
            <View style={[styles.memberIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="sparkles" size={22} color={colors.primary} />
            </View>
            <View style={styles.membershipCopy}>
              <Text
                style={[styles.memberTitle, { color: colors.foreground }]}
                testID="membership-identity"
              >
                {membershipLabel}
              </Text>
            </View>
          </View>
          {subscription.isAdmin ? (
            <Text
              style={[styles.memberSub, { color: colors.mutedForeground }]}
              testID="admin-membership-note"
            >
              {t('parent.adminMemberNote')}
            </Text>
          ) : null}
          {subscription.isPremium &&
          !subscription.isAdmin &&
          currentPeriodEndLabel ? (
            <Text
              style={[styles.memberSub, { color: colors.mutedForeground }]}
              testID="membership-next-period"
            >
              {t(
                subscription.cancelAtPeriodEnd
                  ? 'parent.membershipAccessUntil'
                  : 'parent.nextSubscriptionDate',
                { date: currentPeriodEndLabel },
              )}
            </Text>
          ) : null}
          {!subscription.isPremium ? (
            <>
              <ActionButton
                label={
                  openingWebsite
                    ? t('parent.openingWebsite')
                    : t('parent.websiteSubscribe')
                }
                onPress={() => void openWebsiteMembership()}
                tone="outline"
                testID="website-membership"
                loading={openingWebsite}
                icon={
                  !openingWebsite ? (
                    <Ionicons
                      name="open-outline"
                      size={18}
                      color={colors.foreground}
                    />
                  ) : undefined
                }
              />
              <Text
                style={[
                  styles.membershipHint,
                  { color: colors.mutedForeground },
                ]}
                testID="membership-subscribe-hint"
              >
                {t('parent.websiteSubscribeHint')}
              </Text>
            </>
          ) : !subscription.isAdmin ? (
            <ActionButton
              label={t('parent.manageSubscription')}
              onPress={() => void manageSubscription()}
              tone="outline"
              testID="manage-subscription"
              loading={subscription.isManagingSubscription}
              disabled={subscription.isManagingSubscription}
            />
          ) : null}
          {notice ? (
            <Text style={[styles.notice, { color: colors.primary }]}>{notice}</Text>
          ) : null}
        </Surface>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('parent.languageSection')}
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {t('parent.languageHint')}
          </Text>
        </View>
        <View style={styles.languageRow}>
          {languageOptions.map((option) => {
            const active = language === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`language-${option.value}`}
                onPress={() => {
                  void setLanguage(option.value).then((saved) => {
                    if (!saved) setNotice(t('parent.languageSaveError'));
                  });
                }}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: active ? colors.secondary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.languageText, { color: colors.foreground }]}>
                  {option.label}
                </Text>
                {active ? <Ionicons name="checkmark-circle" size={16} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Surface style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.cardEyebrow, { color: colors.primary }]}>
                {t('parent.currentLevel')}
              </Text>
              <Text style={[styles.levelTitle, { color: colors.foreground }]}>
                {levelName}
              </Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: colors.accent }]}>
              <Text
                style={[styles.levelBadgeText, { color: colors.accentForeground }]}
              >
                {stagePrefix(language, learning.selectedStage)}
              </Text>
            </View>
          </View>
          <ProgressBar value={progressPercent} />
          <View style={styles.progressFooter}>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              {t('parent.xp', { count: learning.selectedStageXp })}
            </Text>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                {learning.selectedStageXp >= 100
                  ? uiText(
                      language,
                      'Stage complete · choose a higher stage anytime.',
                      '已完成此階段 · 可隨時選擇更高階段。',
                      '已完成此阶段 · 可随时选择更高阶段。',
                    )
                  : xpRemaining(language, learning.nextLevelXp)}
            </Text>
          </View>
        </Surface>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {uiText(language, 'Choose a learning stage', '自選學習階段', '自选学习阶段')}
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {uiText(
              language,
              'Each stage has its own word bank, games, stories and XP.',
              '每個階段都有獨立詞語庫、遊戲、故事及 XP。',
              '每个阶段都有独立词语库、游戏、故事及 XP。',
            )}
          </Text>
        </View>
        <View style={styles.ageGrid}>
          {[1, 2, 3, 4].map((stage) => {
            const selected = learning.selectedStage === stage;
            const stageTitle = pickText(language, stageNames[stage - 1]);
            return (
              <Pressable
                key={stage}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !subscription.isPremium }}
                disabled={!subscription.isPremium || learning.progressLoading}
                onPress={() => {
                  void learning.selectStage(stage).catch(() =>
                    setNotice(
                      uiText(
                        language,
                        'Could not save the selected stage. Please retry.',
                        '未能儲存所選階段，請重試。',
                        '未能保存所选阶段，请重试。',
                      ),
                    ),
                  );
                }}
                style={[
                  styles.ageOption,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: subscription.isPremium ? 1 : 0.65,
                  },
                ]}
              >
                <Text style={[styles.ageLabel, { color: colors.foreground }]}>
                  {stageTitle}
                </Text>
                <Text style={[styles.ageNote, { color: colors.mutedForeground }]}>
                  {`${stagePrefix(language, stage)} · ${ageText(language, stageAges[stage - 1])}`}
                </Text>
                <Text style={[styles.ageNote, { color: colors.primary, fontWeight: '700' }]}>
                  {learning.xpByStage[stage - 1] ?? 0} / 100 XP
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.ageCheck} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {!subscription.isPremium ? (
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {uiText(
              language,
              'An active subscription is required to select stages and save XP.',
              '啟用訂閱後即可自選階段並儲存 XP。',
              '启用订阅后即可自选阶段并保存 XP。',
            )}
          </Text>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('parent.ageSection')}
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {t('parent.ageHint')}
          </Text>
        </View>
        <View style={styles.ageGrid}>
          {ageBands.map((band) => {
            const active = learning.ageBand === band.value;
            return (
              <Pressable
                key={band.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`age-${band.value}`}
                onPress={() => learning.setAgeBand(band.value)}
                style={[
                  styles.ageOption,
                  {
                    backgroundColor: active ? colors.secondary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ageLabel,
                    { color: colors.foreground },
                  ]}
                >
                  {t(band.labelKey)}
                </Text>
                <Text
                  style={[
                    styles.ageNote,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t(band.noteKey)}
                </Text>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                    style={styles.ageCheck}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {uiText(language, 'Membership benefits', '會員內容', '会员内容')}
          </Text>
        </View>
        <Surface style={styles.membershipCard}>
          <View style={styles.benefitList}>
            <Benefit text={t('parent.benefitFree')} included />
            <Benefit text={t('parent.benefitPremiumCourses')} included={subscription.isPremium} />
            <Benefit text={t('parent.benefitPremiumGames')} included={subscription.isPremium} />
          </View>
        </Surface>

        <Text style={[styles.ageNoteFooter, { color: colors.mutedForeground }]}>
          {t('parent.ageRecommendation', { note: t(ageBandNote(learning.ageBand)) })}
        </Text>
      </ScrollView>

    </Screen>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function Benefit({ text, included }: { text: string; included: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.benefit}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'lock-closed-outline'}
        size={17}
        color={included ? colors.primary : colors.mutedForeground}
      />
      <Text
        style={[
          styles.benefitText,
          { color: included ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 108,
    gap: 12,
  },
  progressCard: {
    gap: 11,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helperText: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 11,
    marginTop: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHelper: {
    fontSize: 11,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    minHeight: 42,
    flexGrow: 1,
    flexBasis: '30%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageOption: {
    minHeight: 66,
    width: '48%',
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 11,
    justifyContent: 'center',
    gap: 3,
  },
  ageLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  ageNote: {
    fontSize: 11,
  },
  ageCheck: {
    position: 'absolute',
    right: 11,
    top: 11,
  },
  accountCard: {
    gap: 12,
  },
  accountIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  membershipCard: {
    gap: 13,
  },
  purchaseCard: {
    width: '100%',
    gap: 12,
  },
  purchaseSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  membershipCopy: {
    flex: 1,
    minWidth: 0,
  },
  membershipHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  memberIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberSub: {
    fontSize: 12,
    marginTop: 3,
  },
  membershipHint: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  benefitList: {
    gap: 9,
    paddingVertical: 4,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
  },
  notice: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  ageNoteFooter: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
