import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Img } from '@/components/Img';
import { ZoneMap } from '@/components/ZoneMap';
import { colors, font } from '@/theme';
import { type VehicleCategory, type VehicleStatus } from '@/data/vehicles';
import { useVehicles } from '@/lib/vehicleListings';
import { CALAVI } from '@/data/zones';
import { useI18n, type Key } from '@/i18n';

const filters: ('all' | VehicleCategory)[] = ['all', 'sedan', 'suv', 'pickup'];
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function Vehicules() {
  const { t, tr } = useI18n();
  const { data: vehicles, loading, error, retry } = useVehicles();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | VehicleCategory>('all');
  const q = query.trim().toLowerCase();
  const list = vehicles.filter((v) => filter === 'all' || v.category === filter).filter((v) => !q || `${v.brand} ${v.model} ${v.city} ${v.year}`.toLowerCase().includes(q));
  const label = (key: string) => t(key as Key);
  const status = (value: VehicleStatus) => label(`vehicle.${value}`);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('vehicle.back')} onPress={() => router.back()} style={s.round}><Ionicons name="chevron-back" size={22} color={colors.primary} /></Pressable>
        <View style={s.headerText}><Text style={s.eyebrow}>{t('vehicle.market')}</Text><Text style={s.title}>{t('vehicle.buyTitle')}</Text></View>
        <Pressable accessibilityLabel={t('vehicle.favorite')} style={s.round}><Ionicons name="heart-outline" size={21} color={colors.primary} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.intro}><Text style={s.heading}>{t('vehicle.findTitle')}</Text><Text style={s.subheading}>{t('vehicle.findSub')}</Text></View>
        <View style={s.search}><Ionicons name="search-outline" size={20} color={colors.textMuted} /><TextInput value={query} onChangeText={setQuery} placeholder={t('vehicle.search')} placeholderTextColor={colors.textMuted} style={s.searchInput} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{filters.map((f) => <Pressable key={f} onPress={() => setFilter(f)} style={[s.chip, filter === f && s.chipOn]}><Text style={[s.chipText, filter === f && s.chipTextOn]}>{f === 'all' ? t('common.all') : label(`vehicle.${f}`)}</Text></Pressable>)}</ScrollView>
        <ZoneMap flush points={list.map((v) => ({ lat: v.lat, lng: v.lng, label: `${v.brand} ${v.model}` }))} title={t('zone.vehiclesTitle', { zone: tr(CALAVI.name) })} height={190} />
        {loading && <ActivityIndicator color={colors.accent} style={s.loader} accessibilityLabel={t('vehicle.loading')} />}
        {error && <View style={s.errorBox}><Text style={s.empty}>{t('vehicle.loadError')}</Text><Pressable accessibilityRole="button" onPress={retry} style={s.retry}><Text style={s.retryText}>{t('vehicle.retry')}</Text></Pressable></View>}
        {!loading && !error && list.length === 0 && <Text style={s.empty}>{t('vehicle.empty')}</Text>}
        {list.map((v) => <Pressable key={v.id} onPress={() => router.push(`/vehicule/${v.id}` as never)} style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}><View><Img source={v.image} style={s.photo} /><View style={[s.badge, v.status !== 'available' && s.badgeOff]}><Text style={s.badgeText}>{status(v.status)}</Text></View><View style={s.heart}><Ionicons name="heart-outline" size={20} color={colors.primary} /></View><View style={s.counter}><Text style={s.counterText}>1 / {v.photos?.length || 1}</Text></View></View><View style={s.info}><View style={s.row}><Text style={s.name}>{v.brand} {v.model}</Text><Text style={s.city}>{v.city}</Text></View><Text style={s.meta}>{v.year} · {v.km > 0 ? `${fmt(v.km)} km · ` : ''}{label(`vehicle.${v.fuel}`)} · {label(`vehicle.${v.gearbox}`)}</Text><View style={s.bottom}><Text style={s.price}>{fmt(v.price)} FCFA</Text><Text style={s.detail}>{t('vehicle.detail')} <Ionicons name="arrow-forward" size={14} color={colors.accent} /></Text></View></View></Pressable>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  loader: { marginTop: 20 }, errorBox: { alignItems: 'center', gap: 12 }, retry: { height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, retryText: { color: colors.white, fontSize: 14, fontFamily: font.extrabold },
  screen: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, headerText: { flex: 1 }, eyebrow: { fontSize: 10, letterSpacing: 1.5, fontFamily: font.extrabold, color: colors.accent }, title: { fontSize: 19, fontFamily: font.extrabold, color: colors.primary, marginTop: 2 }, round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, content: { padding: 18, gap: 14, paddingBottom: 34 }, intro: { gap: 4 }, heading: { fontSize: 22, lineHeight: 28, fontFamily: font.extrabold, color: colors.primary }, subheading: { color: colors.textMuted, fontSize: 14 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, searchInput: { flex: 1, fontSize: 15, color: colors.primary }, filters: { gap: 8 }, chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, chipOn: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { fontSize: 14, fontFamily: font.bold, color: colors.primary }, chipTextOn: { color: colors.white }, empty: { textAlign: 'center', color: colors.textMuted, marginTop: 20 }, card: { borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, photo: { width: '100%', height: 194 }, badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.success }, badgeOff: { backgroundColor: colors.primary }, badgeText: { color: colors.white, fontSize: 12, fontFamily: font.extrabold }, heart: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' }, counter: { position: 'absolute', right: 12, bottom: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#00000080' }, counterText: { color: colors.white, fontSize: 11, fontFamily: font.bold }, info: { padding: 14, gap: 6 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, name: { flex: 1, fontSize: 18, fontFamily: font.extrabold, color: colors.primary }, city: { fontSize: 13, color: colors.textMuted }, meta: { fontSize: 13, color: colors.textMuted }, bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }, price: { fontSize: 17, fontFamily: font.extrabold, color: colors.accent }, detail: { fontSize: 13, fontFamily: font.extrabold, color: colors.accent },
});
