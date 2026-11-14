import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { useI18n } from '@/i18n';

const assets = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: 'logo-bitcoin' as const,
    color: '#F7931A',
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'logo-electron' as const,
    color: '#627EEA',
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    icon: 'logo-usd' as const,
    color: '#26A17B',
  },
];

export default function Crypto() {
  const { t } = useI18n();
  return (
    <Screen title={t('cry.title')}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="logo-bitcoin" size={34} color="#FFFFFF" />
          </View>

          <Text style={s.heroTitle}>{t('crypto.hero')}</Text>

          <Text style={s.heroText}>
            {t('crypto.heroText')}
          </Text>

          <View style={s.badge}>
            <View style={s.dot} />
            <Text style={s.badgeText}>{t('crypto.badge')}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>{t('crypto.available')}</Text>

        {assets.map((asset) => (
          <View key={asset.symbol} style={s.asset}>
            <View style={[s.assetIcon, { backgroundColor: asset.color }]}>
              <Ionicons name={asset.icon} size={25} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={s.assetName}>{asset.name}</Text>
              <Text style={s.assetSymbol}>{asset.symbol}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </View>
        ))}

        <View style={s.notice}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.accent}
          />
          <Text style={s.noticeText}>
            {t('crypto.notice')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 40,
    gap: 16,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroText: {
    color: '#E1E3E6',
    fontSize: 14,
    lineHeight: 22,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF18',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8B65B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
  },
  asset: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  assetSymbol: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: colors.accentTint,
  },
  noticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 20,
  },
});
