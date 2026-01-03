import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Mock data for now - we'll implement real device monitoring later

// Victory charts removed due to dependency issues - using mock data instead

interface SystemSpecs {
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
  app: {
    applicationId: string;
    applicationName: string;
    nativeApplicationVersion: string;
    nativeBuildVersion: string;
    androidId: string;
    deviceName: string;
    deviceYearClass: number;
    isDevice: boolean;
    osVersion: string;
    platformApiLevel: number;
  };
  constants: {
    appOwnership: string;
    deviceName: string;
    deviceYearClass: number;
    isDevice: boolean;
    linkingUri: string;
    sessionId: string;
    statusBarHeight: number;
    systemFonts: string[];
    systemVersion: string;
  };
}

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  networkSpeed: number;
  batteryLevel: number;
  temperature: number;
}

const AdvancedSystemInfo: React.FC = () => {
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'hardware' | 'software' | 'performance' | 'network'>('hardware');
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    initializeSystemSpecs();
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(updatePerformanceMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const initializeSystemSpecs = async () => {
    try {
      const deviceInfo = await collectDeviceInfo();
      const appInfo = await collectAppInfo();
      const constantsInfo = await collectConstantsInfo();

      setSystemSpecs({
        device: deviceInfo,
        app: appInfo,
        constants: constantsInfo,
      });

      setIsMonitoring(true);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to initialize system information');
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

  const collectAppInfo = async () => {
    return {
      applicationId: 'Unknown',
      applicationName: 'Unknown',
      nativeApplicationVersion: 'Unknown',
      nativeBuildVersion: 'Unknown',
      androidId: 'Unknown',
      deviceName: 'Unknown',
      deviceYearClass: 0,
      isDevice: false,
      osVersion: 'Unknown',
      platformApiLevel: 0,
    };
  };

  const collectConstantsInfo = async () => {
    return {
      appOwnership: 'Unknown',
      deviceName: 'Unknown',
      deviceYearClass: 0,
      isDevice: false,
      linkingUri: 'Unknown',
      sessionId: 'Unknown',
      statusBarHeight: 0,
      systemFonts: [],
      systemVersion: 'Unknown',
    };
  };

  const updatePerformanceMetrics = () => {
    const newMetric: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 100,
      networkSpeed: Math.random() * 100,
      batteryLevel: Math.random() * 100,
      temperature: 20 + Math.random() * 40, // 20-60°C
    };

    setPerformanceMetrics(prev => {
      const updated = [...prev, newMetric];
      return updated.slice(-30); // Keep last 30 data points
    });
  };

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

  const renderHardwareSection = () => (
    <ScrollView style={styles.sectionContent}>
      <View>
        <View style={styles.specCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="memory" size={24} color="white" />
            <Text style={styles.cardTitle}>Hardware Specifications</Text>
          </LinearGradient>
          
          <View style={styles.specDetails}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Brand:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.brand}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Manufacturer:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.manufacturer}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Model:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.modelName}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Product Name:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.productName}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Device Year Class:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.deviceYearClass}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Total Memory:</Text>
              <Text style={styles.specValue}>{formatBytes(systemSpecs?.device.totalMemory || 0)}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>CPU Architectures:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.supportedCpuArchitectures.join(', ')}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Device Type:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.deviceType}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderSoftwareSection = () => (
    <ScrollView style={styles.sectionContent}>
      <View>
        <View style={styles.specCard}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="code" size={24} color="white" />
            <Text style={styles.cardTitle}>Software Information</Text>
          </LinearGradient>
          
          <View style={styles.specDetails}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>OS Name:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.osName}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>OS Version:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.osVersion}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>OS Build ID:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.osBuildId}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Application ID:</Text>
              <Text style={styles.specValue}>{systemSpecs?.app.applicationId}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>App Version:</Text>
              <Text style={styles.specValue}>{systemSpecs?.app.nativeApplicationVersion}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Build Version:</Text>
              <Text style={styles.specValue}>{systemSpecs?.app.nativeBuildVersion}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Platform API Level:</Text>
              <Text style={styles.specValue}>{systemSpecs?.app.platformApiLevel}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>System Version:</Text>
              <Text style={styles.specValue}>{systemSpecs?.constants.systemVersion}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceSection = () => (
    <ScrollView style={styles.sectionContent}>
      <View>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Real-time Performance Metrics</Text>
          
          <VictoryChart
            width={Dimensions.get('window').width - 40}
            height={200}
            padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
          >
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => `${t}%`}
              style={{ axis: { stroke: '#666' }, tickLabels: { fill: '#666' } }}
            />
            <VictoryAxis
              style={{ axis: { stroke: '#666' }, tickLabels: { fill: '#666' } }}
            />
            <VictoryArea
              data={performanceMetrics.map((metric, index) => ({
                x: index,
                y: metric.memoryUsage,
              }))}
              style={{
                data: {
                  fill: 'rgba(102, 126, 234, 0.3)',
                  stroke: '#667eea',
                  strokeWidth: 2,
                },
              }}
            />
          </VictoryChart>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="memory" size={24} color="#667eea" />
              <Text style={styles.metricLabel}>Memory Usage</Text>
              <Text style={styles.metricValue}>
                {formatPercentage(performanceMetrics[performanceMetrics.length - 1]?.memoryUsage || 0)}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="cpu-64-bit" size={24} color="#f093fb" />
              <Text style={styles.metricLabel}>CPU Usage</Text>
              <Text style={styles.metricValue}>
                {formatPercentage(performanceMetrics[performanceMetrics.length - 1]?.cpuUsage || 0)}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <MaterialIcons name="wifi" size={24} color="#43e97b" />
              <Text style={styles.metricLabel}>Network Speed</Text>
              <Text style={styles.metricValue}>
                {formatPercentage(performanceMetrics[performanceMetrics.length - 1]?.networkSpeed || 0)}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="thermometer" size={24} color="#ff6b6b" />
              <Text style={styles.metricLabel}>Temperature</Text>
              <Text style={styles.metricValue}>
                {performanceMetrics[performanceMetrics.length - 1]?.temperature.toFixed(1) || 0}°C
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderNetworkSection = () => (
    <ScrollView style={styles.sectionContent}>
      <View>
        <View style={styles.specCard}>
          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="wifi" size={24} color="white" />
            <Text style={styles.cardTitle}>Network & Connectivity</Text>
          </LinearGradient>
          
          <View style={styles.specDetails}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Device Name:</Text>
              <Text style={styles.specValue}>{systemSpecs?.device.deviceName}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Android ID:</Text>
              <Text style={styles.specValue}>{systemSpecs?.app.androidId}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Session ID:</Text>
              <Text style={styles.specValue}>{systemSpecs?.constants.sessionId}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Linking URI:</Text>
              <Text style={styles.specValue}>{systemSpecs?.constants.linkingUri}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Status Bar Height:</Text>
              <Text style={styles.specValue}>{systemSpecs?.constants.statusBarHeight}px</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>System Fonts:</Text>
              <Text style={styles.specValue}>{systemSpecs?.constants.systemFonts.length} fonts</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedCategory) {
      case 'hardware':
        return renderHardwareSection();
      case 'software':
        return renderSoftwareSection();
      case 'performance':
        return renderPerformanceSection();
      case 'network':
        return renderNetworkSection();
      default:
        return renderHardwareSection();
    }
  };

  if (!systemSpecs) {
    return (
      <View style={styles.loadingContainer}>
        <View>
          <MaterialCommunityIcons name="loading" size={48} color="#667eea" />
          <Text style={styles.loadingText}>Loading System Information...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Navigation */}
      <View style={styles.categoryNavigation}>
        {[
          { key: 'hardware', label: 'Hardware', icon: 'memory' },
          { key: 'software', label: 'Software', icon: 'code' },
          { key: 'performance', label: 'Performance', icon: 'speedometer' },
          { key: 'network', label: 'Network', icon: 'wifi' },
        ].map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.activeCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category.key as any)}
          >
            <MaterialIcons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.key ? '#667eea' : '#666'}
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.key && styles.activeCategoryButtonText,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  categoryNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  activeCategoryButton: {
    backgroundColor: '#f0f4ff',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  activeCategoryButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
  sectionContent: {
    flex: 1,
    padding: 20,
  },
  specCard: {
    backgroundColor: 'white',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  specDetails: {
    padding: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
});

export default AdvancedSystemInfo; 
