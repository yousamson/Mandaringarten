import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, PageTitle, ProgressBar, Screen, Surface } from '@/components/LearningUI';
import { useLearning } from '@/context/LearningContext';
import { ageBandNote, ageBands } from '@/data/vocabulary';
import { useSubscription } from '@/lib/subscriptions';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { languageOptions, translate } from '@/lib/i18n';

export default function ParentScreen() {
  const colors = useColors();
  const { language, setLanguage } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const learning = useLearning();
  const subscription = useSubscription();
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const packageToPurchase = subscription.packageToPurchase;
  const purchase = async () => {
    if (!packageToPurchase) {
      setNotice(t('parent.purchaseUnavailable'));
      return;
    }
    try {
      await subscription.purchase(packageToPurchase);
      setConfirmPurchase(false);
      setNotice(t('parent.purchaseComplete'));
    } catch (error) {
      setNotice(t('parent.purchaseFailed'));
      setConfirmPurchase(false);
    }
  };

  const restore = async () => {
    setNotice(null);
    try {
      const info = await subscription.restore();
      const restored = info.entitlements.active.premium !== undefined;
      setNotice(
        restored
          ? t('parent.restoreFound')
          : t('parent.restoreNotFound'),
      );
    } catch {
      setNotice(t('parent.restoreFailed'));
    }
  };

  const progressPercent = Math.min(
    100,
    (learning.xp / Math.max(1, learning.nextLevelXp)) * 100,
  );
  const levelName = t(`level.name${((learning.level - 1) % 4) + 1}`);

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
                Lv. {learning.level}
              </Text>
            </View>
          </View>
          <ProgressBar value={progressPercent} />
          <View style={styles.progressFooter}>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              {t('parent.xp', { count: learning.xp })}
            </Text>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              {t('parent.nextLevel', { count: learning.nextLevelXp })}
            </Text>
          </View>
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <Stat
              icon="flame-outline"
              value={`${learning.streak}`}
              label={t('parent.streak')}
            />
            <Stat
              icon="book-outline"
              value={`${learning.completedLessonIds.length}`}
              label={t('parent.completedLessons')}
            />
            <Stat
              icon="checkmark-done-outline"
              value={`${learning.learnedWordIds.length}`}
              label={t('parent.learnedWords')}
            />
          </View>
        </Surface>

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
            {t('parent.membership')}
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {subscription.isPremium ? t('parent.premiumEnabled') : t('parent.freePlan')}
          </Text>
        </View>
        <Surface
          style={[
            styles.membershipCard,
            subscription.isPremium && {
              borderColor: colors.primary,
              backgroundColor: colors.secondary,
            },
          ]}
        >
          <View style={styles.membershipHead}>
            <View
              style={[
                styles.memberIcon,
                { backgroundColor: subscription.isPremium ? colors.accent : colors.secondary },
              ]}
            >
              <Ionicons
                name={subscription.isPremium ? 'sparkles' : 'leaf-outline'}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberTitle, { color: colors.foreground }]}>
                {subscription.isPremium ? t('parent.premiumMember') : t('parent.freeMember')}
              </Text>
              <Text style={[styles.memberSub, { color: colors.mutedForeground }]}>
                {subscription.isPremium
                  ? t('parent.allCourses')
                  : t('parent.freeStart')}
              </Text>
            </View>
            {subscription.isPremium ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.primary}
              />
            ) : null}
          </View>

          <View style={styles.benefitList}>
            <Benefit text={t('parent.benefitFree')} included />
            <Benefit
              text={t('parent.benefitPremiumCourses')}
              included={subscription.isPremium}
            />
            <Benefit
              text={t('parent.benefitPremiumGames')}
              included={subscription.isPremium}
            />
          </View>

          {!subscription.isPremium ? (
            <>
              <View
                style={[
                  styles.pricePanel,
                  { backgroundColor: colors.background },
                ]}
              >
                {subscription.isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : subscription.priceLabel ? (
                  <>
                    <Text style={[styles.price, { color: colors.foreground }]}>
                      {subscription.priceLabel}
                    </Text>
                    <Text
                      style={[
                        styles.pricePeriod,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {t('parent.pricePeriod')}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[
                      styles.setupMessage,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {subscription.configured
                      ? t('parent.planNotPublished')
                      : t('parent.planSetupPending')}
                  </Text>
                )}
              </View>
              <ActionButton
                label={subscription.isPurchasing ? t('parent.processing') : t('parent.upgrade')}
                onPress={() => setConfirmPurchase(true)}
                testID="upgrade-premium"
                disabled={!packageToPurchase || subscription.isPurchasing}
                loading={subscription.isPurchasing}
                icon={
                  !subscription.isPurchasing ? (
                    <Ionicons
                      name="sparkles"
                      size={18}
                      color={colors.primaryForeground}
                    />
                  ) : undefined
                }
              />
              <Text
                style={[
                  styles.legal,
                  { color: colors.mutedForeground },
                ]}
              >
                {t('parent.subscriptionLegal')}
              </Text>
              <ActionButton
                label={t('parent.restore')}
                onPress={restore}
                tone="outline"
                testID="restore-purchases"
                loading={subscription.isRestoring}
                disabled={subscription.isRestoring}
              />
            </>
          ) : (
            <ActionButton
              label={t('parent.restore')}
              onPress={restore}
              tone="outline"
              testID="restore-purchases"
              loading={subscription.isRestoring}
              disabled={subscription.isRestoring}
            />
          )}
          {notice ? (
            <Text style={[styles.notice, { color: colors.primary }]}>
              {notice}
            </Text>
          ) : null}
          {subscription.error ? (
            <Pressable
              accessibilityRole="button"
              testID="retry-offering"
              onPress={() => {
                setNotice(null);
                void subscription.refresh();
              }}
            >
              <Text
                style={[
                  styles.retryText,
                  { color: colors.destructive },
                ]}
              >
                {t('parent.planLoadError')}
              </Text>
            </Pressable>
          ) : null}
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
                ? t('parent.confirmPrice', {
                    price: subscription.priceLabel,
                    store: Platform.OS === 'ios' ? t('store.apple') : Platform.OS === 'android' ? t('store.google') : t('store.other'),
                  })
                : t('parent.confirmStorePrice')}
            </Text>
            <ActionButton
              label={t('parent.confirmAndContinue')}
              onPress={() => void purchase()}
              testID="confirm-subscription"
              loading={subscription.isPurchasing}
            />
            <ActionButton
              label={t('parent.later')}
              onPress={() => setConfirmPurchase(false)}
              tone="soft"
              testID="cancel-subscription"
            />
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
  membershipCard: {
    gap: 13,
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
  confirmBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    alignItems: 'center',
    padding: 22,
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
