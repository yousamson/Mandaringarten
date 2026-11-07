import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { familyMedia, type FamilyMedia, type PlaygroundLanguage } from '@workspace/learning-content';
import { useColors } from '@/hooks/useColors';

function tr(language: PlaygroundLanguage, en: string, hant: string, hans: string) {
  return language === 'en' ? en : language === 'zh-Hant' ? hant : hans;
}

function AudioPlayback({ item, language }: { item: FamilyMedia; language: PlaygroundLanguage }) {
  const colors = useColors();
  const player = useAudioPlayer(item.mediaUrl, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const progress = status.duration > 0 ? Math.min(100, (status.currentTime / status.duration) * 100) : 0;

  useEffect(() => () => { player.pause(); }, [player]);

  return (
    <View style={[styles.playerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? tr(language, 'Pause music', '暫停音樂', '暂停音乐') : tr(language, 'Play music', '播放音樂', '播放音乐')}
        testID="media-audio-toggle"
        onPress={() => status.playing ? player.pause() : player.play()}
        style={[styles.audioButton, { backgroundColor: colors.primary }]}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={17} color={colors.primaryForeground} />
        <Text style={[styles.audioButtonText, { color: colors.primaryForeground }]}>
          {status.isBuffering
            ? tr(language, 'Loading…', '載入中…', '加载中…')
            : status.playing
              ? tr(language, 'Pause', '暫停', '暂停')
              : tr(language, 'Play', '播放', '播放')}
        </Text>
      </Pressable>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.playerHint, { color: colors.mutedForeground }]}>
        {status.playbackState === 'error'
          ? tr(language, 'The audio could not be loaded. Please try again later.', '無法載入音樂，請稍後再試。', '无法加载音乐，请稍后再试。')
          : tr(language, 'Audio streams only after you press play.', '按下播放後才會串流音樂。', '按下播放后才会串流音乐。')}
      </Text>
    </View>
  );
}

function VideoPlayback({ item, language }: { item: FamilyMedia; language: PlaygroundLanguage }) {
  const colors = useColors();
  const player = useVideoPlayer({ uri: item.mediaUrl }, (instance) => { instance.loop = false; });

  useEffect(() => () => { player.pause(); }, [player]);

  return (
    <View style={[styles.videoFrame, { backgroundColor: colors.foreground }]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
        allowsPictureInPicture={false}
        accessibilityLabel={item.title[language]}
        testID="media-video-player"
      />
    </View>
  );
}

export function MediaGarden({ language }: { language: PlaygroundLanguage }) {
  const colors = useColors();
  const [activeId, setActiveId] = useState<FamilyMedia['id'] | null>(null);
  const activeItem = familyMedia.find((item) => item.id === activeId);

  const openSource = async (item: FamilyMedia) => {
    try {
      await Linking.openURL(item.sourceUrl);
    } catch {
      Alert.alert(
        tr(language, 'Source unavailable', '無法開啟來源', '无法打开来源'),
        tr(language, 'The media source page could not be opened.', '目前無法開啟影音來源頁面。', '目前无法打开影音来源页面。'),
      );
    }
  };

  return (
    <View style={styles.section} testID="media-garden">
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {tr(language, 'Music and animation', '影音天地', '影音天地')}
        </Text>
        <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
          {tr(language, 'CC0 · Public domain', 'CC0 · 公共領域', 'CC0 · 公共领域')}
        </Text>
      </View>
      <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
        {tr(language, 'Choose an open-licensed song or silent cartoon. Players load only when opened.', '可選播放開放授權兒歌或默片動畫；開啟播放器後才載入影音。', '可选播放开放授权儿歌或默片动画；打开播放器后才加载影音。')}
      </Text>

      <View style={styles.mediaList}>
        {familyMedia.map((item) => {
          const active = activeId === item.id;
          const icon = item.kind === 'audio' ? 'musical-notes-outline' : 'film-outline';
          return (
            <View key={item.id} style={[styles.mediaCard, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border }]}>
              <View style={[styles.mediaIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={icon} size={19} color={colors.primary} />
              </View>
              <View style={styles.mediaContent}>
                <View style={styles.mediaHeading}>
                  <Text style={[styles.mediaTitle, { color: colors.foreground }]}>{item.title[language]}</Text>
                  <Text style={[styles.mediaDuration, { color: colors.mutedForeground }]}>{item.duration}</Text>
                </View>
                <Text style={[styles.mediaDescription, { color: colors.mutedForeground }]}>{item.description[language]}</Text>
                <Text style={[styles.licenseText, { color: colors.primary }]}>{item.license[language]}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: active }}
                  testID={`button-media-${item.id}`}
                  onPress={() => setActiveId((current) => current === item.id ? null : item.id)}
                  style={[styles.openPlayerButton, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name={active ? 'close' : 'play'} size={15} color={colors.primary} />
                  <Text style={[styles.openPlayerText, { color: colors.primary }]}>
                    {active
                      ? tr(language, 'Close player', '關閉播放器', '关闭播放器')
                      : item.kind === 'audio'
                        ? tr(language, 'Listen', '播放音樂', '播放音乐')
                        : tr(language, 'Watch', '播放動畫', '播放动画')}
                  </Text>
                </Pressable>
                {active && (
                  <View style={styles.activePlayer} testID={`player-${item.id}`}>
                    {item.kind === 'audio'
                      ? <AudioPlayback item={item} language={language} />
                      : <VideoPlayback item={item} language={language} />}
                  </View>
                )}
                <Pressable accessibilityRole="link" onPress={() => void openSource(item)} style={styles.sourceButton}>
                  <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
                    {tr(language, `Source and license · ${item.sourceName}`, `來源及授權 · ${item.sourceName}`, `来源及授权 · ${item.sourceName}`)}
                  </Text>
                  <Ionicons name="open-outline" size={13} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        {tr(language, 'Media is streamed from Wikimedia Commons. An adult should choose what younger children watch.', '影音由 Wikimedia Commons 串流；幼兒觀看內容時請由家長陪同。', '影音由 Wikimedia Commons 串流；幼儿观看内容时请由家长陪同。')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 9, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionMeta: { fontSize: 10, fontWeight: '700' },
  sectionDescription: { fontSize: 11, lineHeight: 17 },
  mediaList: { gap: 9 },
  mediaCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderRadius: 17 },
  mediaIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mediaContent: { flex: 1, minWidth: 0, gap: 6 },
  mediaHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  mediaTitle: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  mediaDuration: { fontSize: 10, fontWeight: '700' },
  mediaDescription: { fontSize: 11, lineHeight: 16 },
  licenseText: { fontSize: 10, lineHeight: 14, fontWeight: '700' },
  openPlayerButton: { minHeight: 35, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 11 },
  openPlayerText: { fontSize: 11, fontWeight: '800' },
  activePlayer: { marginTop: 4 },
  playerBox: { gap: 10, padding: 12, borderWidth: 1, borderRadius: 13 },
  audioButton: { minHeight: 42, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 12 },
  audioButtonText: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 5, overflow: 'hidden', borderRadius: 99 },
  progressFill: { height: '100%', borderRadius: 99 },
  playerHint: { fontSize: 10, lineHeight: 15 },
  videoFrame: { overflow: 'hidden', width: '100%', aspectRatio: 4 / 3, borderRadius: 13 },
  video: { width: '100%', height: '100%' },
  sourceButton: { minHeight: 28, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sourceText: { fontSize: 10, lineHeight: 14 },
  note: { fontSize: 10, lineHeight: 15 },
});
