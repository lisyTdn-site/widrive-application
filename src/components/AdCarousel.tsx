import { useEffect, useRef, useState } from 'react';

import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ads, type Ad } from '@/data/ads';
import { Img } from '@/components/Img';
import { colors, font, radius, shadow, spacing } from '@/theme';
import { useI18n } from '@/i18n';

const GAP = 12;
const PADDING = 18;
// Largeur de la carte suivante laissée visible, pour inviter au glissement.
const PEEK = 24;

export function AdCarousel() {
  const { tr, t } = useI18n();
  const { width } = useWindowDimensions();

  const slideWidth = width - PADDING - GAP - PEEK;

  const listRef = useRef<FlatList<Ad>>(null);
  const dragging = useRef(false);

  const [index, setIndex] = useState(0);

  // Défilement automatique
  useEffect(() => {
    if (ads.length <= 1) return;

    const timer = setInterval(() => {
      if (dragging.current) return;

      setIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % ads.length;

        listRef.current?.scrollToOffset({
          offset: nextIndex * (slideWidth + GAP),
          animated: true,
        });

        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [slideWidth]);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={ads}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToInterval={slideWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onMomentumScrollEnd={(event) => {
          dragging.current = false;

          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / (slideWidth + GAP),
          );

          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <Pressable
            disabled={!item.route}
            onPress={() => {
              if (item.route) {
                router.push(item.route as never);
              }
            }}
            style={({ pressed }) => [
              styles.slide,
              { width: slideWidth, transform: [{ scale: pressed ? 0.985 : 1 }] },
            ]}
            accessibilityRole={item.route ? 'button' : undefined}
          >
            <Img source={item.image} style={styles.image} />

            <LinearGradient
              colors={['rgba(25,27,33,0)', 'rgba(25,27,33,0.62)', 'rgba(25,27,33,0.96)'] as const}
              locations={[0.12, 0.48, 1] as const}
              style={styles.shade}
            />

            <View style={styles.textContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tr(item.tag)}</Text>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {tr(item.title)}
              </Text>

              <Text style={styles.subtitle} numberOfLines={1}>
                {tr(item.sub)}
              </Text>
            </View>

            {item.route ? (
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{t('home.discover')}</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={17}
                  color={colors.primary}
                />
              </View>
            ) : null}
          </Pressable>
        )}
      />

      {/* Indicateurs de position */}
      <View style={styles.dots}>
        {ads.map((item, i) => (
          <View
            key={item.id}
            style={[styles.dot, i === index && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: PADDING,
    gap: GAP,
  },

  slide: {
    height: 210,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    ...shadow.raised,
  },

  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.xl,
    paddingBottom: 56,
    gap: spacing.sm,
  },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },

  tagText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: font.extrabold,
    letterSpacing: 0.7,
  },

  title: {
    color: colors.white,
    fontSize: 21,
    lineHeight: 26,
    fontFamily: font.extrabold,
    paddingRight: spacing.xs,
  },

  subtitle: {
    color: colors.onDark,
    fontSize: 13,
  },

  cta: {
    position: 'absolute',
    left: spacing.xl,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    height: 40,
    borderRadius: radius.pill,
  },

  ctaText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: font.extrabold,
    letterSpacing: 0.3,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: spacing.md,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },

  activeDot: {
    width: 22,
    backgroundColor: colors.accent,
  },
});
