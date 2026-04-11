import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { theme } from '../../lib/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[theme.card, style]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[theme.card, style]}>{children}</View>;
}
