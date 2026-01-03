import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface FallbackChartProps {
  data: number[];
  labels: string[];
}

const FallbackChart: React.FC<FallbackChartProps> = ({ data, labels }) => {
  const { colors } = useTheme();

  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Payroll Data (Fallback View)
      </Text>
      
      <View style={styles.chartContainer}>
        {data.map((value, index) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${percentage}%`,
                      backgroundColor: colors.primary || '#3b82f6'
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {labels[index]}
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                Afg {value.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Summary</Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Total: Afg {data.reduce((sum, val) => sum + val, 0).toLocaleString()}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Average: Afg {(data.reduce((sum, val) => sum + val, 0) / data.length).toLocaleString()}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Max: Afg {Math.max(...data).toLocaleString()}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Min: Afg {Math.min(...data).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 150,
    width: 30,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default FallbackChart; 
