import { useState, useEffect, useCallback } from 'react';

interface SystemMetrics {
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    networkSpeed: number;
  };
  battery: {
    batteryLevel: number;
    isCharging: boolean;
  };
  storage: {
    totalSpace: number;
    usedSpace: number;
    freeSpace: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  };
  temperature: {
    cpu: number;
    gpu: number;
    ambient: number;
  };
}

interface PerformanceHistory {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  networkSpeed: number;
  batteryLevel: number;
  temperature: number;
}

interface UseSystemMonitorReturn {
  systemMetrics: SystemMetrics | null;
  performanceHistory: PerformanceHistory[];
  isLoading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

const useSystemMonitor = (): UseSystemMonitorReturn => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Generate mock system metrics
  const generateMockMetrics = useCallback((): SystemMetrics => {
    return {
      performance: {
        cpuUsage: Math.random() * 100,
        memoryUsage: 30 + Math.random() * 50,
        networkSpeed: Math.random() * 100,
      },
      battery: {
        batteryLevel: Math.random(),
        isCharging: Math.random() > 0.5,
      },
      storage: {
        totalSpace: 1000000000000, // 1TB
        usedSpace: Math.random() * 800000000000, // Up to 800GB
        freeSpace: Math.random() * 200000000000, // Up to 200GB
      },
      network: {
        downloadSpeed: Math.random() * 100,
        uploadSpeed: Math.random() * 50,
        latency: Math.random() * 100,
      },
      temperature: {
        cpu: 40 + Math.random() * 30,
        gpu: 35 + Math.random() * 25,
        ambient: 20 + Math.random() * 10,
      },
    };
  }, []);

  // Fetch initial system metrics
  const fetchSystemMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = generateMockMetrics();
      setSystemMetrics(metrics);

      // Add to performance history
      const historyEntry: PerformanceHistory = {
        timestamp: new Date().toISOString(),
        cpuUsage: metrics.performance.cpuUsage,
        memoryUsage: metrics.performance.memoryUsage,
        networkSpeed: metrics.performance.networkSpeed,
        batteryLevel: metrics.battery.batteryLevel * 100,
        temperature: metrics.temperature.cpu,
      };

      setPerformanceHistory(prev => {
        const newHistory = [...prev, historyEntry];
        // Keep only last 100 entries
        return newHistory.slice(-100);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system metrics');
    } finally {
      setIsLoading(false);
    }
  }, [generateMockMetrics]);

  // Start real-time monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    const interval = setInterval(() => {
      const metrics = generateMockMetrics();
      setSystemMetrics(metrics);

      // Add to performance history
      const historyEntry: PerformanceHistory = {
        timestamp: new Date().toISOString(),
        cpuUsage: metrics.performance.cpuUsage,
        memoryUsage: metrics.performance.memoryUsage,
        networkSpeed: metrics.performance.networkSpeed,
        batteryLevel: metrics.battery.batteryLevel * 100,
        temperature: metrics.temperature.cpu,
      };

      setPerformanceHistory(prev => {
        const newHistory = [...prev, historyEntry];
        // Keep only last 100 entries
        return newHistory.slice(-100);
      });
    }, 2000); // Update every 2 seconds

    setMonitoringInterval(interval);
  }, [isMonitoring, generateMockMetrics]);

  // Stop real-time monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    setIsMonitoring(false);
  }, [monitoringInterval]);

  // Refresh metrics manually
  const refreshMetrics = useCallback(async () => {
    await fetchSystemMetrics();
  }, [fetchSystemMetrics]);

  // Initialize on mount
  useEffect(() => {
    fetchSystemMetrics();
  }, [fetchSystemMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  return {
    systemMetrics,
    performanceHistory,
    isLoading,
    error,
    refreshMetrics,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  };
};

export default useSystemMonitor; 
