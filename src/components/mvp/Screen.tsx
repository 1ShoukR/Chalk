import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  children?: ReactNode;
  description?: string;
  title: string;
};

export function Screen({ children, description, title }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  container: {
    backgroundColor: '#fafafa',
    flex: 1,
  },
  description: {
    color: '#52525b',
    fontSize: 15,
    lineHeight: 22,
  },
  header: {
    gap: 8,
  },
  scrollContent: {
    gap: 20,
    padding: 20,
    paddingTop: 32,
  },
  title: {
    color: '#18181b',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
});
