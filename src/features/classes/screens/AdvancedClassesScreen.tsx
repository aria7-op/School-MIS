import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, Dimensions, StatusBar } from 'react-native';
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
  Actionsheet,
  useDisclose,
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

// Import hooks
import { useClassApi } from '../hooks/useClassApi';
import { useClassAnalytics } from '../hooks/useClassAnalytics';

// Import types
import { Class, ClassFilters } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AdvancedClassesScreen: React.FC = () => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Class[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<ClassFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Hooks
  const toast = useToast();
  const { isOpen: isActionSheetOpen, onOpen: onActionSheetOpen, onClose: onActionSheetClose } = useDisclose();
  
  const {
    loading,
    error,
    getClasses,
    createClass,
    updateClass,
    deleteClass,
    getClassStats,
    getClassAnalytics,
    getClassPerformance,
    bulkCreateClasses,
    bulkUpdateClasses,
    bulkDeleteClasses,
    assignTeacher,
    assignStudents,
    removeStudents,
    clearCache,
    getCacheStats,
    exportClasses,
    importClasses,
    stats: apiStats,
    analytics: apiAnalytics,
    performance: apiPerformance,
  } = useClassApi();

  const {
    stats,
    analytics,
    trends,
    comparisons,
    loading: analyticsLoading,
    refreshAnalytics,
  } = useClassAnalytics();

  // Effects
  useEffect(() => {
    loadClasses();
  }, [filters, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    if (selectedClass) {
      refreshAnalytics(selectedClass.id);
    }
  }, [selectedClass, refreshAnalytics]);

  // Data loading
  const loadClasses = async () => {
    try {

      const response = await getClasses({ 
        ...filters, 
        search: searchQuery,
        sortBy,
        sortOrder,
        limit: 50
      });

      if (response && response.data) {
                // Use the data as-is since student counts should come from the class API response
        const enrichedClasses = response.data.map((classItem: any) => ({
          ...classItem,
          studentsCount: classItem._count?.students || classItem.studentsCount || 0
        }));

        setClasses(enrichedClasses);
      } else {

        setClasses([]);
      }
    } catch (err) {
      
      setClasses([]);
      toast.show({
        description: 'Failed to load classes',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
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

  const handleClassSave = async (classData: Partial<Class>) => {
    try {
      if (selectedClass) {
        await updateClass(selectedClass.id, classData);
        toast.show({
          description: 'Class updated successfully',
        });
      } else {
        await createClass(classData as any);
        toast.show({
          description: 'Class created successfully',
        });
      }
      setShowClassForm(false);
      setSelectedClass(null);
      loadClasses();
    } catch (err) {
      
      toast.show({
        description: 'Failed to save class',
      });
    }
  };

  const handleClassDelete = async (classId: number) => {
    try {
      await deleteClass(classId);
      toast.show({
        description: 'Class deleted successfully',
      });
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
      loadClasses();
    } catch (err) {
      
      toast.show({
        description: 'Failed to delete class',
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
          });
          break;
        case 'export':
          await exportClasses({ classIds });
          toast.show({
            description: 'Classes exported successfully',
          });
          break;
        default:
          break;
      }
      setSelectedClasses([]);
      loadClasses();
    } catch (err) {
      
      toast.show({
        description: 'Bulk action failed',
      });
    }
  };

  // Tab content renderer
  const renderTabContent = () => {
    const commonProps = {
      selectedClass,
      onClassSelect: handleClassSelect,
      onRefresh: handleRefresh,
      refreshing,
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <AdvancedClassDashboard
            classes={classes}
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
            classes={classes}
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
            stats={stats}
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
            classes={classes}
            selectedClasses={selectedClasses}
            onBulkAction={handleBulkAction}
            {...commonProps}
          />
        );
      case 'import-export':
        return (
          <ImportExportTab
            onImport={async (data: any) => {
              const result = await importClasses(data);
              return; // Convert boolean to void
            }}
            onExport={async (options: any) => {
              const result = await exportClasses(options);
              return; // Convert boolean to void
            }}
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space={1} px={4} py={3}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              _pressed={{ opacity: 0.7 }}
            >
              <Badge
                colorScheme={activeTab === tab.key ? tab.color : 'gray'}
                variant={activeTab === tab.key ? 'solid' : 'outline'}
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
              >
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name={tab.icon} size="sm" />
                  <Text fontSize="sm" fontWeight="medium">
                    {tab.label}
                  </Text>
                </HStack>
              </Badge>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Box>
  );

  const renderHeader = () => (
    <Box bg={cardBg} borderBottomWidth={1} borderBottomColor={borderColor}>
      <VStack space={3} px={4} py={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="lg" color={textColor}>
              Class Management
            </Heading>
            <Text color={mutedColor} fontSize="sm">
              {classes.length} classes • {selectedClass ? selectedClass.name : 'No class selected'}
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
                source={selectedClass.avatar ? { uri: selectedClass.avatar } : undefined}
              >
                {selectedClass.name?.charAt(0) || 'C'}
              </Avatar>
              <VStack flex={1}>
                <Text fontWeight="bold" fontSize="md">
                  {selectedClass.name}
                </Text>
                <Text color={mutedColor} fontSize="sm">
                  Level {selectedClass.level} • {selectedClass.studentsCount || selectedClass._count?.students || 0} students
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

  const renderStats = () => {
    if (!stats) return null;

    return (
      <Box bg={cardBg} borderBottomWidth={1} borderBottomColor={borderColor}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space={4} px={4} py={3}>
            <Card minW="120" bg={useColorModeValue('green.50', 'green.900')}>
              <VStack space={1} p={3} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {stats.totalClasses || 0}
                </Text>
                <Text fontSize="xs" color={mutedColor} textAlign="center">
                  Total Classes
                </Text>
              </VStack>
            </Card>
            <Card minW="120" bg={useColorModeValue('blue.50', 'blue.900')}>
              <VStack space={1} p={3} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {stats.totalStudents || 0}
                </Text>
                <Text fontSize="xs" color={mutedColor} textAlign="center">
                  Total Students
                </Text>
              </VStack>
            </Card>
            <Card minW="120" bg={useColorModeValue('purple.50', 'purple.900')}>
              <VStack space={1} p={3} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {stats.averageAttendance || 0}%
                </Text>
                <Text fontSize="xs" color={mutedColor} textAlign="center">
                  Avg Attendance
                </Text>
              </VStack>
            </Card>
            <Card minW="120" bg={useColorModeValue('orange.50', 'orange.900')}>
              <VStack space={1} p={3} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {stats.averageGrade || 0}
                </Text>
                <Text fontSize="xs" color={mutedColor} textAlign="center">
                  Avg Grade
                </Text>
              </VStack>
            </Card>
          </HStack>
        </ScrollView>
      </Box>
    );
  };

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
      {renderStats()}
      {renderTabs()}
      
      <Box flex={1}>
        <ScrollView
          showsVerticalScrollIndicator={false}
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

      {/* Action Sheet for bulk actions */}
      <Actionsheet isOpen={isActionSheetOpen} onClose={onActionSheetClose}>
        <Actionsheet.Content>
          <Actionsheet.Item
            onPress={() => {
              handleBulkAction('export', selectedClasses.map(c => c.id));
              onActionSheetClose();
            }}
          >
            Export Selected
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              handleBulkAction('delete', selectedClasses.map(c => c.id));
              onActionSheetClose();
            }}
          >
            Delete Selected
          </Actionsheet.Item>
        </Actionsheet.Content>
      </Actionsheet>

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

export default AdvancedClassesScreen; 
