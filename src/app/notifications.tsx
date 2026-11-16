import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { colors, font } from '@/theme';
import { useI18n } from '@/i18n';

export default function Notifications() {
  const { t } = useI18n();
  return (
    <Screen title={t('notifications.title')}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.top}>
          <View style={s.icon}>
            <Ionicons name="notifications-outline" size={34} color={colors.accent} />
          </View>
          <Text style={s.title}>{t('notifications.hero')}</Text>
          <Text style={s.description}>
            {t('notifications.description')}
          </Text>
        </View>

        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="mail-open-outline" size={42} color={colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>{t('notifications.emptyTitle')}</Text>
          <Text style={s.emptyText}>
            {t('notifications.emptyText')}
          </Text>
        </View>

        <View style={s.info}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={s.infoText}>
            {t('notifications.info')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    gap: 20,
  },
  top: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
  },
  icon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 23,
    fontFamily: font.extrabold,
    color: colors.primary,
  },
  description: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
    fontSize: 14,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: font.extrabold,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 21,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.successTint,
    padding: 14,
    borderRadius: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: colors.primary,
  },
});
