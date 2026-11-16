import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors, font } from '@/theme';
import { useI18n } from '@/i18n';

export default function Bientot() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const { t } = useI18n();

  return (
    <Screen title={title ?? ''}>
      <View style={s.page}>

        <View style={s.illustration}>

          <View style={s.circleLarge} />
          <View style={s.circleSmall} />

          <View style={s.mainIcon}>
            <Ionicons
              name="rocket-outline"
              size={64}
              color={colors.accent}
            />
          </View>

          <View style={s.floatingIcon}>
            <Ionicons
              name="construct-outline"
              size={23}
              color={colors.accent}
            />
          </View>

          <View style={s.floatingIconTwo}>
            <Ionicons
              name="sparkles-outline"
              size={21}
              color={colors.accent}
            />
          </View>

        </View>

        <View style={s.textBlock}>

          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeText}>
              {t('soon.badge')}
            </Text>
          </View>

          <Text style={s.title}>
            {t('soon.headline')}
          </Text>

          <Text style={s.description}>
            {t('soon.text')}
          </Text>

          <Text style={s.extra}>
            {t('soon.extra')}
          </Text>

        </View>

        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Ionicons
              name="rocket-outline"
              size={19}
              color={colors.accent}
            />

            <Text style={s.progressTitle}>
              {t('soon.progressTitle')}
            </Text>
          </View>

          <View style={s.progressTrack}>
            <View style={s.progressFill} />
          </View>

          <Text style={s.progressCaption}>
            {t('soon.progressCaption')}
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={s.button}
          accessibilityRole="button"
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={colors.white}
          />

          <Text style={s.buttonText}>
            {t('soon.back')}
          </Text>
        </Pressable>

        <Text style={s.footer}>
          {t('soon.footer')}
        </Text>

      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  illustration: {
    width: 205,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  circleLarge: {
    position: 'absolute',
    width: 175,
    height: 175,
    borderRadius: 90,
    backgroundColor: colors.accentTint,
  },

  circleSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: colors.accentTint,
  },

  mainIcon: {
    width: 105,
    height: 105,
    borderRadius: 34,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  floatingIcon: {
    position: 'absolute',
    top: 15,
    right: 10,
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingIconTwo: {
    position: 'absolute',
    bottom: 15,
    left: 8,
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: {
    alignItems: 'center',
    gap: 12,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.accentTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },

  badgeText: {
    color: colors.accent,
    fontSize: 9,
    fontFamily: font.extrabold,
    letterSpacing: 1,
  },

  title: {
    color: colors.primary,
    fontSize: 23,
    fontFamily: font.extrabold,
    textAlign: 'center',
  },

  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  extra: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 2,
  },

  progressCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 16,
    marginTop: 25,
    gap: 12,
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  progressTitle: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: font.extrabold,
  },

  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },

  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 10,
  },

  progressCaption: {
    color: colors.textMuted,
    fontSize: 10,
  },

  button: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
  },

  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: font.extrabold,
  },

  footer: {
    color: colors.textMuted,
    fontSize: 8,
    fontFamily: font.extrabold,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 25,
  },
});