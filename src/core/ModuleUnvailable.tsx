import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { useI18n } from '@/i18n';

type Props = {
  kind: 'soon' | 'maintenance';
  title?: string;
};

export function ModuleUnavailable({ kind, title }: Props) {
  const { t } = useI18n();
  const maintenance = kind === 'maintenance';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen title={title ?? 'WIDRIVE'}>
      <View style={s.container}>
        <View style={s.illustration}>
          <Ionicons
            name={maintenance ? 'construct-outline' : 'rocket-outline'}
            size={48}
            color={colors.accent}
          />
        </View>

        <Text style={s.title}>
          {maintenance ? t('module.maintenanceTitle') : t('module.soonTitle')}
        </Text>

        <Text style={s.description}>
          {maintenance ? t('module.maintenanceText') : t('module.soonText')}
        </Text>

        <Pressable onPress={goBack} style={s.button}>
          <Text style={s.buttonText}>{t('module.dashboard')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 16,
  },
  illustration: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
