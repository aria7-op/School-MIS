import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { AttendanceStatus } from '../types';
import { useTheme } from '@react-navigation/native';

interface AttendanceCalendarProps {
  markedDates: { [date: string]: { marked: boolean; dotColor?: string; selected?: boolean } };
  onDayPress: (date: string) => void;
  selectedDate: string;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ markedDates, onDayPress, selectedDate }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Calendar
        current={selectedDate}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            selected: true,
            marked: markedDates[selectedDate]?.marked || false,
            dotColor: markedDates[selectedDate]?.dotColor || '#fff',
          },
        }}
        onDayPress={(day) => onDayPress(day.dateString)}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#4a4a4a',
          selectedDayBackgroundColor: '#4f46e5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3f51b5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#3f51b5',
          selectedDotColor: '#ffffff',
          arrowColor: '#3f51b5',
          monthTextColor: '#3f51b5',
          indicatorColor: '#3f51b5',
          textDayFontFamily: 'Roboto',
          textMonthFontFamily: 'Roboto',
          textDayHeaderFontFamily: 'Roboto',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
        renderArrow={(direction) => (
          <MaterialIcons
            name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
            size={24}
            color="#3f51b5"
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default AttendanceCalendar;
