import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFileAccess } from '../hooks/useAccessControl';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

// Types
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  permissions: string[];
  isPublic: boolean;
  tags: string[];
}

export interface FileAccessLog {
  id: string;
  fileId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecureFileViewerProps {
  fileId: string;
  fileName?: string;
  onAccessGranted?: (fileInfo: FileInfo) => void;
  onAccessDenied?: (reason: string) => void;
  showAccessLog?: boolean;
  className?: string;
  style?: any;
}

// Secure File Viewer Component
export const SecureFileViewer: React.FC<SecureFileViewerProps> = ({
  fileId,
  fileName,
  onAccessGranted,
  onAccessDenied,
  showAccessLog = false,
  className,
  style,
}) => {
  const { user } = useAuth();
  const { hasAccess, loading, error } = useFileAccess(fileId, 'READ');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [accessLogs, setAccessLogs] = useState<FileAccessLog[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [context, setContext] = useState({
    deviceType: 'web',
    location: 'unknown',
    time: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  // Check file access on mount
  useEffect(() => {
    checkFileAccess();
  }, [fileId]);

  const checkFileAccess = useCallback(async () => {
    if (!user) return;

    try {
      // Update context with current information
      const currentContext = {
        ...context,
        time: new Date().toISOString(),
        userId: user.id,
        userRole: user.role,
      };
      setContext(currentContext);

      // Check file access with context
      const result = await apiService.checkFileAccess(fileId, 'READ', currentContext);
      
      if (result.allowed) {
        // Load file information
        await loadFileInfo();
        onAccessGranted?.(fileInfo!);
      } else {
        onAccessDenied?.(result.reason || 'Access denied');
      }
    } catch (err) {
      
      onAccessDenied?.('Access check failed');
    }
  }, [fileId, user, context, onAccessGranted, onAccessDenied]);

  const loadFileInfo = useCallback(async () => {
    try {
      const response = await apiService.get(`/files/${fileId}`);
      if (response.success) {
        setFileInfo(response.data);
      }
    } catch (err) {
      
    }
  }, [fileId]);

  const loadAccessLogs = useCallback(async () => {
    if (!showAccessLog) return;

    try {
      const response = await apiService.get(`/files/${fileId}/access-logs`);
      if (response.success) {
        setAccessLogs(response.data);
      }
    } catch (err) {
      
    }
  }, [fileId, showAccessLog]);

  const handleDownload = useCallback(async () => {
    if (!fileInfo) return;

    try {
      setIsDownloading(true);

      // Check download permission
      const downloadResult = await apiService.checkFileAccess(fileId, 'DOWNLOAD', context);
      if (!downloadResult.allowed) {
        Alert.alert('Access Denied', 'You do not have permission to download this file.');
        return;
      }

      // Log download access
      await apiService.post(`/files/${fileId}/access-logs`, {
        action: 'DOWNLOAD',
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context,
      });

      // Trigger download
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = fileInfo.url;
        link.download = fileInfo.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle mobile download
        Alert.alert('Download', 'File download started');
      }

      Alert.alert('Success', 'File downloaded successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  }, [fileInfo, fileId, context, user]);

  const handleShare = useCallback(async () => {
    if (!fileInfo) return;

    try {
      // Check share permission
      const shareResult = await apiService.checkFileAccess(fileId, 'SHARE', context);
      if (!shareResult.allowed) {
        Alert.alert('Access Denied', 'You do not have permission to share this file.');
        return;
      }

      // Log share access
      await apiService.post(`/files/${fileId}/access-logs`, {
        action: 'SHARE',
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context,
      });

      // Generate share link
      const shareResponse = await apiService.post(`/files/${fileId}/share`, {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        permissions: ['READ'],
      });

      if (shareResponse.success) {
        Alert.alert('Share Link', `Share link: ${shareResponse.data.shareUrl}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate share link');
    }
  }, [fileInfo, fileId, context, user]);

  const handleDelete = useCallback(async () => {
    if (!fileInfo) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this file? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check delete permission
              const deleteResult = await apiService.checkFileAccess(fileId, 'DELETE', context);
              if (!deleteResult.allowed) {
                Alert.alert('Access Denied', 'You do not have permission to delete this file.');
                return;
              }

              // Log delete access
              await apiService.post(`/files/${fileId}/access-logs`, {
                action: 'DELETE',
                userId: user?.id,
                timestamp: new Date().toISOString(),
                context,
              });

              // Delete file
              const response = await apiService.delete(`/files/${fileId}`);
              if (response.success) {
                Alert.alert('Success', 'File deleted successfully');
                // Trigger callback or navigation
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  }, [fileInfo, fileId, context, user]);

  // Loading state
  if (loading) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>Checking file access...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ fontSize: 18, color: '#D32F2F', marginBottom: 8 }}>Access Error</Text>
        <Text style={{ color: '#666', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: '#007AFF',
            borderRadius: 8,
          }}
          onPress={checkFileAccess}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ fontSize: 24, marginBottom: 8 }}>🚫</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Access Denied</Text>
        <Text style={{ color: '#666', textAlign: 'center', marginBottom: 16 }}>
          You don't have permission to view this file.
        </Text>
        <TouchableOpacity
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: '#007AFF',
            borderRadius: 8,
          }}
          onPress={() => onAccessDenied?.('Access denied')}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // File viewer
  return (
    <View style={[{ flex: 1 }, style]}>
      {/* File Header */}
      <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
          {fileInfo?.name || fileName || 'File Viewer'}
        </Text>
        
        {fileInfo && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Size: {(fileInfo.size / 1024 / 1024).toFixed(2)} MB
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Type: {fileInfo.type}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Uploaded: {new Date(fileInfo.uploadedAt).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{
                  padding: 8,
                  marginRight: 8,
                  borderRadius: 4,
                  backgroundColor: '#007AFF',
                }}
                onPress={handleDownload}
                disabled={isDownloading}
              >
                <Text style={{ fontSize: 12, color: 'white' }}>
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 8,
                  marginRight: 8,
                  borderRadius: 4,
                  backgroundColor: '#28A745',
                }}
                onPress={handleShare}
              >
                <Text style={{ fontSize: 12, color: 'white' }}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 8,
                  borderRadius: 4,
                  backgroundColor: '#FF3B30',
                }}
                onPress={handleDelete}
              >
                <Text style={{ fontSize: 12, color: 'white' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* File Content */}
      <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        {fileInfo && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>File Content</Text>
            
            {/* File type specific rendering */}
            {fileInfo.type.startsWith('image/') ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>Image preview not available</Text>
                <Text style={{ fontSize: 12, color: '#999' }}>Use download to view the image</Text>
              </View>
            ) : fileInfo.type.startsWith('text/') ? (
              <ScrollView style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, maxHeight: 300 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {fileContent || 'Loading file content...'}
                </Text>
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
                <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
                  Preview not available for this file type
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  Use the download button to access the file
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Access Logs */}
      {showAccessLog && accessLogs.length > 0 && (
        <View style={{ backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Access Logs</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {accessLogs.map((log) => (
              <View
                key={log.id}
                style={{
                  padding: 8,
                  marginBottom: 8,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600' }}>
                  {log.userName} - {log.action}
                </Text>
                <Text style={{ fontSize: 10, color: '#666' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default SecureFileViewer; 
