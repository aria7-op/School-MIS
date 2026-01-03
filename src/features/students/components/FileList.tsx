import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import googleDriveService, { GoogleDriveFile } from '../services/googleDriveService';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

const FileList: React.FC = () => {
  const { colors } = useTheme();
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await googleDriveService.listExcelFiles();
      setFiles(fileList);
    } catch (error: any) {
      
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleFilePress = (file: GoogleDriveFile) => {
    Alert.alert(
      'File Options',
      `What would you like to do with "${file.name}"?`,
      [
        {
          text: 'View in Drive',
          onPress: () => {
            // Open file in Google Drive
            if (typeof window !== 'undefined') {
              window.open(file.webViewLink, '_blank');
            }
          },
        },
        {
          text: 'Set as Template',
          onPress: () => handleSetAsTemplate(file),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSetAsTemplate = async (file: GoogleDriveFile) => {
    try {
      await googleDriveService.setBillTemplate(file.id, file.name);
      Alert.alert('Success', `${file.name} has been set as the bill template!`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderFileItem = ({ item }: { item: GoogleDriveFile }) => (
    <TouchableOpacity
      style={[styles.fileCard, { backgroundColor: colors.card }]}
      onPress={() => handleFilePress(item)}
    >
      <View style={styles.fileIcon}>
        <Icon name="description" size={32} color={colors.primary} />
      </View>
      
      <View style={styles.fileContent}>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        
        <View style={styles.fileDetails}>
          <View style={styles.fileDetail}>
            <Icon name="storage" size={14} color={colors.text} />
            <Text style={[styles.fileDetailText, { color: colors.text }]}>
              {googleDriveService.formatFileSize(item.size)}
            </Text>
          </View>
          
          <View style={styles.fileDetail}>
            <Icon name="schedule" size={14} color={colors.text} />
            <Text style={[styles.fileDetailText, { color: colors.text }]}>
              {new Date(item.modifiedTime).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSetAsTemplate(item)}
        >
          <Icon name="star" size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.border }]}
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open(item.webViewLink, '_blank');
            }
          }}
        >
          <Icon name="open-in-new" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="folder-open" size={64} color={colors.text} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Excel Files Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.text }]}>
        Upload Excel files to your Google Drive to see them here.
      </Text>
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: colors.primary }]}
        onPress={loadFiles}
      >
        <Icon name="refresh" size={20} color="white" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Excel Files in Google Drive
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Select a file to set as your bill template
        </Text>
      </View>

      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading files...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  listContainer: {
    paddingBottom: 20,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileIcon: {
    marginRight: 16,
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  fileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileDetailText: {
    fontSize: 12,
    opacity: 0.7,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
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

export default FileList; 
