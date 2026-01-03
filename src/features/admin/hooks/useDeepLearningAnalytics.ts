import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

interface NeuralNetworkLayer {
  type: 'dense' | 'conv2d' | 'lstm' | 'attention' | 'transformer';
  units?: number;
  kernelSize?: [number, number];
  activation?: string;
  dropout?: number;
  attentionHeads?: number;
  parameters: number;
  outputShape: number[];
}

interface DeepLearningModel {
  modelId: string;
  architecture: {
    type: 'feedforward' | 'cnn' | 'rnn' | 'transformer';
    layers: NeuralNetworkLayer[];
    totalParameters: number;
    inputShape: number[];
    outputShape: number[];
  };
  training: {
    epochs: number;
    batchSize: number;
    optimizer: string;
    learningRate: number;
    lossFunction: string;
    regularization?: {
      type: string;
      value: number;
    };
  };
  performance: {
    trainLoss: number[];
    validationLoss: number[];
    trainAccuracy: number[];
    validationAccuracy: number[];
    bestEpoch: number;
    convergenceTime: number;
  };
  gradients: {
    mean: number;
    variance: number;
    maxNorm: number;
    layerGradients: Record<string, {
      mean: number;
      variance: number;
    }>;
  };
}

interface LayerActivation {
  layerName: string;
  activations: number[][];
  statistics: {
    mean: number;
    std: number;
    sparsity: number;
  };
  visualizations?: {
    type: 'heatmap' | 'featureMap';
    data: number[][];
  };
}

interface AttentionPattern {
  layer: string;
  head: number;
  pattern: number[][];
  statistics: {
    entropy: number;
    focus: number;
  };
}

interface ModelOptimization {
  technique: 'pruning' | 'quantization' | 'distillation';
  parameters: Record<string, any>;
  results: {
    sizeReduction: number;
    speedup: number;
    accuracyDrop: number;
  };
}

interface DeepLearningConfig {
  modelIds: string[];
  updateInterval: number;
  monitoredMetrics: string[];
  visualizationSettings: {
    showGradients: boolean;
    showActivations: boolean;
    showAttention: boolean;
  };
}

class DeepLearningAnalyzer {
  static analyzeGradients(model: DeepLearningModel): {
    stability: number;
    healthScore: number;
    recommendations: string[];
  } {
    const { gradients } = model;
    const stability = 1 / (1 + gradients.variance);
    const healthScore = Math.min(
      1,
      (stability * (1 - Math.abs(gradients.mean))) / gradients.maxNorm
    );

    const recommendations: string[] = [];
    if (gradients.variance > 1) {
      recommendations.push('Consider gradient clipping to stabilize training');
    }
    if (gradients.maxNorm > 10) {
      recommendations.push('Reduce learning rate to prevent exploding gradients');
    }
    if (Object.values(gradients.layerGradients).some(g => g.variance > 2)) {
      recommendations.push('Add batch normalization to problematic layers');
    }

    return { stability, healthScore, recommendations };
  }

  static analyzeConvergence(model: DeepLearningModel): {
    convergenceRate: number;
    isOverfitting: boolean;
    suggestions: string[];
  } {
    const { performance } = model;
    const convergenceRate =
      (performance.trainLoss[0] - performance.trainLoss[performance.bestEpoch]) /
      performance.bestEpoch;

    const validationGap = performance.validationLoss.map(
      (val, i) => val - performance.trainLoss[i]
    );
    const isOverfitting =
      validationGap[performance.bestEpoch] > 2 * validationGap[0];

    const suggestions: string[] = [];
    if (convergenceRate < 0.01) {
      suggestions.push('Increase learning rate to speed up convergence');
    }
    if (isOverfitting) {
      suggestions.push('Add dropout or regularization to prevent overfitting');
    }

    return { convergenceRate, isOverfitting, suggestions };
  }

  static calculateLayerEfficiency(model: DeepLearningModel): Record<string, {
    efficiency: number;
    bottleneck: boolean;
  }> {
    const efficiency: Record<string, { efficiency: number; bottleneck: boolean }> = {};
    let maxParams = 0;
    let maxTime = 0;

    model.architecture.layers.forEach((layer, i) => {
      const paramRatio = layer.parameters / model.architecture.totalParameters;
      const timeEstimate = this.estimateLayerComputeTime(layer);
      maxParams = Math.max(maxParams, paramRatio);
      maxTime = Math.max(maxTime, timeEstimate);

      efficiency[`layer_${i}`] = {
        efficiency: 1 - (paramRatio + timeEstimate) / 2,
        bottleneck: false,
      };
    });

    // Identify bottlenecks
    Object.entries(efficiency).forEach(([layer, stats]) => {
      efficiency[layer].bottleneck = stats.efficiency < 0.3;
    });

    return efficiency;
  }

  private static estimateLayerComputeTime(layer: NeuralNetworkLayer): number {
    // Simplified compute time estimation based on layer type and parameters
    switch (layer.type) {
      case 'conv2d':
        return (layer.parameters * (layer.kernelSize?.[0] || 1)) / 1e6;
      case 'transformer':
        return (layer.parameters * (layer.attentionHeads || 1)) / 1e6;
      default:
        return layer.parameters / 1e6;
    }
  }
}

const useDeepLearningAnalytics = (config: Partial<DeepLearningConfig> = {}) => {
  const queryClient = useQueryClient();
  const [activeConfig, setActiveConfig] = useState<DeepLearningConfig>({
    modelIds: [],
    updateInterval: 10000,
    monitoredMetrics: ['loss', 'accuracy', 'gradients'],
    visualizationSettings: {
      showGradients: true,
      showActivations: true,
      showAttention: true,
    },
    ...config,
  });

  const {
    data: modelsData,
    isLoading,
    error,
  } = useQuery<{
    models: DeepLearningModel[];
    activations: LayerActivation[];
    attentionPatterns: AttentionPattern[];
  }>(
    ['deepLearningAnalytics', activeConfig],
    async () => {
      const response = await fetch('/api/admin/analytics/deep-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeConfig),
      });
      if (!response.ok) throw new Error('Failed to fetch deep learning analytics');
      return response.json();
    },
    {
      refetchInterval: activeConfig.updateInterval,
      keepPreviousData: true,
    }
  );

  const optimizeModelMutation = useMutation(
    async (optimization: ModelOptimization) => {
      const response = await fetch('/api/admin/analytics/deep-learning/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimization),
      });
      if (!response.ok) throw new Error('Failed to optimize model');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deepLearningAnalytics']);
      },
    }
  );

  const analyses = useMemo(() => {
    if (!modelsData?.models) return null;

    return modelsData.models.map(model => ({
      modelId: model.modelId,
      gradientAnalysis: DeepLearningAnalyzer.analyzeGradients(model),
      convergenceAnalysis: DeepLearningAnalyzer.analyzeConvergence(model),
      layerEfficiency: DeepLearningAnalyzer.calculateLayerEfficiency(model),
    }));
  }, [modelsData?.models]);

  const generateReport = useCallback(async () => {
    if (!analyses || !modelsData) {
      throw new Error('No analyses available for report generation');
    }

    const response = await fetch('/api/admin/analytics/deep-learning/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: activeConfig,
        analyses,
        models: modelsData.models,
        activations: modelsData.activations,
        attentionPatterns: modelsData.attentionPatterns,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate deep learning analytics report');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deep_learning_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyses, modelsData, activeConfig]);

  return {
    config: activeConfig,
    setConfig: setActiveConfig,
    models: modelsData?.models || [],
    activations: modelsData?.activations || [],
    attentionPatterns: modelsData?.attentionPatterns || [],
    analyses,
    isLoading,
    error,
    optimizeModel: optimizeModelMutation.mutateAsync,
    generateReport,
  };
};

export default useDeepLearningAnalytics;
