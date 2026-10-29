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

export default function ParentScreen() {
  const colors = useColors();
  const learning = useLearning();
  const subscription = useSubscription();
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const packageToPurchase = subscription.packageToPurchase;
  const purchase = async () => {
    if (!packageToPurchase) {
      setNotice('目前沒有可用的月費方案，請稍後重試。');
      return;
    }
    try {
      await subscription.purchase(packageToPurchase);
      setConfirmPurchase(false);
      setNotice('訂閱完成，高級課程已解鎖。');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '購買未完成，請稍後重試。';
      setNotice(message);
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
          ? '已恢復高級會員權益。'
          : '沒有找到可恢復的高級會員訂閱。',
      );
    } catch {
      setNotice('恢復購買失敗，請稍後重試。');
    }
  };

  const progressPercent = Math.min(
    100,
    (learning.xp / Math.max(1, learning.nextLevelXp)) * 100,
  );
  const levelNames = ['小芽學徒', '詞語探險家', '短句小能手', '漢語小讀者'];
  const levelName = levelNames[(learning.level - 1) % levelNames.length];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          eyebrow="家長專區"
          title="一起看見進步"
          subtitle="調整學習年齡，查看進度，管理會員方案。"
        />

        <Surface style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.cardEyebrow, { color: colors.primary }]}>
                目前等級
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
              {learning.xp} 點學習經驗
            </Text>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              下一級 {learning.nextLevelXp} 點
            </Text>
          </View>
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <Stat
              icon="flame-outline"
              value={`${learning.streak}`}
              label="連續學習日"
            />
            <Stat
              icon="book-outline"
              value={`${learning.completedLessonIds.length}`}
              label="完成課程"
            />
            <Stat
              icon="checkmark-done-outline"
              value={`${learning.learnedWordIds.length}`}
              label="學會詞語"
            />
          </View>
        </Surface>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            孩子的年齡
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            課程會依年齡調整建議
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
                  {band.label}
                </Text>
                <Text
                  style={[
                    styles.ageNote,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {band.note}
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
            會員方案
          </Text>
          <Text style={[styles.sectionHelper, { color: colors.mutedForeground }]}>
            {subscription.isPremium ? '高級會員已啟用' : '免費方案'}
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
                {subscription.isPremium ? '高級會員' : '免費會員'}
              </Text>
              <Text style={[styles.memberSub, { color: colors.mutedForeground }]}>
                {subscription.isPremium
                  ? '所有年齡課程已解鎖'
                  : '先從免費課程與遊戲開始'}
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
            <Benefit text="免費：打招呼、水果入門課" included />
            <Benefit
              text="高級：完整生活詞彙與分齡課程"
              included={subscription.isPremium}
            />
            <Benefit
              text="高級：所有小遊戲與學習路徑"
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
                      / 月 · 由商店確認付款
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
                      ? '月費方案尚未在商店發布'
                      : '訂閱商店設定完成後會在此顯示價格'}
                  </Text>
                )}
              </View>
              <ActionButton
                label={subscription.isPurchasing ? '處理中…' : '升級高級會員'}
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
                訂閱由 Apple App Store 或 Google Play 管理，續訂及取消請至商店設定。
              </Text>
              <ActionButton
                label="恢復購買"
                onPress={restore}
                tone="outline"
                testID="restore-purchases"
                loading={subscription.isRestoring}
                disabled={subscription.isRestoring}
              />
            </>
          ) : (
            <ActionButton
              label="恢復購買"
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
                方案載入失敗，點此重試
              </Text>
            </Pressable>
          ) : null}
        </Surface>

        <Text style={[styles.ageNoteFooter, { color: colors.mutedForeground }]}>
          建議 {ageBandNote(learning.ageBand)}，每次短時間練習，讓孩子保持愉快。
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
              確認訂閱高級會員？
            </Text>
            <Text
              style={[
                styles.confirmCopy,
                { color: colors.mutedForeground },
              ]}
            >
              {subscription.priceLabel
                ? `每月 ${subscription.priceLabel}，付款會由${Platform.OS === 'ios' ? 'App Store' : Platform.OS === 'android' ? 'Google Play' : '商店'}處理。`
                : '商店會在確認購買前顯示訂閱價格。'}
            </Text>
            <ActionButton
              label="確認並繼續"
              onPress={() => void purchase()}
              testID="confirm-subscription"
              loading={subscription.isPurchasing}
            />
            <ActionButton
              label="稍後再說"
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
