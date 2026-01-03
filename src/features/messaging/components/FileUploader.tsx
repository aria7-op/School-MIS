import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface FileUploaderProps {
  onFileUploaded: (file: any) => void;
  onUploadError: (error: string) => void;
  onClose: () => void;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUploaded,
  onUploadError,
  onClose,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/*']
}) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (type: string) => {
    try {
      setUploading(true);
      
      // Simulate file selection and upload
      // In a real implementation, you would use a file picker library
      const mockFile = {
        name: `sample.${type}`,
        type: type,
        size: Math.random() * maxFileSize,
        uri: 'mock-uri'
      };

      // Validate file size
      if (mockFile.size > maxFileSize) {
        onUploadError('File size exceeds the maximum allowed size');
        return;
      }

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onFileUploaded(mockFile);
      onClose();
    } catch (error) {
      onUploadError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'videocam';
      case 'audio':
        return 'musical-notes';
      case 'document':
        return 'document';
      case 'camera':
        return 'camera';
      case 'gallery':
        return 'images';
      default:
        return 'document';
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return COLORS.primary;
      case 'video':
        return COLORS.error;
      case 'audio':
        return COLORS.warning;
      case 'document':
        return COLORS.info;
      case 'camera':
        return COLORS.success;
      case 'gallery':
        return COLORS.primary;
      default:
        return COLORS.secondary;
    }
  };

  const fileTypes = [
    { type: 'camera', label: 'Camera', description: 'Take a photo' },
    { type: 'gallery', label: 'Gallery', description: 'Choose from gallery' },
    { type: 'image', label: 'Images', description: 'Upload images' },
    { type: 'video', label: 'Videos', description: 'Upload videos' },
    { type: 'audio', label: 'Audio', description: 'Record or upload audio' },
    { type: 'document', label: 'Documents', description: 'Upload documents' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Upload File
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* File type options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose file type
          </Text>
          
          <View style={styles.fileTypeGrid}>
            {fileTypes.map((fileType) => (
              <TouchableOpacity
                key={fileType.type}
                style={[
                  styles.fileTypeItem,
                  { backgroundColor: colors.card, borderColor: colors.border }
                ]}
                onPress={() => handleFileSelect(fileType.type)}
                disabled={uploading}
              >
                <View style={[
                  styles.fileTypeIcon,
                  { backgroundColor: getFileTypeColor(fileType.type) }
                ]}>
                  <Ionicons 
                    name={getFileTypeIcon(fileType.type) as any} 
                    size={24} 
                    color="white" 
                  />
                </View>
                <Text style={[styles.fileTypeLabel, { color: colors.text }]}>
                  {fileType.label}
                </Text>
                <Text style={[styles.fileTypeDescription, { color: colors.textSecondary }]}>
                  {fileType.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upload Information
          </Text>
          
          <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Maximum file size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Files are encrypted and secure
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="cloud-upload" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Upload progress will be shown
              </Text>
            </View>
          </View>
        </View>

        {/* Loading state */}
        {uploading && (
          <View style={styles.loadingContainer}>
            <Ionicons name="cloud-upload" size={32} color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Uploading file...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: SPACING.sm,
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.md,
  },
  fileTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fileTypeItem: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fileTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  fileTypeLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
    textAlign: 'center',
  },
  fileTypeDescription: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
  infoContainer: {
    padding: SPACING.md,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.sm,
  },
});

export default FileUploader; 
