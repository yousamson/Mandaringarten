import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.safe,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'web' ? 12 : insets.top,
          paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.titleWrap}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {subtitle}
      </Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  disabled = false,
  loading = false,
  testID,
}: {
  label: string;
  onPress: PressableProps['onPress'];
  icon?: React.ReactNode;
  tone?: 'primary' | 'soft' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  const buttonColor =
    tone === 'primary'
      ? colors.primary
      : tone === 'soft'
        ? colors.secondary
        : 'transparent';
  const textColor =
    tone === 'primary' ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: buttonColor,
          borderColor: colors.border,
          borderWidth: tone === 'outline' ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Surface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.surface,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const colors = useColors();
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
      <View
        style={[styles.progressFill, { backgroundColor: colors.primary, width }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  titleWrap: {
    gap: 5,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  surface: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  button: {
    minHeight: 52,
    borderRadius: 17,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    height: 9,
    overflow: 'hidden',
    borderRadius: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
});
