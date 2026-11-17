import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { mapHtml, type MapPoint } from '@/components/mapHtml';

type Props = {
  lat?: number;
  lng?: number;
  label?: string;
  points?: MapPoint[];
  zoom?: number;
  height?: number;
};

// Version web : iframe directe (pas de WebView natif sur le web).
export function MapView({ lat, lng, label, points, zoom, height = 200 }: Props) {
  const list: MapPoint[] =
    points && points.length > 0
      ? points
      : lat != null && lng != null
        ? [{ lat, lng, label }]
        : [];

  return (
    <View style={[s.wrap, { height }]}>
      <iframe
        title="WIDRIVE map"
        srcDoc={mapHtml(list, zoom)}
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.border },
});
