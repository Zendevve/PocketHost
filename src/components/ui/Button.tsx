import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../lib/theme';

type Variant = 'default' | 'secondary' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: Variant;
}

const variantStyles: Record<Variant, ViewStyle> = {
  default: { backgroundColor: colors.primary },
  secondary: { backgroundColor: '#374151' },
  danger: { backgroundColor: colors.danger },
};

export function Button({ title, onPress, disabled, style, variant = 'default' }: ButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    
    // Provide standard iOS/Android haptic feedback on button interaction
    if (variant === 'danger') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.title, variant !== 'default' && { color: '#ffffff' }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#052e16',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
