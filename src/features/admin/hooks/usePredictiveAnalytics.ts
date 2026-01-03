import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';

interface PredictionModel {
  modelId: string;
  type: 'classification' | 'regression' | 'clustering' | 'anomaly';
  target: string;
  features: string[];
  parameters: Record<string, any>;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    r2?: number;
    silhouetteScore?: number;
  };
  lastTrained: string;
  version: string;
}

interface Prediction {
  timestamp: string;
  modelId: string;
  input: Record<string, any>;
  output: {
    prediction: any;
    probability?: number;
    confidence: number;
    alternatives?: Array<{
      value: any;
      probability: number;
    }>;
  };
  feedback?: {
    actual: any;
    timestamp: string;
    accuracy: number;
  };
}

interface ModelTrainingConfig {
  modelId: string;
  parameters: {
    learningRate?: number;
    epochs?: number;
    batchSize?: number;
    optimizer?: string;
    layers?: Array<{
      type: string;
      units?: number;
      activation?: string;
    }>;
    regularization?: {
      type: string;
      value: number;
    };
  };
  validationSplit: number;
  earlyStoppingPatience: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  correlation: number;
  pValue: number;
}

interface ModelInsights {
  modelId: string;
  performance: {
    overall: number;
    bySegment: Record<string, number>;
    trend: Array<{
      timestamp: string;
      accuracy: number;
    }>;
  };
  featureImportance: FeatureImportance[];
  confusionMatrix?: number[][];
  rocCurve?: Array<{
    fpr: number;
    tpr: number;
    threshold: number;
  }>;
  predictionDistribution: {
    histogram: Array<{
      bin: string;
      count: number;
    }>;
    statistics: {
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
    };
  };
}

interface PredictiveAnalyticsConfig {
  modelsToTrack: string[];
  updateInterval: number;
  confidenceThreshold: number;
  maxPredictions: number;
}

class ModelAnalyzer {
  static calculateFeatureImportance(
    predictions: Prediction[],
    features: string[]
  ): FeatureImportance[] {
    const importance: FeatureImportance[] = features.map(feature => ({
      feature,
      importance: 0,
      correlation: 0,
      pValue: 0,
    }));

    // Simplified feature importance calculation
    predictions.forEach(prediction => {
      features.forEach((feature, index) => {
        const value = prediction.input[feature];
        const output = prediction.output.prediction;
        const correlation = this.calculateCorrelation([value], [output]);
        importance[index].correlation = correlation;
        importance[index].importance += Math.abs(correlation);
      });
    });

    // Normalize importance scores
    const totalImportance = importance.reduce((sum, feat) => sum + feat.importance, 0);
    importance.forEach(feat => {
      feat.importance /= totalImportance;
      // Simplified p-value calculation
      feat.pValue = 1 - Math.abs(feat.correlation);
    });

    return importance.sort((a, b) => b.importance - a.importance);
  }

  static calculateModelPerformance(
    predictions: Prediction[],
    segments?: Record<string, (p: Prediction) => boolean>
  ): ModelInsights['performance'] {
    const overall = predictions.reduce(
      (acc, p) => acc + (p.feedback?.accuracy || 0),
      0
    ) / predictions.length;

    const bySegment: Record<string, number> = {};
    if (segments) {
      Object.entries(segments).forEach(([segment, filter]) => {
        const segmentPredictions = predictions.filter(filter);
        bySegment[segment] =
          segmentPredictions.reduce((acc, p) => acc + (p.feedback?.accuracy || 0), 0) /
          segmentPredictions.length;
      });
    }

    const trend = this.calculatePerformanceTrend(predictions);

    return { overall, bySegment, trend };
  }

  private static calculatePerformanceTrend(
    predictions: Prediction[]
  ): Array<{ timestamp: string; accuracy: number }> {
    const sortedPredictions = [...predictions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const windowSize = Math.max(Math.floor(predictions.length / 10), 1);
    const trend: Array<{ timestamp: string; accuracy: number }> = [];

    for (let i = 0; i < sortedPredictions.length; i += windowSize) {
      const window = sortedPredictions.slice(i, i + windowSize);
      const accuracy =
        window.reduce((acc, p) => acc + (p.feedback?.accuracy || 0), 0) / window.length;
      trend.push({
        timestamp: window[0].timestamp,
        accuracy,
      });
    }

    return trend;
  }

  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    const covariance =
      x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / (n - 1);
    const stdX = Math.sqrt(
      x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0) / (n - 1)
    );
    const stdY = Math.sqrt(
      y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0) / (n - 1)
    );

    return covariance / (stdX * stdY);
  }
}

const usePredictiveAnalytics = (config: Partial<PredictiveAnalyticsConfig> = {}) => {
  const queryClient = useQueryClient();
  const [activeConfig, setActiveConfig] = useState<PredictiveAnalyticsConfig>({
    modelsToTrack: [],
    updateInterval: 5 * 60 * 1000, // 5 minutes
    confidenceThreshold: 0.8,
    maxPredictions: 1000,
    ...config,
  });

  const {
    data: modelData,
    isLoading,
    error,
  } = useQuery<{
    models: PredictionModel[];
    predictions: Prediction[];
  }>(
    ['predictiveAnalytics', activeConfig],
    async () => {
      const response = await fetch('/api/admin/analytics/predictive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeConfig),
      });
      if (!response.ok) throw new Error('Failed to fetch predictive analytics data');
      return response.json();
    },
    {
      refetchInterval: activeConfig.updateInterval,
      keepPreviousData: true,
    }
  );

  const trainModelMutation = useMutation(
    async (config: ModelTrainingConfig) => {
      const response = await fetch(`/api/admin/analytics/model/${config.modelId}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to train model');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['predictiveAnalytics']);
      },
    }
  );

  const insights = useMemo(() => {
    if (!modelData) return null;

    return modelData.models.map(model => {
      const modelPredictions = modelData.predictions.filter(p => p.modelId === model.modelId);
      return {
        modelId: model.modelId,
        performance: ModelAnalyzer.calculateModelPerformance(modelPredictions),
        featureImportance: ModelAnalyzer.calculateFeatureImportance(
          modelPredictions,
          model.features
        ),
        predictionDistribution: calculatePredictionDistribution(modelPredictions),
      } as ModelInsights;
    });
  }, [modelData]);

  const calculatePredictionDistribution = (predictions: Prediction[]) => {
    const values = predictions.map(p => p.output.prediction);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(values.length / 2)];
    const std = Math.sqrt(
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    );

    // Create histogram
    const binCount = 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount;
    const histogram = Array.from({ length: binCount }, (_, i) => ({
      bin: `${(min + i * binSize).toFixed(2)} - ${(min + (i + 1) * binSize).toFixed(2)}`,
      count: values.filter(
        v => v >= min + i * binSize && v < min + (i + 1) * binSize
      ).length,
    }));

    return {
      histogram,
      statistics: {
        mean,
        median,
        std,
        min,
        max,
      },
    };
  };

  const trainModel = useCallback(
    async (config: ModelTrainingConfig) => {
      await trainModelMutation.mutateAsync(config);
    },
    [trainModelMutation]
  );

  const generateReport = useCallback(async () => {
    if (!insights) throw new Error('No insights available for report generation');

    const response = await fetch('/api/admin/analytics/predictive/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: activeConfig,
        insights,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate predictive analytics report');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictive_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [insights, activeConfig]);

  return {
    config: activeConfig,
    setConfig: setActiveConfig,
    models: modelData?.models || [],
    predictions: modelData?.predictions || [],
    insights,
    isLoading,
    error,
    trainModel,
    generateReport,
  };
};

export default usePredictiveAnalytics;
