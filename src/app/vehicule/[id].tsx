import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Img } from '@/components/Img';
import { colors, font } from '@/theme';
import { vehicles, type VehicleStatus } from '@/data/vehicles';
import { useI18n, type Key } from '@/i18n';

const PHONE = '2290199003132';
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function VehiculeDetail() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = vehicles.find((x) => x.id === id);
  const [fav, setFav] = useState(false);
  const label = (key: string) => t(key as Key);
  const status = (value: VehicleStatus) => label(`vehicle.${value}`);
  if (!v) return <SafeAreaView style={s.screen}><Text style={s.notFound}>{t('vehicle.notFound')}</Text></SafeAreaView>;

  const title = `${v.brand} ${v.model} ${v.year}`;
  const specs: [string, string][] = [[t('vehicle.year'), String(v.year)], [t('vehicle.mileage'), `${fmt(v.km)} km`], [t('vehicle.fuel'), label(`vehicle.${v.fuel}`)], [t('vehicle.gearbox'), label(`vehicle.${v.gearbox}`)], [t('vehicle.drive'), label(`vehicle.${v.drive}`)], [t('vehicle.type'), label(`vehicle.${v.category}`)], [t('vehicle.location'), v.city]];
  const condition: [string, string][] = [[t('vehicle.engine'), label(`vehicle.${v.engine}`)], [t('vehicle.paint'), label(`vehicle.${v.paint}`)], [t('vehicle.interior'), label(`vehicle.${v.interior}`)], [t('vehicle.ac'), label(`vehicle.${v.ac}`)]];
  const shareMessage = `${title} · ${fmt(v.price)} FCFA sur WIDRIVE AFRICA`;

  return <SafeAreaView style={s.screen} edges={['top']}>
    <View style={s.header}><Pressable accessibilityLabel={t('vehicle.back')} onPress={() => router.back()} style={s.round}><Ionicons name="chevron-back" size={22} color={colors.primary} /></Pressable><View style={s.actions}><Pressable accessibilityLabel={t('vehicle.share')} onPress={() => Share.share({ message: shareMessage })} style={s.round}><Ionicons name="share-social-outline" size={20} color={colors.primary} /></Pressable><Pressable accessibilityLabel={fav ? t('vehicle.removeFavorite') : t('vehicle.favorite')} onPress={() => setFav(!fav)} style={s.round}><Ionicons name={fav ? 'heart' : 'heart-outline'} size={21} color={fav ? colors.accent : colors.primary} /></Pressable></View></View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.hero}><Img source={v.image} style={s.heroImage} /><View style={s.photoCount}><Text style={s.photoCountText}>1 / 4</Text></View></View>
      <View style={s.titleRow}><View style={{ flex: 1, gap: 5 }}><Text style={s.title}>{title}</Text><Text style={s.location}><Ionicons name="location-outline" size={15} color={colors.textMuted} /> {v.city} · {t('vehicle.verified')}</Text></View><View style={[s.badge, v.status !== 'available' && s.badgeOff]}><Text style={s.badgeText}>{status(v.status)}</Text></View></View>
      <Text style={s.price}>{fmt(v.price)} FCFA</Text><View style={s.rating}><Ionicons name="star" size={16} color={colors.gold} /><Text style={s.ratingText}>4,8</Text><Text style={s.muted}> · 12 {t('vehicle.reviews')}</Text></View>
      <Text style={s.section}>{t('vehicle.about')}</Text><Text style={s.text}>{t('vehicle.aboutText')}</Text>
      <Text style={s.section}>{t('vehicle.characteristics')}</Text><View style={s.box}>{specs.map(([k, val], i) => <View key={k} style={[s.row, i > 0 && s.rowLine]}><Text style={s.key}>{k}</Text><Text style={s.val}>{val}</Text></View>)}</View>
      <Text style={s.section}>{t('vehicle.condition')}</Text><View style={s.box}>{condition.map(([k, val], i) => <View key={k} style={[s.row, i > 0 && s.rowLine]}><Text style={s.key}>{k}</Text><Text style={s.val}>{val}</Text></View>)}</View>
      <Text style={s.section}>{t('vehicle.equipment')}</Text><View style={s.tags}>{v.equipment.map((x) => <View key={x} style={s.tag}><Ionicons name="checkmark-circle-outline" size={16} color={colors.success} /><Text style={s.tagText}>{label(`vehicle.equipment.${x}`)}</Text></View>)}</View>
      <Text style={s.section}>{t('vehicle.documents')}</Text><Text style={s.text}>{t(v.documentKey)}</Text>
    </ScrollView>
    <View style={s.footer}><Pressable onPress={() => Linking.openURL(`tel:+${PHONE}`)} style={[s.btn, s.btnOutline]}><Ionicons name="call-outline" size={19} color={colors.primary} /><Text style={[s.btnText, { color: colors.primary }]}>{t('vehicle.call')}</Text></Pressable><Pressable onPress={() => Linking.openURL(`https://wa.me/${PHONE}?text=${encodeURIComponent(`${t('vehicle.reserve')}: ${title}`)}`)} style={[s.btn, s.btnPrimary]}><Ionicons name="logo-whatsapp" size={19} color={colors.white} /><Text style={s.btnText}>{t('vehicle.reserve')}</Text></Pressable></View>
  </SafeAreaView>;
}

const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, notFound: { padding: 24, fontSize: 16, color: colors.primary }, header: { height: 68, paddingHorizontal: 18, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actions: { flexDirection: 'row', gap: 9 }, round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, content: { padding: 18, gap: 8, paddingBottom: 120 }, hero: { height: 248, borderRadius: 22, overflow: 'hidden', marginBottom: 8 }, heroImage: { width: '100%', height: '100%' }, photoCount: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#00000080' }, photoCountText: { color: colors.white, fontSize: 12, fontFamily: font.extrabold }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, title: { fontSize: 24, lineHeight: 29, fontFamily: font.extrabold, color: colors.primary }, location: { fontSize: 14, color: colors.textMuted }, badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.success }, badgeOff: { backgroundColor: colors.primary }, badgeText: { color: colors.white, fontSize: 12, fontFamily: font.extrabold }, price: { fontSize: 22, fontFamily: font.extrabold, color: colors.accent, marginTop: 2 }, rating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 }, ratingText: { fontFamily: font.extrabold, color: colors.primary, marginLeft: 4 }, muted: { color: colors.textMuted }, section: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary, marginTop: 16, marginBottom: 2 }, text: { fontSize: 14, lineHeight: 21, color: colors.primary }, box: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, row: { flexDirection: 'row', justifyContent: 'space-between', padding: 13 }, rowLine: { borderTopWidth: 1, borderTopColor: colors.border }, key: { fontSize: 14, color: colors.textMuted }, val: { fontSize: 14, fontFamily: font.bold, color: colors.primary }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, tagText: { fontSize: 13, color: colors.primary, fontFamily: font.bold }, footer: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 26, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }, btn: { flex: 1, height: 52, borderRadius: 26, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, btnOutline: { borderWidth: 2, borderColor: colors.border }, btnPrimary: { backgroundColor: colors.accent }, btnText: { color: colors.white, fontSize: 15, fontFamily: font.extrabold } });
