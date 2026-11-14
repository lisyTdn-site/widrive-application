import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { useI18n, type Key } from '@/i18n';

const helpItems = [
  {
    icon: 'wallet-outline' as const,
    title: 'support.walletTitle',
    description: 'support.walletDesc',
  },
  {
    icon: 'car-outline' as const,
    title: 'support.vehicleTitle',
    description: 'support.vehicleDesc',
  },
  {
    icon: 'person-circle-outline' as const,
    title: 'support.accountTitle',
    description: 'support.accountDesc',
  },
  {
    icon: 'card-outline' as const,
    title: 'support.cardsTitle',
    description: 'support.cardsDesc',
  },
];

export default function Assistance() {
  const { t } = useI18n();
  const contact = () => {
    Alert.alert(
      t('support.alertTitle'),
      t('support.alertText'),
      [{ text: t('support.ok') }]
    );
  };

  return (
    <Screen title={t('support.title')}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="headset-outline" size={38} color="#FFFFFF" />
          </View>
          <Text style={s.heroTitle}>{t('support.heroTitle')}</Text>
          <Text style={s.heroText}>
            {t('support.heroText')}
          </Text>
        </View>

        <Text style={s.sectionTitle}>{t('support.center')}</Text>

        {helpItems.map((item) => (
          <View key={item.title} style={s.item}>
            <View style={s.itemIcon}>
              <Ionicons name={item.icon} size={23} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>{t(item.title as Key)}</Text>
              <Text style={s.itemDescription}>{t(item.description as Key)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        ))}

        <View style={s.contactCard}>
          <Text style={s.contactTitle}>{t('support.noAnswer')}</Text>
          <Text style={s.contactText}>
            {t('support.contactText')}
          </Text>

          <Pressable style={s.button} onPress={contact}>
            <Ionicons name="chatbubble-ellipses-outline" size={19} color="#FFFFFF" />
            <Text style={s.buttonText}>{t('support.contact')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 18,
    gap: 15,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: colors.primary,
    padding: 22,
    borderRadius: 24,
    gap: 12,
  },
  heroIcon: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroText: {
    color: '#E3E5E8',
    lineHeight: 22,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  itemDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
    marginTop: 8,
  },
  contactTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  contactText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 15,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
