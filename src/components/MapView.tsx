import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/theme';
import { mapHtml } from '@/components/mapHtml';

type Props = {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
};

export function MapView({ lat, lng, label, height = 200 }: Props) {
  return (
    <View style={[s.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml(lat, lng, label) }}
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
