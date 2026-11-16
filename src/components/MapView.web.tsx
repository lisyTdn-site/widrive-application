import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { mapHtml } from '@/components/mapHtml';

type Props = {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
};

// Version web : iframe directe (pas de WebView natif sur le web).
export function MapView({ lat, lng, label, height = 200 }: Props) {
  return (
    <View style={[s.wrap, { height }]}>
      <iframe
        title="WIDRIVE map"
        srcDoc={mapHtml(lat, lng, label)}
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.border },
});
