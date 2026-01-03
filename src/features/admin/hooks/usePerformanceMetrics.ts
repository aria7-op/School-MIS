import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface PerformanceData {
  timestamp: string;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
}

interface StatisticalMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  outliers: PerformanceData[];
  trends: {
    slope: number;
    intercept: number;
    rSquared: number;
    forecast: Array<{ timestamp: string; value: number }>;
  };
}

interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  correlation: number;
  causalityScore: number;
  timeOffset: number;
  significance: number;
}

interface AnomalyDetection {
  timestamp: string;
  metric: string;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface PerformanceReport {
  period: string;
  metrics: Record<string, StatisticalMetrics>;
  anomalies: AnomalyDetection[];
  correlations: CorrelationAnalysis[];
  recommendations: Array<{
    metric: string;
    issue: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
    potentialGain: number;
  }>;
}

interface PerformanceFilter {
  startDate: Date;
  endDate: Date;
  metrics: string[];
  aggregation: 'hour' | 'day' | 'week' | 'month';
  confidenceLevel: number;
  outlierThreshold: number;
}

class StatisticalAnalyzer {
  private static calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private static calculateStandardDeviation(values: number[], mean: number): number {
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }

  private static calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private static detectOutliers(
    data: PerformanceData[],
    mean: number,
    stdDev: number,
    threshold: number
  ): PerformanceData[] {
    return data.filter(item => {
      const zScore = Math.abs((item.value - mean) / stdDev);
      return zScore > threshold;
    });
  }

  private static calculateLinearRegression(
    data: Array<{ x: number; y: number }>
  ): { slope: number; intercept: number; rSquared: number } {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const totalSS = data.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
    const regressionSS = data.reduce(
      (sum, point) => sum + Math.pow(slope * point.x + intercept - yMean, 2),
      0
    );
    const rSquared = regressionSS / totalSS;

    return { slope, intercept, rSquared };
  }

  static analyzeData(data: PerformanceData[], outlierThreshold: number): StatisticalMetrics {
    const values = data.map(item => item.value);
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values, mean);

    const timeSeriesData = data.map((item, index) => ({
      x: index,
      y: item.value,
    }));
    const regression = this.calculateLinearRegression(timeSeriesData);

    const forecast = Array.from({ length: 7 }, (_, i) => ({
      timestamp: format(addDays(new Date(), i), 'yyyy-MM-dd'),
      value: regression.slope * (timeSeriesData.length + i) + regression.intercept,
    }));

    return {
      mean,
      median: this.calculateMedian(values),
      standardDeviation: stdDev,
      percentiles: {
        p25: this.calculatePercentile(values, 25),
        p50: this.calculatePercentile(values, 50),
        p75: this.calculatePercentile(values, 75),
        p90: this.calculatePercentile(values, 90),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99),
      },
      outliers: this.detectOutliers(data, mean, stdDev, outlierThreshold),
      trends: {
        ...regression,
        forecast,
      },
    };
  }

  static calculateCorrelation(data1: number[], data2: number[]): number {
    const mean1 = this.calculateMean(data1);
    const mean2 = this.calculateMean(data2);
    const stdDev1 = this.calculateStandardDeviation(data1, mean1);
    const stdDev2 = this.calculateStandardDeviation(data2, mean2);

    const covariance = data1.reduce(
      (sum, val, i) => sum + (val - mean1) * (data2[i] - mean2),
      0
    ) / data1.length;

    return covariance / (stdDev1 * stdDev2);
  }
}

const usePerformanceMetrics = (initialFilter?: Partial<PerformanceFilter>) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<PerformanceFilter>({
    startDate: startOfDay(subDays(new Date(), 30)),
    endDate: endOfDay(new Date()),
    metrics: [],
    aggregation: 'day',
    confidenceLevel: 0.95,
    outlierThreshold: 2.5,
    ...initialFilter,
  });

  const {
    data: performanceData,
    isLoading,
    error,
  } = useQuery<PerformanceData[], Error>(
    ['performanceMetrics', filter],
    async () => {
      const response = await fetch('/api/admin/metrics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
      });
      if (!response.ok) throw new Error('Failed to fetch performance metrics');
      return response.json();
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const analyzedData = useMemo(() => {
    if (!performanceData) return null;

    const metricGroups = performanceData.reduce((groups, item) => {
      if (!groups[item.metric]) groups[item.metric] = [];
      groups[item.metric].push(item);
      return groups;
    }, {} as Record<string, PerformanceData[]>);

    const metrics = Object.entries(metricGroups).reduce(
      (result, [metric, data]) => {
        result[metric] = StatisticalAnalyzer.analyzeData(data, filter.outlierThreshold);
        return result;
      },
      {} as Record<string, StatisticalMetrics>
    );

    const correlations = Object.keys(metrics).flatMap(metric1 =>
      Object.keys(metrics)
        .filter(metric2 => metric1 < metric2)
        .map(metric2 => {
          const data1 = metricGroups[metric1].map(item => item.value);
          const data2 = metricGroups[metric2].map(item => item.value);
          return {
            metric1,
            metric2,
            correlation: StatisticalAnalyzer.calculateCorrelation(data1, data2),
            causalityScore: 0, // Would require more sophisticated analysis
            timeOffset: 0, // Would require time series analysis
            significance: 0.95, // Would require statistical testing
          };
        })
    );

    return {
      metrics,
      correlations,
      period: `${format(filter.startDate, 'yyyy-MM-dd')} to ${format(
        filter.endDate,
        'yyyy-MM-dd'
      )}`,
    };
  }, [performanceData, filter.outlierThreshold, filter.startDate, filter.endDate]);

  const generateReport = useCallback(async (): Promise<PerformanceReport> => {
    if (!analyzedData) throw new Error('No data available for report generation');

    const response = await fetch('/api/admin/metrics/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter,
        analyzedData,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate performance report');
    return response.json();
  }, [analyzedData, filter]);

  const exportData = useCallback(
    async (format: 'csv' | 'json' | 'pdf') => {
      if (!analyzedData) throw new Error('No data available for export');

      const response = await fetch(`/api/admin/metrics/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter,
          analyzedData,
        }),
      });

      if (!response.ok) throw new Error(`Failed to export data in ${format} format`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance_metrics_${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [analyzedData, filter]
  );

  return {
    filter,
    setFilter,
    performanceData,
    analyzedData,
    isLoading,
    error,
    generateReport,
    exportData,
  };
};

export default usePerformanceMetrics;
