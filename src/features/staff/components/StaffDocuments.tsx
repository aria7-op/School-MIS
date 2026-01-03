import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { documentsApi } from '../services/staffApi';
import * as DocumentPicker from 'expo-document-picker';

const dummyDocuments = {
  documents: [
    {
      id: 1,
      title: 'Employment Contract',
      type: 'CONTRACT',
      category: 'Legal',
      fileUrl: 'https://example.com/contract.pdf',
      fileSize: 245760,
      uploadDate: '2024-01-15',
      expiryDate: '2025-01-15',
      status: 'ACTIVE',
      verifiedBy: 'HR Manager',
      verifiedAt: '2024-01-16',
      staffId: 1
    },
    {
      id: 2,
      title: 'Teaching Certificate',
      type: 'CERTIFICATE',
      category: 'Professional',
      fileUrl: 'https://example.com/certificate.pdf',
      fileSize: 102400,
      uploadDate: '2024-01-10',
      expiryDate: '2026-01-10',
      status: 'ACTIVE',
      verifiedBy: 'Admin',
      verifiedAt: '2024-01-11',
      staffId: 1
    },
    {
      id: 3,
      title: 'Background Check',
      type: 'VERIFICATION',
      category: 'Security',
      fileUrl: 'https://example.com/background.pdf',
      fileSize: 512000,
      uploadDate: '2024-01-05',
      expiryDate: '2025-01-05',
      status: 'PENDING_VERIFICATION',
      verifiedBy: null,
      verifiedAt: null,
      staffId: 1
    },
    {
      id: 4,
      title: 'Health Certificate',
      type: 'MEDICAL',
      category: 'Health',
      fileUrl: 'https://example.com/health.pdf',
      fileSize: 153600,
      uploadDate: '2024-01-20',
      expiryDate: '2024-07-20',
      status: 'EXPIRED',
      verifiedBy: 'Medical Officer',
      verifiedAt: '2024-01-21',
      staffId: 1
    }
  ],
  categories: [
    { id: 1, name: 'Legal', color: '#ef4444' },
    { id: 2, name: 'Professional', color: '#3b82f6' },
    { id: 3, name: 'Security', color: '#10b981' },
    { id: 4, name: 'Health', color: '#f59e0b' },
    { id: 5, name: 'Training', color: '#8b5cf6' },
    { id: 6, name: 'Performance', color: '#06b6d4' }
  ],
  expiringDocuments: [
    { id: 4, title: 'Health Certificate', daysUntilExpiry: 5 },
    { id: 5, title: 'First Aid Certificate', daysUntilExpiry: 12 },
    { id: 6, title: 'Fire Safety Training', daysUntilExpiry: 18 }
  ]
};

const StaffDocuments: React.FC = () => {
  const [documents, setDocuments] = useState(dummyDocuments.documents);
  const [categories, setCategories] = useState(dummyDocuments.categories);
  const [expiringDocuments, setExpiringDocuments] = useState(dummyDocuments.expiringDocuments);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usingDummyData, setUsingDummyData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    category: '',
    type: '',
    description: ''
  });

  // ======================
  // DATA LOADING
  // ======================

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const [docsResponse, categoriesResponse, expiringResponse] = await Promise.all([
        documentsApi.getStaffDocuments('1'),
        documentsApi.getDocumentCategories('1'),
        documentsApi.getExpiringDocuments('1')
      ]);
      
      setDocuments(docsResponse.data);
      setCategories(categoriesResponse.data);
      setExpiringDocuments(expiringResponse.data);
      setUsingDummyData(false);
    } catch (error) {
      
      setUsingDummyData(true);
      setDocuments(dummyDocuments.documents);
      setCategories(dummyDocuments.categories);
      setExpiringDocuments(dummyDocuments.expiringDocuments);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  // ======================
  // DOCUMENT OPERATIONS
  // ======================

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          type: result.mimeType,
          name: result.name,
        } as any);
        formData.append('title', uploadData.title);
        formData.append('category', uploadData.category);
        formData.append('type', uploadData.type);
        formData.append('description', uploadData.description);

        const response = await documentsApi.uploadStaffDocument('1', formData);
        setDocuments(prev => [...prev, response.data]);
        setShowUploadModal(false);
        setUploadData({ title: '', category: '', type: '', description: '' });
        Alert.alert('Success', 'Document uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const handleVerifyDocument = async (documentId: string) => {
    try {
      const response = await documentsApi.verifyStaffDocument('1', { documentId });
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? response.data : doc
      ));
      setShowVerifyModal(false);
      setSelectedDocument(null);
      Alert.alert('Success', 'Document verified successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to verify document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentsApi.deleteStaffDocument('1', documentId);
              setDocuments(prev => prev.filter(doc => doc.id !== documentId));
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  // ======================
  // FILTERING & SEARCH
  // ======================

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ======================
  // RENDER FUNCTIONS
  // ======================

  const renderDummyDataNotification = () => {
    if (!usingDummyData) return null;
    
    return (
      <View style={styles.dummyDataNotification}>
        <MaterialIcons name="info" size={16} color="#f59e0b" />
        <Text style={styles.dummyDataText}>Showing sample data due to connection issues</Text>
      </View>
    );
  };

  const renderSearchAndFilters = () => (
    <View style={styles.searchSection}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search documents..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[styles.filterChip, selectedCategory === category.name && styles.filterChipActive]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[styles.filterChipText, selectedCategory === category.name && styles.filterChipTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.statusFilters}>
        <TouchableOpacity
          style={[styles.statusChip, selectedStatus === 'all' && styles.statusChipActive]}
          onPress={() => setSelectedStatus('all')}
        >
          <Text style={[styles.statusChipText, selectedStatus === 'all' && styles.statusChipTextActive]}>
            All Status
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, selectedStatus === 'ACTIVE' && styles.statusChipActive]}
          onPress={() => setSelectedStatus('ACTIVE')}
        >
          <Text style={[styles.statusChipText, selectedStatus === 'ACTIVE' && styles.statusChipTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, selectedStatus === 'PENDING_VERIFICATION' && styles.statusChipActive]}
          onPress={() => setSelectedStatus('PENDING_VERIFICATION')}
        >
          <Text style={[styles.statusChipText, selectedStatus === 'PENDING_VERIFICATION' && styles.statusChipTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, selectedStatus === 'EXPIRED' && styles.statusChipActive]}
          onPress={() => setSelectedStatus('EXPIRED')}
        >
          <Text style={[styles.statusChipText, selectedStatus === 'EXPIRED' && styles.statusChipTextActive]}>
            Expired
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDocumentCard = ({ item }: { item: any }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE': return '#10b981';
        case 'PENDING_VERIFICATION': return '#f59e0b';
        case 'EXPIRED': return '#ef4444';
        default: return '#6b7280';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'check-circle';
        case 'PENDING_VERIFICATION': return 'schedule';
        case 'EXPIRED': return 'warning';
        default: return 'help';
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const daysUntilExpiry = item.expiryDate ? 
      Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{item.title}</Text>
            <Text style={styles.documentCategory}>{item.category}</Text>
          </View>
          <View style={styles.documentStatus}>
            <MaterialIcons 
              name={getStatusIcon(item.status) as any} 
              size={20} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        <View style={styles.documentDetails}>
          <Text style={styles.documentMeta}>Size: {formatFileSize(item.fileSize)}</Text>
          <Text style={styles.documentMeta}>Uploaded: {new Date(item.uploadDate).toLocaleDateString()}</Text>
          {item.expiryDate && (
            <Text style={[
              styles.documentMeta, 
              daysUntilExpiry <= 30 && { color: '#ef4444', fontWeight: 'bold' }
            ]}>
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
              {daysUntilExpiry !== null && ` (${daysUntilExpiry} days)`}
            </Text>
          )}
          {item.verifiedBy && (
            <Text style={styles.documentMeta}>Verified by: {item.verifiedBy}</Text>
          )}
        </View>

        <View style={styles.documentActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <MaterialIcons name="visibility" size={16} color="#3b82f6" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          {item.status === 'PENDING_VERIFICATION' && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setSelectedDocument(item);
                setShowVerifyModal(true);
              }}
            >
              <MaterialIcons name="verified" size={16} color="#10b981" />
              <Text style={styles.actionButtonText}>Verify</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleDeleteDocument(item.id)}
          >
            <MaterialIcons name="delete" size={16} color="#ef4444" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderExpiringDocuments = () => {
    if (expiringDocuments.length === 0) return null;

    return (
      <View style={styles.expiringSection}>
        <Text style={styles.sectionTitle}>⚠️ Expiring Documents</Text>
        {expiringDocuments.map(doc => (
          <View key={doc.id} style={styles.expiringCard}>
            <Text style={styles.expiringTitle}>{doc.title}</Text>
            <Text style={styles.expiringDays}>
              Expires in {doc.daysUntilExpiry} days
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderUploadModal = () => (
    <Modal visible={showUploadModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Upload Document</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Document Title"
            value={uploadData.title}
            onChangeText={(text) => setUploadData(prev => ({ ...prev, title: text }))}
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Category"
            value={uploadData.category}
            onChangeText={(text) => setUploadData(prev => ({ ...prev, category: text }))}
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Type"
            value={uploadData.type}
            onChangeText={(text) => setUploadData(prev => ({ ...prev, type: text }))}
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Description"
            value={uploadData.description}
            onChangeText={(text) => setUploadData(prev => ({ ...prev, description: text }))}
            multiline
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowUploadModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonPrimary]} 
              onPress={handleUploadDocument}
            >
              <Text style={styles.modalButtonTextPrimary}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderVerifyModal = () => (
    <Modal visible={showVerifyModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Verify Document</Text>
          <Text style={styles.modalText}>
            Are you sure you want to verify "{selectedDocument?.title}"?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowVerifyModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonPrimary]} 
              onPress={() => handleVerifyDocument(selectedDocument?.id)}
            >
              <Text style={styles.modalButtonTextPrimary}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderDummyDataNotification()}
      
      <View style={styles.header}>
        <Text style={styles.title}>Staff Documents</Text>
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={() => setShowUploadModal(true)}
        >
          <MaterialIcons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {renderSearchAndFilters()}
      {renderExpiringDocuments()}

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="folder-open" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No documents found</Text>
          </View>
        }
      />

      {renderUploadModal()}
      {renderVerifyModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#6b7280' },
  dummyDataNotification: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fef3c7', 
    padding: 12, 
    margin: 16,
    borderRadius: 8 
  },
  dummyDataText: { marginLeft: 8, color: '#92400e', fontSize: 14 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  uploadButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#3b82f6', 
    padding: 8, 
    borderRadius: 8 
  },
  uploadButtonText: { marginLeft: 4, color: '#fff', fontWeight: '600' },
  searchSection: { padding: 16, backgroundColor: '#fff' },
  searchInput: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  filtersRow: { marginBottom: 12 },
  filterChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: '#f3f4f6', 
    marginRight: 8 
  },
  filterChipActive: { backgroundColor: '#3b82f6' },
  filterChipText: { color: '#6b7280', fontSize: 14 },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  statusFilters: { flexDirection: 'row' },
  statusChip: { 
    flex: 1, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: '#f3f4f6', 
    marginHorizontal: 2,
    alignItems: 'center'
  },
  statusChipActive: { backgroundColor: '#3b82f6' },
  statusChipText: { color: '#6b7280', fontSize: 12 },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },
  expiringSection: { padding: 16, backgroundColor: '#fef2f2' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#dc2626' },
  expiringCard: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  expiringTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  expiringDays: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  documentCard: { 
    backgroundColor: '#fff', 
    margin: 8, 
    borderRadius: 12, 
    padding: 16,
    elevation: 2
  },
  documentHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12
  },
  documentInfo: { flex: 1 },
  documentTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  documentCategory: { fontSize: 14, color: '#6b7280' },
  documentStatus: { alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  documentDetails: { marginBottom: 12 },
  documentMeta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  documentActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8 
  },
  actionButtonText: { marginLeft: 4, fontSize: 14, color: '#6b7280' },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 48 
  },
  emptyStateText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#9ca3af', 
    textAlign: 'center' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modal: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    width: 320 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalText: { fontSize: 16, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  modalInput: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 8, 
    marginHorizontal: 4, 
    borderWidth: 1, 
    borderColor: '#d1d5db' 
  },
  modalButtonPrimary: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  modalButtonText: { textAlign: 'center', color: '#6b7280', fontWeight: '600' },
  modalButtonTextPrimary: { textAlign: 'center', color: '#fff', fontWeight: '600' },
});

export default StaffDocuments; 
