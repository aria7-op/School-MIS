import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Icon,
  useToast,
  Spinner,
  Divider,
  Badge,
  FlatList,
  Pressable,
  Modal,
  FormControl,
  Input,
  Select,
  Switch,
  Progress,
  Avatar,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import useCustomerApi from '../hooks/useCustomerApi';

interface Document {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  status: string;
  tags: string[];
  fileSize: number;
  mimeType: string;
  isPublic: boolean;
  isConfidential: boolean;
  expiryDate?: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  versions: Array<{
    id: string;
    versionNumber: number;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  _count: {
    versions: number;
    shares: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CustomerDocuments: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { getCustomerDocuments, uploadDocument, deleteDocument, getDocumentAnalytics } = useCustomerApi();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    tags: '',
    isPublic: false,
    isConfidential: false,
    expiryDate: ''
  });
  const toast = useToast();

  const documentTypes = [
    { label: 'Enrollment Form', value: 'enrollment_form', category: 'academic' },
    { label: 'Academic Record', value: 'academic_record', category: 'academic' },
    { label: 'Transcript', value: 'transcript', category: 'academic' },
    { label: 'Certificate', value: 'certificate', category: 'academic' },
    { label: 'Report Card', value: 'report_card', category: 'academic' },
    { label: 'ID Proof', value: 'id_proof', category: 'administrative' },
    { label: 'Birth Certificate', value: 'birth_certificate', category: 'administrative' },
    { label: 'Medical Record', value: 'medical_record', category: 'medical' },
    { label: 'Fee Structure', value: 'fee_structure', category: 'financial' },
    { label: 'Payment Receipt', value: 'payment_receipt', category: 'financial' },
    { label: 'Contract', value: 'contract', category: 'legal' },
    { label: 'Letter', value: 'letter', category: 'communication' },
    { label: 'Photo', value: 'photo', category: 'personal' },
    { label: 'Other', value: 'other', category: 'other' }
  ];

  const categoryOptions = [
    { label: 'Academic', value: 'academic' },
    { label: 'Administrative', value: 'administrative' },
    { label: 'Financial', value: 'financial' },
    { label: 'Communication', value: 'communication' },
    { label: 'Legal', value: 'legal' },
    { label: 'Medical', value: 'medical' },
    { label: 'Personal', value: 'personal' },
    { label: 'Other', value: 'other' }
  ];

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await getCustomerDocuments(customerId);
      setDocuments(response.data || []);
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to load documents',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getDocumentAnalytics();
      setAnalytics(response.data);
    } catch (error: any) {
      
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDocuments(), loadAnalytics()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDocuments();
    loadAnalytics();
  }, [customerId]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        // Auto-fill title if not provided
        if (!formData.title) {
          setFormData(prev => ({
            ...prev,
            title: result.assets[0].name.replace(/\.[^/.]+$/, '') // Remove extension
          }));
        }
      }
    } catch (error) {
      toast.show({
        description: 'Failed to pick document',
        status: 'error'
      });
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast.show({
        description: 'Please select a file',
        status: 'error'
      });
      return;
    }

    if (!formData.title || !formData.type) {
      toast.show({
        description: 'Title and type are required',
        status: 'error'
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        file: selectedFile
      };

      await uploadDocument(customerId, uploadData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.show({
        description: 'Document uploaded successfully',
        status: 'success'
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        type: '',
        category: '',
        tags: '',
        isPublic: false,
        isConfidential: false,
        expiryDate: ''
      });
      setUploadProgress(0);

      loadDocuments();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to upload document',
        status: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(customerId, documentId);
      toast.show({
        description: 'Document deleted successfully',
        status: 'success'
      });
      loadDocuments();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to delete document',
        status: 'error'
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending_review': return 'warning';
      case 'rejected': return 'error';
      case 'expired': return 'gray';
      default: return 'info';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'blue';
      case 'administrative': return 'purple';
      case 'financial': return 'green';
      case 'communication': return 'orange';
      case 'legal': return 'red';
      case 'medical': return 'pink';
      case 'personal': return 'gray';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocumentCard = ({ item }: { item: Document }) => (
    <Pressable onPress={() => handleViewDocument(item)}>
      <Card mb={3} borderRadius="lg" shadow={2}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack flex={1} space={1}>
              <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                {item.title}
              </Text>
              <Text fontSize="sm" color="coolGray.600" numberOfLines={2}>
                {item.description}
              </Text>
            </VStack>
            <VStack alignItems="flex-end" space={1}>
              <Badge colorScheme={getStatusColor(item.status)} variant="subtle">
                {item.status}
              </Badge>
              <Badge colorScheme={getCategoryColor(item.category)} variant="subtle">
                {item.category}
              </Badge>
            </VStack>
          </HStack>

          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="description" size="sm" color="coolGray.500" />
            <Text fontSize="xs" color="coolGray.500">
              {item.type.replace('_', ' ')}
            </Text>
            <Icon as={MaterialIcons} name="storage" size="sm" color="coolGray.500" />
            <Text fontSize="xs" color="coolGray.500">
              {formatFileSize(item.fileSize)}
            </Text>
          </HStack>

          <HStack space={3} alignItems="center">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="history" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                v{item._count.versions}
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="share" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.shares}
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="comment" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.comments}
              </Text>
            </HStack>
          </HStack>

          {item.tags.length > 0 && (
            <HStack space={1} flexWrap="wrap">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} size="xs" colorScheme="blue" variant="subtle">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Text fontSize="xs" color="coolGray.500">
                  +{item.tags.length - 3} more
                </Text>
              )}
            </HStack>
          )}

          <Divider />

          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={2} alignItems="center">
              <Avatar
                size="xs"
                source={{ uri: `https://ui-avatars.com/api/?name=${item.uploadedBy.firstName}+${item.uploadedBy.lastName}` }}
              >
                {item.uploadedBy.firstName[0]}{item.uploadedBy.lastName[0]}
              </Avatar>
              <Text fontSize="xs" color="coolGray.500">
                {item.uploadedBy.firstName} {item.uploadedBy.lastName}
              </Text>
            </HStack>
            <HStack space={2}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MaterialIcons} name="download" size="sm" />}
                onPress={() => {/* Handle download */}}
              >
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                colorScheme="red"
                leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                onPress={() => handleDeleteDocument(item.id)}
              >
                Delete
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  return (
    <Box flex={1} bg="coolGray.50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Box p={4}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color="coolGray.800">
                Documents
              </Text>
              <Text fontSize="sm" color="coolGray.600">
                Manage customer documents and files
              </Text>
            </VStack>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={MaterialIcons} name="upload-file" size="sm" />}
              onPress={() => setShowUploadModal(true)}
              size="sm"
            >
              Upload
            </Button>
          </HStack>

          {/* Statistics */}
          {analytics && (
            <HStack space={3} mb={4}>
              <Card flex={1} p={3} borderRadius="lg" bg="blue.50">
                <VStack alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {analytics.overview?.total || 0}
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    Total Documents
                  </Text>
                </VStack>
              </Card>
              <Card flex={1} p={3} borderRadius="lg" bg="green.50">
                <VStack alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {formatFileSize(analytics.overview?.storageUsage || 0)}
                  </Text>
                  <Text fontSize="xs" color="green.600">
                    Storage Used
                  </Text>
                </VStack>
              </Card>
              <Card flex={1} p={3} borderRadius="lg" bg="orange.50">
                <VStack alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                    {analytics.overview?.byCategory?.academic || 0}
                  </Text>
                  <Text fontSize="xs" color="orange.600">
                    Academic Docs
                  </Text>
                </VStack>
              </Card>
            </HStack>
          )}

          {/* Documents List */}
          {loading ? (
            <Box alignItems="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={2} color="coolGray.600">Loading documents...</Text>
            </Box>
          ) : documents.length === 0 ? (
            <Card p={8} borderRadius="lg" bg="white">
              <VStack alignItems="center" space={3}>
                <Icon as={MaterialIcons} name="folder-open" size="lg" color="coolGray.400" />
                <Text fontSize="lg" fontWeight="bold" color="coolGray.600">
                  No Documents Yet
                </Text>
                <Text fontSize="sm" color="coolGray.500" textAlign="center">
                  Upload documents related to this customer to keep everything organized
                </Text>
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={MaterialIcons} name="upload-file" size="sm" />}
                  onPress={() => setShowUploadModal(true)}
                >
                  Upload Document
                </Button>
              </VStack>
            </Card>
          ) : (
            <FlatList
              data={documents}
              renderItem={renderDocumentCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>
      </ScrollView>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Upload Document</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Select File</FormControl.Label>
                <Button
                  variant="outline"
                  leftIcon={<Icon as={MaterialIcons} name="attach-file" size="sm" />}
                  onPress={handlePickDocument}
                >
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
                {selectedFile && (
                  <Text fontSize="xs" color="coolGray.500" mt={1}>
                    {formatFileSize(selectedFile.size)} • {selectedFile.mimeType}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormControl.Label>Title</FormControl.Label>
                <Input
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter document title"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <Input
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter document description"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Type</FormControl.Label>
                <Select
                  selectedValue={formData.type}
                  onValueChange={(value) => {
                    const selectedType = documentTypes.find(type => type.value === value);
                    setFormData({ 
                      ...formData, 
                      type: value,
                      category: selectedType?.category || formData.category
                    });
                  }}
                  placeholder="Select document type"
                >
                  {documentTypes.map((type) => (
                    <Select.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Category</FormControl.Label>
                <Select
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  {categoryOptions.map((category) => (
                    <Select.Item key={category.value} label={category.label} value={category.value} />
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Tags</FormControl.Label>
                <Input
                  value={formData.tags}
                  onChangeText={(text) => setFormData({ ...formData, tags: text })}
                  placeholder="Enter tags separated by commas"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Expiry Date</FormControl.Label>
                <Input
                  value={formData.expiryDate}
                  onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
                  placeholder="YYYY-MM-DD (optional)"
                />
              </FormControl>

              <HStack space={4}>
                <FormControl flex={1}>
                  <FormControl.Label>Public</FormControl.Label>
                  <Switch
                    isChecked={formData.isPublic}
                    onToggle={(value) => setFormData({ ...formData, isPublic: value })}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label>Confidential</FormControl.Label>
                  <Switch
                    isChecked={formData.isConfidential}
                    onToggle={(value) => setFormData({ ...formData, isConfidential: value })}
                  />
                </FormControl>
              </HStack>

              {uploading && (
                <VStack space={2}>
                  <Text fontSize="sm" color="coolGray.600">Uploading...</Text>
                  <Progress value={uploadProgress} colorScheme="blue" />
                </VStack>
              )}
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onPress={handleUploadDocument}
                isLoading={uploading}
                isDisabled={!selectedFile}
              >
                Upload
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Document Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>
            {selectedDocument?.title}
          </Modal.Header>
          <Modal.Body>
            {selectedDocument && (
              <VStack space={4}>
                <VStack space={2}>
                  <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                    {selectedDocument.title}
                  </Text>
                  <Text fontSize="sm" color="coolGray.600">
                    {selectedDocument.description}
                  </Text>
                  <HStack space={2}>
                    <Badge colorScheme={getStatusColor(selectedDocument.status)}>
                      {selectedDocument.status}
                    </Badge>
                    <Badge colorScheme={getCategoryColor(selectedDocument.category)}>
                      {selectedDocument.category}
                    </Badge>
                  </HStack>
                </VStack>

                <Divider />

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    File Information
                  </Text>
                  <HStack space={4}>
                    <VStack>
                      <Text fontSize="xs" color="coolGray.500">Size</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {formatFileSize(selectedDocument.fileSize)}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="xs" color="coolGray.500">Type</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {selectedDocument.mimeType}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="xs" color="coolGray.500">Versions</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {selectedDocument._count.versions}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                <Divider />

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    Versions
                  </Text>
                  {selectedDocument.versions.map((version) => (
                    <HStack key={version.id} space={2} alignItems="center" bg="coolGray.50" p={2} borderRadius="md">
                      <VStack flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="coolGray.800">
                          Version {version.versionNumber}
                        </Text>
                        <Text fontSize="xs" color="coolGray.500">
                          {formatFileSize(version.fileSize)} • {new Date(version.createdAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <Button size="sm" variant="ghost">
                        Download
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            )}
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CustomerDocuments; 
