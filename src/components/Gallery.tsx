import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';
import { Img } from '@/components/Img';

type Props = {
  photos: ImageSourcePropType[];
  height?: number;
  caption?: (index: number) => string | undefined;
};

export function Gallery({ photos, height = 280, caption }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (photos.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {photos.map((source, i) => (
          <Pressable key={i} onPress={() => { setIndex(i); setOpen(true); }}>
            <Img source={source} style={{ width, height }} />
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.counter} pointerEvents="none">
        <Text style={s.counterText}>{index + 1} / {photos.length}</Text>
      </View>

      {caption?.(index) ? (
        <View style={s.caption} pointerEvents="none">
          <Text style={s.captionText}>{caption(index)}</Text>
        </View>
      ) : null}

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={s.viewer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: index * width, y: 0 }}
            onMomentumScrollEnd={onScroll}
          >
            {photos.map((source, i) => (
              <View key={i} style={{ width, flex: 1, justifyContent: 'center' }}>
                <Img source={source} style={{ width, height: width }} />
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={() => setOpen(false)} style={s.close} accessibilityLabel="close">
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>

          <View style={s.viewerFooter} pointerEvents="none">
            <Text style={s.viewerCount}>{index + 1} / {photos.length}</Text>
            {caption?.(index) ? <Text style={s.viewerCaption}>{caption(index)}</Text> : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  counter: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  counterText: { color: colors.white, fontSize: 12, fontFamily: font.extrabold },
  caption: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captionText: { color: colors.white, fontSize: 12, fontFamily: font.bold },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  close: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFooter: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', gap: 4 },
  viewerCount: { color: colors.white, fontSize: 13, fontFamily: font.extrabold },
  viewerCaption: { color: colors.onDark, fontSize: 13, fontFamily: font.semibold },
});
