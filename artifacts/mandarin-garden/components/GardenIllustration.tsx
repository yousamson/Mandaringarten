import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

const positions = [
  { x: 62, y: 139, h: 55 },
  { x: 111, y: 126, h: 77 },
  { x: 164, y: 137, h: 66 },
  { x: 214, y: 120, h: 88 },
  { x: 266, y: 139, h: 58 },
];

export function GardenIllustration({ growthDays }: { growthDays: number }) {
  const colors = useColors();
  const days = Math.max(0, Math.min(30, Math.floor(growthDays)));
  const plants = days >= 24 ? 5 : days >= 15 ? 3 : days >= 6 ? 2 : days > 0 ? 1 : 0;
  const flowers = days >= 30 ? 5 : days >= 24 ? 4 : days >= 18 ? 3 : days >= 10 ? 1 : 0;

  return (
    <View style={styles.frame} accessibilityRole="image" accessibilityLabel={`${days} days of garden growth`}>
      <Svg width="100%" height="190" viewBox="0 0 320 190">
        <Rect x="0" y="0" width="320" height="190" rx="24" fill={colors.secondary} />
        <Circle cx="258" cy="46" r="20" fill={colors.accent} opacity=".72" />
        <Path d="M0 147c49-24 84-12 129 4 56 20 111 9 191-12v51H0Z" fill={colors.primary} opacity=".26" />
        <Path d="M0 165c54-19 92-8 141 3 61 15 109 6 179-11v33H0Z" fill={colors.primary} opacity=".48" />
        {positions.slice(0, plants).map((plant, index) => {
          const height = Math.max(14, plant.h * Math.min(1, days / (index === 0 ? 8 : 14)));
          const top = plant.y - height;
          return (
            <G key={plant.x}>
              <Path d={`M${plant.x} 166 Q${plant.x - 2} ${top + height * 0.4} ${plant.x} ${top}`} fill="none" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" />
              {height > 25 ? <Ellipse cx={plant.x - 13} cy={top + height * 0.63} rx="17" ry="7" fill={colors.primaryShade} transform={`rotate(-28 ${plant.x - 13} ${top + height * 0.63})`} /> : null}
              {height > 40 ? <Ellipse cx={plant.x + 14} cy={top + height * 0.8} rx="16" ry="7" fill={colors.primary} opacity=".78" transform={`rotate(28 ${plant.x + 14} ${top + height * 0.8})`} /> : null}
              {index < flowers ? (
                <G transform={`translate(${plant.x} ${top - 2})`}>
                  <Ellipse cy="-10" rx="5" ry="10" fill={colors.accent} />
                  <Ellipse cy="10" rx="5" ry="10" fill={colors.accent} />
                  <Ellipse cx="-10" rx="5" ry="10" fill={colors.accent} transform="rotate(90 -10 0)" />
                  <Ellipse cx="10" rx="5" ry="10" fill={colors.accent} transform="rotate(90 10 0)" />
                  <Circle r="4" fill={colors.warmInk} />
                </G>
              ) : null}
            </G>
          );
        })}
        {days === 0 ? (
          <G transform="translate(160 153)">
            <Ellipse cx="0" cy="10" rx="12" ry="6" fill={colors.warmInk} opacity=".6" />
            <Path d="M0 7c-2-13 4-20 11-23M1 0c-7-7-13-6-16-1 7 6 12 6 16 1Z" fill={colors.primaryShade} stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderRadius: 20 },
});
