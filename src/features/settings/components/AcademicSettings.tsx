  // src/components/settings/AcademicSettings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@react-navigation/native';
import SettingItem from './SettingItem';
import { useTranslation } from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AcademicSettings = () => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [academicYear, setAcademicYear] = useState('2023-2024');
  const [term, setTerm] = useState('First Term');
  const [semester, setSemester] = useState('First Semester');
  const [loading, setLoading] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    loadAcademicSettings();
  }, []);

  const loadAcademicSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('academicSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAcademicYear(settings.academicYear ?? '2023-2024');
        setTerm(settings.term ?? 'First Term');
        setSemester(settings.semester ?? 'First Semester');
      }
    } catch (error) {
      // Use default settings if loading fails
    }
  };

  const saveAcademicSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('academicSettings', JSON.stringify(newSettings));
    } catch (error) {
      Alert.alert('Error', 'Failed to save academic settings');
    }
  };

  const handleAcademicYearChange = async (value: string) => {
    setAcademicYear(value);
    await saveAcademicSettings({
      academicYear: value,
      term,
      semester
    });
  };

  const handleTermChange = async (value: string) => {
    setTerm(value);
    await saveAcademicSettings({
      academicYear,
      term: value,
      semester
    });
  };

  const handleSemesterChange = async (value: string) => {
    setSemester(value);
    await saveAcademicSettings({
      academicYear,
      term,
      semester: value
    });
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('academic_settings')}</Text>
      
      <SettingItem
        label={t('academic_year')}
        rightComponent={
          <Picker
            selectedValue={academicYear}
            style={[styles.picker, { color: colors.text }]}
            onValueChange={handleAcademicYearChange}
          >
            <Picker.Item label="2023-2024" value="2023-2024" />
            <Picker.Item label="2024-2025" value="2024-2025" />
            <Picker.Item label="2025-2026" value="2025-2026" />
            <Picker.Item label="2026-2027" value="2026-2027" />
          </Picker>
        }
      />
      
      <SettingItem
        label={t('current_term')}
        rightComponent={
          <Picker
            selectedValue={term}
            style={[styles.picker, { color: colors.text }]}
            onValueChange={handleTermChange}
          >
            <Picker.Item label={t('first_term')} value="First Term" />
            <Picker.Item label={t('second_term')} value="Second Term" />
            <Picker.Item label={t('third_term')} value="Third Term" />
          </Picker>
        }
      />

      <SettingItem
        label={t('current_semester')}
        rightComponent={
          <Picker
            selectedValue={semester}
            style={[styles.picker, { color: colors.text }]}
            onValueChange={handleSemesterChange}
          >
            <Picker.Item label={t('first_semester')} value="First Semester" />
            <Picker.Item label={t('second_semester')} value="Second Semester" />
            <Picker.Item label={t('summer_semester')} value="Summer Semester" />
          </Picker>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  picker: {
    width: 150,
    height: 40,
  },
});

export default AcademicSettings;
