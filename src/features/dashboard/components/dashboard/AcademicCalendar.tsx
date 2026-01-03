import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@react-navigation/native';
import Card from '../shared/Card';
import SectionTitle from '../shared/SectionTitle';
import { calendarEvents } from '../../../../data/dashboardData';

const AcademicCalendar: React.FC = () => {
  const { colors } = useTheme();

  // Prepare marked dates for calendar
  const markedDates = calendarEvents.reduce((acc, event) => {
    const color = 
      event.type === 'exam' ? '#FF5252' : 
      event.type === 'holiday' ? '#4CAF50' : '#2196F3';
    
    acc[event.date] = { 
      marked: true, 
      dotColor: color,
      selected: true,
      selectedColor: color 
    };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <SectionTitle title="Academic Calendar" />
      <Card>
        <Calendar
          markingType={'multi-dot'}
          markedDates={markedDates}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: 'white',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            arrowColor: colors.primary,
          }}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
});

export default AcademicCalendar;
