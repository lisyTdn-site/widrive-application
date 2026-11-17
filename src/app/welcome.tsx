import { useEffect, useState } from 'react';

import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n';
import { LangSwitch } from '@/components/LangSwitch';
import { colors, font, radius, spacing } from '@/theme';

// Séquence de marque officielle (fournie par le client) : logotype « WDA »
// prolongé par une flèche, « WIDRIVE AFRICA » entre deux traits fins, puis
// le slogan. Le slogan est incrusté dans la vidéo : on recadre donc l'image
// sur le logotype et on affiche le slogan en texte, traduit (FR / EN).
const INTRO = require('@/assets/videos/intro.mp4');

type Player = ReturnType<typeof useVideoPlayer>;

// Le lecteur est un objet partagé dont on pilote l'état par mutation :
// on isole la mutation ici pour ne pas la faire dans le corps du composant.
function setPlayerMuted(player: Player, muted: boolean) {
  player.muted = muted;
}

// Repères du logotype dans la vidéo (1080 × 1920), mesurés sur l'image :
// logotype y 826–979, « WIDRIVE AFRICA » y 999–1031, slogan y 1044–1066.
const VIDEO_W = 1080;
const VIDEO_H = 1920;
const BAND_TOP = 794;
const BAND_BOTTOM = 1038;
const ZOOM = 1.2;
const MAX_FRAME = 760;

/**
 * Écran d'ouverture WIDRIVE.
 * Joue la séquence de marque cadrée sur le logotype, affiche le slogan dans
 * la langue choisie, puis révèle le bouton « CONTINUER ».
 */
export default function Welcome() {
  const { phone } = useAuth();
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  const [revealed, setRevealed] = useState(false);
  const [muted, setMuted] = useState(true);

  const player = useVideoPlayer(INTRO, (p) => {
    p.loop = false;
    // La lecture automatique n'est autorisée qu'en mode muet sur le web.
    p.muted = true;
  });

  const [ctaOpacity] = useState(() => new Animated.Value(0));
  const [ctaY] = useState(() => new Animated.Value(18));
  const [taglineOpacity] = useState(() => new Animated.Value(0));

  // Sur le web, la vue vidéo n'est attachée au lecteur qu'après le montage :
  // on lance donc la lecture depuis un effet, une fois le lecteur en place.
  useEffect(() => {
    player.play();
  }, [player]);

  useEventListener(player, 'playToEnd', () => setRevealed(true));

  // Le slogan apparaît immédiatement (léger fondu), sans attendre la fin de
  // la vidéo : l'écran n'a plus de temps mort avant le texte.
  useEffect(() => {
    const anim = Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 550,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    anim.start();

    return () => anim.stop();
  }, [taglineOpacity]);

  // Filet de sécurité : si la lecture automatique est bloquée par le
  // navigateur, on révèle le bouton après la durée de la vidéo.
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!revealed) return;

    const anim = Animated.parallel([
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(ctaY, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    anim.start();

    return () => anim.stop();
  }, [revealed, ctaOpacity, ctaY]);

  const toggleSound = () => {
    const next = !muted;
    setPlayerMuted(player, next);
    setMuted(next);
  };

  // Cadrage : on agrandit la vidéo pour que le logotype soit bien visible,
  // puis on ne montre que la bande qui le contient.
  const frameWidth = Math.min(width, MAX_FRAME);
  const videoWidth = frameWidth * ZOOM;
  const videoHeight = (videoWidth * VIDEO_H) / VIDEO_W;
  const frameHeight = (videoHeight * (BAND_BOTTOM - BAND_TOP)) / VIDEO_H;

  if (phone) {
    return <Redirect href={'/' as never} />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* BARRE HAUTE */}
        <View style={styles.topBar}>
          <Pressable
            onPress={toggleSound}
            style={({ pressed }) => [styles.sound, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={muted ? t('welcome.soundOn') : t('welcome.soundOff')}
          >
            <Ionicons
              name={muted ? 'volume-mute' : 'volume-high'}
              size={17}
              color={colors.primary}
            />
          </Pressable>

          <LangSwitch />
        </View>

        {/* SÉQUENCE VIDÉO + SLOGAN */}
        <View style={styles.center}>
          <View
            style={[styles.frame, { width: frameWidth, height: frameHeight }]}
          >
            <VideoView
              player={player}
              style={[
                styles.video,
                {
                  width: videoWidth,
                  height: videoHeight,
                  left: -(videoWidth - frameWidth) / 2,
                  top: -(videoHeight * BAND_TOP) / VIDEO_H,
                },
              ]}
              contentFit="contain"
              nativeControls={false}
              playsInline
              accessibilityLabel="WIDRIVE AFRICA"
            />
          </View>

          <Animated.View
            style={[styles.taglineRow, { opacity: taglineOpacity }]}
            pointerEvents="none"
          >
            <View style={styles.taglineRule} />

            <Text style={styles.taglineText}>{t('welcome.tagline')}</Text>

            <View style={styles.taglineRule} />
          </Animated.View>
        </View>

        {/* BOUTON */}
        <Animated.View
          style={[
            styles.bottom,
            {
              opacity: ctaOpacity,
              transform: [{ translateY: ctaY }],
            },
          ]}
          pointerEvents={revealed ? 'auto' : 'none'}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login' as never)}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>{t('welcome.continue')}</Text>

            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>

          <View style={styles.trustRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={colors.textMuted}
            />

            <Text style={styles.trustText}>{t('welcome.trust')}</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  safe: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  sound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },

  frame: {
    overflow: 'hidden',
    alignSelf: 'center',
  },

  video: {
    position: 'absolute',
  },

  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  taglineRule: {
    width: 22,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },

  taglineText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: font.semibold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  bottom: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },

  cta: {
    width: '100%',
    maxWidth: 330,
    minHeight: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  ctaPressed: {
    opacity: 0.85,
  },

  ctaText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: font.extrabold,
    letterSpacing: 0.8,
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  trustText: {
    color: colors.textMuted,
    fontSize: 11,
  },

  pressed: {
    opacity: 0.6,
  },
});
