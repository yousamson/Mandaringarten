import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { languageOptions, translate } from '@/lib/i18n';
import { useLocalSearchParams } from 'expo-router';
import { stageAges, stageNames } from '@workspace/learning-content';

export default function ParentScreen() {
  const colors = useColors();
  const { language, setLanguage } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const learning = useLearning();
  const subscription = useSubscription();
  const { user } = useUser();
  const { signOut } = useClerk();
  const routeParams = useLocalSearchParams<{ billing?: string | string[] }>();
  const billingReturn = Array.isArray(routeParams.billing)
    ? routeParams.billing[0]
    : routeParams.billing;
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [noRefundAccepted, setNoRefundAccepted] = useState(false);
  useEffect(() => {
    if (billingReturn === 'success') void subscription.refresh();
  }, [billingReturn, subscription.refresh]);

  useEffect(() => {
    if (subscription.isLoading) return;
    if (billingReturn === 'success') {
      setNotice(
        translate(
          language,
          subscription.isPremium
            ? 'parent.purchaseComplete'
            : 'parent.purchasePending',
        ),
      );
    } else if (billingReturn === 'cancelled') {
      setNotice(translate(language, 'parent.purchaseCancelled'));
    } else if (billingReturn === 'returned') {
      setNotice(null);
    }
  }, [
    billingReturn,
    language,
    subscription.isLoading,
    subscription.isPremium,
    subscription.isWeb,
  ]);

  const purchase = async () => {
    if (!subscription.canPurchase) {
      setNotice(t('parent.purchaseUnavailable'));
      return;
    }
    try {
      setConfirmPurchase(false);
      await subscription.purchase({
        privacyAccepted,
        disclaimerAccepted,
        noRefundAccepted,
      });
      setNotice(t('parent.purchasePending'));
      void subscription.refresh();
    } catch (error) {
      setNotice(t('parent.purchaseFailed'));
      setConfirmPurchase(false);
    }
  };

  const manageSubscription = async () => {
    setNotice(null);
    try {
      await subscription.manageSubscription();
    } catch {
      setNotice(t('parent.manageSubscriptionFailed'));
    }
  };

  const progressPercent = Math.min(
    100,
    learning.selectedStageXp,
  );
  const levelName =
    language === 'en'
      ? stageNames[learning.selectedStage - 1][0]
      : language === 'zh-Hans'
        ? stageNames[learning.selectedStage - 1][2]
        : stageNames[learning.selectedStage - 1][1];
  const openLegal = async (path: 'privacy' | 'disclaimer') => {
    try {
      await WebBrowser.openBrowserAsync(`${getWebsiteOrigin()}/${path}`);
    } catch {
      setNotice(
        language === 'en'
          ? 'Could not open the policy page.'
          : language === 'zh-Hans'
            ? '未能開啟政策頁面。'
            : '未能開啟政策頁面。',
      );
    }
  };
  const openCheckoutConfirmation = () => {
    setNotice(null);
    setPrivacyAccepted(false);
    setDisclaimerAccepted(false);
    setNoRefundAccepted(false);
    setConfirmPurchase(true);
  };

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
                {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? ''}
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
            {subscription.isPremium ? t('parent.premiumEnabled') : t('parent.freePlan')}
          </Text>
        </View>
        <Surface style={styles.purchaseCard}>
          <View style={styles.purchaseSummary}>
            <View style={[styles.memberIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="sparkles" size={22} color={colors.primary} />
            </View>
            <View style={styles.purchasePriceCopy}>
              <Text style={[styles.memberTitle, { color: colors.foreground }]}>
                {subscription.isPremium ? t('parent.premiumMember') : t('parent.freeMember')}
              </Text>
              {subscription.isPlanLoading ? (
                <View style={styles.priceLoading}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : subscription.priceLabel ? (
                <View style={styles.priceInline}>
                  <Text style={[styles.price, { color: colors.foreground }]}>{subscription.priceLabel}</Text>
                  <Text style={[styles.pricePeriod, { color: colors.mutedForeground }]}>
                    {t('parent.pricePeriodWeb')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.setupMessage, { color: colors.mutedForeground }]}>
                  {subscription.error
                    ? t('parent.planLoadError')
                    : t('parent.planSetupPendingWeb')}
                </Text>
              )}
            </View>
          </View>
          {!subscription.isPremium ? (
            <>
              {subscription.error ? (
                <Pressable
                  accessibilityRole="button"
                  testID="retry-offering"
                  onPress={() => {
                    setNotice(null);
                    void subscription.refresh();
                  }}
                  style={styles.planRetry}
                >
                  <Ionicons name="refresh" size={16} color={colors.destructive} />
                  <Text style={[styles.retryText, { color: colors.destructive }]}>
                    {t('parent.planLoadError')}
                  </Text>
                </Pressable>
              ) : !subscription.isLoading && !subscription.isSignedIn ? (
                <Text style={[styles.setupMessage, { color: colors.mutedForeground }]}>
                  {language === 'en'
                    ? 'Sign in before upgrading.'
                    : language === 'zh-Hans'
                      ? '登入後即可升級會員。'
                      : '登入後即可升級會員。'}
                </Text>
              ) : subscription.isLoading && subscription.isSignedIn ? (
                <Text style={[styles.setupMessage, { color: colors.mutedForeground }]}>
                  {language === 'en'
                    ? 'Checking your account before checkout…'
                    : language === 'zh-Hans'
                      ? '正在確認帳戶付款資格…'
                      : '正在確認帳戶付款資格…'}
                </Text>
              ) : null}
              <ActionButton
                label={subscription.isPurchasing ? t('parent.processing') : t('parent.upgrade')}
                onPress={openCheckoutConfirmation}
                testID="upgrade-premium"
                disabled={!subscription.canPurchase || subscription.isPurchasing}
                loading={subscription.isPurchasing}
                icon={!subscription.isPurchasing ? (
                  <Ionicons name="sparkles" size={18} color={colors.primaryForeground} />
                ) : undefined}
              />
              <Text style={[styles.legal, { color: colors.mutedForeground }]}>
                {t('parent.subscriptionLegalWeb')}
              </Text>
            </>
          ) : subscription.hasBillingCustomer ? (
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
                {language === 'en'
                  ? `Stage ${learning.selectedStage}`
                  : language === 'zh-Hans'
                    ? `第 ${learning.selectedStage} 阶段`
                    : `第 ${learning.selectedStage} 階段`}
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
                ? language === 'en'
                  ? 'Stage complete · choose a higher stage anytime.'
                  : language === 'zh-Hans'
                    ? '已完成此阶段 · 可随时选择更高阶段。'
                    : '已完成此階段 · 可隨時選擇更高階段。'
                : language === 'en'
                  ? `${learning.nextLevelXp} XP to complete this stage`
                  : language === 'zh-Hans'
                    ? `再得 ${learning.nextLevelXp} XP 即完成此阶段`
                    : `再得 ${learning.nextLevelXp} XP 即完成此階段`}
            </Text>
          </View>
        </Surface>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {language === 'en'
              ? 'Choose a learning stage'
              : language === 'zh-Hans'
                ? '自選學習階段'
                : '自選學習階段'}
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {language === 'en'
              ? 'Each stage has its own word bank, games, stories and XP.'
              : language === 'zh-Hans'
                ? '每個階段都有獨立詞語庫、遊戲、故事及 XP。'
                : '每個階段都有獨立詞語庫、遊戲、故事及 XP。'}
          </Text>
        </View>
        <View style={styles.ageGrid}>
          {[1, 2, 3, 4].map((stage) => {
            const selected = learning.selectedStage === stage;
            const stageTitle =
              language === 'en'
                ? stageNames[stage - 1][0]
                : language === 'zh-Hans'
                  ? stageNames[stage - 1][2]
                  : stageNames[stage - 1][1];
            return (
              <Pressable
                key={stage}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !subscription.isPremium }}
                disabled={!subscription.isPremium || learning.progressLoading}
                onPress={() => {
                  void learning.selectStage(stage).catch(() =>
                    setNotice(
                      language === 'en'
                        ? 'Could not save the selected stage. Please retry.'
                        : language === 'zh-Hans'
                          ? '未能儲存所選階段，請重試。'
                          : '未能儲存所選階段，請重試。',
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
                  {language === 'en'
                    ? `Stage ${stage} · ages ${stageAges[stage - 1]}`
                    : language === 'zh-Hans'
                      ? `第 ${stage} 阶段 · ${stageAges[stage - 1]} 岁`
                      : `第 ${stage} 階段 · ${stageAges[stage - 1]} 歲`}
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
            {language === 'en'
              ? 'An active subscription is required to select stages and save XP.'
              : language === 'zh-Hans'
                ? '訂閱啟用後即可自選階段並儲存 XP。'
                : '訂閱啟用後即可自選階段並儲存 XP。'}
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
            {language === 'en' ? 'Membership benefits' : language === 'zh-Hans' ? '會員內容' : '會員內容'}
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

      <Modal
        transparent
        animationType="fade"
        visible={confirmPurchase}
        onRequestClose={() => setConfirmPurchase(false)}
      >
        <View
          style={[
            styles.confirmBackdrop,
            { backgroundColor: colors.overlay },
          ]}
        >
          <Surface style={styles.confirmCard}>
            <ScrollView
              style={styles.confirmScroll}
              contentContainerStyle={styles.confirmScrollContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
            <View style={[styles.confirmIcon, { backgroundColor: colors.accent }]}>
              <Ionicons
                name="sparkles"
                size={25}
                color={colors.accentForeground}
              />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
              {t('parent.confirmTitle')}
            </Text>
            <Text
              style={[
                styles.confirmCopy,
                { color: colors.mutedForeground },
              ]}
            >
              {subscription.priceLabel
                ? t('parent.confirmWebPrice', { price: subscription.priceLabel })
                : t('parent.planNotPublished')}
            </Text>
            <View style={styles.agreementList}>
              <View style={styles.agreementRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: privacyAccepted }}
                  onPress={() => setPrivacyAccepted((value) => !value)}
                  style={styles.agreementCheck}
                >
                  <Ionicons
                    name={privacyAccepted ? 'checkbox' : 'square-outline'}
                    size={21}
                    color={privacyAccepted ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[styles.agreementText, { color: colors.foreground }]}>
                    {language === 'en'
                      ? 'I agree to and fully understand the privacy policy.'
                      : language === 'zh-Hans'
                        ? '我同意并完全理解个人隐私资料政策。'
                        : '我同意並完全明白個人私隱資料政策。'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void openLegal('privacy')}>
                  <Text style={[styles.agreementLink, { color: colors.primary }]}>
                    {language === 'en' ? 'Read' : language === 'zh-Hans' ? '查看' : '閱讀'}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.agreementRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: disclaimerAccepted }}
                  onPress={() => setDisclaimerAccepted((value) => !value)}
                  style={styles.agreementCheck}
                >
                  <Ionicons
                    name={disclaimerAccepted ? 'checkbox' : 'square-outline'}
                    size={21}
                    color={disclaimerAccepted ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[styles.agreementText, { color: colors.foreground }]}>
                    {language === 'en'
                      ? 'I agree to and fully understand the legal disclaimer.'
                      : language === 'zh-Hans'
                        ? '我同意并完全理解法律免责声明。'
                        : '我同意並完全明白法律免責聲明。'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void openLegal('disclaimer')}>
                  <Text style={[styles.agreementLink, { color: colors.primary }]}>
                    {language === 'en' ? 'Read' : language === 'zh-Hans' ? '查看' : '閱讀'}
                  </Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: noRefundAccepted }}
                onPress={() => setNoRefundAccepted((value) => !value)}
                style={styles.agreementCheck}
              >
                <Ionicons
                  name={noRefundAccepted ? 'checkbox' : 'square-outline'}
                  size={21}
                  color={noRefundAccepted ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.agreementText, { color: colors.foreground }]}>
                  {language === 'en'
                    ? 'I understand paid subscription fees are non-refundable.'
                    : language === 'zh-Hans'
                      ? '我明白已缴付的订阅月费不予退还。'
                      : '我明白已繳付的訂閱月費不獲退還。'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.confirmButtonWrap}>
              <ActionButton
                label={t('parent.confirmAndContinue')}
                onPress={() => void purchase()}
                testID="confirm-subscription"
                loading={subscription.isPurchasing}
                disabled={!privacyAccepted || !disclaimerAccepted || !noRefundAccepted}
              />
            </View>
            <View style={styles.confirmButtonWrap}>
              <ActionButton
                label={t('parent.later')}
                onPress={() => setConfirmPurchase(false)}
                tone="soft"
                testID="cancel-subscription"
              />
            </View>
            </ScrollView>
          </Surface>
        </View>
      </Modal>
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
  purchasePriceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  priceInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 5,
  },
  priceLoading: {
    minHeight: 24,
    justifyContent: 'center',
  },
  planRetry: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 8,
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
  pricePanel: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
  },
  pricePeriod: {
    fontSize: 12,
  },
  setupMessage: {
    fontSize: 12,
    textAlign: 'center',
  },
  legal: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 15,
    marginTop: -4,
  },
  notice: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  ageNoteFooter: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  agreementList: {
    width: '100%',
    gap: 12,
    marginVertical: 12,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  agreementCheck: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  agreementLink: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 5,
  },
  confirmBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    overflow: 'hidden',
    alignItems: 'center',
    padding: 14,
  },
  confirmScroll: {
    width: '100%',
  },
  confirmScrollContent: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  confirmButtonWrap: {
    width: '100%',
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmCopy: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 3,
  },
});
