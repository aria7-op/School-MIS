import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';
import Card from '../shared/Card';
import SectionTitle from '../shared/SectionTitle';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useTranslation } from '../../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');
const chartWidth = width - 40; // Account for padding

const PerformanceCharts: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Pie Chart Data
  const pieData = [
    {
      name: t('science'),
      population: 35,
      color: '#4CAF50',
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: t('arts'),
      population: 40,
      color: '#2196F3',
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: t('commerce'),
      population: 25,
      color: '#9C27B0',
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  // Line Chart Data
  const lineData = {
    labels: [t('jan'), t('feb'), t('mar'), t('apr'), t('may')],
    datasets: [
      {
        data: [85, 82, 88, 90, 92],
        color: (opacity = 1) => colors.primary, // Use theme primary color
        strokeWidth: 2,
      },
    ],
    legend: [t('attendance_trend')],
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(${colors.text}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${colors.text}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 12,
    },
  };

  const [exporting, setExporting] = useState(false);

const handleExportToExcel = () => {
  setExporting(true);
  try {
    const courseDistribution = pieData.map(item => ({
      Course: item.name,
      Percentage: item.population,
    }));

    const attendanceTrend = lineData.labels.map((label, index) => ({
      Month: label,
      Attendance: lineData.datasets[0].data[index],
    }));

    const wb = XLSX.utils.book_new();

    const courseSheet = XLSX.utils.json_to_sheet(courseDistribution);
    XLSX.utils.book_append_sheet(wb, courseSheet, 'Course Distribution');

    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceTrend);
    XLSX.utils.book_append_sheet(wb, attendanceSheet, 'Attendance Trend');

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'performance_charts.xlsx');

    Alert.alert(t('export_successful'), t('data_exported_performance_charts'));
  } catch (error) {
    
    Alert.alert(t('export_failed'), String(error));
  } finally {
    setExporting(false);
  }
};

  return (
    <View style={styles.container}>
  <SectionTitle title={t('performance_analytics')} />

  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
    <TouchableOpacity
      onPress={handleExportToExcel}
      disabled={exporting}
      style={{
        backgroundColor: exporting ? '#a7f3d0' : '#10B981',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: colors.card, fontWeight: 'bold' }}>
        {exporting ? t('exporting') : t('export_to_excel')}
      </Text>
    </TouchableOpacity>
  </View>

      <Card>
        {/* Course Distribution Pie Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('course_distribution')}</Text>
          <PieChart
            data={pieData}
            width={chartWidth*0.80}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend
          />
        </View>
        
        {/* Attendance Trend Line Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('attendance_trend')}</Text>
          <LineChart
            data={lineData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.lineChart}
            withVerticalLines={false}
            withHorizontalLabels={true}
            segments={5}
          />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  lineChart: {
    borderRadius: 8,
  },
});

export default PerformanceCharts;
