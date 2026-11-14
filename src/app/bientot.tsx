import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
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
              color="#A83245"
            />
          </View>

          <View style={s.floatingIcon}>
            <Ionicons
              name="construct-outline"
              size={23}
              color="#A83245"
            />
          </View>

          <View style={s.floatingIconTwo}>
            <Ionicons
              name="sparkles-outline"
              size={21}
              color="#A83245"
            />
          </View>

        </View>

        <View style={s.textBlock}>

          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeText}>
              EN DÉVELOPPEMENT
            </Text>
          </View>

          <Text style={s.title}>
            Quelque chose se prépare !
          </Text>

          <Text style={s.description}>
            {t('soon.text')}
          </Text>

          <Text style={s.extra}>
            Nous travaillons pour vous proposer une expérience
            WIDRIVE toujours plus complète.
          </Text>

        </View>

        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Ionicons
              name="rocket-outline"
              size={19}
              color="#A83245"
            />

            <Text style={s.progressTitle}>
              Notre équipe y travaille
            </Text>
          </View>

          <View style={s.progressTrack}>
            <View style={s.progressFill} />
          </View>

          <Text style={s.progressCaption}>
            De nouveaux services arrivent progressivement.
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={s.button}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color="#FFFFFF"
          />

          <Text style={s.buttonText}>
            {t('soon.back')}
          </Text>
        </Pressable>

        <Text style={s.footer}>
          WIDRIVE AFRICA · VOTRE VISION, NOTRE MOUVEMENT.
        </Text>

      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F3F2',
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
    backgroundColor: '#F7EAED',
  },

  circleSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: '#F0DDE1',
  },

  mainIcon: {
    width: 105,
    height: 105,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F7EAED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#A83245',
  },

  badgeText: {
    color: '#A83245',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  title: {
    color: '#292D32',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },

  description: {
    color: '#555B63',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  extra: {
    color: '#747982',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 2,
  },

  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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
    color: '#292D32',
    fontSize: 12,
    fontWeight: '800',
  },

  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: '#F0EDEF',
    overflow: 'hidden',
  },

  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#A83245',
    borderRadius: 10,
  },

  progressCaption: {
    color: '#747982',
    fontSize: 10,
  },

  button: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#A83245',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  footer: {
    color: '#A0A4AA',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 25,
  },
});