import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import Card from '../shared/Card';
import SectionTitle from '../shared/SectionTitle';
import { upcomingExams } from '../../../../data/dashboardData';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from '../../../../contexts/TranslationContext';

const UpcomingExams: React.FC<{ style?: any }> = ({ style }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  // Export Excel only on web
  const handleExportToExcel = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(t('not_supported'), t('excel_export_not_supported_on_mobile'));
      return;
    }
    setExporting(true);
    try {
      const exportData = upcomingExams.map(exam => ({
        [t('course')]: exam.course,
        [t('date')]: exam.date,
        [t('time')]: exam.time,
        [t('room')]: exam.room,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Upcoming Exams');
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, 'upcoming_exams.xlsx');

      Alert.alert(t('export_complete'), t('exams_exported'));
    } catch (err) {
      
      Alert.alert(t('export_failed'), String(err));
    } finally {
      setExporting(false);
    }
  };

  // Export PDF only on web using html2canvas + jsPDF
  const handleExportToPDF = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(t('not_supported'), t('pdf_export_not_supported_on_mobile'));
      return;
    }

    setExporting(true);
    try {
      // First create an HTML element with a table
      const tableHtml = `
        <div style="padding:10px; font-family: Arial, sans-serif;">
          <h1 style="text-align:center;">${t('upcoming_exams')}</h1>
          <table border="1" style="width:100%; border-collapse:collapse; text-align:center;">
            <thead>
              <tr>
                <th>${t('course')}</th>
                <th>${t('date')}</th>
                <th>${t('time')}</th>
                <th>${t('room')}</th>
              </tr>
            </thead>
            <tbody>
              ${upcomingExams.map(exam => `
                <tr>
                  <td>${exam.course}</td>
                  <td>${exam.date}</td>
                  <td>${exam.time}</td>
                  <td>${exam.room}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Create a temporary HTML element
      const element = document.createElement('div');
      element.innerHTML = tableHtml;
      document.body.appendChild(element);

      // Take a screenshot of the table
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      // Remove the temporary HTML element
      document.body.removeChild(element);

      // Create a PDF and add the image
      const pdf = new jsPDF('p', 'pt', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('upcoming_exams.pdf');

      Alert.alert(t('export_complete'), t('exams_exported'));
    } catch (err) {
      
      Alert.alert(t('export_failed'), String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <SectionTitle title={t('upcoming_exams')} />

      {/* Show buttons only on web */}
      {Platform.OS === 'web' && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 8 }}>
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
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              {exporting ? t('exporting') : t('export_to_excel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportToPDF}
            disabled={exporting}
            style={{
              backgroundColor: exporting ? '#fca5a5' : '#EF4444',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              {exporting ? t('exporting') : t('export_to_pdf')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Card>
        {upcomingExams.map(exam => (
          <View key={exam.id} style={styles.examItem}>
            <MaterialCommunityIcons
              name="clipboard-text"
              size={20}
              style={[styles.icon, { color: colors.primary }]}
            />
            <View style={styles.textContainer}>
              <Text style={[styles.course, { color: colors.text }]}>{exam.course}</Text>
              <View style={styles.details}>
                <Text style={[styles.detail, { color: colors.text }]}>{exam.date}</Text>
                <Text style={[styles.detail, { color: colors.text }]}>{exam.time}</Text>
                <Text style={[styles.detail, { color: colors.text }]}>{exam.room}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  course: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detail: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default UpcomingExams;
