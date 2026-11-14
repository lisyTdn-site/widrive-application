import { useEffect, useRef } from 'react';

import {
  Animated,
  Easing,
  Image,
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

import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n';
import { LangSwitch } from '@/components/LangSwitch';

const LOGO = require('@/assets/images/image.png');

export default function Welcome() {
  const { phone } = useAuth();
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganY = useRef(new Animated.Value(20)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(25)).current;
  const buttonPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          speed: 1,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),

        Animated.timing(sloganY, {
          toValue: 0,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),

      Animated.delay(300),

      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),

        Animated.spring(buttonY, {
          toValue: 0,
          speed: 1,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),

        Animated.timing(buttonPulse, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => {
      pulse.start();
    }, 4500);

    return () => {
      animation.stop();
      pulse.stop();
      clearTimeout(timer);
    };
  }, []);

  if (phone) {
    return <Redirect href={'/' as never} />;
  }

  const pulseScale = buttonPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ÉLÉMENTS DÉCORATIFS */}

      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <View pointerEvents="none" style={styles.decorCircle} />

      <SafeAreaView style={styles.safe}>

        {/* BARRE SUPÉRIEURE */}

        <View style={styles.topBar}>
          <View style={styles.languageContainer}>
            <LangSwitch dark />
          </View>
        </View>

        {/* CONTENU PRINCIPAL */}

        <View style={styles.content}>

          <Animated.View
            style={[
              styles.logoCard,
              {
                width: Math.min(width - 44, 400),
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={LOGO}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo WIDRIVE AFRICA"
            />
          </Animated.View>

          {/* IDENTITÉ */}

          <Animated.View
            style={[
              styles.sloganContainer,
              {
                opacity: sloganOpacity,
                transform: [{ translateY: sloganY }],
              },
            ]}
          >
            <Text style={styles.slogan}>
              {t('app.tagline').split('\n')[0]}
            </Text>

            <Text style={styles.sloganAccent}>
              {t('app.tagline').split('\n')[1]}
            </Text>
          </Animated.View>

          <Animated.Text
            style={[
              styles.subtitle,
              { opacity: subtitleOpacity },
            ]}
          >
            {t('app.taglineSub')}
          </Animated.Text>

          {/* INDICATEUR DÉCORATIF */}

          <View style={styles.indicator}>
            <View style={styles.indicatorActive} />
            <View style={styles.indicatorInactive} />
            <View style={styles.indicatorInactive} />
          </View>

          {/* BOUTON */}

          <Animated.View
            style={[
              styles.buttonWrap,
              {
                opacity: buttonOpacity,
                transform: [
                  { translateY: buttonY },
                  { scale: pulseScale },
                ],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login' as never)}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaText}>
                {t('welcome.continue')}
              </Text>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          </Animated.View>

          {/* MESSAGE DE CONFIANCE */}

          <View style={styles.trustRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#C5A3AA"
            />

            <Text style={styles.trustText}>
              Une expérience pensée pour vous
            </Text>
          </View>

        </View>

        {/* PIED DE PAGE */}

        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerText}>
            WIDRIVE AFRICA
          </Text>

          <View style={styles.footerLine} />
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#292D32',
    overflow: 'hidden',
  },

  safe: {
    flex: 1,
  },

  glowTop: {
    position: 'absolute',
    width: 390,
    height: 390,
    borderRadius: 195,
    top: -210,
    right: -130,
    backgroundColor: '#A83245',
    opacity: 0.22,
  },

  glowBottom: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    bottom: -190,
    left: -130,
    backgroundColor: '#A83245',
    opacity: 0.13,
  },

  decorCircle: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: '#666B72',
    right: -130,
    bottom: 90,
    opacity: 0.2,
  },

  topBar: {
    height: 58,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 19,
  },

  languageContainer: {
    backgroundColor: '#3B4047',
    borderRadius: 12,
    paddingHorizontal: 5,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 12,
  },

  logoCard: {
    height: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 14,
    justifyContent: 'center',
    marginBottom: 43,

    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 10,
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  sloganContainer: {
    alignItems: 'center',
  },

  slogan: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 39,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  sloganAccent: {
    color: '#D88A97',
    fontSize: 29,
    lineHeight: 39,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  subtitle: {
    color: '#D0D2D5',
    fontSize: 14,
    marginTop: 15,
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 27,
  },

  indicatorActive: {
    width: 24,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#A83245',
  },

  indicatorInactive: {
    width: 6,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#777D84',
  },

  buttonWrap: {
    width: '100%',
    maxWidth: 330,
    marginTop: 36,
  },

  cta: {
    minHeight: 61,
    borderRadius: 18,
    backgroundColor: '#A83245',
    paddingLeft: 25,
    paddingRight: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#A83245',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 7,
  },

  ctaPressed: {
    opacity: 0.85,
  },

  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  arrowCircle: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#C65B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 23,
  },

  trustText: {
    color: '#C5A3AA',
    fontSize: 11,
    letterSpacing: 0.2,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 17,
  },

  footerLine: {
    height: 1,
    width: 28,
    backgroundColor: '#777D84',
    opacity: 0.7,
  },

  footerText: {
    color: '#D0D2D5',
    fontSize: 9,
    letterSpacing: 2.8,
    fontWeight: '700',
  },

});
