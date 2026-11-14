import { useEffect, useRef, useState } from 'react';

import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import { ads, type Ad } from '@/data/ads';
import { Img } from '@/components/Img';
import { colors } from '@/theme/colors';
import { useI18n } from '@/i18n';

const GAP = 12;

export function AdCarousel() {
  const { tr } = useI18n();
  const { width } = useWindowDimensions();

  const slideWidth = width - 32;

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
            event.nativeEvent.contentOffset.x /
              (slideWidth + GAP),
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
            style={[
              styles.slide,
              { width: slideWidth },
            ]}
          >
            <Img
              source={item.image}
              style={styles.image}
            />

            <View style={styles.shade} />

            <View style={styles.textContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {tr(item.tag)}
                </Text>
              </View>

              <Text style={styles.title}>
                {tr(item.title)}
              </Text>

              <Text style={styles.subtitle}>
                {tr(item.sub)}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {/* Indicateurs de position */}
      <View style={styles.dots}>
        {ads.map((item, i) => (
          <View
            key={item.id}
            style={[
              styles.dot,
              i === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    gap: GAP,
  },

  slide: {
    height: 185,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.primary,

    elevation: 5,

    shadowColor: '#20232B',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
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
    backgroundColor: 'rgba(20, 23, 30, 0.56)',
  },

  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 19,
    gap: 6,
  },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },

  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  subtitle: {
    color: '#E4E2E3',
    fontSize: 13,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9CBCF',
  },

  activeDot: {
    width: 20,
    backgroundColor: colors.accent,
  },
});