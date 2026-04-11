import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = '#4ade80' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}33`, borderColor: color }]}> 
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
