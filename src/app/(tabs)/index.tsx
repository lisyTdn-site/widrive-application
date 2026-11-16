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

import { colors, font } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n';
import { modules } from '@/core/modules';
import { AdCarousel } from '@/components/AdCarousel';
import { money, useWallet } from '@/lib/wallet';

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { balance } = useWallet();

  const { width } = useWindowDimensions();

  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState('');

  const gap = 12;
  const padding = 18;
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
        kind:
          module.status === 'maintenance'
            ? 'maintenance'
            : 'soon',
      },
    } as never);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >

        {/* EN-TÊTE */}

        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <Image
                source={require('@/assets/images/logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />

              <View>
                <Text style={styles.brandName}>WIDRIVE</Text>
                <Text style={styles.brandSub}>AFRICA</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notification,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/notifications' as never)
              }
              accessibilityRole="button"
              accessibilityLabel={t('notifications.title')}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={23}
                color={colors.white}
              />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <Text style={styles.welcome}>
            {t('home.welcomeName', { name: user?.firstName || t('home.welcomeDefault') })}
          </Text>

          <Text style={styles.intro}>
            {t('home.intro')}
          </Text>

          {/* PORTEFEUILLE */}

          <View style={styles.wallet}>
            <View style={styles.walletTop}>
              <View style={styles.walletLabel}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={20}
                  color={colors.accentSoft}
                />

                <Text style={styles.walletLabelText}>
                  {t('home.wallet')}
                </Text>
              </View>

              <Pressable
                onPress={() => setHidden(!hidden)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('home.toggleBalance')}
              >
                <MaterialCommunityIcons
                  name={
                    hidden
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={22}
                  color={colors.white}
                />
              </Pressable>
            </View>

            <Text style={styles.balance}>
              {hidden ? '••••••••' : money(balance)}
            </Text>

            <Text style={styles.available}>
                  {t('home.available')}
            </Text>

            <View style={styles.walletDivider} />

            <View style={styles.walletActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.walletAction,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push('/transfer?mode=dep' as never)
                }
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={21}
                  color={colors.white}
                />
                <Text style={styles.actionText}>{t('home.deposit')}</Text>
              </Pressable>

              <View style={styles.verticalDivider} />

              <Pressable
                style={({ pressed }) => [
                  styles.walletAction,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push('/transfer?mode=ret' as never)
                }
              >
                <MaterialCommunityIcons
                  name="arrow-up-circle-outline"
                  size={21}
                  color={colors.white}
                />
                <Text style={styles.actionText}>{t('home.withdraw')}</Text>
              </Pressable>

              <View style={styles.verticalDivider} />

              <Pressable
                style={({ pressed }) => [
                  styles.walletAction,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push('/wallet' as never)
                }
              >
                <MaterialCommunityIcons
                  name="arrow-right-circle-outline"
                  size={21}
                  color={colors.white}
                />
                <Text style={styles.actionText}>{t('home.details')}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* RECHERCHE */}

        <View style={styles.search}>
          <MaterialCommunityIcons
            name="magnify"
            size={23}
            color={colors.textMuted}
          />

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
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* OFFRES */}

        {!query.trim() && (
          <View style={styles.offers}>
            <View style={styles.heading}>
              <View>
                <Text style={styles.headingTitle}>
                  {t('home.featured')}
                </Text>
                <Text style={styles.headingSub}>
                  {t('home.featuredSub')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="star-four-points"
                size={22}
                color={colors.gold}
              />
            </View>

            <AdCarousel />
          </View>
        )}

        {/* SERVICES */}

        <View style={styles.services}>
          <View style={styles.heading}>
            <View>
              <Text style={styles.headingTitle}>
                {t('home.services')}
              </Text>
              <Text style={styles.headingSub}>
                {t('home.servicesSub')}
              </Text>
            </View>

            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {String(list.length).padStart(2, '0')}
              </Text>
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
                    {
                      width: tileWidth,
                      transform: [
                        { scale: pressed ? 0.97 : 1 },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      disabled && styles.iconDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={module.icon}
                      size={31}
                      color={
                        disabled
                          ? colors.textMuted
                          : colors.accent
                      }
                    />
                  </View>

                  <Text
                    style={styles.serviceTitle}
                    numberOfLines={2}
                  >
                    {t(module.title)}
                  </Text>

                  {disabled ? (
                    <Text style={styles.soon}>{t('home.soonUpper')}</Text>
                  ) : (
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={16}
                      color={colors.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SIGNATURE */}

        <View style={styles.signature}>
          <View style={styles.signatureLine} />

          <Text style={styles.signatureText}>
            WIDRIVE AFRICA
          </Text>

          <Text style={styles.signatureSub}>
            {t('home.moveSmart')}
          </Text>
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

  content: {
    paddingBottom: 35,
  },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 27,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },

  brandName: {
    color: colors.white,
    fontSize: 17,
    fontFamily: font.extrabold,
    letterSpacing: 2,
  },

  brandSub: {
    color: colors.accentSoft,
    fontSize: 10,
    fontFamily: font.extrabold,
    letterSpacing: 4,
    marginTop: 3,
  },

  notification: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.darkSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  welcome: {
    color: colors.white,
    fontSize: 24,
    fontFamily: font.extrabold,
  },

  intro: {
    color: colors.onDarkMuted,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 21,
  },

  wallet: {
    backgroundColor: colors.darkSurface,
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },

  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  walletLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  walletLabelText: {
    color: colors.accentSoft,
    fontSize: 13,
    fontFamily: font.bold,
  },

  balance: {
    color: colors.white,
    fontSize: 30,
    fontFamily: font.extrabold,
    marginTop: 17,
  },

  available: {
    color: colors.onDarkMuted,
    fontSize: 12,
    marginTop: 5,
  },

  walletDivider: {
    height: 1,
    backgroundColor: colors.darkBorder,
    marginVertical: 17,
  },

  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  walletAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  actionText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: font.extrabold,
  },

  verticalDivider: {
    height: 23,
    width: 1,
    backgroundColor: colors.darkBorder,
  },

  search: {
    height: 55,
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },

  offers: {
    marginBottom: 26,
  },

  heading: {
    marginHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headingTitle: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: font.extrabold,
  },

  headingSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
  },

  services: {
    marginTop: 5,
  },

  counter: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterText: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: font.extrabold,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 18,
  },

  serviceCard: {
    minHeight: 142,
    backgroundColor: colors.surface,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.045,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
  },

  iconBox: {
    width: 61,
    height: 61,
    borderRadius: 20,
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
    lineHeight: 17,
    minHeight: 34,
  },

  soon: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: font.extrabold,
    letterSpacing: 0.6,
  },

  signature: {
    alignItems: 'center',
    marginTop: 34,
  },

  signatureLine: {
    width: 45,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginBottom: 12,
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
    marginTop: 5,
  },

  pressed: {
    opacity: 0.7,
  },
});
