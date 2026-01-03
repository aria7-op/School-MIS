import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import classService from '../services/classService';

interface AdvancedClassImportExportProps {
  selectedClass: any;
  onImportExportAction: (action: string, data: any) => void;
}

const AdvancedClassImportExport: React.FC<AdvancedClassImportExportProps> = ({
  selectedClass,
  onImportExportAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [selectedData, setSelectedData] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);

  const TABS = [
    { key: 'export', label: t('export'), icon: 'file-download' },
    { key: 'import', label: t('import'), icon: 'file-upload' },
    { key: 'history', label: t('history'), icon: 'history' },
  ];

  // Rich dummy export history data
  const dummyExportHistory = [
    {
      id: 1,
      type: 'export',
      dataType: 'students',
      format: 'excel',
      fileName: 'class_10a_students.xlsx',
      date: '2024-02-15',
      status: 'completed',
      size: '2.3 MB',
      records: 28,
    },
    {
      id: 2,
      type: 'export',
      dataType: 'grades',
      format: 'pdf',
      fileName: 'class_10a_grades.pdf',
      date: '2024-02-14',
      status: 'completed',
      size: '1.8 MB',
      records: 140,
    },
    {
      id: 3,
      type: 'import',
      dataType: 'attendance',
      format: 'csv',
      fileName: 'attendance_import.csv',
      date: '2024-02-13',
      status: 'completed',
      size: '0.5 MB',
      records: 25,
    },
    {
      id: 4,
      type: 'export',
      dataType: 'assignments',
      format: 'excel',
      fileName: 'class_10a_assignments.xlsx',
      date: '2024-02-12',
      status: 'failed',
      size: '0 MB',
      records: 0,
    },
    {
      id: 5,
      type: 'import',
      dataType: 'students',
      format: 'excel',
      fileName: 'new_students.xlsx',
      date: '2024-02-11',
      status: 'completed',
      size: '1.2 MB',
      records: 5,
    },
  ];

  // Available formats
  const exportFormats = [
    { id: 'excel', label: 'Excel (.xlsx)', icon: 'table-chart', color: '#217346' },
    { id: 'csv', label: 'CSV (.csv)', icon: 'description', color: '#FF9800' },
    { id: 'pdf', label: 'PDF (.pdf)', icon: 'picture-as-pdf', color: '#F44336' },
    { id: 'json', label: 'JSON (.json)', icon: 'code', color: '#2196F3' },
  ];

  // Available data types
  const dataTypes = [
    { id: 'students', label: t('students'), icon: 'people', count: 28 },
    { id: 'assignments', label: t('assignments'), icon: 'assignment', count: 5 },
    { id: 'grades', label: t('grades'), icon: 'grade', count: 140 },
    { id: 'attendance', label: t('attendance'), icon: 'check-circle', count: 303 },
    { id: 'subjects', label: t('subjects'), icon: 'book', count: 4 },
    { id: 'timetable', label: t('timetable'), icon: 'schedule', count: 35 },
    { id: 'exams', label: t('exams'), icon: 'event', count: 3 },
    { id: 'all', label: t('allData'), icon: 'folder', count: 525 },
  ];

  // Import templates
  const importTemplates = [
    {
      id: 'students',
      label: t('studentsTemplate'),
      description: t('studentsTemplateDesc'),
      icon: 'people',
      format: 'excel',
      downloadUrl: '#',
    },
    {
      id: 'grades',
      label: t('gradesTemplate'),
      description: t('gradesTemplateDesc'),
      icon: 'grade',
      format: 'excel',
      downloadUrl: '#',
    },
    {
      id: 'attendance',
      label: t('attendanceTemplate'),
      description: t('attendanceTemplateDesc'),
      icon: 'check-circle',
      format: 'csv',
      downloadUrl: '#',
    },
  ];

  useEffect(() => {
    if (activeTab === 'history') {
      loadExportHistory();
    }
  }, [activeTab]);

  const loadExportHistory = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExportHistory(dummyExportHistory);
    } catch (error) {
      
      setExportHistory(dummyExportHistory);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle data type selection
  const handleDataTypeSelection = (dataType: string) => {
    if (selectedData.includes(dataType)) {
      setSelectedData(selectedData.filter(type => type !== dataType));
    } else {
      setSelectedData([...selectedData, dataType]);
    }
  };

  // Handle export
  const handleExport = () => {
    if (selectedData.length === 0) {
      Alert.alert(t('noSelection'), t('pleaseSelectDataToExport'));
      return;
    }

    Alert.alert(
      t('confirmExport'),
      t('confirmExportMessage', { format: selectedFormat.toUpperCase(), count: selectedData.length }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('export'),
          onPress: () => {
            onImportExportAction('export', {
              dataTypes: selectedData,
              format: selectedFormat,
              classId: selectedClass?.id,
            });
          }
        }
      ]
    );
  };

  // Handle import
  const handleImport = () => {
    if (!importFile) {
      Alert.alert(t('noFile'), t('pleaseSelectFileToImport'));
      return;
    }

    Alert.alert(
      t('confirmImport'),
      t('confirmImportMessage', { fileName: importFile.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('import'),
          onPress: () => {
            onImportExportAction('import', {
              file: importFile,
              classId: selectedClass?.id,
            });
          }
        }
      ]
    );
  };

  // Handle template download
  const handleTemplateDownload = (template: any) => {
    Alert.alert(
      t('downloadTemplate'),
      t('downloadTemplateMessage', { template: template.label }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('download'),
          onPress: () => {
            onImportExportAction('downloadTemplate', template);
          }
        }
      ]
    );
  };

  // Render export tab
  const renderExportTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Format Selection */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('selectFormat')}
        </Text>
        <View style={styles.formatGrid}>
          {exportFormats.map(format => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatCard,
                { backgroundColor: colors.background },
                selectedFormat === format.id && { borderColor: format.color, borderWidth: 2 }
              ]}
              onPress={() => setSelectedFormat(format.id)}
            >
              <MaterialIcons name={format.icon as any} size={32} color={format.color} />
              <Text style={[styles.formatLabel, { color: colors.text }]}>
                {format.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Data Selection */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('selectData')}
        </Text>
        <View style={styles.dataTypeGrid}>
          {dataTypes.map(dataType => (
            <TouchableOpacity
              key={dataType.id}
              style={[
                styles.dataTypeCard,
                { backgroundColor: colors.background },
                selectedData.includes(dataType.id) && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleDataTypeSelection(dataType.id)}
            >
              <View style={styles.dataTypeHeader}>
                <MaterialIcons name={dataType.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.dataTypeLabel, { color: colors.text }]}>
                  {dataType.label}
                </Text>
              </View>
              <Text style={[styles.dataTypeCount, { color: colors.text + '80' }]}>
                {dataType.count} {t('records')}
              </Text>
              {selectedData.includes(dataType.id) && (
                <View style={styles.selectedIndicator}>
                  <MaterialIcons name="check" size={16} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Export Button */}
      <TouchableOpacity
        style={[styles.exportButton, { backgroundColor: colors.primary }]}
        onPress={handleExport}
        disabled={selectedData.length === 0}
      >
        <MaterialIcons name="file-download" size={24} color="white" />
        <Text style={styles.exportButtonText}>
          {t('exportData')} ({selectedData.length} {t('selected')})
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render import tab
  const renderImportTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Import Templates */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('importTemplates')}
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.text + '80' }]}>
          {t('importTemplatesDesc')}
        </Text>
        
        {importTemplates.map(template => (
          <View key={template.id} style={[styles.templateCard, { backgroundColor: colors.background }]}>
            <View style={styles.templateInfo}>
              <MaterialIcons name={template.icon as any} size={24} color={colors.primary} />
              <View style={styles.templateDetails}>
                <Text style={[styles.templateLabel, { color: colors.text }]}>
                  {template.label}
                </Text>
                <Text style={[styles.templateDescription, { color: colors.text + '80' }]}>
                  {template.description}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: colors.primary }]}
              onPress={() => handleTemplateDownload(template)}
            >
              <MaterialIcons name="file-download" size={20} color="white" />
              <Text style={styles.downloadButtonText}>{t('download')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* File Upload */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('uploadFile')}
        </Text>
        
        <TouchableOpacity
          style={[styles.uploadArea, { backgroundColor: colors.background, borderColor: colors.text + '30' }]}
          onPress={() => Alert.alert(t('selectFile'), t('fileSelectionComingSoon'))}
        >
          <MaterialIcons name="cloud-upload" size={48} color={colors.text + '50'} />
          <Text style={[styles.uploadText, { color: colors.text }]}>
            {t('clickToSelectFile')}
          </Text>
          <Text style={[styles.uploadSubtext, { color: colors.text + '80' }]}>
            {t('supportedFormats')}: Excel, CSV, JSON
          </Text>
        </TouchableOpacity>

        {importFile && (
          <View style={[styles.fileInfo, { backgroundColor: colors.background }]}>
            <MaterialIcons name="description" size={24} color={colors.primary} />
            <View style={styles.fileDetails}>
              <Text style={[styles.fileName, { color: colors.text }]}>
                {importFile.name}
              </Text>
              <Text style={[styles.fileSize, { color: colors.text + '80' }]}>
                {importFile.size}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setImportFile(null)}
              style={styles.removeFile}
            >
              <MaterialIcons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Import Button */}
      <TouchableOpacity
        style={[styles.importButton, { backgroundColor: colors.primary }]}
        onPress={handleImport}
        disabled={!importFile}
      >
        <MaterialIcons name="file-upload" size={24} color="white" />
        <Text style={styles.importButtonText}>
          {t('importData')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render history tab
  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingHistory')}...
          </Text>
        </View>
      ) : (
        <FlatList
          data={exportHistory}
          renderItem={({ item }) => (
            <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
              <View style={styles.historyHeader}>
                <View style={styles.historyInfo}>
                  <MaterialIcons
                    name={item.type === 'export' ? 'file-download' : 'file-upload'}
                    size={24}
                    color={item.type === 'export' ? '#4CAF50' : '#2196F3'}
                  />
                  <View style={styles.historyDetails}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>
                      {item.fileName}
                    </Text>
                    <Text style={[styles.historySubtitle, { color: colors.text + '80' }]}>
                      {item.dataType} • {item.format.toUpperCase()} • {item.date}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              
              <View style={styles.historyStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="storage" size={16} color={colors.text + '80'} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.size}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="list" size={16} color={colors.text + '80'} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.records} {t('records')}
                  </Text>
                </View>
              </View>

              <View style={styles.historyActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => onImportExportAction('download', item)}
                >
                  <MaterialIcons name="file-download" size={16} color="white" />
                  <Text style={styles.actionButtonText}>{t('download')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => onImportExportAction('view', item)}
                >
                  <MaterialIcons name="visibility" size={16} color="white" />
                  <Text style={styles.actionButtonText}>{t('view')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                  onPress={() => onImportExportAction('delete', item)}
                >
                  <MaterialIcons name="delete" size={16} color="white" />
                  <Text style={styles.actionButtonText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color={colors.text + '50'} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                {t('noHistoryFound')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? colors.primary : colors.text}
              />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.primary : colors.text }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'export' && renderExportTab()}
      {activeTab === 'import' && renderImportTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  formatCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formatLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  dataTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataTypeCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
  },
  dataTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  dataTypeCount: {
    fontSize: 12,
    marginLeft: 32,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateDetails: {
    marginLeft: 12,
    flex: 1,
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  uploadSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
  },
  removeFile: {
    padding: 4,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  historySubtitle: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  historyStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AdvancedClassImportExport; 
