import type { ReactNode } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, font } from '@/theme';
import { useI18n } from '@/i18n';

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as never))}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <MaterialCommunityIcons name="arrow-left" size={21} color={colors.primary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, color: colors.primary, fontSize: 19, fontFamily: font.extrabold },
  headerSpacer: { width: 42 },
  body: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.6 },
});
