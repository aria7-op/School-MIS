import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { colors as defaultColors } from '../../../constants/colors';

interface FinancialCalendarProps {
  payments: any[];
  expenses: any[];
  incomes: any[];
  colors: any;
}

interface CalendarEvent {
  date: string;
  type: 'payment' | 'expense' | 'income';
  amount: number;
  description: string;
  status?: string;
}

const FinancialCalendar: React.FC<FinancialCalendarProps> = ({
  payments,
  expenses,
  incomes,
  colors: propColors,
}) => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));

  // Safe color access with fallbacks
  const colors = {
    primary: propColors?.primary || defaultColors.primary,
    text: propColors?.text || defaultColors.text,
    textSecondary: propColors?.textSecondary || defaultColors.textSecondary,
    card: propColors?.card || defaultColors.card,
    background: propColors?.background || defaultColors.background,
  };

  // Process financial events for calendar
  const calendarEvents = useMemo(() => {
    const events: Record<string, CalendarEvent[]> = {};

    // Process payments
    if (Array.isArray(payments)) {
      payments.forEach(payment => {
        const date = moment(payment.paymentDate || payment.createdAt).format('YYYY-MM-DD');
        if (!events[date]) events[date] = [];
        
        events[date].push({
          date,
          type: 'payment',
          amount: payment.amount || payment.total || 0,
          description: payment.description || 'Payment',
          status: payment.status,
        });
      });
    }

    // Process expenses
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        const date = moment(expense.expenseDate || expense.createdAt).format('YYYY-MM-DD');
        if (!events[date]) events[date] = [];
        
        events[date].push({
          date,
          type: 'expense',
          amount: expense.amount || 0,
          description: expense.description || 'Expense',
        });
      });
    }

    // Process incomes
    if (Array.isArray(incomes)) {
      incomes.forEach(income => {
        const date = moment(income.incomeDate || income.createdAt).format('YYYY-MM-DD');
        if (!events[date]) events[date] = [];
        
        events[date].push({
          date,
          type: 'income',
          amount: income.amount || 0,
          description: income.description || 'Income',
        });
      });
    }

    return events;
  }, [payments, expenses, incomes]);

  // Generate marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};
    
    Object.entries(calendarEvents).forEach(([date, events]) => {
      const hasPayment = events.some(e => e.type === 'payment');
      const hasExpense = events.some(e => e.type === 'expense');
      const hasIncome = events.some(e => e.type === 'income');
      
      let dotColor = '#6366f1'; // Default blue
      if (hasPayment && hasExpense) {
        dotColor = '#f59e0b'; // Orange for mixed
      } else if (hasExpense) {
        dotColor = '#ef4444'; // Red for expenses
      } else if (hasIncome) {
        dotColor = '#10b981'; // Green for income
      }
      
      marked[date] = {
        marked: true,
        dotColor,
        textColor: selectedDate === date ? 'white' : colors.text,
        backgroundColor: selectedDate === date ? colors.primary : 'transparent',
      };
    });

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
        textColor: 'white',
      };
    }

    return marked;
  }, [calendarEvents, selectedDate, colors]);

  const selectedDateEvents = calendarEvents[selectedDate] || [];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'payment': return '💰';
      case 'expense': return '💸';
      case 'income': return '💵';
      default: return '📊';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'payment': return '#6366f1';
      case 'expense': return '#ef4444';
      case 'income': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return `Afg ${amount.toLocaleString()}`;
  };

  const getDaySummary = (date: string) => {
    const events = calendarEvents[date] || [];
    const totalIncome = events
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = events
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalPayments = events
      .filter(e => e.type === 'payment')
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      totalPayments,
      netFlow: totalIncome + totalPayments - totalExpenses,
    };
  };

  const daySummary = getDaySummary(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Financial Calendar</Text>
      
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.card,
          calendarBackground: colors.card,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: 'white',
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          dotColor: colors.primary,
          selectedDotColor: 'white',
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
        style={styles.calendar}
      />

      {/* Selected Date Events */}
      <View style={styles.eventsContainer}>
        <Text style={[styles.eventsTitle, { color: colors.text }]}>
          Events for {moment(selectedDate).format('MMMM D, YYYY')}
        </Text>
        
        {/* Day Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {formatCurrency(daySummary.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Payments</Text>
            <Text style={[styles.summaryValue, { color: '#6366f1' }]}>
              {formatCurrency(daySummary.totalPayments)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              {formatCurrency(daySummary.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Flow</Text>
            <Text style={[
              styles.summaryValue, 
              { color: daySummary.netFlow >= 0 ? '#10b981' : '#ef4444' }
            ]}>
              {formatCurrency(daySummary.netFlow)}
            </Text>
          </View>
        </View>

        {/* Events List */}
        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => (
              <View key={index} style={[styles.eventItem, { backgroundColor: colors.background }]}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>{getEventIcon(event.type)}</Text>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventDescription, { color: colors.text }]}>
                      {event.description}
                    </Text>
                    <Text style={[styles.eventType, { color: colors.textSecondary }]}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.eventAmount,
                    { color: getEventColor(event.type) }
                  ]}>
                    {formatCurrency(event.amount)}
                  </Text>
                </View>
                {event.status && (
                  <View style={styles.eventStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: event.status === 'completed' ? '#10b981' : '#f59e0b' }
                    ]} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                      {event.status}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No financial events on this date
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 8,
    marginBottom: 16,
  },
  eventsContainer: {
    flex: 1,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventsList: {
    maxHeight: 200,
  },
  eventItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventType: {
    fontSize: 12,
  },
  eventAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FinancialCalendar; 
