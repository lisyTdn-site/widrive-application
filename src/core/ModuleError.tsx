import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font } from '@/theme';
import { useI18n } from '@/i18n';

export function ModuleError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error('Erreur du module WIDRIVE :', error);
  }, [error]);

  return (
    <View style={s.container}>
      <View style={s.icon}>
        <Ionicons name="alert-circle-outline" size={45} color={colors.accent} />
      </View>

      <Text style={s.title}>{t('module.errorTitle')}</Text>

      <Text style={s.description}>
        {t('module.errorText')}
      </Text>

      <Pressable onPress={retry} style={s.retry}>
        <Text style={s.retryText}>{t('module.retry')}</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/')} style={s.back}>
        <Text style={s.backText}>{t('module.back')}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 15,
  },
  icon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontFamily: font.extrabold,
    color: colors.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  retry: {
    backgroundColor: colors.accent,
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 8,
  },
  retryText: {
    color: colors.white,
    fontFamily: font.extrabold,
  },
  back: {
    padding: 12,
  },
  backText: {
    color: colors.primary,
    fontFamily: font.bold,
  },
});
