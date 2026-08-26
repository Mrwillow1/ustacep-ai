import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, PrimaryButton, SectionTitle, StatusPill } from '@/components/AppUI';
import { formatCurrency, useQuotes } from '@/context/QuoteContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { quotes, hydrated } = useQuotes();
  const currentMonth = new Date().getMonth();
  const monthQuotes = quotes.filter((quote) => new Date(quote.createdAt).getMonth() === currentMonth);
  const pending = quotes.filter((quote) => quote.status === 'Gönderildi').length;
  const approved = quotes.filter((quote) => quote.status === 'Onaylandı').length;
  const revenue = monthQuotes.reduce((sum, quote) => sum + quote.total, 0);
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 10, paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><BrandMark /><Pressable testID="button-notifications" style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="bell" size={20} color={colors.foreground} /><View style={[styles.dot, { backgroundColor: colors.accent }]} /></Pressable></View>
        <View style={styles.greeting}><Text style={[styles.eyebrow, { color: colors.primary }]}>ÇARŞAMBA, 26 AĞUSTOS</Text><Text style={[styles.title, { color: colors.foreground }]}>İşlerinizi kolaylaştırın.</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Bugün kaç teklif hazırlayalım?</Text></View>
        <PrimaryButton label="Yeni Teklif Oluştur" icon="plus" onPress={() => router.push('/new-offer')} />
        <View style={styles.statsGrid}>
          <Stat label="Bu ay teklif" value={String(monthQuotes.length)} icon="file-text" tint={colors.primary} />
          <Stat label="Bekleyen" value={String(pending)} icon="clock" tint="#D9822B" />
          <Stat label="Onaylanan" value={String(approved)} icon="check-circle" tint="#29966A" />
          <Stat label="Tahmini ciro" value={formatCurrency(revenue)} icon="trending-up" tint="#7B61C9" small />
        </View>
        <SectionTitle title="Son teklifler" action="Tümünü gör" onAction={() => router.push('/offers')} />
        {hydrated && quotes.length === 0 ? <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="file-plus" size={24} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>İlk teklifinizi oluşturun</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Bir iş fotoğrafı ekleyin, detayları birlikte hesaplayalım.</Text></View> : quotes.slice(0, 3).map((quote) => <Pressable key={quote.id} onPress={() => router.push({ pathname: '/preview', params: { id: quote.id } })} style={[styles.quoteRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.quoteIcon, { backgroundColor: colors.secondary }]}><Feather name="briefcase" size={18} color={colors.primary} /></View><View style={styles.quoteMain}><Text numberOfLines={1} style={[styles.quoteTitle, { color: colors.foreground }]}>{quote.title}</Text><Text style={[styles.quoteCustomer, { color: colors.mutedForeground }]}>{quote.customerName} · {quote.number}</Text></View><View style={styles.quoteRight}><StatusPill status={quote.status} /><Text style={[styles.quotePrice, { color: colors.foreground }]}>{formatCurrency(quote.total)}</Text></View></Pressable>)}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, icon, tint, small }: { label: string; value: string; icon: keyof typeof Feather.glyphMap; tint: string; small?: boolean }) {
  const colors = useColors();
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.statIcon, { backgroundColor: `${tint}18` }]}><Feather name={icon} size={17} color={tint} /></View><Text style={[styles.statValue, { color: colors.foreground, fontSize: small ? 17 : 25 }]} numberOfLines={1}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dot: { width: 7, height: 7, borderRadius: 6, position: 'absolute', top: 8, right: 9 },
  greeting: { gap: 5 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48.5%', minHeight: 116, borderRadius: 17, borderWidth: 1, padding: 14, gap: 5 },
  statIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  statValue: { fontWeight: '700', letterSpacing: -0.4 },
  statLabel: { fontSize: 12 },
  empty: { borderWidth: 1, borderRadius: 18, padding: 22, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  quoteRow: { minHeight: 76, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quoteIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quoteMain: { flex: 1, gap: 4 },
  quoteTitle: { fontSize: 14, fontWeight: '700' },
  quoteCustomer: { fontSize: 11 },
  quoteRight: { alignItems: 'flex-end', gap: 7 },
  quotePrice: { fontSize: 13, fontWeight: '700' },
});