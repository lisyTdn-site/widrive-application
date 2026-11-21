import { useState } from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, font, radius, spacing } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n';
import { modules } from '@/core/modules';
import { CALAVI } from '@/data/zones';
import { AdCarousel } from '@/components/AdCarousel';
import { money, useWallet } from '@/lib/wallet';

export default function Home() {
  const { user } = useAuth();
  const { t, tr } = useI18n();
  const { balance } = useWallet();

  const { width } = useWindowDimensions();

  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState('');

  const gap = spacing.md;
  const padding = spacing.lg;
  const tileWidth = (width - padding * 2 - gap * 2) / 3;

  const list = modules.filter(
    (module) =>
      module.status !== 'hidden' &&
      `${t(module.title)} ${t(module.sub)}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  const openModule = (module: (typeof modules)[number]) => {
    if (module.status === 'active' && module.route) {
      router.push(module.route as never);
      return;
    }

    router.push({
      pathname: '/bientot',
      params: {
        title: `${t(module.title)} ${t(module.sub)}`,
        kind: module.status === 'maintenance' ? 'maintenance' : 'soon',
      },
    } as never);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* EN-TÊTE */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <View style={styles.logoPill}>
                <Image
                  source={require('@/assets/images/logo.jpg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View>
                <Text style={styles.brandName}>WIDRIVE</Text>
                <Text style={styles.brandSub}>AFRICA</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.notification, pressed && styles.pressed]}
              onPress={() => router.push('/notifications' as never)}
              accessibilityRole="button"
              accessibilityLabel={t('notifications.title')}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <Text style={styles.welcome}>
            {t('home.welcomeName', { name: user?.firstName || t('home.welcomeDefault') })}
          </Text>

          <Text style={styles.intro}>{t('home.intro')}</Text>
        </View>

        {/* PORTEFEUILLE */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabel}>
              <MaterialCommunityIcons name="wallet-outline" size={17} color={colors.accent} />
              <Text style={styles.cardLabelText}>{t('home.wallet')}</Text>
            </View>

            <Pressable
              onPress={() => setHidden(!hidden)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('home.toggleBalance')}
            >
              <MaterialCommunityIcons
                name={hidden ? 'eye-off-outline' : 'eye-outline'}
                size={21}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <Text style={styles.balance}>{hidden ? '••••••••' : money(balance)}</Text>
          <Text style={styles.available}>{t('home.available')}</Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              onPress={() => router.push('/transfer?mode=dep' as never)}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={19} color={colors.white} />
              <Text style={styles.actionText}>{t('home.deposit')}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              onPress={() => router.push('/transfer?mode=ret' as never)}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="arrow-up-circle-outline" size={19} color={colors.white} />
              <Text style={styles.actionText}>{t('home.withdraw')}</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
            onPress={() => router.push('/wallet' as never)}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="chart-line" size={17} color={colors.accent} />
            <Text style={styles.ghostText}>{t('home.details')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* RECHERCHE */}
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={21} color={colors.textMuted} />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('home.search')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />

          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel={t('common.clear')}
            >
              <MaterialCommunityIcons name="close-circle" size={19} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* OFFRES */}
        {!query.trim() && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.section}>{t('home.featured')}</Text>
              <Text style={styles.sectionSub}>{t('home.featuredSub')}</Text>
            </View>

            <AdCarousel />
          </>
        )}

        {/* SERVICES — en priorité : visibles sans défilement */}
        <View style={styles.sectionHead}>
          <Text style={styles.section}>{t('home.services')}</Text>
          <Text style={styles.sectionSub}>{t('home.servicesSub')}</Text>
          <View style={styles.zonePill}>
            <MaterialCommunityIcons name="map-marker-radius" size={13} color={colors.accent} />
            <Text style={styles.zonePillText}>{t('zone.servicesHere', { zone: tr(CALAVI.name) })}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {list.map((module) => {
            const disabled = module.status !== 'active';

            return (
              <Pressable
                key={module.id}
                onPress={() => openModule(module)}
                style={({ pressed }) => [
                  styles.serviceCard,
                  { width: tileWidth, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <View style={[styles.iconBox, disabled && styles.iconDisabled]}>
                  <MaterialCommunityIcons
                    name={module.icon}
                    size={26}
                    color={disabled ? colors.textMuted : colors.accent}
                  />
                </View>

                <Text style={styles.serviceTitle} numberOfLines={2}>
                  {t(module.title)}
                </Text>

                {disabled ? (
                  <Text style={styles.soon}>{t('home.soonUpper')}</Text>
                ) : (
                  <MaterialCommunityIcons name="arrow-right" size={15} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* SIGNATURE */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />

          <Text style={styles.signatureText}>WIDRIVE AFRICA</Text>

          <Text style={styles.signatureSub}>{t('home.moveSmart')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  body: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: spacing.xxxl,
  },

  // --- En-tête (même traitement que Portefeuille / Profil) ---
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  logoPill: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  brandName: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: font.extrabold,
    letterSpacing: 2,
  },

  brandSub: {
    color: colors.accent,
    fontSize: 10,
    fontFamily: font.extrabold,
    letterSpacing: 3.5,
    marginTop: 2,
  },

  notification: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  welcome: {
    color: colors.primary,
    fontSize: 22,
    fontFamily: font.extrabold,
  },

  intro: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },

  // --- Carte portefeuille (carte blanche standard) ---
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  cardLabelText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  balance: {
    color: colors.primary,
    fontSize: 30,
    fontFamily: font.extrabold,
    marginTop: spacing.md,
  },

  available: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  action: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  actionText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: font.extrabold,
  },

  ghost: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  ghostText: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontFamily: font.bold,
  },

  // --- Recherche ---
  search: {
    height: 52,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },

  // --- Titres de section (même style que Profil) ---
  sectionHead: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },

  section: {
    fontSize: 14,
    fontFamily: font.extrabold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  sectionSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.accentTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },

  zonePillText: {
    fontSize: 12,
    fontFamily: font.extrabold,
    color: colors.accent,
  },

  // --- Grille de services ---
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },

  serviceCard: {
    minHeight: 132,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconDisabled: {
    backgroundColor: colors.surfaceAlt,
  },

  serviceTitle: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: font.extrabold,
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 32,
  },

  soon: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: font.extrabold,
    letterSpacing: 0.6,
  },

  // --- Signature ---
  signature: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },

  signatureLine: {
    width: 45,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },

  signatureText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: font.extrabold,
    letterSpacing: 3,
  },

  signatureSub: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: font.bold,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },

  pressed: {
    opacity: 0.75,
  },
});
