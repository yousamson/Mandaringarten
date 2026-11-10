import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function GardenIllustration({ growthDays }: { growthDays: number }) {
  const days = Math.max(0, Math.min(30, Math.floor(growthDays)));
  const imageSource = days >= 30
    ? require('../assets/images/garden-full-bloom-wide.jpg')
    : days >= 20
      ? require('../assets/images/garden-growing-wide.jpg')
      : days >= 10
        ? require('../assets/images/garden-first-bloom-wide.jpg')
        : require('../assets/images/garden-seed-wide.jpg');

  return (
    <View style={styles.frame} accessibilityRole="image" accessibilityLabel={`${days} days of garden growth`}>
      <Image source={imageSource} style={styles.image} resizeMode="cover" accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderRadius: 20 },
  image: { width: '100%', aspectRatio: 2 },
});
