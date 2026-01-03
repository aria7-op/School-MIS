import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import googleDriveService, { BillTemplate } from '../services/googleDriveService';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

const TemplateSelector: React.FC = () => {
  const { colors } = useTheme();
  const [currentTemplate, setCurrentTemplate] = useState<BillTemplate | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<BillTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templates = await googleDriveService.getAvailableTemplates();
      setAvailableTemplates(templates);
      
      const current = await googleDriveService.getCurrentTemplate();
      setCurrentTemplate(current);
    } catch (error: any) {
      
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: BillTemplate) => {
    try {
      await googleDriveService.setBillTemplate(template.fileId, template.name);
      setCurrentTemplate(template);
      Alert.alert('Success', `${template.name} has been set as the active template!`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCreateTemplate = () => {
    Alert.alert(
      'Create New Template',
      'Would you like to create a new bill template?',
      [
        {
          text: 'Upload Excel File',
          onPress: () => {
            // For web, trigger file upload
            if (typeof window !== 'undefined') {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    await googleDriveService.uploadTemplate(file);
                    loadTemplates();
                    Alert.alert('Success', 'Template uploaded successfully!');
                  } catch (error: any) {
                    Alert.alert('Error', error.message);
                  }
                }
              };
              input.click();
            } else {
              // For mobile, show instructions
              Alert.alert(
                'Upload Template',
                'Please upload an Excel file to your Google Drive and refresh this page to see it here.'
              );
            }
          },
        },
        {
          text: 'Use Default Template',
          onPress: async () => {
            try {
              await googleDriveService.createDefaultTemplate();
              loadTemplates();
              Alert.alert('Success', 'Default template created successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePreviewTemplate = (template: BillTemplate) => {
    if (typeof window !== 'undefined') {
      window.open(template.previewUrl, '_blank');
    } else {
      Alert.alert('Preview', 'Template preview is available on web version.');
    }
  };

  const handleDeleteTemplate = (template: BillTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await googleDriveService.deleteTemplate(template.fileId);
              loadTemplates();
              Alert.alert('Success', 'Template deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderCurrentTemplate = () => (
    <View style={[styles.currentTemplateCard, { backgroundColor: colors.card }]}>
      <View style={styles.currentTemplateHeader}>
        <Icon name="star" size={24} color="#ffd700" />
        <Text style={[styles.currentTemplateTitle, { color: colors.text }]}>
          Current Active Template
        </Text>
      </View>
      
      {currentTemplate ? (
        <View style={styles.templateInfo}>
          <Text style={[styles.templateName, { color: colors.text }]}>
            {currentTemplate.name}
          </Text>
          <Text style={[styles.templateDetails, { color: colors.text }]}>
            Created: {new Date(currentTemplate.createdTime).toLocaleDateString()}
          </Text>
          <Text style={[styles.templateDetails, { color: colors.text }]}>
            Size: {googleDriveService.formatFileSize(currentTemplate.size)}
          </Text>
        </View>
      ) : (
        <Text style={[styles.noTemplateText, { color: colors.text }]}>
          No template selected. Please select or create a template.
        </Text>
      )}
    </View>
  );

  const renderTemplateItem = (template: BillTemplate) => {
    const isActive = currentTemplate?.fileId === template.fileId;
    
    return (
      <View key={template.fileId} style={[styles.templateCard, { backgroundColor: colors.card }]}>
        <View style={styles.templateHeader}>
          <View style={styles.templateIcon}>
            <Icon name="description" size={24} color={colors.primary} />
          </View>
          
          <View style={styles.templateContent}>
            <Text style={[styles.templateName, { color: colors.text }]}>
              {template.name}
            </Text>
            <Text style={[styles.templateDetails, { color: colors.text }]}>
              {new Date(template.createdTime).toLocaleDateString()} • {googleDriveService.formatFileSize(template.size)}
            </Text>
          </View>
          
          {isActive && (
            <View style={styles.activeBadge}>
              <Icon name="check-circle" size={20} color="#4caf50" />
            </View>
          )}
        </View>
        
        <View style={styles.templateActions}>
          {!isActive && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleSelectTemplate(template)}
            >
              <Icon name="star" size={16} color="white" />
              <Text style={styles.actionButtonText}>Set Active</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.border }]}
            onPress={() => handlePreviewTemplate(template)}
          >
            <Icon name="visibility" size={16} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Preview</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f44336' }]}
            onPress={() => handleDeleteTemplate(template)}
          >
            <Icon name="delete" size={16} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="description" size={64} color={colors.text} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Templates Available
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.text }]}>
        Create your first bill template to get started with automated bill generation.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateTemplate}
      >
        <Icon name="add" size={20} color="white" />
        <Text style={styles.createButtonText}>Create Template</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Bill Template Management
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Select and manage your bill templates for automated generation
        </Text>
      </View>

      {renderCurrentTemplate()}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Templates
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateTemplate}
          >
            <Icon name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Template</Text>
          </TouchableOpacity>
        </View>

        {availableTemplates.length > 0 ? (
          <View style={styles.templatesList}>
            {availableTemplates.map(renderTemplateItem)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading templates...
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  currentTemplateCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentTemplateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTemplateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  templateInfo: {
    marginLeft: 32,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  noTemplateText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  templatesList: {
    gap: 12,
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    marginRight: 12,
  },
  templateContent: {
    flex: 1,
  },
  activeBadge: {
    marginLeft: 8,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TemplateSelector; 
