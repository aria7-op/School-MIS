import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ActivityIndicator, Dimensions ,Platform} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import Card from '../shared/Card';
import Timetable from './Timetable';
import secureApiService from '../../../../services/secureApiService';
import Tooltip from '../../../../components/ui/Tooltip';
import { useTranslation } from '../../../../contexts/TranslationContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StatItem {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

const StatsCards: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
const [exporting, setExporting] = useState(false);
  const API_BASE = 'https://khwanzay.school/api';

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await secureApiService.get('/dashboard/stats');
      if (response.success) {
        setStatsData(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch stats');
      }
    } catch (error: any) {
      // setError(error.message || 'Failed to fetch stats'); // This line was removed from the new_code, so it's removed here.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  const renderTrendIndicator = (trend: 'up' | 'down' | 'neutral' | undefined) => {
    switch (trend) {
      case 'up':
        return <MaterialCommunityIcons name="trending-up" size={16} color="#4CAF50" style={styles.trendIcon} />;
      case 'down':
        return <MaterialCommunityIcons name="trending-down" size={16} color="#F44336" style={styles.trendIcon} />;
      default:
        return <MaterialCommunityIcons name="trending-neutral" size={16} color="#9E9E9E" style={styles.trendIcon} />;
    }
  };
  // Export Excel only on web
const handleExportToExcel = async () => {
  if (Platform.OS !== 'web') {
    Alert.alert(t('not_supported'), t('excel_export_not_supported_on_mobile'));
    return;
  }
  
  setExporting(true);
  try {
    const exportData = statsData.map(stat => ({
      [t('statistic')]: stat.title,
      [t('value')]: stat.value,
      [t('trend')]: stat.trend,
      [t('description')]: stat.description || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statistics');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'statistics.xlsx');

    Alert.alert(t('export_complete'), t('stats_exported'));
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
    // Create an HTML element with the table
    const tableHtml = `
      <div style="padding:10px; font-family: Arial, sans-serif;">
        <h1 style="text-align:center;">${t('statistics')}</h1>
        <table border="1" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th>${t('statistic')}</th>
              <th>${t('value')}</th>
              <th>${t('trend')}</th>
              <th>${t('description')}</th>
            </tr>
          </thead>
          <tbody>
            ${statsData.map(stat => `
              <tr>
                <td>${stat.title}</td>
                <td>${stat.value}</td>
                <td>${stat.trend || 'neutral'}</td>
                <td>${stat.description || ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = tableHtml;
    document.body.appendChild(element);

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    document.body.removeChild(element);

    const pdf = new jsPDF('p', 'pt', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('statistics.pdf');

    Alert.alert(t('export_complete'), t('stats_exported'));
  } catch (err) {
    
    Alert.alert(t('export_failed'), String(err));
  } finally {
    setExporting(false);
  }
};

  return (
    
    <View style={styles.container}>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {statsData.map((stat, index) => (
            <Tooltip key={index} text={stat.title + (stat.description ? ': ' + stat.description : '')}>
            
              <View style={[styles.card, { backgroundColor: colors.card }]}> 
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}> 
                      <MaterialCommunityIcons name={stat.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={16} color={stat.color} />
                    </View>
                    {stat.trend && renderTrendIndicator(stat.trend)}
                  </View>
                  <Text style={[styles.value, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.title, { color: colors.text }]}>{stat.title}</Text>
                  {stat.description && (
                    <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
                      {stat.description}
                    </Text>
                  )}
                </View>
              </View>
            </Tooltip>
          ))}
        </>
      )}

      {/* Floating Timetable Button */}
      <Tooltip text={t('view_weekly_schedule')}>
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={togglePopup}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="calendar-clock" size={20} color="#fff" />
        </TouchableOpacity>
      </Tooltip>
{Platform.OS === 'web' && (
  <View style={{ 
    position: 'absolute', 
    right: 16, 
    top: -10, 
    flexDirection: 'row', 
    gap: 8,
    zIndex: 10 
  }}>
    <TouchableOpacity
      onPress={handleExportToExcel}
      disabled={exporting}
      style={{
        backgroundColor: exporting ? '#a7f3d0' : '#10B981',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
      }}
    >
      <MaterialCommunityIcons name="file-excel" size={16} color="white" />
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
        {exporting ? t('exporting') : t('excel')}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={handleExportToPDF}
      disabled={exporting}
      style={{
        backgroundColor: exporting ? '#fca5a5' : '#EF4444',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
      }}
    >
      <MaterialCommunityIcons name="file-pdf" size={16} color="white" />
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
        {exporting ? t('exporting') : t('pdf')}
      </Text>
    </TouchableOpacity>
  </View>
)}
      {/* Timetable Popup */}
      <Modal
        visible={isPopupVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={togglePopup}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('weekly_schedule')}</Text>
              <TouchableOpacity onPress={togglePopup} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSubtitleContainer}>
              <MaterialCommunityIcons name="information" size={14} color={colors.text} style={{ opacity: 0.6 }} />
              <Text style={[styles.modalSubtitle, { color: colors.text }]}>{t('current_week')} May 20-26</Text>
            </View>
            <Timetable />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_GAP = isWeb ? 18 : 10;
const CARD_MIN_WIDTH = isWeb ? 180 : 120;
const CARD_MAX_WIDTH = isWeb ? 200 : 160;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: isWeb ? 'wrap' : 'nowrap',
    justifyContent: isWeb ? 'flex-start' : 'space-between',
    marginBottom: 24,
    marginTop: 8,
    gap: CARD_GAP,
    maxWidth: isWeb ? '100%' : undefined,
    paddingHorizontal: isWeb ? 16 : 0,
  },
  card: {
    minWidth: CARD_MIN_WIDTH,
    borderRadius: 10,
    padding: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: CARD_GAP,
    ...(isWeb && {
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  cardContent: {
    padding: isWeb ? 16 : 10,
    alignItems: 'flex-start',
    minHeight: isWeb ? 100 : undefined,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    opacity: 0.8,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    opacity: 0.6,
    fontWeight: '400',
  },
  trendIcon: {
    marginLeft: 'auto',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
  },
  floatingButton: {
    position: 'absolute',
    backgroundColor:'#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    right: 16,
    bottom: -22,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 380,
    padding: 16,
    borderRadius: 14,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 6,
    fontWeight: '400',
  },
});

export default StatsCards;
