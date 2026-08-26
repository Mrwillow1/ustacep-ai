import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function BrandMark({ small = false }: { small?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.brand}>
      <View style={[styles.brandIcon, small && styles.brandIconSmall, { backgroundColor: colors.primary }]}>
        <Feather name="tool" size={small ? 16 : 20} color={colors.primaryForeground} />
        <View style={styles.spark}><Feather name="star" size={small ? 7 : 9} color={colors.accent} /></View>
      </View>
      {!small && <Text style={[styles.brandText, { color: colors.foreground }]}>Usta<Text style={{ color: colors.primary }}>Cep</Text> <Text style={styles.ai}>AI</Text></Text>}
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon, disabled = false, secondary = false }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; disabled?: boolean; secondary?: boolean }) {
  const colors = useColors();
  return (
    <Pressable testID={`button-${label}`} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? colors.secondary : colors.primary, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }]}>
      {icon && <Feather name={icon} size={18} color={secondary ? colors.primary : colors.primaryForeground} />}
      <Text style={[styles.buttonText, { color: secondary ? colors.primary : colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostButton, { opacity: pressed ? 0.6 : 1 }]}>{icon && <Feather name={icon} size={17} color={colors.primary} />}<Text style={[styles.ghostText, { color: colors.primary }]}>{label}</Text></Pressable>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionTitleText, { color: colors.foreground }]}>{title}</Text>{action && onAction && <Pressable onPress={onAction}><Text style={[styles.link, { color: colors.primary }]}>{action}</Text></Pressable>}</View>;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput placeholderTextColor={colors.mutedForeground} {...props} style={[styles.input, { backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border, color: colors.foreground }]} />{error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}</View>;
}

export function StatusPill({ status }: { status: string }) {
  const colors = useColors();
  const map: Record<string, { bg: string; fg: string }> = { Taslak: { bg: '#FFF4D6', fg: '#9A6700' }, Gönderildi: { bg: '#E3F0FF', fg: '#2563A8' }, Onaylandı: { bg: '#DDF6EA', fg: '#147A4A' }, Reddedildi: { bg: '#FFE7E7', fg: colors.destructive } };
  const tone = map[status] ?? map.Taslak;
  return <View style={[styles.pill, { backgroundColor: tone.bg }]}><Text style={[styles.pillText, { color: tone.fg }]}>{status}</Text></View>;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.muted, { color: colors.mutedForeground }]}>Hazırlanıyor…</Text></View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  brandIconSmall: { width: 32, height: 32, borderRadius: 10 },
  spark: { position: 'absolute', top: 4, right: 4 },
  brandText: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  ai: { fontSize: 11, color: '#F59E0B', letterSpacing: 0.5, fontWeight: '700' },
  button: { minHeight: 54, borderRadius: 16, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  ghostButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
  ghostText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleText: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  link: { fontSize: 13, fontWeight: '700' },
  field: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 15 },
  error: { fontSize: 12, marginTop: 5 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  muted: { fontSize: 14 },
});

export const sharedStyles = styles;