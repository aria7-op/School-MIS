import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, Dimensions, StatusBar, StyleSheet } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Input,
  Icon,
  useToast,
  Spinner,
  Heading,
  Divider,
  Center,
  Pressable,
  Modal,
  Fab,
  Select,
  CheckIcon,
  Avatar,
  Progress,
  Alert,
  CloseIcon,
  IconButton,
  useColorModeValue,
  Skeleton,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import advanced components
import AdvancedClassDashboard from '../components/AdvancedClassDashboard';
import ClassListTab from '../components/ClassListTab';
import AnalyticsTab from '../components/AnalyticsTab';
import StudentsTab from '../components/StudentsTab';
import SubjectsTab from '../components/SubjectsTab';
import TimetableTab from '../components/TimetableTab';
import ExamsTab from '../components/ExamsTab';
import AssignmentsTab from '../components/AssignmentsTab';
import AttendanceTab from '../components/AttendanceTab';
import PerformanceTab from '../components/PerformanceTab';
import BulkOperationsTab from '../components/BulkOperationsTab';
import ImportExportTab from '../components/ImportExportTab';
import CacheTab from '../components/CacheTab';
import ComingSoonTab from '../components/ComingSoonTab';
import CreateClassModal from '../components/CreateClassModal';
import ClassSearch from '../components/ClassSearch';

// Import hooks
import { useClassApi } from '../hooks/useClassApi';
import { useClassAnalytics } from '../hooks/useClassAnalytics';

// Import types
import { Class, ClassSearchParams } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 60,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    minWidth: 80,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
});

const ClassesScreen: React.FC = () => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Class[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Class[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<ClassSearchParams>({});
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'level' | 'section' | 'capacity' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Hooks
  const toast = useToast();
  
  const {
    classes,
    loading,
    error,
    stats,
    analytics,
    performance,
    createClass,
    updateClass,
    deleteClass,
    loadClasses,
    bulkCreateClasses,
    bulkUpdateClasses,
    bulkDeleteClasses,
    loadStats,
    loadAnalytics,
    loadPerformance,
    clearCache,
    getCacheStats,
  } = useClassApi();

  const {
    trends,
    comparisons,
    loading: analyticsLoading,
    loadAnalytics: refreshAnalytics,
  } = useClassAnalytics();

  // Effects
  useEffect(() => {
    loadClassesData();
  }, [filters, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    if (selectedClass) {
              refreshAnalytics({ period: '30d' });
    }
  }, [selectedClass]);

  // Data loading
  const loadClassesData = async () => {
    try {
      await loadClasses({ 
        ...filters, 
        search: searchQuery,
        sortBy,
        sortOrder,
        limit: 50
      });
    } catch (err) {
      
      toast.show({
        description: 'Failed to load classes',
        status: 'error'
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClassesData();
    if (selectedClass) {
      await refreshAnalytics(selectedClass.id);
    }
    setRefreshing(false);
  };

  // Class actions
  const handleClassSelect = (classItem: Class) => {
    setSelectedClass(classItem);
    if (activeTab === 'dashboard') {
      setActiveTab('students');
    }
  };

  const handleClassSave = async (classData: any) => {
    try {
      if (selectedClass) {
        await updateClass(selectedClass.id, classData);
        toast.show({
          description: 'Class updated successfully',
          status: 'success'
        });
      } else {
        await createClass(classData);
        toast.show({
          description: 'Class created successfully',
          status: 'success'
        });
      }
      setShowClassForm(false);
      setSelectedClass(null);
      loadClassesData();
    } catch (err) {
      
      toast.show({
        description: 'Failed to save class',
        status: 'error'
      });
    }
  };

  const handleClassDelete = async (classId: number) => {
    try {
      await deleteClass(classId);
      toast.show({
        description: 'Class deleted successfully',
        status: 'success'
      });
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
      loadClassesData();
    } catch (err) {
      
      toast.show({
        description: 'Failed to delete class',
        status: 'error'
      });
    }
  };

  const handleBulkAction = async (action: string, classIds: number[]) => {
    try {
      switch (action) {
        case 'delete':
          await bulkDeleteClasses(classIds);
          toast.show({
            description: `${classIds.length} classes deleted successfully`,
            status: 'success'
          });
          break;
        case 'export':
          // Handle export logic here
          toast.show({
            description: 'Classes exported successfully',
            status: 'success'
          });
          break;
        default:
          break;
      }
      setSelectedClasses([]);
      loadClassesData();
    } catch (err) {
      
      toast.show({
        description: 'Bulk action failed',
        status: 'error'
      });
    }
  };

  // Import/Export functions
  const handleImport = async (data: any) => {
    // Mock import function

  };

  const handleExport = async (options: any) => {
    // Mock export function

  };

  // Handle Class Creation
  const handleClassCreated = useCallback(() => {
    // Refresh the classes list after creation
    loadClassesData();
    toast.show({
      title: 'Success',
      description: 'Classes refreshed',
      status: 'success',
    });
  }, [loadClassesData, toast]);

  // Tab content renderer
  const renderTabContent = () => {
    const commonProps = {
      selectedClass,
      onClassSelect: handleClassSelect,
      onRefresh: handleRefresh,
      refreshing,
    };

    // Use search results when searching, otherwise use all classes
    const displayClasses = isSearching ? searchResults : classes;

    switch (activeTab) {
      case 'dashboard':
        return (
          <AdvancedClassDashboard
            classes={displayClasses}
            stats={stats}
            analytics={analytics}
            trends={trends}
            loading={loading || analyticsLoading}
            {...commonProps}
          />
        );
      case 'list':
        return (
          <ClassListTab
            classes={displayClasses}
            selectedClasses={selectedClasses}
            onClassesSelect={setSelectedClasses}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClassEdit={(classItem) => {
              setSelectedClass(classItem);
              setShowClassForm(true);
            }}
            onClassDelete={handleClassDelete}
            loading={loading}
            {...commonProps}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            analytics={analytics}
            trends={trends}
            comparisons={comparisons}
            loading={analyticsLoading}
            {...commonProps}
          />
        );
      case 'students':
        return (
          <StudentsTab
            {...commonProps}
          />
        );
      case 'subjects':
        return (
          <SubjectsTab
            {...commonProps}
          />
        );
      case 'timetable':
        return (
          <TimetableTab
            {...commonProps}
          />
        );
      case 'exams':
        return (
          <ExamsTab
            {...commonProps}
          />
        );
      case 'assignments':
        return (
          <AssignmentsTab
            {...commonProps}
          />
        );
      case 'attendance':
        return (
          <AttendanceTab
            {...commonProps}
          />
        );
      case 'performance':
        return (
          <PerformanceTab
            {...commonProps}
          />
        );
      case 'bulk':
        return (
          <BulkOperationsTab
            classes={displayClasses}
            selectedClasses={selectedClasses}
            onBulkAction={handleBulkAction}
            {...commonProps}
          />
        );
      case 'import-export':
        return (
          <ImportExportTab
            onImport={handleImport}
            onExport={handleExport}
            {...commonProps}
          />
        );
      case 'cache':
        return (
          <CacheTab
            onClearCache={clearCache}
            getCacheStats={getCacheStats}
            {...commonProps}
          />
        );
      default:
        return <ComingSoonTab tabName={activeTab} />;
    }
  };

  // Tab configuration
  const tabs = useMemo(() => [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', color: 'blue' },
    { key: 'list', label: 'Classes', icon: 'school', color: 'green' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics', color: 'purple' },
    { key: 'students', label: 'Students', icon: 'people', color: 'orange' },
    { key: 'subjects', label: 'Subjects', icon: 'book', color: 'red' },
    { key: 'timetable', label: 'Timetable', icon: 'schedule', color: 'cyan' },
    { key: 'exams', label: 'Exams', icon: 'assignment', color: 'yellow' },
    { key: 'assignments', label: 'Assignments', icon: 'assignment-turned-in', color: 'pink' },
    { key: 'attendance', label: 'Attendance', icon: 'event-available', color: 'teal' },
    { key: 'performance', label: 'Performance', icon: 'trending-up', color: 'indigo' },
    { key: 'bulk', label: 'Bulk Ops', icon: 'playlist-add-check', color: 'gray' },
    { key: 'import-export', label: 'Import/Export', icon: 'import-export', color: 'brown' },
    { key: 'cache', label: 'Cache', icon: 'cached', color: 'coolGray' },
  ], []);

  const renderTabs = () => (
    <Box bg={cardBg} borderBottomWidth={1} borderBottomColor={borderColor}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          // Use a color map for color names to hex if needed
          const colorMap = {
            blue: '#6366f1',
            green: '#10b981',
            purple: '#8b5cf6',
            orange: '#f59e0b',
            red: '#ef4444',
            cyan: '#06b6d4',
            yellow: '#facc15',
            pink: '#ec4899',
            teal: '#14b8a6',
            indigo: '#6366f1',
            gray: '#6b7280',
            brown: '#a16207',
            coolGray: '#64748b',
          };
          const tabColor = colorMap[tab.color] || tab.color;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              _pressed={{ opacity: 0.7 }}
            >
              <Badge
                colorScheme={isActive ? tab.color : 'gray'}
                variant={isActive ? 'solid' : 'outline'}
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                style={{
                  ...styles.tabChip,
                  ...(isActive && {
                    backgroundColor: tabColor,
                    borderColor: tabColor,
                  }),
                }}
              >
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name={tab.icon} size="sm" color={isActive ? 'white' : tabColor} />
                  <Text fontSize="sm" fontWeight="medium" style={isActive ? { color: 'white' } : { color: tabColor }}>
                    {tab.label}
                  </Text>
                </HStack>
              </Badge>
            </Pressable>
          );
        })}
      </ScrollView>
    </Box>
  );

  const renderHeader = () => (
    <Box bg={cardBg} borderBottomWidth={1} borderBottomColor={borderColor}>
      <VStack space={3} px={4} py={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="lg" color={textColor}>
              Classes Management
            </Heading>
            <Text color={mutedColor} fontSize="sm">
              {isSearching ? `${searchResults.length} of ${classes.length}` : classes.length} classes • {selectedClass ? selectedClass.name : 'No class selected'}
            </Text>
          </VStack>
          <HStack space={2}>
            {selectedClasses.length > 0 && (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onPress={() => setShowBulkActions(true)}
                leftIcon={<Icon as={MaterialIcons} name="more-vert" size="sm" />}
              >
                {selectedClasses.length} Selected
              </Button>
            )}
            <Button
              size="sm"
              colorScheme="blue"
              onPress={() => setShowClassForm(true)}
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
            >
              Add Class
            </Button>
          </HStack>
        </HStack>

        {selectedClass && (
          <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg">
            <HStack space={3} alignItems="center" p={3}>
              <Avatar
                size="md"
                bg="blue.500"
                source={{ uri: selectedClass.name }}
              >
                {selectedClass.name?.charAt(0) || 'C'}
              </Avatar>
              <VStack flex={1}>
                <Text fontWeight="bold" fontSize="md">
                  {selectedClass.name}
                </Text>
                <Text color={mutedColor} fontSize="sm">
                  Level {selectedClass.level} • {selectedClass.currentStudents || 0} students
                </Text>
              </VStack>
              <IconButton
                icon={<Icon as={MaterialIcons} name="close" />}
                onPress={() => setSelectedClass(null)}
                size="sm"
                variant="ghost"
              />
            </HStack>
          </Card>
        )}
      </VStack>
    </Box>
  );

  const renderSearchBar = () => (
    <ClassSearch
      onSearch={(results) => {
        setSearchResults(results);
        setIsSearching(true);
      }}
      onClear={() => {
        setSearchResults([]);
        setIsSearching(false);
      }}
      placeholder="Search classes by name, code, teacher, or level..."
      classes={classes}
      />
  );

  if (loading && classes.length === 0) {
    return (
      <Box flex={1} bg={bgColor}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <Center flex={1}>
          <VStack space={4} alignItems="center">
            <Spinner size="lg" color="blue.500" />
            <Text color={mutedColor}>Loading classes...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={bgColor}>
      <StatusBar barStyle="dark-content" />
      
      {renderHeader()}
      {renderSearchBar()}
      {renderTabs()}
      
      <Box flex={1}>
        <ScrollView
          flex={1}
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {renderTabContent()}
        </ScrollView>
      </Box>

      {/* FAB for quick actions */}
      <Fab
        renderInPortal={false}
        shadow={2}
        size="sm"
        icon={<Icon color="white" as={MaterialIcons} name="add" size="sm" />}
        onPress={() => setShowClassForm(true)}
        bg="blue.500"
        _pressed={{ bg: 'blue.600' }}
      />

      {/* Bulk Actions Modal */}
      <Modal isOpen={showBulkActions} onClose={() => setShowBulkActions(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Bulk Actions</Modal.Header>
          <Modal.Body>
            <VStack space={3}>
              <Button
                colorScheme="blue"
                variant="outline"
                onPress={() => {
                  handleBulkAction('export', selectedClasses.map(c => c.id));
                  setShowBulkActions(false);
                }}
                leftIcon={<Icon as={MaterialIcons} name="download" size="sm" />}
              >
                Export Selected
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onPress={() => {
                  handleBulkAction('delete', selectedClasses.map(c => c.id));
                  setShowBulkActions(false);
                }}
                leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
              >
                Delete Selected
              </Button>
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showClassForm}
        onClose={() => setShowClassForm(false)}
        onClassCreated={handleClassCreated}
      />

      {/* Error Alert */}
      {error && (
        <Alert w="100%" status="error" position="absolute" top={0}>
          <VStack space={2} flexShrink={1} w="100%">
            <HStack flexShrink={1} space={2} alignItems="center">
              <Alert.Icon />
              <Text fontSize="md" color="coolGray.800">
                {error}
              </Text>
            </HStack>
          </VStack>
        </Alert>
      )}
    </Box>
  );
};

export default ClassesScreen;
