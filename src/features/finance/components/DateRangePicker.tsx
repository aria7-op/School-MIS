import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import moment from 'moment';
import { useTheme } from '@react-navigation/native';

const DateRangePicker = ({ onDateRangeSelected, onClose }) => {
  const { colors } = useTheme();
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const getIntermediateDates = (start, end) => {
    let range = {};
    let current = moment(start).add(1, 'day');

    while (current.isBefore(end)) {
      range[current.format('YYYY-MM-DD')] = {
        color: '#c7d2fe',
        textColor: 'black'
      };
      current.add(1, 'day');
    }

    return range;
  };

  const handleApply = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      onDateRangeSelected({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });
      onClose();
    }
  };

  return (
    <View style={styles.datePickerContainer}>
      <Text style={styles.datePickerTitle}>Select Date Range</Text>
      
      <CalendarList
        onDayPress={(day) => {
          const selected = day.dateString;
          if (!dateFilter.startDate || (dateFilter.startDate && dateFilter.endDate)) {
            setDateFilter({ startDate: selected, endDate: '' });
          } else {
            const isAfter = moment(selected).isAfter(dateFilter.startDate);
            if (isAfter) {
              setDateFilter(prev => ({ ...prev, endDate: selected }));
            } else {
              setDateFilter({ startDate: selected, endDate: '' });
            }
          }
        }}
        markedDates={{
          ...(dateFilter.startDate && {
            [dateFilter.startDate]: { startingDay: true, color: '#4f46e5', textColor: 'white' }
          }),
          ...(dateFilter.endDate && {
            [dateFilter.endDate]: { endingDay: true, color: '#4f46e5', textColor: 'white' }
          }),
          ...(dateFilter.startDate && dateFilter.endDate && {
            ...getIntermediateDates(dateFilter.startDate, dateFilter.endDate)
          })
        }}
        markingType={'period'}
        pastScrollRange={12}
        futureScrollRange={12}
        scrollEnabled
        showScrollIndicator
      />
      
      <View style={styles.datePickerButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyButton, !(dateFilter.startDate && dateFilter.endDate) && { opacity: 0.5 }]}
          onPress={handleApply}
          disabled={!(dateFilter.startDate && dateFilter.endDate)}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111827',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  applyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '500',
  }
});

export default DateRangePicker;
