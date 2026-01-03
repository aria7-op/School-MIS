// src/features/classes/components/ClassFilters.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';

const ClassFilters = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View>
      <TextInput
        style={[
          styles.searchInput,
          { 
            color: colors.text,
            borderColor: colors.border
          }
        ]}
        placeholder={t('searchClassesPlaceholder')}
        placeholderTextColor={colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor:'#fff'
  },
});

export default ClassFilters;
