import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

const SectionTitle: React.FC<{ title: string }> = ({ title }) => {
  const { colors } = useTheme();

  return (
    <Text style={[styles.title, { color: colors.text }]}>
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default SectionTitle;
