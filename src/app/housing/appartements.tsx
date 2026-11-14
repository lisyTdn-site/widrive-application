import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Chips } from '@/components/Chips';
import { Img } from '@/components/Img';
import { Spec } from '@/components/Spec';
import { PaySheet } from '@/components/PaySheet';
import { apartments, SUPPORT_WHATSAPP, type Apartment } from '@/data/catalog';
import { money } from '@/lib/wallet';
import { useI18n, type Key } from '@/i18n';
import { colors } from '@/theme/colors';

const TYPES = ['all', 'studio', 'two', 'three', 'villa'] as const;
type TypeF = (typeof TYPES)[number];

export default function Appartements() {
  const { t, tr } = useI18n();
  const [type, setType] = useState<TypeF>('all');
  const [detail, setDetail] = useState<Apartment | null>(null);
  const [booking, setBooking] = useState<Apartment | null>(null);

  const list = apartments.filter((a) => type === 'all' || a.type === type);
  const typeLabel = (x: TypeF) => (x === 'all' ? t('common.all') : t(`apt.type.${x}` as Key));

  const visit = (a: Apartment) =>
    Linking.openURL(
      `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(t('apt.visitMsg', { title: tr(a.title), area: tr(a.area) }))}`
    );

  return (
    <Screen title={t('apt.title')}>
      <Chips items={TYPES} value={type} onChange={setType} label={typeLabel} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        {list.map((a) => (
          <Pressable key={a.id} onPress={() => setDetail(a)} style={s.card}>
            <Img source={a.image} style={s.img} />
            <View style={s.body}>
              <Text style={s.title}>{tr(a.title)}</Text>
              <View style={s.loc}>
                <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                <Text style={s.area}>{tr(a.area)}</Text>
              </View>
              <View style={s.specs}>
                <Spec icon="bed-outline" text={t('apt.beds', { n: a.beds })} />
                <Spec icon="water-outline" text={t('apt.baths', { n: a.baths })} />
                <Spec icon="resize-outline" text={`${a.size} m²`} />
              </View>
              <Text style={s.price}>{money(a.pricePerMonth)} <Text style={s.per}>{t('apt.perMonth')}</Text></Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        {detail && (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
              <Img source={detail.image} style={{ width: '100%', height: 280 }} />
              <Pressable onPress={() => setDetail(null)} style={s.close} accessibilityLabel={t('common.close')}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
              <View style={{ padding: 18, gap: 10 }}>
                <Text style={s.dTitle}>{tr(detail.title)}</Text>
                <Text style={s.area}>{tr(detail.area)}</Text>
                <View style={s.specs}>
                  <Spec icon="bed-outline" text={t('apt.bedsLong', { n: detail.beds })} />
                  <Spec icon="water-outline" text={t('apt.baths', { n: detail.baths })} />
                  <Spec icon="resize-outline" text={`${detail.size} m²`} />
                </View>
                <Text style={s.dText}>{tr(detail.description)}</Text>
                <View style={s.tags}>
                  {detail.features.map((f) => (
                    <View key={f} style={s.tag}><Text style={s.tagText}>{t(`feat.${f}` as Key)}</Text></View>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={s.bar}>
              <Text style={s.price}>{money(detail.pricePerMonth)} <Text style={s.per}>{t('apt.perMonth')}</Text></Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => visit(detail)} style={[s.btn, s.btnLight]}>
                  <Text style={[s.btnText, { color: colors.primary }]}>{t('apt.visit')}</Text>
                </Pressable>
                <Pressable onPress={() => { setBooking(detail); setDetail(null); }} style={s.btn}>
                  <Text style={s.btnText}>{t('apt.book')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Montant de réservation (1er mois) à confirmer avec le client */}
      <PaySheet
        visible={!!booking}
        title={booking ? t('apt.payTitle', { title: tr(booking.title) }) : ''}
        amount={booking?.pricePerMonth ?? 0}
        onClose={() => setBooking(null)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  img: { width: '100%', height: 190 },
  body: { padding: 14, gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  area: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  specs: { flexDirection: 'row', gap: 14 },
  price: { fontSize: 18, fontWeight: '800', color: colors.primary },
  per: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  close: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  dTitle: { fontSize: 24, fontWeight: '800', color: colors.primary },
  dText: { fontSize: 15, lineHeight: 22, color: colors.primary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  tagText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 16, paddingBottom: 30, gap: 10, borderTopWidth: 1, borderColor: colors.border },
  btn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  btnLight: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.border },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});