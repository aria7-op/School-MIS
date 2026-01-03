import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Skeleton,
  Progress,
  Avatar,
  Divider,
  ScrollView,
  Pressable,
  Center,
  Heading,
  SimpleGrid,
  Switch,
  Slider,
  useToast,
  Alert,
  Modal,
  useDisclose,
  Spinner,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface CacheTabProps {
  onClearCache: () => Promise<void>;
  getCacheStats: () => Promise<any>;
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const CacheTab: React.FC<CacheTabProps> = ({
  onClearCache,
  getCacheStats,
  selectedClass,
  onClassSelect,
  onRefresh,
  refreshing,
}) => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // State
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [cacheSize, setCacheSize] = useState(50);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Hooks
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclose();

  // Mock cache data
  const mockCacheStats = useMemo(() => ({
    totalSize: '45.2 MB',
    totalSizeBytes: 47420416,
    itemCount: 1247,
    hitRate: 89.5,
    missRate: 10.5,
    lastCleared: '2024-01-15T10:30:00Z',
    categories: {
      classes: { size: '12.3 MB', items: 342, hitRate: 92.1 },
      students: { size: '18.7 MB', items: 523, hitRate: 87.3 },
      attendance: { size: '8.4 MB', items: 234, hitRate: 91.2 },
      assignments: { size: '5.8 MB', items: 148, hitRate: 85.7 },
    },
    performance: {
      avgResponseTime: 120,
      cacheHits: 8950,
      cacheMisses: 1050,
      compressionRatio: 0.68,
    }
  }), []);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCacheStats(mockCacheStats);
    } catch (error) {
      toast.show({
        description: 'Failed to load cache statistics',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async (category?: string) => {
    setClearingCache(true);
    try {
      await onClearCache();
      toast.show({
        description: category ? `${category} cache cleared successfully` : 'All cache cleared successfully',
        status: 'success'
      });
      await loadCacheStats();
    } catch (error) {
      toast.show({
        description: 'Failed to clear cache',
        status: 'error'
      });
    } finally {
      setClearingCache(false);
      setShowClearModal(false);
    }
  };

  // Chart data
  const cacheUsageData = useMemo(() => ({
    labels: ['Classes', 'Students', 'Attendance', 'Assignments', 'Other'],
    datasets: [{
      data: [25, 38, 17, 12, 8]
    }]
  }), []);

  const performanceData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [89.5, 91.2, 87.8, 93.1, 88.9, 90.3, 92.4],
      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      strokeWidth: 3
    }]
  }), []);

  const chartConfig = {
    backgroundColor: cardBg,
    backgroundGradientFrom: cardBg,
    backgroundGradientTo: cardBg,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => useColorModeValue(`rgba(55, 65, 81, ${opacity})`, `rgba(229, 231, 235, ${opacity})`),
    style: { borderRadius: 16 },
  };

  // Render functions
  const renderCacheHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="md" color={textColor}>
            Cache Management
          </Heading>
          <Text color={mutedColor} fontSize="sm">
            Monitor and optimize application cache performance
          </Text>
        </VStack>
        <HStack space={2}>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onPress={() => setShowClearModal(true)}
            leftIcon={<Icon as={MaterialIcons} name="clear-all" size="sm" />}
            isLoading={clearingCache}
          >
            Clear Cache
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onPress={loadCacheStats}
            leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
            isLoading={loading}
          >
            Refresh
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );

  const renderCacheOverview = () => {
    if (loading) {
      return (
        <VStack space={3}>
          <Skeleton.Text lines={1} />
          <SimpleGrid columns={2} space={3}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} h="100" borderRadius="xl" />
            ))}
          </SimpleGrid>
        </VStack>
      );
    }

    if (!cacheStats) return null;

    return (
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Cache Overview</Heading>
        
        <SimpleGrid columns={2} space={3}>
          <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="xl">
            <VStack space={2} p={4} alignItems="center">
              <Icon as={MaterialIcons} name="storage" size="lg" color="blue.500" />
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {cacheStats.totalSize}
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Total Cache Size
              </Text>
            </VStack>
          </Card>

          <Card bg={useColorModeValue('green.50', 'green.900')} borderRadius="xl">
            <VStack space={2} p={4} alignItems="center">
              <Icon as={MaterialIcons} name="inventory" size="lg" color="green.500" />
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {cacheStats.itemCount.toLocaleString()}
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Cached Items
              </Text>
            </VStack>
          </Card>

          <Card bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="xl">
            <VStack space={2} p={4} alignItems="center">
              <Icon as={MaterialIcons} name="speed" size="lg" color="purple.500" />
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {cacheStats.hitRate}%
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Cache Hit Rate
              </Text>
            </VStack>
          </Card>

          <Card bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="xl">
            <VStack space={2} p={4} alignItems="center">
              <Icon as={MaterialIcons} name="timer" size="lg" color="orange.500" />
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {cacheStats.performance.avgResponseTime}ms
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Avg Response Time
              </Text>
            </VStack>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold" color={textColor}>Cache Health</Text>
              <Badge colorScheme="green" variant="solid" borderRadius="full">
                Excellent
              </Badge>
            </HStack>
            <Progress
              value={cacheStats.hitRate}
              size="lg"
              colorScheme="green"
            />
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color={mutedColor}>
                Hits: {cacheStats.performance.cacheHits.toLocaleString()}
              </Text>
              <Text fontSize="sm" color={mutedColor}>
                Misses: {cacheStats.performance.cacheMisses.toLocaleString()}
              </Text>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    );
  };

  const renderCacheCategories = () => {
    if (!cacheStats) return null;

    return (
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Cache Categories</Heading>
        
        <VStack space={3}>
          {Object.entries(cacheStats.categories).map(([category, data]: [string, any]) => (
            <Card key={category} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <VStack space={3} p={4}>
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Avatar
                      size="sm"
                      bg="blue.500"
                    >
                      <Icon
                        as={MaterialIcons}
                        name={
                          category === 'classes' ? 'school' :
                          category === 'students' ? 'people' :
                          category === 'attendance' ? 'event-available' :
                          category === 'assignments' ? 'assignment' : 'folder'
                        }
                        color="white"
                        size="sm"
                      />
                    </Avatar>
                    <VStack>
                      <Text fontWeight="bold" color={textColor} fontSize="md">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                      <Text fontSize="sm" color={mutedColor}>
                        {data.items} items • {data.size}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack alignItems="flex-end" space={1}>
                    <Badge
                      colorScheme={data.hitRate >= 90 ? 'green' : data.hitRate >= 80 ? 'orange' : 'red'}
                      variant="solid"
                      borderRadius="full"
                    >
                      {data.hitRate}%
                    </Badge>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      onPress={() => handleClearCache(category)}
                    >
                      Clear
                    </Button>
                  </VStack>
                </HStack>
                <Progress
                  value={data.hitRate}
                  size="sm"
                  colorScheme={data.hitRate >= 90 ? 'green' : data.hitRate >= 80 ? 'orange' : 'red'}
                />
              </VStack>
            </Card>
          ))}
        </VStack>
      </VStack>
    );
  };

  const renderCacheSettings = () => (
    <VStack space={4}>
      <Heading size="sm" color={textColor}>Cache Settings</Heading>
      
      <Card bg={cardBg} borderRadius="xl" p={4}>
        <VStack space={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack flex={1}>
              <Text fontWeight="medium" color={textColor}>Auto Cleanup</Text>
              <Text fontSize="sm" color={mutedColor}>
                Automatically clear old cache entries
              </Text>
            </VStack>
            <Switch
              isChecked={autoCleanup}
              onToggle={setAutoCleanup}
              colorScheme="blue"
            />
          </HStack>

          <Divider />

          <HStack justifyContent="space-between" alignItems="center">
            <VStack flex={1}>
              <Text fontWeight="medium" color={textColor}>Compression</Text>
              <Text fontSize="sm" color={mutedColor}>
                Enable cache compression to save space
              </Text>
            </VStack>
            <Switch
              isChecked={compressionEnabled}
              onToggle={setCompressionEnabled}
              colorScheme="blue"
            />
          </HStack>

          <Divider />

          <VStack space={3}>
            <HStack justifyContent="space-between">
              <Text fontWeight="medium" color={textColor}>Max Cache Size</Text>
              <Text fontSize="sm" color={textColor}>{cacheSize} MB</Text>
            </HStack>
            <Slider
              value={cacheSize}
              onChange={setCacheSize}
              minValue={10}
              maxValue={200}
              step={5}
              colorScheme="blue"
            >
              <Slider.Track>
                <Slider.FilledTrack />
              </Slider.Track>
              <Slider.Thumb />
            </Slider>
            <HStack justifyContent="space-between">
              <Text fontSize="xs" color={mutedColor}>10 MB</Text>
              <Text fontSize="xs" color={mutedColor}>200 MB</Text>
            </HStack>
          </VStack>
        </VStack>
      </Card>
    </VStack>
  );

  const renderPerformanceCharts = () => {
    if (!cacheStats) return null;

    return (
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Performance Analytics</Heading>
        
        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={3}>
            <Text fontWeight="bold" color={textColor}>Cache Hit Rate Trend</Text>
            <LineChart
              data={performanceData}
              width={chartWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </VStack>
        </Card>

        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={3}>
            <Text fontWeight="bold" color={textColor}>Storage Distribution</Text>
            <BarChart
              data={cacheUsageData}
              width={chartWidth - 64}
              height={200}
              chartConfig={chartConfig}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </VStack>
        </Card>
      </VStack>
    );
  };

  const renderCacheActions = () => (
    <VStack space={4}>
      <Heading size="sm" color={textColor}>Quick Actions</Heading>
      
      <SimpleGrid columns={2} space={3}>
        <Button
          colorScheme="blue"
          variant="outline"
          leftIcon={<Icon as={MaterialIcons} name="cached" size="sm" />}
          onPress={() => toast.show({ description: 'Cache preloaded', status: 'success' })}
        >
          Preload Cache
        </Button>
        
        <Button
          colorScheme="green"
          variant="outline"
          leftIcon={<Icon as={MaterialIcons} name="compress" size="sm" />}
          onPress={() => toast.show({ description: 'Cache optimized', status: 'success' })}
        >
          Optimize Cache
        </Button>
        
        <Button
          colorScheme="purple"
          variant="outline"
          leftIcon={<Icon as={MaterialIcons} name="download" size="sm" />}
          onPress={() => toast.show({ description: 'Cache exported', status: 'success' })}
        >
          Export Stats
        </Button>
        
        <Button
          colorScheme="orange"
          variant="outline"
          leftIcon={<Icon as={MaterialIcons} name="sync" size="sm" />}
          onPress={() => toast.show({ description: 'Cache synchronized', status: 'success' })}
        >
          Sync Cache
        </Button>
      </SimpleGrid>
    </VStack>
  );

  return (
    <ScrollView flex={1} bg={bgColor} showsVerticalScrollIndicator={false}>
      <VStack space={6} p={4} pb={8}>
        {renderCacheHeader()}
        {renderCacheOverview()}
        {renderCacheCategories()}
        {renderCacheSettings()}
        {renderPerformanceCharts()}
        {renderCacheActions()}
      </VStack>

      {/* Clear Cache Confirmation Modal */}
      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Clear Cache</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Alert status="warning" borderRadius="lg">
                <VStack space={2} flexShrink={1} w="100%">
                  <HStack flexShrink={1} space={2} alignItems="center">
                    <Alert.Icon />
                    <Text fontSize="md" fontWeight="medium">
                      Warning
                    </Text>
                  </HStack>
                  <Text fontSize="sm">
                    Clearing the cache will remove all stored data and may temporarily slow down the application while data is reloaded.
                  </Text>
                </VStack>
              </Alert>
              
              <Text>
                Are you sure you want to clear all cache data? This action cannot be undone.
              </Text>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="blueGray"
                onPress={() => setShowClearModal(false)}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onPress={() => handleClearCache()}
                isLoading={clearingCache}
              >
                Clear Cache
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default CacheTab; 
