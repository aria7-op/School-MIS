import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Mock data for now - we'll implement real device monitoring later
// Victory charts removed due to dependency issues - using mock data instead

interface SystemInfo {
  device: {
    brand: string;
    manufacturer: string;
    modelName: string;
    modelId: string;
    designName: string;
    productName: string;
    deviceYearClass: number;
    totalMemory: number;
    supportedCpuArchitectures: string[];
    osName: string;
    osVersion: string;
    osBuildId: string;
    osInternalBuildId: string;
    deviceName: string;
    deviceType: string;
    isDevice: boolean;
  };
  network: {
    isConnected: boolean;
    isInternetReachable: boolean;
    type: string;
    isConnectionExpensive: boolean;
    details: any;
  };
  battery: {
    batteryLevel: number;
    isCharging: boolean;
    isLowPowerModeEnabled: boolean;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    networkSpeed: number;
    timestamp: number;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number;
    heading: number;
    speed: number;
  };
  storage: {
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
  };
  sensors: {
    accelerometer: { x: number; y: number; z: number };
    gyroscope: { x: number; y: number; z: number };
    magnetometer: { x: number; y: number; z: number };
  };
}

interface PerformanceData {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  networkSpeed: number;
}

const SystemMonitor: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshRate, setRefreshRate] = useState(1000); // 1 second
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'device' | 'network'>('overview');

  // Performance monitoring interval
  useEffect(() => {
    let interval: number;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        updatePerformanceMetrics();
      }, refreshRate);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, refreshRate]);

  // Initialize system information
  useEffect(() => {
    initializeSystemInfo();
  }, []);

  const initializeSystemInfo = async () => {
    try {
      // Request permissions
      await requestPermissions();

      // Collect comprehensive device information
      const deviceInfo = await collectDeviceInfo();
      const networkInfo = await collectNetworkInfo();
      const batteryInfo = await collectBatteryInfo();
      const locationInfo = await collectLocationInfo();
      const storageInfo = await collectStorageInfo();
      const performanceInfo = await collectPerformanceInfo();

      setSystemInfo({
        device: deviceInfo,
        network: networkInfo,
        battery: batteryInfo,
        location: locationInfo,
        storage: storageInfo,
        performance: performanceInfo,
        sensors: { accelerometer: { x: 0, y: 0, z: 0 }, gyroscope: { x: 0, y: 0, z: 0 }, magnetometer: { x: 0, y: 0, z: 0 } }
      });

      // Start monitoring
      setIsMonitoring(true);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to initialize system monitoring');
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      for (const permission of permissions) {
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn(`Permission ${permission} not granted`);
        }
      }
    }
  };

  const collectDeviceInfo = async () => {
    return {
      brand: 'Unknown',
      manufacturer: 'Unknown',
      modelName: 'Unknown',
      modelId: 'Unknown',
      designName: 'Unknown',
      productName: 'Unknown',
      deviceYearClass: 0,
      totalMemory: 0,
      supportedCpuArchitectures: [],
      osName: 'Unknown',
      osVersion: 'Unknown',
      osBuildId: 'Unknown',
      osInternalBuildId: 'Unknown',
      deviceName: 'Unknown',
      deviceType: 'Unknown',
      isDevice: false,
    };
  };

  const collectNetworkInfo = async () => {
    return {
      isConnected: false,
      isInternetReachable: false,
      type: 'unknown',
      isConnectionExpensive: false,
      details: null,
    };
  };

  const collectBatteryInfo = async () => {
    return {
      batteryLevel: 0,
      isCharging: false,
      isLowPowerModeEnabled: false,
    };
  };

  const collectLocationInfo = async () => {
    return {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      altitude: 0,
      heading: 0,
      speed: 0,
    };
  };

  const collectStorageInfo = async () => {
    return {
      totalSpace: 0,
      freeSpace: 0,
      usedSpace: 0,
    };
  };

  const collectPerformanceInfo = async () => {
    // Simulate performance metrics since we can't get real CPU usage in React Native
    const memoryUsage = Math.random() * 100;
    const cpuUsage = Math.random() * 100;
    const networkSpeed = Math.random() * 100;
    
    return {
      memoryUsage,
      cpuUsage,
      networkSpeed,
      timestamp: Date.now(),
    };
  };

  const updatePerformanceMetrics = useCallback(async () => {
    if (!systemInfo) return;

    const performanceInfo = await collectPerformanceInfo();
    const newPerformanceData: PerformanceData = {
      timestamp: performanceInfo.timestamp,
      memoryUsage: performanceInfo.memoryUsage,
      cpuUsage: performanceInfo.cpuUsage,
      networkSpeed: performanceInfo.networkSpeed,
    };

    setPerformanceHistory(prev => {
      const updated = [...prev, newPerformanceData];
      // Keep only last 60 data points (1 minute at 1-second intervals)
      return updated.slice(-60);
    });

    setSystemInfo(prev => prev ? {
      ...prev,
      performance: performanceInfo,
    } : null);
  }, [systemInfo]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceChartData = useMemo(() => {
    return performanceHistory.map((data, index) => ({
      x: index,
      y: data.memoryUsage,
      timestamp: data.timestamp,
    }));
  }, [performanceHistory]);

  const getCpuChartData = useMemo(() => {
    return performanceHistory.map((data, index) => ({
      x: index,
      y: data.cpuUsage,
      timestamp: data.timestamp,
    }));
  }, [performanceHistory]);

  const getNetworkChartData = useMemo(() => {
    return performanceHistory.map((data, index) => ({
      x: index,
      y: data.networkSpeed,
      timestamp: data.timestamp,
    }));
  }, [performanceHistory]);

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.overviewGrid}>
        {/* Device Info Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="phone-android" size={24} color="white" />
            <Text style={styles.cardTitle}>Device Information</Text>
            <Text style={styles.cardSubtitle}>
              {systemInfo?.device.brand} {systemInfo?.device.modelName}
            </Text>
            <Text style={styles.cardText}>
              OS: {systemInfo?.device.osName} {systemInfo?.device.osVersion}
            </Text>
            <Text style={styles.cardText}>
              Memory: {formatBytes(systemInfo?.device.totalMemory || 0)}
            </Text>
          </LinearGradient>
        </View>

        {/* Performance Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.cardGradient}
          >
            <MaterialCommunityIcons name="speedometer" size={24} color="white" />
            <Text style={styles.cardTitle}>Performance</Text>
            <Text style={styles.cardSubtitle}>
              Memory: {formatPercentage(systemInfo?.performance.memoryUsage || 0)}
            </Text>
            <Text style={styles.cardText}>
              CPU: {formatPercentage(systemInfo?.performance.cpuUsage || 0)}
            </Text>
            <Text style={styles.cardText}>
              Network: {formatPercentage(systemInfo?.performance.networkSpeed || 0)}
            </Text>
          </LinearGradient>
        </View>

        {/* Battery Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.cardGradient}
          >
            <Ionicons name="battery-charging" size={24} color="white" />
            <Text style={styles.cardTitle}>Battery</Text>
            <Text style={styles.cardSubtitle}>
              {formatPercentage((systemInfo?.battery.batteryLevel || 0) * 100)}
            </Text>
            <Text style={styles.cardText}>
              {systemInfo?.battery.isCharging ? 'Charging' : 'Not Charging'}
            </Text>
            <Text style={styles.cardText}>
              {systemInfo?.battery.isLowPowerModeEnabled ? 'Low Power Mode' : 'Normal Mode'}
            </Text>
          </LinearGradient>
        </View>

        {/* Network Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="wifi" size={24} color="white" />
            <Text style={styles.cardTitle}>Network</Text>
            <Text style={styles.cardSubtitle}>
              {systemInfo?.network.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            <Text style={styles.cardText}>
              Type: {systemInfo?.network.type}
            </Text>
            <Text style={styles.cardText}>
              {systemInfo?.network.isInternetReachable ? 'Internet Available' : 'No Internet'}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Current Performance Metrics</Text>
        
        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Memory Usage:</Text>
            <Text style={styles.detailValue}>{formatPercentage(systemInfo?.performance.memoryUsage || 0)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CPU Usage:</Text>
            <Text style={styles.detailValue}>{formatPercentage(systemInfo?.performance.cpuUsage || 0)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network Speed:</Text>
            <Text style={styles.detailValue}>{formatPercentage(systemInfo?.performance.networkSpeed || 0)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>
              {systemInfo?.performance.timestamp ? new Date(systemInfo.performance.timestamp).toLocaleTimeString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance History</Text>
        <Text style={styles.detailLabel}>Recent data points: {performanceHistory.length}</Text>
        {performanceHistory.slice(-5).map((data, index) => (
          <View key={index} style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {new Date(data.timestamp).toLocaleTimeString()}:
            </Text>
            <Text style={styles.detailValue}>
              M: {formatPercentage(data.memoryUsage)} | C: {formatPercentage(data.cpuUsage)} | N: {formatPercentage(data.networkSpeed)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderDeviceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Hardware Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.brand}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Manufacturer:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.manufacturer}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Model:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.modelName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Product Name:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.productName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Device Year Class:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.deviceYearClass}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Memory:</Text>
          <Text style={styles.detailValue}>{formatBytes(systemInfo?.device.totalMemory || 0)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CPU Architectures:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.supportedCpuArchitectures.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Operating System</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>OS Name:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.osName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>OS Version:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.osVersion}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>OS Build ID:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.osBuildId}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Device Name:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.deviceName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Device Type:</Text>
          <Text style={styles.detailValue}>{systemInfo?.device.deviceType}</Text>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Storage Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Space:</Text>
          <Text style={styles.detailValue}>{formatBytes(systemInfo?.storage.totalSpace || 0)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Used Space:</Text>
          <Text style={styles.detailValue}>{formatBytes(systemInfo?.storage.usedSpace || 0)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Free Space:</Text>
          <Text style={styles.detailValue}>{formatBytes(systemInfo?.storage.freeSpace || 0)}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderNetworkTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Connected:</Text>
          <Text style={[styles.detailValue, { color: systemInfo?.network.isConnected ? '#4CAF50' : '#F44336' }]}>
            {systemInfo?.network.isConnected ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Internet Reachable:</Text>
          <Text style={[styles.detailValue, { color: systemInfo?.network.isInternetReachable ? '#4CAF50' : '#F44336' }]}>
            {systemInfo?.network.isInternetReachable ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Connection Type:</Text>
          <Text style={styles.detailValue}>{systemInfo?.network.type}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expensive Connection:</Text>
          <Text style={styles.detailValue}>
            {systemInfo?.network.isConnectionExpensive ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Location Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Latitude:</Text>
          <Text style={styles.detailValue}>{systemInfo?.location.latitude.toFixed(6)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Longitude:</Text>
          <Text style={styles.detailValue}>{systemInfo?.location.longitude.toFixed(6)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Accuracy:</Text>
          <Text style={styles.detailValue}>{systemInfo?.location.accuracy.toFixed(2)}m</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Altitude:</Text>
          <Text style={styles.detailValue}>{systemInfo?.location.altitude.toFixed(2)}m</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Heading:</Text>
          <Text style={styles.detailValue}>{systemInfo?.location.heading.toFixed(2)}°</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Speed:</Text>
          <Text style={styles.detailValue}>{systemInfo?.location.speed.toFixed(2)}m/s</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'performance':
        return renderPerformanceTab();
      case 'device':
        return renderDeviceTab();
      case 'network':
        return renderNetworkTab();
      default:
        return renderOverviewTab();
    }
  };

  if (!systemInfo) {
    return (
      <View style={styles.loadingContainer}>
        <View>
          <MaterialCommunityIcons name="loading" size={48} color="#667eea" />
          <Text style={styles.loadingText}>Initializing System Monitor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Monitor</Text>
        <View style={styles.headerControls}>
          <View style={styles.monitoringStatus}>
            <View style={[styles.statusDot, { backgroundColor: isMonitoring ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.statusText}>
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'performance', label: 'Performance', icon: 'speedometer' },
          { key: 'device', label: 'Device', icon: 'phone-android' },
          { key: 'network', label: 'Network', icon: 'wifi' },
        ].map((tab) => (
          <View
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.activeTabButton,
            ]}
            onTouchEnd={() => setSelectedTab(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.key ? '#667eea' : '#666'}
            />
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === tab.key && styles.activeTabButtonText,
              ]}
            >
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monitoringStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#f0f4ff',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default SystemMonitor; 
