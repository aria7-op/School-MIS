import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
} from '@mui/material';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { format } from 'date-fns';
import useAdvancedAnalytics from '../hooks/useAdvancedAnalytics';

interface ModelTrainingParams {
  learningRate: number;
  epochs: number;
  batchSize: number;
  optimizerType: 'adam' | 'sgd' | 'rmsprop';
  regularization: number;
}

const AdvancedAnalytics: React.FC = () => {
  const {
    analytics,
    isLoading,
    isError,
    error,
    filters,
    setFilters,
    refreshAnalytics,
    generateInsightReport,
    exportAnalytics,
    trainModel,
    getModelMetrics,
    updateModelParameters,
  } = useAdvancedAnalytics();

  const [selectedMetric, setSelectedMetric] = useState<string>('studentRetention');
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } | null>(null);
  const [trainingParams, setTrainingParams] = useState<ModelTrainingParams>({
    learningRate: 0.001,
    epochs: 100,
    batchSize: 32,
    optimizerType: 'adam',
    regularization: 0.01,
  });

  const handleMetricsRefresh = useCallback(async () => {
    try {
      const metrics = await getModelMetrics();
      setModelMetrics(metrics);
    } catch (error) {
      
    }
  }, [getModelMetrics]);

  const handleTrainingSubmit = useCallback(async () => {
    try {
      await trainModel('predictive', trainingParams);
      await handleMetricsRefresh();
      setIsTrainingModalOpen(false);
    } catch (error) {
      
    }
  }, [trainModel, trainingParams, handleMetricsRefresh]);

  const retentionChartData = useMemo(() => {
    if (!analytics?.predictiveAnalytics?.studentRetention?.trendPredictions) return null;

    const predictions = analytics.predictiveAnalytics.studentRetention.trendPredictions;
    return {
      labels: predictions.map(p => p.month),
      datasets: [
        {
          label: 'Predicted Retention Rate',
          data: predictions.map(p => p.predictedRetentionRate),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false,
        },
        {
          label: 'Confidence Interval (Lower)',
          data: predictions.map(p => p.confidenceInterval[0]),
          borderColor: 'rgba(75, 192, 192, 0.3)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.1,
          fill: 1,
        },
        {
          label: 'Confidence Interval (Upper)',
          data: predictions.map(p => p.confidenceInterval[1]),
          borderColor: 'rgba(75, 192, 192, 0.3)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.1,
          fill: '-1',
        },
      ],
    };
  }, [analytics]);

  const anomalyChartData = useMemo(() => {
    if (!analytics?.machineLearningSummary?.anomalyDetection?.systemPerformance) return null;

    const anomalies = analytics.machineLearningSummary.anomalyDetection.systemPerformance;
    return {
      labels: anomalies.map(a => a.metric),
      datasets: [
        {
          label: 'Anomaly Score',
          data: anomalies.map(a => a.anomalies.length),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        },
      ],
    };
  }, [analytics]);

  const clusterChartData = useMemo(() => {
    if (!analytics?.machineLearningSummary?.clusterAnalysis?.studentGroups) return null;

    const clusters = analytics.machineLearningSummary.clusterAnalysis.studentGroups;
    const metrics = Object.keys(clusters[0]?.performanceMetrics || {});

    return {
      labels: metrics,
      datasets: clusters.map((cluster, index) => ({
        label: `Cluster ${cluster.clusterId}`,
        data: metrics.map(metric => cluster.performanceMetrics[metric]),
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`,
        borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
      })),
    };
  }, [analytics]);

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">{error?.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Advanced Analytics Dashboard</Typography>
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsTrainingModalOpen(true)}
                sx={{ mr: 1 }}
              >
                Train Model
              </Button>
              <Button
                variant="outlined"
                onClick={() => generateInsightReport('predictive')}
                sx={{ mr: 1 }}
              >
                Generate Report
              </Button>
              <Button variant="outlined" onClick={() => exportAnalytics('pdf')}>
                Export Data
              </Button>
            </Box>
          </Paper>
        </Grid>

        {modelMetrics && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Model Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Accuracy</Typography>
                  <Typography variant="h6">{(modelMetrics.accuracy * 100).toFixed(2)}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Precision</Typography>
                  <Typography variant="h6">{(modelMetrics.precision * 100).toFixed(2)}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Recall</Typography>
                  <Typography variant="h6">{(modelMetrics.recall * 100).toFixed(2)}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">F1 Score</Typography>
                  <Typography variant="h6">{(modelMetrics.f1Score * 100).toFixed(2)}%</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Student Retention Predictions
            </Typography>
            {retentionChartData && <Line data={retentionChartData} />}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Performance Anomalies
            </Typography>
            {anomalyChartData && <Bar data={anomalyChartData} />}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Student Cluster Analysis
            </Typography>
            {clusterChartData && <Radar data={clusterChartData} />}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)}>
        <DialogTitle>Configure Model Training</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Learning Rate"
              type="number"
              value={trainingParams.learningRate}
              onChange={(e) =>
                setTrainingParams(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Epochs"
              type="number"
              value={trainingParams.epochs}
              onChange={(e) =>
                setTrainingParams(prev => ({ ...prev, epochs: parseInt(e.target.value, 10) }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Batch Size"
              type="number"
              value={trainingParams.batchSize}
              onChange={(e) =>
                setTrainingParams(prev => ({ ...prev, batchSize: parseInt(e.target.value, 10) }))
              }
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Optimizer</InputLabel>
              <Select
                value={trainingParams.optimizerType}
                onChange={(e) =>
                  setTrainingParams(prev => ({
                    ...prev,
                    optimizerType: e.target.value as 'adam' | 'sgd' | 'rmsprop',
                  }))
                }
              >
                <MenuItem value="adam">Adam</MenuItem>
                <MenuItem value="sgd">SGD</MenuItem>
                <MenuItem value="rmsprop">RMSprop</MenuItem>
              </Select>
            </FormControl>
            <Typography gutterBottom>Regularization</Typography>
            <Slider
              value={trainingParams.regularization}
              onChange={(_, value) =>
                setTrainingParams(prev => ({ ...prev, regularization: value as number }))
              }
              min={0}
              max={0.1}
              step={0.001}
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTrainingModalOpen(false)}>Cancel</Button>
          <Button onClick={handleTrainingSubmit} variant="contained" color="primary">
            Start Training
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedAnalytics;
