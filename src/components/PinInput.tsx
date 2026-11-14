import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

type PinInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

export function PinInput({
  label,
  value,
  onChange,
  autoFocus = false,
}: PinInputProps) {
  
const inputRef = useRef<any>(null);
  const handleChange = (text: string) => {
    const pin = text.replace(/\D/g, '').slice(0, 4);
    onChange(pin);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={focusInput}
        style={styles.row}
        accessibilityLabel={label}
      >
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.box,
              index < 3 && styles.boxSpacing,
              value.length === index && styles.boxActive,
            ]}
          >
            {index < value.length ? (
              <View style={styles.dot} />
            ) : null}
          </View>
        ))}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus={autoFocus}
          caretHidden
          style={styles.hiddenInput}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  box: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  boxSpacing: {
    marginRight: 10,
  },

  boxActive: {
    borderColor: colors.primary,
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },

  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});