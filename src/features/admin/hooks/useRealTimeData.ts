import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';

interface RealTimeMetric {
  timestamp: string;
  value: number;
  type: string;
  source: string;
  metadata?: Record<string, any>;
}

interface RealTimeAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

interface WebSocketMessage {
  type: 'metric' | 'alert' | 'status' | 'error';
  payload: any;
  timestamp: string;
}

interface MetricThreshold {
  metric: string;
  min?: number;
  max?: number;
  criticalMin?: number;
  criticalMax?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

interface RealTimeDataConfig {
  bufferSize: number;
  updateInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  metricThresholds: MetricThreshold[];
  enableSSE?: boolean;
}

interface DataBuffer<T> {
  add(item: T): void;
  get(): T[];
  clear(): void;
  getLatest(): T | undefined;
  getByTimeRange(start: Date, end: Date): T[];
}

class CircularBuffer<T extends { timestamp: string }> implements DataBuffer<T> {
  private buffer: T[];
  private pointer: number;
  private readonly maxSize: number;

  constructor(size: number) {
    this.buffer = new Array<T>(size);
    this.pointer = 0;
    this.maxSize = size;
  }

  add(item: T): void {
    this.buffer[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.maxSize;
  }

  get(): T[] {
    return this.buffer.filter(Boolean);
  }

  clear(): void {
    this.buffer = new Array<T>(this.maxSize);
    this.pointer = 0;
  }

  getLatest(): T | undefined {
    const index = this.pointer === 0 ? this.maxSize - 1 : this.pointer - 1;
    return this.buffer[index];
  }

  getByTimeRange(start: Date, end: Date): T[] {
    return this.buffer.filter(item => {
      if (!item) return false;
      const timestamp = new Date(item.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }
}

interface UseRealTimeDataHook {
  metrics: RealTimeMetric[];
  alerts: RealTimeAlert[];
  isConnected: boolean;
  lastUpdate: Date | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  clearData: () => void;
  getMetricsByType: (type: string) => RealTimeMetric[];
  getAlertsBySeverity: (severity: RealTimeAlert['severity']) => RealTimeAlert[];
  getMetricsByTimeRange: (start: Date, end: Date) => RealTimeMetric[];
  setThreshold: (threshold: MetricThreshold) => void;
  exportData: (format: 'csv' | 'json') => Promise<void>;
}

const defaultConfig: RealTimeDataConfig = {
  bufferSize: 1000,
  updateInterval: 1000,
  reconnectAttempts: 5,
  reconnectDelay: 5000,
  metricThresholds: [],
  enableSSE: false,
};

const useRealTimeData = (config: Partial<RealTimeDataConfig> = {}): UseRealTimeDataHook => {
  const finalConfig = { ...defaultConfig, ...config };
  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const metricsBuffer = useRef(new CircularBuffer<RealTimeMetric>(finalConfig.bufferSize));
  const alertsBuffer = useRef(new CircularBuffer<RealTimeAlert>(finalConfig.bufferSize));

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const now = new Date();
    setLastUpdate(now);

    switch (message.type) {
      case 'metric':
        const metric: RealTimeMetric = {
          ...message.payload,
          timestamp: message.timestamp,
        };
        metricsBuffer.current.add(metric);

        // Check thresholds
        const threshold = finalConfig.metricThresholds.find(t => t.metric === metric.type);
        if (threshold) {
          if (
            (threshold.criticalMax && metric.value > threshold.criticalMax) ||
            (threshold.criticalMin && metric.value < threshold.criticalMin)
          ) {
            alertsBuffer.current.add({
              id: `${Date.now()}`,
              timestamp: message.timestamp,
              severity: 'critical',
              message: `Critical threshold exceeded for ${metric.type}`,
              source: metric.source,
              metadata: { value: metric.value, threshold },
            });
          } else if (
            (threshold.max && metric.value > threshold.max) ||
            (threshold.min && metric.value < threshold.min)
          ) {
            alertsBuffer.current.add({
              id: `${Date.now()}`,
              timestamp: message.timestamp,
              severity: 'warning',
              message: `Warning threshold exceeded for ${metric.type}`,
              source: metric.source,
              metadata: { value: metric.value, threshold },
            });
          }
        }
        break;

      case 'alert':
        alertsBuffer.current.add({
          ...message.payload,
          timestamp: message.timestamp,
        });
        break;

      case 'error':
        setError(new Error(message.payload.message));
        break;
    }
  }, [finalConfig.metricThresholds]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    if (finalConfig.enableSSE) {
      const sse = new EventSource('/api/admin/metrics/stream');
      sse.onmessage = (event) => handleMessage(JSON.parse(event.data));
      sse.onerror = () => {
        setConnectionStatus('error');
        setError(new Error('SSE connection failed'));
        sse.close();
      };
      sseRef.current = sse;
    } else {
      const ws = new WebSocket('wss://sapi.ariadeltatravel.com/admin/metrics/ws');

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => handleMessage(JSON.parse(event.data));

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        if (reconnectAttemptsRef.current < finalConfig.reconnectAttempts) {
          setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, finalConfig.reconnectDelay);
        }
      };

      ws.onerror = (event) => {
        setConnectionStatus('error');
        setError(new Error('WebSocket connection failed'));
      };

      wsRef.current = ws;
    }
  }, [finalConfig, handleMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const clearData = useCallback(() => {
    metricsBuffer.current.clear();
    alertsBuffer.current.clear();
    setLastUpdate(null);
  }, []);

  const getMetricsByType = useCallback((type: string) => {
    return metricsBuffer.current.get().filter(metric => metric.type === type);
  }, []);

  const getAlertsBySeverity = useCallback((severity: RealTimeAlert['severity']) => {
    return alertsBuffer.current.get().filter(alert => alert.severity === severity);
  }, []);

  const getMetricsByTimeRange = useCallback((start: Date, end: Date) => {
    return metricsBuffer.current.getByTimeRange(start, end);
  }, []);

  const setThreshold = useCallback((threshold: MetricThreshold) => {
    const index = finalConfig.metricThresholds.findIndex(t => t.metric === threshold.metric);
    if (index >= 0) {
      finalConfig.metricThresholds[index] = threshold;
    } else {
      finalConfig.metricThresholds.push(threshold);
    }
  }, [finalConfig]);

  const exportData = useCallback(async (format: 'csv' | 'json') => {
    const data = {
      metrics: metricsBuffer.current.get(),
      alerts: alertsBuffer.current.get(),
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      config: finalConfig,
    };

    const blob = new Blob(
      [format === 'csv' ? convertToCSV(data) : JSON.stringify(data, null, 2)],
      { type: `text/${format}` }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtime-data-export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [finalConfig]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    metrics: metricsBuffer.current.get(),
    alerts: alertsBuffer.current.get(),
    isConnected,
    lastUpdate,
    connectionStatus,
    error,
    connect,
    disconnect,
    clearData,
    getMetricsByType,
    getAlertsBySeverity,
    getMetricsByTimeRange,
    setThreshold,
    exportData,
  };
};

const convertToCSV = (data: any): string => {
  const replacer = (key: string, value: any) => value === null ? '' : value;
  const header = Object.keys(data.metrics[0] || {});
  const csv = [
    header.join(','),
    ...data.metrics.map((row: any) =>
      header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')
    )
  ].join('\r\n');
  return csv;
};

export default useRealTimeData;
