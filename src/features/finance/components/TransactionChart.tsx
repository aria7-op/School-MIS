import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';

const BASE_URL = 'https://khwanzay.school/api';

const TransactionChart: React.FC = () => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [incomeData, setIncomeData] = useState<number[]>([]);
  const [expenseData, setExpenseData] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all endpoints in parallel
        const [transactionsRes, expensesRes] = await Promise.all([
          fetch(`${BASE_URL}/transactions`).then(r => r.json()),
          fetch(`${BASE_URL}/expense`).then(r => r.json()),
        ]);
        const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
        const expenses = Array.isArray(expensesRes.data) ? expensesRes.data : [];

        // Aggregate by month (YYYY-MM)
        const incomeByMonth: { [month: string]: number } = {};
        const expenseByMonth: { [month: string]: number } = {};

        transactions.forEach((tx: any) => {
          const month = moment(tx.transaction_date).format('YYYY-MM');
          const amount = parseFloat(tx.amount || '0');
          if (tx.transaction_type === 'credit') {
            incomeByMonth[month] = (incomeByMonth[month] || 0) + amount;
          } else {
            expenseByMonth[month] = (expenseByMonth[month] || 0) + amount;
          }
        });
        expenses.forEach((e: any) => {
          const month = moment(e.expense_date).format('YYYY-MM');
          const amount = parseFloat(e.amount || '0');
          expenseByMonth[month] = (expenseByMonth[month] || 0) + amount;
        });

        // Get all months in sorted order (last 6 months)
        const allMonths = Array.from(new Set([
          ...Object.keys(incomeByMonth),
          ...Object.keys(expenseByMonth),
        ])).sort();
        const last6 = allMonths.slice(-6);
        setLabels(last6);
        setIncomeData(last6.map(m => incomeByMonth[m] || 0));
        setExpenseData(last6.map(m => expenseByMonth[m] || 0));
      } catch (err) {
        setError('Failed to fetch chart data');
        setLabels([]);
        setIncomeData([]);
        setExpenseData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${colors.text === '#000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${colors.text === '#000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />;
  }
  if (error) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  }
  if (!labels.length) {
    return <View style={styles.center}><Text style={styles.empty}>No data available.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Monthly Overview</Text>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: expenseData,
              color: (opacity = 1) => `rgba(248, 113, 113, ${opacity})`, // expense color
              strokeWidth: 2,
            },
            {
              data: incomeData,
              color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`, // income color
              strokeWidth: 2,
            },
          ],
          legend: ['Expenses', 'Income'],
        }}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLines={false}
        withHorizontalLines={false}
        withShadow={false}
        fromZero
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  error: {
    color: '#e63946',
    fontWeight: 'bold',
  },
  empty: {
    color: '#888',
  },
});

export default TransactionChart;
