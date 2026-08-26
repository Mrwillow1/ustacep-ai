import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { BrandMark, Field, PrimaryButton } from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';
import { analyzeWork, type AnalyzeWorkResult } from '@workspace/api-client-react';

type OfferPayload = { customerName?: string; title: string; type: string; address?: string; notes?: string; photos?: string[] };
const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000;
const MAX_TOTAL_IMAGE_DATA_URL_LENGTH = 12_000_000;

async function dataUrlFromUri(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fotoğraf okunamadı.'));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export default function AnalysisScreen() {
  const colors = useColors();
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [materials, setMaterials] = useState('');
  const [hours, setHours] = useState('8');

  const loadAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      if (!payload) throw new Error('Teklif bilgileri bulunamadı. Lütfen yeniden deneyin.');
      const offer = JSON.parse(payload) as OfferPayload;
      const imageDataUrls: string[] = [];
      for (const uri of (offer.photos ?? []).slice(0, 5)) {
        const dataUrl = await dataUrlFromUri(uri);
        if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) throw new Error('Bir fotoğraf çok büyük. Lütfen daha düşük çözünürlüklü bir fotoğraf seçin.');
        if (imageDataUrls.reduce((total, item) => total + item.length, 0) + dataUrl.length > MAX_TOTAL_IMAGE_DATA_URL_LENGTH) throw new Error('Fotoğrafların toplam boyutu çok büyük. Lütfen daha az fotoğrafla deneyin.');
        imageDataUrls.push(dataUrl);
      }
      const result: AnalyzeWorkResult = await analyzeWork({
        customerName: offer.customerName,
        title: offer.title,
        type: offer.type,
        address: offer.address,
        notes: offer.notes,
        imageDataUrls,
      });
      setDescription(result.description);
      setDimensions(result.dimensions);
      setMaterials(result.materials.map((item) => `${item.name} — ${item.quantity} ${item.unit}`).join('\n'));
      setHours(String(result.laborHours));
      setSource(result.source);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analiz tamamlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAnalysis(); }, [payload]);

  const next = () => router.push({ pathname: '/cost', params: { payload, analysis: JSON.stringify({ description, dimensions, materials, hours }) } });
  return <View style={[styles.page, { backgroundColor: colors.background }]}><KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={20}><View style={styles.top}><Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><BrandMark small /><Text style={[styles.step, { color: colors.mutedForeground }]}>2 / 4</Text></View><Text style={[styles.title, { color: colors.foreground }]}>AI analizi</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Fotoğraf ve iş bilgilerine göre öneriler hazırlıyoruz.</Text><View style={[styles.aiCard, { backgroundColor: colors.primary }]}><View style={styles.aiCircle}><Feather name={loading ? 'loader' : error ? 'alert-triangle' : 'check'} size={22} color={colors.primary} /></View><View style={styles.aiCopy}><Text style={styles.aiTitle}>{loading ? 'İşiniz analiz ediliyor…' : error ? 'Analiz tamamlanamadı' : 'Analiz tamamlandı'}</Text><Text style={styles.aiText}>{loading ? 'Fotoğraf detayları ve tahmini malzemeler çıkarılıyor.' : error ? 'Bağlantınızı kontrol edin veya tekrar deneyin.' : 'Sonuçları kontrol edin ve istediğiniz alanı düzenleyin.'}</Text></View></View>{loading ? <View style={styles.loadingLines}><View style={[styles.line, { backgroundColor: colors.secondary }]} /><View style={[styles.line, styles.shortLine, { backgroundColor: colors.secondary }]} /><View style={[styles.line, { backgroundColor: colors.secondary }]} /></View> : error ? <><View style={[styles.errorCard, { backgroundColor: '#FFF0F0' }]}><Feather name="alert-circle" size={17} color="#B42318" /><Text style={styles.errorText}>{error}</Text></View><PrimaryButton label="Analizi tekrar dene" icon="refresh-cw" onPress={loadAnalysis} /></> : <><View style={[styles.notice, { backgroundColor: '#FFF4D6' }]}><Feather name="info" size={17} color="#9A6700" /><Text style={styles.noticeText}>{source === 'mock' ? 'AI bağlantısı kullanılamadığı için yerel yaklaşık tahmin gösteriliyor. Yerinde kontrol önerilir.' : 'Fotoğrafa dayalı yaklaşık değer. Kesin ölçü için yerinde kontrol önerilir.'}</Text></View><Field label="İş açıklaması" value={description} onChangeText={setDescription} multiline numberOfLines={4} /><Field label="Tahmini ölçüler" value={dimensions} onChangeText={setDimensions} /><Field label="Gerekli malzemeler" value={materials} onChangeText={setMaterials} multiline numberOfLines={5} /><Field label="Tahmini işçilik süresi (saat)" value={hours} onChangeText={setHours} keyboardType="decimal-pad" /><PrimaryButton label="Sonraki: Maliyet hesabı" icon="arrow-right" onPress={next} /></>}</KeyboardAwareScrollViewCompat></View>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, content: { padding: 20, paddingTop: 20, paddingBottom: 40, gap: 12 }, top: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 10 }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, step: { marginLeft: 'auto', fontSize: 12, fontWeight: '700' }, title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.8 }, subtitle: { fontSize: 14, lineHeight: 21 }, aiCard: { borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 7 }, aiCircle: { width: 43, height: 43, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, aiCopy: { flex: 1, gap: 4 }, aiTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, aiText: { color: '#D5F3F5', fontSize: 12, lineHeight: 18 }, loadingLines: { gap: 12, paddingVertical: 16 }, line: { height: 54, borderRadius: 14 }, shortLine: { width: '65%' }, notice: { borderRadius: 13, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 4 }, noticeText: { color: '#815900', fontSize: 12, lineHeight: 18, flex: 1 }, errorCard: { borderRadius: 13, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 4 }, errorText: { color: '#B42318', fontSize: 12, lineHeight: 18, flex: 1 } });