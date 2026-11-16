import { useState } from 'react';
import { Image, View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export function Img({ source, style }: { source: ImageSourcePropType; style?: StyleProp<ImageStyle> }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={[style as StyleProp<ViewStyle>, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
      </View>
    );
  }
  return <Image source={source} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}