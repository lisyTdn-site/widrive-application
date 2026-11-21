import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useI18n, type Key } from '@/i18n';
import { submitVehicleListing } from '@/repositories/listingRepository';
import { colors, font } from '@/theme';

type Form = { brand: string; model: string; year: string; km: string; price: string; city: string; desc: string };
const EMPTY: Form = { brand: '', model: '', year: '', km: '', price: '', city: '', desc: '' };

export default function Vendre() {
  const { t } = useI18n();
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Key | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const digits = (v: string) => v.replace(/\D/g, '');

  const submit = async () => {
    const year = Number(f.year);
    const price = Number(f.price);
    if (!f.brand.trim() || !f.model.trim() || year < 1950 || year > new Date().getFullYear() + 1 || !(price > 0)) {
      setErr('sell.err.fields');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await submitVehicleListing({
      brand: f.brand.trim(),
      model: f.model.trim(),
      year,
      km: Number(f.km) || 0,
      price,
      city: f.city.trim(),
      description: f.desc.trim(),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setF(EMPTY);
    } else {
      setErr('sell.err.send');
    }
  };

  const field = (k: keyof Form, label: Key, opts?: { numeric?: boolean; multiline?: boolean }) => (
    <View style={s.field}>
      <Text style={s.label}>{t(label)}</Text>
      <TextInput
        style={[s.input, opts?.multiline && { height: 96, textAlignVertical: 'top' }]}
        value={f[k]}
        onChangeText={(v) => set(k)(opts?.numeric ? digits(v) : v)}
        keyboardType={opts?.numeric ? 'number-pad' : 'default'}
        multiline={opts?.multiline}
        maxLength={opts?.multiline ? 2000 : 80}
      />
    </View>
  );

  return (
    <Screen title={t('sell.title')}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {done ? (
          <View style={s.done}>
            <Text style={s.doneTitle}>{t('sell.doneTitle')}</Text>
            <Text style={s.intro}>{t('sell.doneSub')}</Text>
            <Pressable style={s.cta} onPress={() => setDone(false)}>
              <Text style={s.ctaText}>{t('sell.again')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={s.intro}>{t('sell.intro')}</Text>
            {field('brand', 'sell.brand')}
            {field('model', 'sell.model')}
            {field('year', 'sell.year', { numeric: true })}
            {field('km', 'sell.km', { numeric: true })}
            {field('price', 'sell.price', { numeric: true })}
            {field('city', 'sell.city')}
            {field('desc', 'sell.desc', { multiline: true })}
            {err ? <Text style={s.err}>{t(err)}</Text> : null}
            <Pressable style={[s.cta, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>
              <Text style={s.ctaText}>{t('sell.submit')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  intro: { fontSize: 14, fontFamily: font.regular, color: colors.textMuted },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: font.regular,
    color: colors.text,
  },
  err: { color: colors.accent, fontFamily: font.bold, fontSize: 13 },
  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  ctaText: { color: colors.white, fontFamily: font.extrabold, fontSize: 14, letterSpacing: 0.5 },
  done: { gap: 14, paddingTop: 30 },
  doneTitle: { fontSize: 22, fontFamily: font.extrabold, color: colors.primary },
});
