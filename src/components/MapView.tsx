import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
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

export function MapView({ lat, lng, label, points, zoom, height = 200 }: Props) {
  const list: MapPoint[] =
    points && points.length > 0
      ? points
      : lat != null && lng != null
        ? [{ lat, lng, label }]
        : [];

  return (
    <View style={[s.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml(list, zoom) }}
        style={s.web}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.border },
  web: { flex: 1, backgroundColor: 'transparent' },
});
