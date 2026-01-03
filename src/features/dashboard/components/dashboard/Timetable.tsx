import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../../contexts/TranslationContext';

const Timetable = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  // Sample timetable data
  const timetableData = [
    { 
      time: '08:00 - 09:00', 
      monday: t('mathematics'), 
      tuesday: t('physics'), 
      wednesday: t('chemistry'),
      thursday: t('biology'),
      friday: t('english')
    },
    { 
      time: '09:00 - 10:00', 
      monday: t('physics'), 
      tuesday: t('chemistry'), 
      wednesday: t('biology'),
      thursday: t('english'),
      friday: t('mathematics')
    },
    { 
      time: '10:00 - 11:00', 
      monday: t('break'), 
      tuesday: t('break'), 
      wednesday: t('break'),
      thursday: t('break'),
      friday: t('break')
    },
    { 
      time: '11:00 - 12:00', 
      monday: t('history'), 
      tuesday: t('geography'), 
      wednesday: t('physics'),
      thursday: t('mathematics'),
      friday: t('chemistry')
    },
  ];

  const days = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday')];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('weekly_timetable')}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.timeCell}>
              <Text style={[styles.headerText, { color: colors.card }]}>{t('time')}</Text>
            </View>
            {days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                <Text style={[styles.headerText, { color: colors.card }]}>{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Timetable rows */}
          {timetableData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.dataRow}>
              <View style={[styles.timeCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.cellText, { color: colors.text }]}>{row.time}</Text>
              </View>
              <View style={[styles.dayCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.cellText, { color: colors.text }]}>{row.monday}</Text>
              </View>
              <View style={[styles.dayCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.cellText, { color: colors.text }]}>{row.tuesday}</Text>
              </View>
              <View style={[styles.dayCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.cellText, { color: colors.text }]}>{row.wednesday}</Text>
              </View>
              <View style={[styles.dayCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.cellText, { color: colors.text }]}>{row.thursday}</Text>
              </View>
              <View style={[styles.dayCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.cellText, { color: colors.text }]}>{row.friday}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 30,
    borderWidth: 1,
    marginBottom: 16,
    alignSelf:'center'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeCell: {
    minWidth: 100,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#af7ac5',
    flex:1
  },
  dayCell: {
    width: 120,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#af7ac5',
    flex:1
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cellText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default Timetable;
