import { type PressableProps, Pressable, StyleSheet, Text } from 'react-native';

type Variant = 'danger' | 'primary' | 'secondary';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
};

export function Button({ disabled, label, style, variant = 'primary', ...rest }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      disabled={disabled}
      {...rest}>
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});

const variantStyles = StyleSheet.create<Record<Variant, object>>({
  danger: {
    backgroundColor: '#ef4444',
  },
  primary: {
    backgroundColor: '#18181b',
  },
  secondary: {
    backgroundColor: '#f4f4f5',
    borderColor: '#d4d4d8',
    borderWidth: 1,
  },
});

const labelStyles = StyleSheet.create<Record<Variant, object>>({
  danger: {
    color: '#ffffff',
  },
  primary: {
    color: '#ffffff',
  },
  secondary: {
    color: '#18181b',
  },
});
