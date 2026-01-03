import React from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useTranslation } from '../../../../contexts/TranslationContext';

const TodaysSchedule = (props) => {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);
  const { t } = useTranslation();

const handleExportSchedule = () => {
  setExporting(true);
  try {
    const exportData = todaysSchedule.map(item => ({
      [t('teacher')]: item.teacher,
      [t('class')]: item.class,
      [t('time')]: item.time,
      [t('room')]: item.room,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'todays_schedule.xlsx');

    Alert.alert(t('export_complete'), t('schedule_exported'));
  } catch (err) {
    
    Alert.alert(t('export_failed'), String(err));
  } finally {
    setExporting(false);
  }
};

  // Sample data - replace with your actual data
  const todaysSchedule = [
    { teacher: t('mr_smith'), class: t('math_101'), time: '8:00-9:00', room: 'A12' },
    { teacher: t('ms_johnson'), class: t('english_201'), time: '8:00-9:00', room: 'B05' },
    { teacher: t('dr_lee'), class: t('physics_301'), time: '9:15-10:15', room: 'C22' },
    // Add 30+ entries as needed...
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.header, { color: colors.text }]}>{t('todays_schedule')}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
  <TouchableOpacity
    onPress={handleExportSchedule}
    disabled={exporting}
    style={{
      backgroundColor: exporting ? '#a7f3d0' : '#10B981',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6
    }}
  >
    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
      {exporting ? t('exporting') : t('export_to_excel')}
    </Text>
  </TouchableOpacity>
</View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        {todaysSchedule.map((item, index) => (
          <View key={index} style={styles.scheduleItem}>
            <View style={styles.teacherContainer}>
              <Text style={[styles.teacherText, { color: colors.text }]}>{item.teacher}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={[styles.classText, { color: colors.text }]}>{item.class}</Text>
              <Text style={[styles.timeText, { color: colors.text }]}>{item.time} • {t('room')} {item.room}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    margin: 8,
    maxHeight: Dimensions.get('window').height * 0.4, // Limit height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teacherContainer: {
    width: '30%',
    paddingRight: 8,
  },
  teacherText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    flex: 1,
  },
  classText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
  },
});

export default TodaysSchedule;
